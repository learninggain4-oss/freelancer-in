// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Clock, ArrowLeft, Plus, Pencil, Trash2, Loader2, Search } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};
const A1 = "#6366f1";

const EMPTY_FORM = { profile_id: "", start_time: "09:00", end_time: "18:00", status: "active" };

const AdminAddMoneySetupTime = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey] ?? TH.white;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ["add-money-time-slots-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("add_money_time_slots")
        .select("*, profiles(full_name, user_code, user_type)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles-for-add-money", userSearch],
    enabled: dialogOpen && !editId,
    queryFn: async () => {
      const q = supabase.from("profiles").select("id, full_name, user_code, user_type").limit(20);
      if (userSearch) q.ilike("full_name->0", `%${userSearch}%`);
      const { data } = await q;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.profile_id && !editId) throw new Error("Please select a user");
      if (!form.start_time || !form.end_time) throw new Error("Start and end time required");
      if (form.start_time >= form.end_time) throw new Error("End time must be after start time");
      if (editId) {
        const { error } = await supabase.from("add_money_time_slots").update({
          start_time: form.start_time,
          end_time: form.end_time,
          status: form.status,
          updated_at: new Date(0).toISOString(),
        }).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("add_money_time_slots").upsert({
          profile_id: form.profile_id,
          start_time: form.start_time,
          end_time: form.end_time,
          status: form.status,
          updated_at: new Date(0).toISOString(),
        }, { onConflict: "profile_id" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editId ? "Time slot updated" : "Time slot created");
      qc.invalidateQueries({ queryKey: ["add-money-time-slots-admin"] });
      setDialogOpen(false); setEditId(null); setForm({ ...EMPTY_FORM });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("add_money_time_slots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["add-money-time-slots-admin"] });
      setDeleteId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("add_money_time_slots").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["add-money-time-slots-admin"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const openAdd = () => { setForm({ ...EMPTY_FORM }); setEditId(null); setUserSearch(""); setDialogOpen(true); };
  const openEdit = (s: any) => {
    setForm({ profile_id: s.profile_id, start_time: s.start_time, end_time: s.end_time, status: s.status });
    setEditId(s.id); setDialogOpen(true);
  };

  const filtered = slots.filter((s: any) => {
    if (!search) return true;
    const name = (s.profiles?.full_name || []).join(" ").toLowerCase();
    const code = (s.profiles?.user_code || []).join("").toLowerCase();
    return name.includes(search.toLowerCase()) || code.includes(search.toLowerCase());
  });

  const statusStyle = (st: string) => st === "active"
    ? { bg: "rgba(74,222,128,.12)", color: "#4ade80" }
    : { bg: "rgba(248,113,113,.12)", color: "#f87171" };

  return (
    <div style={{ padding: "20px 16px", maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => navigate("/admin/verifications")}
            style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: T.sub }}>
            <ArrowLeft size={16} />
          </button>
          <div style={{ background: `${A1}15`, borderRadius: 12, padding: 10 }}>
            <Clock size={22} color={A1} />
          </div>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: 20, color: T.text, margin: 0 }}>Add Money Setup Time</h1>
            <p style={{ color: T.sub, fontSize: 12, marginTop: 2 }}>Manage add money time windows for each user</p>
          </div>
        </div>
        <button onClick={openAdd}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: A1, border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          <Plus size={14} /> Add Time Slot
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 18 }}>
        {[
          { label: "Total Slots", value: slots.length, color: "#a5b4fc" },
          { label: "Active", value: slots.filter((s: any) => s.status === "active").length, color: "#4ade80" },
          { label: "Inactive", value: slots.filter((s: any) => s.status !== "active").length, color: "#f87171" },
        ].map(s => (
          <div key={s.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 26, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 12px", marginBottom: 14 }}>
        <Search size={13} color={T.sub} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or code…"
          style={{ background: "none", border: "none", outline: "none", color: T.text, fontSize: 13, flex: 1 }} />
      </div>

      {/* Table */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {["User", "User Type", "Start Time", "End Time", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: "center" }}>
                  <Loader2 size={22} className="animate-spin" style={{ color: A1, margin: "0 auto" }} />
                </td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: T.sub, fontSize: 13 }}>
                  No time slots found. Click "Add Time Slot" to get started.
                </td></tr>
              )}
              {filtered.map((s: any) => {
                const name = (s.profiles?.full_name || []).join(" ") || "—";
                const code = (s.profiles?.user_code || []).join("") || "—";
                const st = statusStyle(s.status);
                return (
                  <tr key={s.id} style={{ borderBottom: `1px solid ${T.border}20` }}>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{name}</div>
                      <div style={{ fontSize: 11, color: T.sub }}>{code}</div>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: T.sub, textTransform: "capitalize" }}>{s.profiles?.user_type || "—"}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: A1 }}>{s.start_time}</span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "#8b5cf6" }}>{s.end_time}</span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <button
                        onClick={() => toggleStatus.mutate({ id: s.id, status: s.status === "active" ? "inactive" : "active" })}
                        style={{ ...st, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, border: `1px solid ${st.color}30`, cursor: "pointer" }}>
                        {s.status === "active" ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => openEdit(s)}
                          style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", background: `${A1}12`, border: `1px solid ${A1}30`, borderRadius: 7, color: A1, fontSize: 12, cursor: "pointer" }}>
                          <Pencil size={11} /> Edit
                        </button>
                        <button onClick={() => setDeleteId(s.id)}
                          style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", background: "rgba(248,113,113,.12)", border: "1px solid rgba(248,113,113,.3)", borderRadius: 7, color: "#f87171", fontSize: 12, cursor: "pointer" }}>
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      {dialogOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: themeKey === "black" ? "#0f0f23" : "#fff", border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, maxWidth: 420, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontWeight: 800, fontSize: 17, color: T.text, marginBottom: 18 }}>{editId ? "Edit" : "Add"} Add Money Time Slot</h2>

            {!editId && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 5 }}>Select User</label>
                <input placeholder="Search user by name…" value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 6 }} />
                <div style={{ maxHeight: 160, overflowY: "auto", border: `1px solid ${T.border}`, borderRadius: 8 }}>
                  {profiles.map((p: any) => (
                    <div key={p.id} onClick={() => setForm((f: any) => ({ ...f, profile_id: p.id }))}
                      style={{ padding: "8px 12px", cursor: "pointer", background: form.profile_id === p.id ? `${A1}15` : "transparent", borderBottom: `1px solid ${T.border}20` }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{(p.full_name || []).join(" ") || "—"}</div>
                      <div style={{ fontSize: 11, color: T.sub }}>{(p.user_code || []).join("")} · {p.user_type}</div>
                    </div>
                  ))}
                  {profiles.length === 0 && <div style={{ padding: 12, color: T.sub, fontSize: 12, textAlign: "center" }}>No users found</div>}
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 5 }}>Start Time</label>
                <input type="time" value={form.start_time} onChange={e => setForm((f: any) => ({ ...f, start_time: e.target.value }))}
                  style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 5 }}>End Time</label>
                <input type="time" value={form.end_time} onChange={e => setForm((f: any) => ({ ...f, end_time: e.target.value }))}
                  style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, color: T.sub, display: "block", marginBottom: 5 }}>Status</label>
              <select value={form.status} onChange={e => setForm((f: any) => ({ ...f, status: e.target.value }))}
                style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13, outline: "none" }}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setDialogOpen(false); setEditId(null); }}
                style={{ flex: 1, background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px", cursor: "pointer", color: T.text, fontWeight: 600 }}>Cancel</button>
              <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
                style={{ flex: 2, background: A1, border: "none", borderRadius: 8, padding: "9px", cursor: "pointer", color: "#fff", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                {editId ? "Save Changes" : "Create Slot"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: themeKey === "black" ? "#0f0f23" : "#fff", border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, maxWidth: 360, width: "100%", textAlign: "center" }}>
            <Trash2 size={32} color="#f87171" style={{ marginBottom: 12 }} />
            <h3 style={{ fontWeight: 800, fontSize: 16, color: T.text, margin: "0 0 8px" }}>Delete this time slot?</h3>
            <p style={{ fontSize: 13, color: T.sub, marginBottom: 20 }}>This action cannot be undone.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px", cursor: "pointer", color: T.text, fontWeight: 600 }}>Cancel</button>
              <button onClick={() => deleteMutation.mutate(deleteId!)} disabled={deleteMutation.isPending}
                style={{ flex: 1, background: "rgba(248,113,113,.15)", border: "1px solid rgba(248,113,113,.4)", borderRadius: 8, padding: "9px", cursor: "pointer", color: "#f87171", fontWeight: 700 }}>
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAddMoneySetupTime;
