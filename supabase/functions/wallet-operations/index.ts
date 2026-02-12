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

    const { action, amount, profile_id, withdrawal_id, status, review_notes, project_id, upi_id, bank_account_number, bank_ifsc_code, bank_name, bank_holder_name, reject_reason } =
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

      case "hold_project_payment": {
        // Client initiates payment processing: project budget → employee hold_balance
        if (callerProfile.user_type !== "client")
          throw new Error("Only clients can initiate payment processing");
        if (!project_id) throw new Error("Missing project_id");

        const { data: project, error: pErr } = await supabase
          .from("projects")
          .select("id, amount, client_id, assigned_employee_id, status")
          .eq("id", project_id)
          .single();
        if (pErr || !project) throw new Error("Project not found");
        if (project.client_id !== callerProfile.id)
          throw new Error("Not your project");
        if (project.status !== "in_progress")
          throw new Error("Project must be in_progress to process payment");
        if (!project.assigned_employee_id)
          throw new Error("No employee assigned");

        const projectAmount = Number(project.amount);

        if (Number(callerProfile.available_balance) < projectAmount)
          throw new Error("Insufficient balance to process payment");

        await supabase
          .from("profiles")
          .update({
            available_balance: Number(callerProfile.available_balance) - projectAmount,
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
              hold_balance: Number(empProfile.hold_balance) + projectAmount,
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
            amount: projectAmount,
            description: `Payment processing for project: ${project_id}`,
            reference_id: project_id,
          },
          {
            profile_id: project.assigned_employee_id,
            type: "hold",
            amount: projectAmount,
            description: `Payment held for project: ${project_id}`,
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
            title: "Payment Processing Initiated",
            message: `The client has initiated payment processing for your project. ₹${projectAmount} is now held in your account.`,
            type: "financial",
            reference_id: project_id,
            reference_type: "project",
          });
        }

        result.status = "payment_processing";
        break;
      }

      case "release_project_payment": {
        if (callerProfile.user_type !== "client")
          throw new Error("Only clients can release payments");
        if (!project_id) throw new Error("Missing project_id");

        const { data: project, error: pErr } = await supabase
          .from("projects")
          .select("id, amount, client_id, assigned_employee_id, status")
          .eq("id", project_id)
          .single();
        if (pErr || !project) throw new Error("Project not found");
        if (project.client_id !== callerProfile.id)
          throw new Error("Not your project");
        if (project.status !== "payment_processing")
          throw new Error("Project must be in payment_processing to release");
        if (!project.assigned_employee_id)
          throw new Error("No employee assigned");

        const projectAmount = Number(project.amount);

        const { data: empProfile } = await supabase
          .from("profiles")
          .select("hold_balance, available_balance")
          .eq("id", project.assigned_employee_id)
          .single();

        if (empProfile) {
          await supabase
            .from("profiles")
            .update({
              hold_balance: Number(empProfile.hold_balance) - projectAmount,
              available_balance: Number(empProfile.available_balance) + projectAmount,
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
          amount: projectAmount,
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
            message: `Congratulations! Your project has been marked as successful. ₹${projectAmount} has been released to your available balance.`,
            type: "financial",
            reference_id: project_id,
            reference_type: "project",
          });
        }

        result.status = "completed";
        break;
      }

      case "refund_project_payment": {
        if (callerProfile.user_type !== "client")
          throw new Error("Only clients can refund payments");
        if (!project_id) throw new Error("Missing project_id");

        const { data: project, error: pErr } = await supabase
          .from("projects")
          .select("id, amount, client_id, assigned_employee_id, status")
          .eq("id", project_id)
          .single();
        if (pErr || !project) throw new Error("Project not found");
        if (project.client_id !== callerProfile.id)
          throw new Error("Not your project");
        if (project.status !== "payment_processing")
          throw new Error("Project must be in payment_processing to refund");
        if (!project.assigned_employee_id)
          throw new Error("No employee assigned");

        const projectAmount = Number(project.amount);

        await supabase
          .from("profiles")
          .update({
            available_balance: Number(callerProfile.available_balance) + projectAmount,
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
              hold_balance: Number(empProfile.hold_balance) - projectAmount,
            })
            .eq("id", project.assigned_employee_id);
        }

        await supabase
          .from("projects")
          .update({ status: "cancelled" })
          .eq("id", project_id);

        await supabase.from("transactions").insert([
          {
            profile_id: callerProfile.id,
            type: "credit",
            amount: projectAmount,
            description: `Refund for rejected project: ${project_id}`,
            reference_id: project_id,
          },
          {
            profile_id: project.assigned_employee_id,
            type: "release",
            amount: projectAmount,
            description: `Hold released (project rejected): ${project_id}`,
            reference_id: project_id,
          },
        ]);

        const { data: empUser3 } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("id", project.assigned_employee_id)
          .single();
        if (empUser3) {
          await supabase.from("notifications").insert({
            user_id: empUser3.user_id,
            title: "Project Rejected — Payment Refunded",
            message: `The client has rejected the project during payment processing. The held amount of ₹${projectAmount} has been released.`,
            type: "financial",
            reference_id: project_id,
            reference_type: "project",
          });
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
