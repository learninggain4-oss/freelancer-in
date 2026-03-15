import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiter per user (10 requests per 60 seconds)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count++;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify JWT from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const anonClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const {
      data: { user },
      error: authError,
    } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    // Rate limit check
    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, amount, profile_id, withdrawal_id, status, review_notes, project_id, upi_id, bank_account_number, bank_ifsc_code, bank_name, bank_holder_name, reject_reason, recovery_request_id, admin_notes, target_profile_id, transfer_to_profile_id, description, adjust_balance, transaction_id, type, order_id } =
      await req.json();

    // Get the caller's profile
    const { data: callerProfile, error: cpErr } = await supabase
      .from("profiles")
      .select("id, user_id, user_type, available_balance, hold_balance, approval_status")
      .eq("user_id", user.id)
      .single();
    if (cpErr || !callerProfile) throw new Error("Profile not found");
    if (callerProfile.approval_status !== "approved")
      throw new Error("Account not approved");

    let result: any = { success: true };

    switch (action) {
      case "add_money": {
        if (callerProfile.user_type !== "client")
          throw new Error("Only clients can add money");
        if (!amount || amount <= 0) throw new Error("Invalid amount");

        const newBalance = Number(callerProfile.available_balance) + amount;
        const { error: updateErr } = await supabase
          .from("profiles")
          .update({ available_balance: newBalance })
          .eq("id", callerProfile.id);
        if (updateErr) throw updateErr;

        await supabase.from("transactions").insert({
          profile_id: callerProfile.id,
          type: "credit",
          amount,
          description: "Added to wallet",
        });

        result.new_balance = newBalance;
        break;
      }

      case "request_withdrawal": {
        // Employee requests withdrawal — deduct from available_balance immediately
        if (callerProfile.user_type !== "employee")
          throw new Error("Only employees can request withdrawals");
        if (!amount || amount <= 0) throw new Error("Invalid amount");
        if (amount > Number(callerProfile.available_balance))
          throw new Error("Insufficient balance");

        // Check bank verification status
        const { data: bankVerif } = await supabase
          .from("bank_verifications")
          .select("status")
          .eq("profile_id", callerProfile.id)
          .single();
        if (!bankVerif || bankVerif.status !== "verified")
          throw new Error("Bank details must be verified before requesting withdrawals. Please submit your bank details for verification in your profile.");

        // Deduct from available balance
        await supabase
          .from("profiles")
          .update({
            available_balance: Number(callerProfile.available_balance) - amount,
          })
          .eq("id", callerProfile.id);

        // Create withdrawal record
        const { data: newW, error: wErr } = await supabase
          .from("withdrawals")
          .insert({
            employee_id: callerProfile.id,
            amount,
            method: upi_id ? "UPI" : "Bank Transfer",
            upi_id: upi_id || null,
            bank_account_number: bank_account_number || null,
            bank_ifsc_code: bank_ifsc_code || null,
            bank_holder_name: bank_holder_name || null,
          })
          .select("id")
          .single();
        if (wErr) throw wErr;

        // Record transaction
        await supabase.from("transactions").insert({
          profile_id: callerProfile.id,
          type: "debit",
          amount,
          description: "Withdrawal requested (pending approval)",
          reference_id: newW.id,
        });

        result.withdrawal_id = newW.id;
        break;
      }

      case "confirm_job": {
        // Step 1: Client confirms the job (in_progress → job_confirmed)
        if (callerProfile.user_type !== "client")
          throw new Error("Only clients can confirm jobs");
        if (!project_id) throw new Error("Missing project_id");

        const { data: proj1, error: p1Err } = await supabase
          .from("projects")
          .select("id, client_id, assigned_employee_id, status")
          .eq("id", project_id)
          .single();
        if (p1Err || !proj1) throw new Error("Project not found");
        if (proj1.client_id !== callerProfile.id)
          throw new Error("Not your project");
        if (proj1.status !== "in_progress")
          throw new Error("Project must be in_progress to confirm job");

        await supabase
          .from("projects")
          .update({ status: "job_confirmed" })
          .eq("id", project_id);

        if (proj1.assigned_employee_id) {
          const { data: empU } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("id", proj1.assigned_employee_id)
            .single();
          if (empU) {
            await supabase.from("notifications").insert({
              user_id: empU.user_id,
              title: "Job Confirmed",
              message: `The client has confirmed your job. Payment processing will follow.`,
              type: "info",
              reference_id: project_id,
              reference_type: "project",
            });
          }
        }

        result.status = "job_confirmed";
        break;
      }

      case "hold_project_payment": {
        // Step 2: Client initiates payment processing: validation_fees → employee hold_balance
        if (callerProfile.user_type !== "client")
          throw new Error("Only clients can initiate payment processing");
        if (!project_id) throw new Error("Missing project_id");

        const { data: project, error: pErr } = await supabase
          .from("projects")
          .select("id, amount, validation_fees, client_id, assigned_employee_id, status")
          .eq("id", project_id)
          .single();
        if (pErr || !project) throw new Error("Project not found");
        if (project.client_id !== callerProfile.id)
          throw new Error("Not your project");
        if (project.status !== "job_confirmed")
          throw new Error("Job must be confirmed before processing payment");
        if (!project.assigned_employee_id)
          throw new Error("No employee assigned");

        const validationFees = Number(project.validation_fees);

        if (Number(callerProfile.available_balance) < validationFees)
          throw new Error("Insufficient balance to process validation fees");

        await supabase
          .from("profiles")
          .update({
            available_balance: Number(callerProfile.available_balance) - validationFees,
          })
          .eq("id", callerProfile.id);

        const { data: empProfile } = await supabase
          .from("profiles")
          .select("hold_balance")
          .eq("id", project.assigned_employee_id)
          .single();

        if (empProfile) {
          await supabase
            .from("profiles")
            .update({
              hold_balance: Number(empProfile.hold_balance) + validationFees,
            })
            .eq("id", project.assigned_employee_id);
        }

        await supabase
          .from("projects")
          .update({ status: "payment_processing" })
          .eq("id", project_id);

        await supabase.from("transactions").insert([
          {
            profile_id: callerProfile.id,
            type: "debit",
            amount: validationFees,
            description: `Validation fees for project: ${project_id}`,
            reference_id: project_id,
          },
          {
            profile_id: project.assigned_employee_id,
            type: "hold",
            amount: validationFees,
            description: `Validation fees held for project: ${project_id}`,
            reference_id: project_id,
          },
        ]);

        const { data: empUser1 } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("id", project.assigned_employee_id)
          .single();
        if (empUser1) {
          await supabase.from("notifications").insert({
            user_id: empUser1.user_id,
            title: "Payment Processing — Validation Fees Held",
            message: `The client has initiated payment processing. ₹${validationFees} (validation fees) is now held in your account.`,
            type: "financial",
            reference_id: project_id,
            reference_type: "project",
          });
        }

        result.status = "payment_processing";
        break;
      }

      case "confirm_validation": {
        // Step 3: Client confirms validation (payment_processing → validation) — budget amount → employee hold
        if (callerProfile.user_type !== "client")
          throw new Error("Only clients can confirm validation");
        if (!project_id) throw new Error("Missing project_id");

        const { data: projV, error: pvErr } = await supabase
          .from("projects")
          .select("id, amount, client_id, assigned_employee_id, status")
          .eq("id", project_id)
          .single();
        if (pvErr || !projV) throw new Error("Project not found");
        if (projV.client_id !== callerProfile.id)
          throw new Error("Not your project");
        if (projV.status !== "payment_processing")
          throw new Error("Project must be in payment_processing to validate");

        const budgetAmount = Number(projV.amount);

        // Re-fetch caller balance (may have changed)
        const { data: freshCaller } = await supabase
          .from("profiles")
          .select("available_balance")
          .eq("id", callerProfile.id)
          .single();
        const callerBal = Number(freshCaller?.available_balance ?? callerProfile.available_balance);

        if (callerBal < budgetAmount)
          throw new Error("Insufficient balance to hold budget amount");

        // Deduct budget from client
        await supabase
          .from("profiles")
          .update({ available_balance: callerBal - budgetAmount })
          .eq("id", callerProfile.id);

        // Add budget to employee hold
        const { data: empProfV } = await supabase
          .from("profiles")
          .select("hold_balance")
          .eq("id", projV.assigned_employee_id!)
          .single();

        if (empProfV) {
          await supabase
            .from("profiles")
            .update({ hold_balance: Number(empProfV.hold_balance) + budgetAmount })
            .eq("id", projV.assigned_employee_id!);
        }

        await supabase
          .from("projects")
          .update({ status: "validation" })
          .eq("id", project_id);

        await supabase.from("transactions").insert([
          {
            profile_id: callerProfile.id,
            type: "debit",
            amount: budgetAmount,
            description: `Budget amount held for project: ${project_id}`,
            reference_id: project_id,
          },
          {
            profile_id: projV.assigned_employee_id!,
            type: "hold",
            amount: budgetAmount,
            description: `Budget amount held for project: ${project_id}`,
            reference_id: project_id,
          },
        ]);

        if (projV.assigned_employee_id) {
          const { data: empUV } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("id", projV.assigned_employee_id)
            .single();
          if (empUV) {
            await supabase.from("notifications").insert({
              user_id: empUV.user_id,
              title: "Validation Confirmed — Budget Held",
              message: `The client has confirmed validation. ₹${budgetAmount} (budget) is now held in your account. Final confirmation pending.`,
              type: "financial",
              reference_id: project_id,
              reference_type: "project",
            });
          }
        }

        result.status = "validation";
        break;
      }

      case "release_project_payment": {
        // Step 4: Final confirmation — move all hold to available (validation → completed)
        if (callerProfile.user_type !== "client")
          throw new Error("Only clients can release payments");
        if (!project_id) throw new Error("Missing project_id");

        const { data: project, error: pErr } = await supabase
          .from("projects")
          .select("id, amount, validation_fees, client_id, assigned_employee_id, status")
          .eq("id", project_id)
          .single();
        if (pErr || !project) throw new Error("Project not found");
        if (project.client_id !== callerProfile.id)
          throw new Error("Not your project");
        if (project.status !== "validation")
          throw new Error("Project must be in validation to release payment");
        if (!project.assigned_employee_id)
          throw new Error("No employee assigned");

        const totalAmount = Number(project.amount) + Number(project.validation_fees);

        const { data: empProfile } = await supabase
          .from("profiles")
          .select("hold_balance, available_balance")
          .eq("id", project.assigned_employee_id)
          .single();

        if (empProfile) {
          await supabase
            .from("profiles")
            .update({
              hold_balance: Number(empProfile.hold_balance) - totalAmount,
              available_balance: Number(empProfile.available_balance) + totalAmount,
            })
            .eq("id", project.assigned_employee_id);
        }

        await supabase
          .from("projects")
          .update({ status: "completed" })
          .eq("id", project_id);

        await supabase.from("transactions").insert({
          profile_id: project.assigned_employee_id,
          type: "release",
          amount: totalAmount,
          description: `Payment released for project: ${project_id}`,
          reference_id: project_id,
        });

        const { data: empUser2 } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("id", project.assigned_employee_id)
          .single();
        if (empUser2) {
          await supabase.from("notifications").insert({
            user_id: empUser2.user_id,
            title: "Payment Released — Project Completed!",
            message: `Congratulations! ₹${totalAmount} (budget + validation fees) has been released to your available balance.`,
            type: "financial",
            reference_id: project_id,
            reference_type: "project",
          });
        }

        result.status = "completed";
        break;
      }

      case "refund_project_payment": {
        // Reject: cancel project, held balance stays on hold (no refund)
        if (callerProfile.user_type !== "client")
          throw new Error("Only clients can reject projects");
        if (!project_id) throw new Error("Missing project_id");

        const { data: project, error: pErr } = await supabase
          .from("projects")
          .select("id, amount, validation_fees, client_id, assigned_employee_id, status, remarks")
          .eq("id", project_id)
          .single();
        if (pErr || !project) throw new Error("Project not found");
        if (project.client_id !== callerProfile.id)
          throw new Error("Not your project");
        if (project.status !== "payment_processing" && project.status !== "validation")
          throw new Error("Project must be in payment_processing or validation to reject");

        await supabase
          .from("projects")
          .update({ status: "cancelled", remarks: reject_reason || project.remarks || "Rejected by client" })
          .eq("id", project_id);

        if (project.assigned_employee_id) {
          const { data: empUser3 } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("id", project.assigned_employee_id)
            .single();
          if (empUser3) {
            await supabase.from("notifications").insert({
              user_id: empUser3.user_id,
              title: "Project Rejected",
              message: `The client has rejected the project. The held balance remains on hold.`,
              type: "financial",
              reference_id: project_id,
              reference_type: "project",
            });
          }
        }

        result.status = "cancelled";
        break;
      }

      case "process_withdrawal": {
        if (callerProfile.user_type !== "client")
          throw new Error("Only clients can process withdrawals");
        if (!withdrawal_id || !status)
          throw new Error("Missing withdrawal_id or status");

        const { data: withdrawal, error: wErr } = await supabase
          .from("withdrawals")
          .select("*")
          .eq("id", withdrawal_id)
          .single();
        if (wErr || !withdrawal) throw new Error("Withdrawal not found");
        if (withdrawal.status !== "pending")
          throw new Error("Withdrawal already processed");

        const wAmount = Number(withdrawal.amount);

        if (status === "approved") {
          // Employee balance was already deducted on request; mark as completed
          await supabase.from("transactions").insert([
            {
              profile_id: callerProfile.id,
              type: "debit",
              amount: wAmount,
              description: `Withdrawal approved for employee`,
              reference_id: withdrawal_id,
            },
            {
              profile_id: withdrawal.employee_id,
              type: "credit",
              amount: wAmount,
              description: `Withdrawal approved and processed`,
              reference_id: withdrawal_id,
            },
          ]);
        } else if (status === "rejected") {
          // Restore employee available balance
          const { data: empProfile } = await supabase
            .from("profiles")
            .select("available_balance, user_id")
            .eq("id", withdrawal.employee_id)
            .single();

          if (empProfile) {
            await supabase
              .from("profiles")
              .update({
                available_balance: Number(empProfile.available_balance) + wAmount,
              })
              .eq("id", withdrawal.employee_id);

            // Record refund transaction
            await supabase.from("transactions").insert({
              profile_id: withdrawal.employee_id,
              type: "credit",
              amount: wAmount,
              description: `Withdrawal rejected — amount restored`,
              reference_id: withdrawal_id,
            });

            // Notify employee about rejection
            await supabase.from("notifications").insert({
              user_id: empProfile.user_id,
              title: "Withdrawal Rejected",
              message: reject_reason
                ? `Your withdrawal of ₹${wAmount.toLocaleString("en-IN")} was rejected. Reason: ${reject_reason}. The amount has been restored to your balance.`
                : `Your withdrawal of ₹${wAmount.toLocaleString("en-IN")} was rejected. The amount has been restored to your balance.`,
              type: "financial",
              reference_id: withdrawal_id,
              reference_type: "withdrawal",
            });
          }
        }

        await supabase
          .from("withdrawals")
          .update({
            status,
            reviewed_by: callerProfile.id,
            reviewed_at: new Date().toISOString(),
            review_notes: reject_reason || review_notes || null,
          })
          .eq("id", withdrawal_id);

        result.status = status;
        break;
      }

      case "admin_process_withdrawal": {
        // Admin approves/rejects withdrawal
        // Check admin role
        const { data: roleCheck } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .single();
        if (!roleCheck) throw new Error("Admin access required");

        if (!withdrawal_id || !status)
          throw new Error("Missing withdrawal_id or status");

        const { data: withdrawal, error: wErr } = await supabase
          .from("withdrawals")
          .select("*")
          .eq("id", withdrawal_id)
          .single();
        if (wErr || !withdrawal) throw new Error("Withdrawal not found");
        if (withdrawal.status !== "pending")
          throw new Error("Withdrawal already processed");

        const wAmount = Number(withdrawal.amount);

        if (status === "rejected") {
          // Restore employee balance
          const { data: empProfile } = await supabase
            .from("profiles")
            .select("available_balance, user_id")
            .eq("id", withdrawal.employee_id)
            .single();

          if (empProfile) {
            await supabase
              .from("profiles")
              .update({
                available_balance: Number(empProfile.available_balance) + wAmount,
              })
              .eq("id", withdrawal.employee_id);

            await supabase.from("transactions").insert({
              profile_id: withdrawal.employee_id,
              type: "credit",
              amount: wAmount,
              description: `Withdrawal rejected by admin — amount restored`,
              reference_id: withdrawal_id,
            });

            await supabase.from("notifications").insert({
              user_id: empProfile.user_id,
              title: "Withdrawal Rejected by Admin",
              message: reject_reason
                ? `Your withdrawal of ₹${wAmount.toLocaleString("en-IN")} was rejected by admin. Reason: ${reject_reason}. The amount has been restored.`
                : `Your withdrawal of ₹${wAmount.toLocaleString("en-IN")} was rejected by admin. The amount has been restored.`,
              type: "financial",
              reference_id: withdrawal_id,
              reference_type: "withdrawal",
            });
          }
        } else if (status === "approved") {
          await supabase.from("transactions").insert({
            profile_id: withdrawal.employee_id,
            type: "credit",
            amount: wAmount,
            description: `Withdrawal approved by admin`,
            reference_id: withdrawal_id,
          });
        }

        await supabase
          .from("withdrawals")
          .update({
            status,
            reviewed_by: callerProfile.id,
            reviewed_at: new Date().toISOString(),
            review_notes: reject_reason || review_notes || null,
          })
          .eq("id", withdrawal_id);

        result.status = status;
        break;
      }

      case "admin_release_held_balance": {
        // Admin releases held balance from cancelled project to employee's available balance
        const { data: roleCheck } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .single();
        if (!roleCheck) throw new Error("Admin access required");

        if (!project_id) throw new Error("Missing project_id");

        const { data: project, error: pErr } = await supabase
          .from("projects")
          .select("id, amount, validation_fees, assigned_employee_id, status")
          .eq("id", project_id)
          .single();
        if (pErr || !project) throw new Error("Project not found");
        if (project.status !== "cancelled")
          throw new Error("Project must be cancelled to release held balance");
        if (!project.assigned_employee_id)
          throw new Error("No employee assigned");

        // Calculate held amount based on what was held
        const heldAmount = Number(project.amount) + Number(project.validation_fees);

        const { data: empProfile } = await supabase
          .from("profiles")
          .select("hold_balance, available_balance, user_id")
          .eq("id", project.assigned_employee_id)
          .single();
        if (!empProfile) throw new Error("Employee profile not found");

        const currentHold = Number(empProfile.hold_balance);
        const releaseAmount = Math.min(heldAmount, currentHold);
        if (releaseAmount <= 0) throw new Error("No held balance to release");

        // Transfer from hold to available
        await supabase
          .from("profiles")
          .update({
            hold_balance: currentHold - releaseAmount,
            available_balance: Number(empProfile.available_balance) + releaseAmount,
          })
          .eq("id", project.assigned_employee_id);

        // Record transaction
        await supabase.from("transactions").insert({
          profile_id: project.assigned_employee_id,
          type: "release",
          amount: releaseAmount,
          description: `Recovery: held balance released by admin for project: ${project_id}`,
          reference_id: project_id,
        });

        // Update recovery request admin notes (keep status pending so chat stays open)
        if (recovery_request_id) {
          await supabase
            .from("recovery_requests")
            .update({
              admin_notes: admin_notes || "Balance released by admin",
            })
            .eq("id", recovery_request_id);
        }

        // Notify employee
        await supabase.from("notifications").insert({
          user_id: empProfile.user_id,
          title: "Balance Recovered! 🎉",
          message: `₹${releaseAmount.toLocaleString("en-IN")} has been released from hold to your available balance by Customer Service.`,
          type: "financial",
          reference_id: project_id,
          reference_type: "project",
        });

        result.status = "released";
        result.released_amount = releaseAmount;
        break;
      }

      case "admin_hold_balance": {
        // Admin moves funds from employee's available balance back to hold balance
        const { data: roleCheck } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .single();
        if (!roleCheck) throw new Error("Admin access required");

        if (!recovery_request_id) throw new Error("Missing recovery_request_id");
        if (!amount || amount <= 0) throw new Error("Invalid amount");

        const { data: recReq, error: rrErr } = await supabase
          .from("recovery_requests")
          .select("*, employee:profiles!recovery_requests_employee_id_fkey(id, available_balance, hold_balance, user_id)")
          .eq("id", recovery_request_id)
          .single();
        if (rrErr || !recReq) throw new Error("Recovery request not found");

        const emp = recReq.employee as any;
        if (!emp) throw new Error("Employee not found");

        const holdAmount = Math.min(amount, Number(emp.available_balance));
        if (holdAmount <= 0) throw new Error("Employee has no available balance to hold");

        await supabase
          .from("profiles")
          .update({
            available_balance: Number(emp.available_balance) - holdAmount,
            hold_balance: Number(emp.hold_balance) + holdAmount,
          })
          .eq("id", emp.id);

        await supabase.from("transactions").insert({
          profile_id: emp.id,
          type: "hold",
          amount: holdAmount,
          description: `Recovery: balance held by admin for recovery request: ${recovery_request_id}`,
          reference_id: recReq.project_id,
        });

        if (admin_notes) {
          await supabase
            .from("recovery_requests")
            .update({ admin_notes })
            .eq("id", recovery_request_id);
        }

        await supabase.from("notifications").insert({
          user_id: emp.user_id,
          title: "Balance Held",
          message: `₹${holdAmount.toLocaleString("en-IN")} has been moved from your available balance to hold by Customer Service.`,
          type: "financial",
          reference_id: recReq.project_id,
          reference_type: "project",
        });

        result.status = "held";
        result.held_amount = holdAmount;
        break;
      }

      // ─── Admin Wallet Management Actions ───

      case "admin_wallet_add": {
        const { data: roleCheck } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single();
        if (!roleCheck) throw new Error("Admin access required");
        if (!target_profile_id || !amount || amount <= 0) throw new Error("Missing profile_id or invalid amount");

        const { data: tp, error: tpErr } = await supabase.from("profiles").select("id, available_balance, user_id, full_name").eq("id", target_profile_id).single();
        if (tpErr || !tp) throw new Error("Target profile not found");

        const newBal = Number(tp.available_balance) + amount;
        await supabase.from("profiles").update({ available_balance: newBal }).eq("id", tp.id);
        await supabase.from("transactions").insert({ profile_id: tp.id, type: "credit", amount, description: description || "Admin: added to wallet" });
        await supabase.from("notifications").insert({ user_id: tp.user_id, title: "Wallet Credited", message: `₹${amount.toLocaleString("en-IN")} has been added to your wallet by admin.`, type: "financial" });
        
        result.new_balance = newBal;
        break;
      }

      case "admin_wallet_deduct": {
        const { data: roleCheck } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single();
        if (!roleCheck) throw new Error("Admin access required");
        if (!target_profile_id || !amount || amount <= 0) throw new Error("Missing profile_id or invalid amount");

        const { data: tp } = await supabase.from("profiles").select("id, available_balance, user_id, full_name").eq("id", target_profile_id).single();
        if (!tp) throw new Error("Target profile not found");

        const newBal = Number(tp.available_balance) - amount;
        await supabase.from("profiles").update({ available_balance: newBal }).eq("id", tp.id);
        await supabase.from("transactions").insert({ profile_id: tp.id, type: "debit", amount, description: description || "Admin: deducted from wallet" });
        await supabase.from("notifications").insert({ user_id: tp.user_id, title: "Wallet Deducted", message: `₹${amount.toLocaleString("en-IN")} has been deducted from your wallet by admin.`, type: "financial" });
        
        result.new_balance = newBal;
        break;
      }

      case "admin_wallet_hold": {
        const { data: roleCheck } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single();
        if (!roleCheck) throw new Error("Admin access required");
        if (!target_profile_id || !amount || amount <= 0) throw new Error("Missing profile_id or invalid amount");

        const { data: tp } = await supabase.from("profiles").select("id, available_balance, hold_balance, user_id, full_name").eq("id", target_profile_id).single();
        if (!tp) throw new Error("Target profile not found");

        const holdAmt = Math.min(amount, Number(tp.available_balance));
        if (holdAmt <= 0) throw new Error("Insufficient available balance to hold");

        await supabase.from("profiles").update({ available_balance: Number(tp.available_balance) - holdAmt, hold_balance: Number(tp.hold_balance) + holdAmt }).eq("id", tp.id);
        await supabase.from("transactions").insert({ profile_id: tp.id, type: "hold", amount: holdAmt, description: description || "Admin: amount held" });
        await supabase.from("notifications").insert({ user_id: tp.user_id, title: "Balance Held", message: `₹${holdAmt.toLocaleString("en-IN")} has been placed on hold by admin.`, type: "financial" });
        
        break;
      }

      case "admin_wallet_transfer": {
        const { data: roleCheck } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single();
        if (!roleCheck) throw new Error("Admin access required");
        if (!target_profile_id || !transfer_to_profile_id || !amount || amount <= 0) throw new Error("Missing parameters");

        const { data: from } = await supabase.from("profiles").select("id, available_balance, user_id, full_name").eq("id", target_profile_id).single();
        const { data: to } = await supabase.from("profiles").select("id, available_balance, user_id, full_name").eq("id", transfer_to_profile_id).single();
        if (!from || !to) throw new Error("Profile not found");

        await supabase.from("profiles").update({ available_balance: Number(from.available_balance) - amount }).eq("id", from.id);
        await supabase.from("profiles").update({ available_balance: Number(to.available_balance) + amount }).eq("id", to.id);
        await supabase.from("transactions").insert([
          { profile_id: from.id, type: "debit" as const, amount, description: description || `Admin transfer to ${(to.full_name as any)?.[0] || to.id}` },
          { profile_id: to.id, type: "credit" as const, amount, description: description || `Admin transfer from ${(from.full_name as any)?.[0] || from.id}` },
        ]);
        await supabase.from("notifications").insert([
          { user_id: from.user_id, title: "Funds Transferred", message: `₹${amount.toLocaleString("en-IN")} transferred to ${(to.full_name as any)?.[0]} by admin.`, type: "financial" },
          { user_id: to.user_id, title: "Funds Received", message: `₹${amount.toLocaleString("en-IN")} received from ${(from.full_name as any)?.[0]} by admin.`, type: "financial" },
        ]);
        
        break;
      }

      case "admin_edit_transaction": {
        const { data: roleCheck } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single();
        if (!roleCheck) throw new Error("Admin access required");
        if (!transaction_id || !target_profile_id) throw new Error("Missing parameters");

        const { data: oldTx } = await supabase.from("transactions").select("*").eq("id", transaction_id).single();
        if (!oldTx) throw new Error("Transaction not found");

        if (adjust_balance) {
          const { data: tp } = await supabase.from("profiles").select("id, available_balance, hold_balance").eq("id", target_profile_id).single();
          if (!tp) throw new Error("Profile not found");

          let avail = Number(tp.available_balance);
          let hold = Number(tp.hold_balance);
          const oldAmt = Number(oldTx.amount);
          const newAmt = Number(amount ?? oldTx.amount);
          const oldType = oldTx.type;
          const newType = type ?? oldTx.type;

          if (oldType === "credit") avail -= oldAmt;
          else if (oldType === "debit") avail += oldAmt;
          else if (oldType === "hold") { avail += oldAmt; hold -= oldAmt; }
          else if (oldType === "release") { avail -= oldAmt; hold += oldAmt; }

          if (newType === "credit") avail += newAmt;
          else if (newType === "debit") avail -= newAmt;
          else if (newType === "hold") { avail -= newAmt; hold += newAmt; }
          else if (newType === "release") { avail += newAmt; hold -= newAmt; }

          await supabase.from("profiles").update({ available_balance: avail, hold_balance: hold }).eq("id", target_profile_id);
        }

        await supabase.from("transactions").update({
          amount: Number(amount ?? oldTx.amount),
          description: description ?? oldTx.description,
          type: type ?? oldTx.type,
        }).eq("id", transaction_id);

        break;
      }

      case "admin_delete_transaction": {
        const { data: roleCheck } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single();
        if (!roleCheck) throw new Error("Admin access required");
        if (!transaction_id || !target_profile_id) throw new Error("Missing parameters");

        const { data: oldTx } = await supabase.from("transactions").select("*").eq("id", transaction_id).single();
        if (!oldTx) throw new Error("Transaction not found");

        if (adjust_balance) {
          const { data: tp } = await supabase.from("profiles").select("id, available_balance, hold_balance").eq("id", target_profile_id).single();
          if (!tp) throw new Error("Profile not found");

          let avail = Number(tp.available_balance);
          let hold = Number(tp.hold_balance);
          const amt = Number(oldTx.amount);

          if (oldTx.type === "credit") avail -= amt;
          else if (oldTx.type === "debit") avail += amt;
          else if (oldTx.type === "hold") { avail += amt; hold -= amt; }
          else if (oldTx.type === "release") { avail -= amt; hold += amt; }

          await supabase.from("profiles").update({ available_balance: avail, hold_balance: hold }).eq("id", target_profile_id);
        }

        await supabase.from("transactions").delete().eq("id", transaction_id);

        break;
      }

      case "admin_edit_withdrawal": {
        const { data: roleCheck } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single();
        if (!roleCheck) throw new Error("Admin access required");
        if (!withdrawal_id || !target_profile_id) throw new Error("Missing parameters");

        const { data: oldW } = await supabase.from("withdrawals").select("*").eq("id", withdrawal_id).single();
        if (!oldW) throw new Error("Withdrawal not found");

        if (adjust_balance && amount !== undefined && Number(amount) !== Number(oldW.amount)) {
          const diff = Number(amount) - Number(oldW.amount);
          const { data: tp } = await supabase.from("profiles").select("id, available_balance").eq("id", target_profile_id).single();
          if (tp) {
            await supabase.from("profiles").update({ available_balance: Number(tp.available_balance) - diff }).eq("id", target_profile_id);
          }
        }

        const updates: any = {};
        if (amount !== undefined) updates.amount = Number(amount);
        if (status) updates.status = status;
        if (review_notes !== undefined) updates.review_notes = review_notes;

        await supabase.from("withdrawals").update(updates).eq("id", withdrawal_id);

        break;
      }

      case "admin_delete_withdrawal": {
        const { data: roleCheck } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single();
        if (!roleCheck) throw new Error("Admin access required");
        if (!withdrawal_id || !target_profile_id) throw new Error("Missing parameters");

        const { data: oldW } = await supabase.from("withdrawals").select("*").eq("id", withdrawal_id).single();
        if (!oldW) throw new Error("Withdrawal not found");

        if (adjust_balance && (oldW.status === "pending" || oldW.status === "approved")) {
          const { data: tp } = await supabase.from("profiles").select("id, available_balance").eq("id", target_profile_id).single();
          if (tp) {
            await supabase.from("profiles").update({ available_balance: Number(tp.available_balance) + Number(oldW.amount) }).eq("id", target_profile_id);
          }
        }

        await supabase.from("withdrawals").delete().eq("id", withdrawal_id);

        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("wallet-operations error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
