import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  category: "Security" | "User Management" | "Financial" | "System" | "Content" | "Authentication" | "General";
  status: "success" | "warning" | "critical";
  ip?: string;
}

const MAX_ENTRIES = 500;
const STORAGE_KEY = "admin_audit_logs_v2";

function seed(): AuditEntry[] {
  const now = Date.now();
  return [
    { id: "s1", timestamp: new Date(now - 120000).toISOString(), user: "admin@system", action: "Admin Login", details: "Successful login from known device", category: "Authentication", status: "success" },
    { id: "s2", timestamp: new Date(now - 300000).toISOString(), user: "admin@system", action: "Withdrawal Approved", details: "Approved withdrawal #WD-4421 for ₹5,000", category: "Financial", status: "success" },
    { id: "s3", timestamp: new Date(now - 900000).toISOString(), user: "admin@system", action: "User Blocked", details: "Blocked profile ID: emp_2923 — Policy violation", category: "User Management", status: "warning" },
    { id: "s4", timestamp: new Date(now - 3600000).toISOString(), user: "admin@system", action: "IP Blocked", details: "Added 192.168.1.44 to blocklist — Suspicious activity", category: "Security", status: "warning" },
    { id: "s5", timestamp: new Date(now - 7200000).toISOString(), user: "admin@system", action: "Settings Updated", details: "Updated platform commission rate from 8% to 10%", category: "System", status: "success" },
    { id: "s6", timestamp: new Date(now - 86400000).toISOString(), user: "admin@system", action: "Bulk Notification Sent", details: "Sent announcement to 1,240 active users", category: "Content", status: "success" },
    { id: "s7", timestamp: new Date(now - 172800000).toISOString(), user: "admin@system", action: "Wallet Transfer", details: "Transferred ₹50,000 from system wallet to reserve", category: "Financial", status: "success" },
    { id: "s8", timestamp: new Date(now - 259200000).toISOString(), user: "admin@system", action: "Failed Login Attempt", details: "3 failed login attempts from IP 10.0.0.5", category: "Authentication", status: "critical" },
  ];
}

export function useAdminAudit() {
  const { profile } = useAuth();

  const logAction = useCallback((
    action: string,
    details: string,
    category: AuditEntry["category"] = "General",
    status: AuditEntry["status"] = "success"
  ) => {
    try {
      const existing: AuditEntry[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || seed();
      const entry: AuditEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        user: (profile as { email?: string; full_name?: string } | null)?.email || (profile as { email?: string; full_name?: string } | null)?.full_name || "Admin",
        action,
        details,
        category,
        status,
      };
      const updated = [entry, ...existing].slice(0, MAX_ENTRIES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch { /* silent */ }
  }, [profile]);

  const getLogs = (): AuditEntry[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        const s = seed();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
        return s;
      }
      return JSON.parse(stored);
    } catch { return []; }
  };

  const clearLogs = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  return { logAction, getLogs, clearLogs };
}
