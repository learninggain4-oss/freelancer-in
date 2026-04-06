import { useState, useEffect, useRef, useCallback } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Users, Wallet, LogOut, X, ChevronLeft,
  ShieldCheck, Fingerprint, UserCheck, Building2, Edit, UserPlus,
  FileText, Layers, IndianRupee, Settings, Landmark, Megaphone,
  Briefcase, LifeBuoy, Bell, HelpCircle, BarChart3, CreditCard,
  Clock, BadgeCheck, Monitor, MessageSquareQuote, Wifi,
  SlidersHorizontal, Eye, ClipboardCheck, Star, ArrowUpCircle,
  Shield, ClipboardList, Crown, AlertTriangle,
  Database, Server, Archive, KeyRound,
  GitPullRequest, GitBranch, Lock,
  Settings2, Wrench, Gauge, CalendarClock, UserCog, Download, Globe,
  Zap, FileUp, Cpu, Activity, BookOpen,
  ShieldAlert, UserX, Ban, Folder, BarChart2, TrendingUp,
  Search, MessageSquare, Plus, ChevronDown,
  User, Languages, PanelRightOpen, PanelRightClose,
  CheckCircle2, Info, XCircle, Mail, Image as ImageIcon, RotateCcw,
  Trash2, CheckSquare, Square, Timer,
} from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";

const SESSION_TIMEOUT_KEY = "admin_session_timeout_min";
const COLLAPSED_SECTIONS_KEY = "admin_collapsed_sections_v2";
const SIDEBAR_MINI_KEY = "admin_sidebar_mini";

const A1 = "#6366f1";
const A2 = "#8b5cf6";
const VER = "v2.4.1";

/* ─── Fixed light admin design tokens ─────────────────────────── */
const T = {
  shell:        "#f5f7ff",
  sidebar:      "#0e1030",
  sidebarBdr:   "rgba(255,255,255,.07)",
  header:       "rgba(255,255,255,.97)",
  headerBdr:    "rgba(0,0,0,.07)",
  sectionTit:   "rgba(165,180,252,.42)",
  navLink:      "rgba(226,232,240,.5)",
  navHoverBg:   "rgba(255,255,255,.08)",
  navHoverFg:   "rgba(255,255,255,.95)",
  navActiveBg:  "rgba(99,102,241,.28)",
  navActiveFg:  "#c4b5fd",
  navActiveBdr: "rgba(139,92,246,.45)",
  contentHoverBg: "rgba(99,102,241,.07)",
  logoBg:       `linear-gradient(135deg,${A1},${A2})`,
  logoShadow:   "rgba(99,102,241,.65)",
  logoutFg:     "#f87171",
  logoutHover:  "rgba(239,68,68,.14)",
  badgeBg:      "#ef4444",
  mainBg:       "#f5f7ff",
  mainText:     "#0f172a",
  mainSub:      "#64748b",
  cardBg:       "#ffffff",
  cardBdr:      "rgba(0,0,0,.08)",
  mutedBg:      "#f1f5f9",
  inputBg:      "#ffffff",
  inputBdr:     "rgba(0,0,0,.1)",
  inputFg:      "#0f172a",
  inputPh:      "#94a3b8",
  accent:       "#4f46e5",
  green:        "#16a34a",
  orange:       "#d97706",
  red:          "#dc2626",
  orbA:         "rgba(99,102,241,.07)",
  orbB:         "rgba(139,92,246,.05)",
  gridLine:     "rgba(99,102,241,.025)",
  headerRight:  "#64748b",
  statusDot:    "#22c55e",
  liveBg:       "rgba(22,163,74,.08)",
  liveBdr:      "rgba(22,163,74,.18)",
  liveFg:       "#16a34a",
  searchBg:     "#f1f5f9",
  searchBdr:    "rgba(0,0,0,.1)",
  dropBg:       "#ffffff",
  dropBdr:      "rgba(0,0,0,.09)",
  footerBg:     "rgba(255,255,255,.97)",
  footerBdr:    "rgba(0,0,0,.07)",
  rightBg:      "#ffffff",
  rightBdr:     "rgba(0,0,0,.08)",
  iconBtn:      "rgba(0,0,0,.04)",
  iconBtnHov:   "rgba(99,102,241,.09)",
};

function buildCss(t: typeof T): string {
  return `
@keyframes orbGlow { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:.7;transform:scale(1.1)} }
@keyframes slideIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
@keyframes pulse-dot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:.7} }
.admin-drop { animation:slideIn .15s ease; }
.admin-main .text-foreground { color:${t.mainText} !important; }
.admin-main .text-muted-foreground { color:${t.mainSub} !important; }
.admin-main .bg-background { background:transparent !important; }
.admin-main .bg-card { background:${t.cardBg} !important; border:1px solid ${t.cardBdr} !important; }
.admin-main .border { border-color:${t.cardBdr} !important; }
.admin-main .bg-muted { background:${t.mutedBg} !important; }
.admin-main .bg-primary\\/10 { background:rgba(99,102,241,.1) !important; }
.admin-main .bg-accent\\/10 { background:rgba(34,197,94,.08) !important; }
.admin-main .bg-destructive\\/10 { background:rgba(239,68,68,.08) !important; }
.admin-main .bg-warning\\/10 { background:rgba(245,158,11,.08) !important; }
.admin-main .text-primary { color:${t.accent} !important; }
.admin-main .text-accent { color:${t.green} !important; }
.admin-main .text-destructive { color:${t.red} !important; }
.admin-main .text-warning { color:${t.orange} !important; }
.admin-main .hover\\:shadow-md:hover { box-shadow:0 8px 24px rgba(0,0,0,.15) !important; }
.admin-main input,.admin-main select,.admin-main textarea { background:${t.inputBg} !important; border:1px solid ${t.inputBdr} !important; color:${t.inputFg} !important; }
.admin-main input::placeholder,.admin-main textarea::placeholder { color:${t.inputPh} !important; }
.admin-main table { color:${t.mainText} !important; }
.admin-main th { color:${t.mainSub} !important; }
.admin-main td { border-color:${t.cardBdr} !important; }
`;
}

const navSections = [
  { title: "Overview", items: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { label: "My Wallet",  icon: Wallet,          path: "/admin/wallet" },
  ]},
  { title: "User Management", items: [
    { label: "All Users",     icon: Users,    path: "/admin/users" },
    { label: "Admins",        icon: Crown,    path: "/admin/admins" },
    { label: "Invite Users",  icon: Mail,     path: "/admin/invite" },
    { label: "Freelancers",   icon: UserCheck,path: "/admin/freelancers" },
    { label: "Employers",     icon: Building2,path: "/admin/employers" },
    { label: "Profile Edits", icon: Edit,     path: "/admin/profile-edits" },
    { label: "Sessions",      icon: Monitor,  path: "/admin/sessions" },
    { label: "Online Status", icon: Wifi,     path: "/admin/online-status" },
  ]},
  { title: "Financial", items: [
    { label: "Withdrawals",        icon: Wallet,             path: "/admin/withdrawals" },
    { label: "Wallet Mgmt",        icon: IndianRupee,        path: "/admin/wallet-management" },
    { label: "Wallet Types",       icon: Wallet,             path: "/admin/wallet-types" },
    { label: "Payment Methods",    icon: CreditCard,         path: "/admin/payment-methods" },
    { label: "Banks",              icon: Landmark,           path: "/admin/banks" },
    { label: "Wallet Upgrades",    icon: ArrowUpCircle,      path: "/admin/wallet-upgrades" },
    { label: "Auto Responses",     icon: MessageSquareQuote, path: "/admin/auto-responses" },
    { label: "Commission Mgmt",    icon: SlidersHorizontal,  path: "/admin/commission-management" },
    { label: "GST & Tax Reports",  icon: FileText,           path: "/admin/gst-tax-reports" },
    { label: "Fee Configuration",  icon: Settings2,          path: "/admin/fee-configuration" },
    { label: "Invoice Management", icon: FileText,           path: "/admin/invoice-management" },
    { label: "Revenue Analytics",  icon: TrendingUp,         path: "/admin/revenue-analytics" },
    { label: "Payout Schedule",    icon: Clock,              path: "/admin/payout-schedule" },
    { label: "TDS Management",     icon: IndianRupee,        path: "/admin/tds-management" },
    { label: "Commission Tiers",   icon: SlidersHorizontal,  path: "/admin/commission-tiers" },
  ]},
  { title: "Verification", items: [
    { label: "Aadhaar Verify",     icon: Fingerprint, path: "/admin/verifications" },
    { label: "Bank Verify",        icon: Landmark,    path: "/admin/bank-verifications" },
    { label: "Validation",         icon: BadgeCheck,  path: "/admin/validation" },
    { label: "KYC Dashboard",      icon: ShieldCheck, path: "/admin/kyc-dashboard" },
    { label: "Waitlist Mgmt",      icon: UserCheck,   path: "/admin/waitlist-management" },
    { label: "PAN/GST Verify",     icon: CreditCard,  path: "/admin/pan-gst-verification" },
  ]},
  { title: "Projects & Work", items: [
    { label: "Jobs",               icon: Briefcase,     path: "/admin/jobs" },
    { label: "Attendance",         icon: ClipboardCheck,path: "/admin/attendance" },
    { label: "Services",           icon: Layers,        path: "/admin/services" },
    { label: "Project Analytics",  icon: BarChart3,     path: "/admin/project-analytics" },
    { label: "Dispute Center",     icon: ShieldAlert,   path: "/admin/dispute-center" },
    { label: "Milestone Mgmt",     icon: ClipboardCheck,path: "/admin/milestone-management" },
    { label: "Bidding Rules",      icon: Zap,           path: "/admin/bidding-rules" },
  ]},
  { title: "Business & Growth", items: [
    { label: "Badge Management",   icon: Star,          path: "/admin/badge-management" },
    { label: "Coin Management",    icon: Zap,           path: "/admin/coin-management" },
    { label: "Promo Codes",        icon: Megaphone,     path: "/admin/promo-management" },
    { label: "Content Moderation", icon: ShieldCheck,   path: "/admin/content-moderation" },
    { label: "Affiliate Partners", icon: UserPlus,      path: "/admin/affiliate-management" },
    { label: "Skill & Category",   icon: Layers,        path: "/admin/skill-category-management" },
    { label: "Subscription Plans", icon: Crown,         path: "/admin/subscription-management" },
    { label: "Review Management",  icon: Star,          path: "/admin/review-management" },
    { label: "Email Campaigns",    icon: Mail,          path: "/admin/email-campaigns" },
    { label: "Mobile App Mgmt",    icon: Monitor,       path: "/admin/mobile-app-management" },
    { label: "SLA Reports",        icon: BarChart2,     path: "/admin/sla-reports" },
    { label: "Talent Showcase",    icon: Star,          path: "/admin/talent-showcase" },
    { label: "Freelancer Levels",  icon: TrendingUp,    path: "/admin/freelancer-levels" },
    { label: "Banner Manager",     icon: Megaphone,     path: "/admin/banner-manager" },
    { label: "Rate Cards",         icon: FileText,      path: "/admin/rate-cards" },
    { label: "Feature Flags",      icon: Activity,      path: "/admin/feature-flags" },
  ]},
  { title: "Communication", items: [
    { label: "Help & Support",       icon: HelpCircle, path: "/admin/help-support" },
    { label: "Support Reports",      icon: BarChart3,  path: "/admin/support-reporting" },
    { label: "Recovery",             icon: LifeBuoy,   path: "/admin/recovery-requests" },
    { label: "Notifications",        icon: Bell,       path: "/admin/notifications" },
    { label: "Announcements",        icon: Megaphone,  path: "/admin/announcements" },
    { label: "Email Deliverability", icon: Mail,       path: "/admin/email-deliverability" },
    { label: "Bulk Notification",    icon: Bell,       path: "/admin/bulk-notification" },
    { label: "Notification Control", icon: Settings,   path: "/admin/notification-control" },
    { label: "Chat Monitoring",      icon: MessageSquare, path: "/admin/chat-monitoring" },
  ]},
  { title: "Security & Monitoring", items: [
    { label: "Safety Center",    icon: Shield,        path: "/admin/safety-center" },
    { label: "Audit Logs",       icon: ClipboardList, path: "/admin/audit-logs" },
    { label: "RBAC & Roles",     icon: Crown,         path: "/admin/rbac" },
    { label: "IP Blocking",      icon: ShieldCheck,   path: "/admin/ip-blocking" },
    { label: "App Installs",     icon: Monitor,       path: "/admin/pwa-installs" },
    { label: "Auto Logout",      icon: Clock,         path: "/admin/auto-logout" },
    { label: "SSL Monitor",      icon: Lock,          path: "/admin/ssl-monitor" },
    { label: "XSS Protection",   icon: ShieldCheck,   path: "/admin/xss-protection" },
    { label: "CSRF Protection",  icon: ShieldCheck,   path: "/admin/csrf-protection" },
    { label: "Encryption Keys",  icon: KeyRound,      path: "/admin/encryption-keys" },
  ]},
  { title: "Infrastructure", items: [
    { label: "Database Manager",      icon: Database, path: "/admin/database-manager" },
    { label: "Env Variables",         icon: KeyRound, path: "/admin/env-vars" },
    { label: "Server Monitor",        icon: Server,   path: "/admin/server-monitor" },
    { label: "Backup & Restore",      icon: Archive,  path: "/admin/backups" },
    { label: "DNS & Domain",          icon: Globe,    path: "/admin/dns-domain" },
    { label: "Storage Manager",       icon: Archive,  path: "/admin/storage-manager" },
    { label: "File Paths",            icon: FileText, path: "/admin/file-paths" },
    { label: "File Permissions",      icon: Lock,     path: "/admin/file-permissions" },
    { label: "File Upload Validation",icon: FileUp,   path: "/admin/file-upload-validation" },
    { label: "DB Indexing",           icon: Database, path: "/admin/db-indexing" },
    { label: "Dependency Manager",    icon: Layers,   path: "/admin/dependency-manager" },
  ]},
  { title: "Risk Prevention", items: [
    { label: "Approval Center",  icon: GitPullRequest, path: "/admin/approval-center" },
    { label: "Data Privacy",     icon: Shield,         path: "/admin/data-privacy" },
    { label: "Alert System",     icon: Bell,           path: "/admin/alert-system" },
    { label: "Version Control",  icon: GitBranch,      path: "/admin/version-control" },
    { label: "Session Security", icon: Lock,           path: "/admin/session-security" },
  ]},
  { title: "System Stability", items: [
    { label: "Config Management",   icon: Settings2,    path: "/admin/config-management" },
    { label: "Maintenance Center",  icon: Wrench,       path: "/admin/maintenance-center" },
    { label: "Rate Limiting",       icon: Gauge,        path: "/admin/rate-limiting" },
    { label: "Scheduler",           icon: CalendarClock,path: "/admin/scheduler" },
    { label: "Vendor Manager",      icon: Globe,        path: "/admin/vendor-manager" },
    { label: "Maintenance Mode",    icon: Wrench,       path: "/admin/maintenance-mode" },
    { label: "Feature Flags",       icon: Zap,          path: "/admin/feature-flags" },
    { label: "Cron Jobs",           icon: CalendarClock,path: "/admin/cron-jobs" },
    { label: "Job Scheduler",       icon: CalendarClock,path: "/admin/job-scheduler" },
    { label: "Feature Conflicts",   icon: Settings2,    path: "/admin/feature-conflicts" },
    { label: "Feature Dependency",  icon: Layers,       path: "/admin/feature-dependency" },
    { label: "Module Dependency",   icon: Cpu,          path: "/admin/module-dependency" },
    { label: "Activity Log",        icon: Activity,     path: "/admin/activity-log" },
    { label: "Holiday Calendar",    icon: CalendarClock,path: "/admin/holiday-calendar" },
  ]},
  { title: "Advanced Security", items: [
    { label: "Permission Validator", icon: UserCog,       path: "/admin/permission-validator" },
    { label: "Export Control",       icon: Download,      path: "/admin/export-control" },
    { label: "RBAC Security",        icon: ShieldCheck,   path: "/admin/rbac-security" },
    { label: "Role Escalation",      icon: Crown,         path: "/admin/role-escalation" },
    { label: "Multi-Admin Conflict", icon: Users,         path: "/admin/multi-admin-conflict" },
    { label: "Secure Audit Log",     icon: ClipboardList, path: "/admin/secure-audit-log" },
    { label: "Secure Session Mgr",   icon: Lock,          path: "/admin/secure-session-mgr" },
  ]},
  { title: "Monitoring", items: [
    { label: "Cache Manager",        icon: Layers,    path: "/admin/cache-manager" },
    { label: "Cache Management",     icon: Layers,    path: "/admin/cache-management" },
    { label: "API Manager",          icon: Zap,       path: "/admin/api-manager" },
    { label: "Session Manager",      icon: Users,     path: "/admin/session-manager" },
    { label: "API Monitor",          icon: Activity,  path: "/admin/api-monitor" },
    { label: "API Schema",           icon: FileText,  path: "/admin/api-schema" },
    { label: "API Timeout",          icon: Clock,     path: "/admin/api-timeout" },
    { label: "API Rate Limiting",    icon: Gauge,     path: "/admin/api-rate-limiting" },
    { label: "External API Monitor", icon: Globe,     path: "/admin/external-api-monitor" },
    { label: "Deployment Monitor",   icon: Server,    path: "/admin/deployment-monitor" },
    { label: "Webhook Monitor",      icon: Zap,       path: "/admin/webhook-monitor" },
    { label: "Background Jobs",      icon: Cpu,       path: "/admin/background-jobs" },
    { label: "Performance Monitor",  icon: Activity,  path: "/admin/performance-monitor" },
    { label: "Smart Alerts",         icon: Bell,      path: "/admin/smart-alerts" },
    { label: "Traffic Management",   icon: Activity,  path: "/admin/traffic-management" },
  ]},
  { title: "Platform Safety", items: [
    { label: "Notification Center",    icon: Bell,   path: "/admin/notification-center" },
    { label: "File Manager",           icon: FileUp, path: "/admin/file-manager" },
    { label: "High Availability",      icon: Server, path: "/admin/high-availability" },
    { label: "Gateway Failover",       icon: Globe,  path: "/admin/gateway-failover" },
    { label: "External Svc Failover",  icon: Globe,  path: "/admin/external-failover" },
  ]},
  { title: "Reliability", items: [
    { label: "Data Migration",       icon: Database,     path: "/admin/data-migration" },
    { label: "Job Queue",            icon: Cpu,          path: "/admin/job-queue" },
    { label: "Transaction Control",  icon: IndianRupee,  path: "/admin/transaction-control" },
    { label: "Resource Monitor",     icon: Activity,     path: "/admin/resource-monitor" },
    { label: "Service Resilience",   icon: Globe,        path: "/admin/service-resilience" },
    { label: "Backup Storage",       icon: Archive,      path: "/admin/backup-storage" },
    { label: "Restore Version",      icon: RotateCcw,    path: "/admin/restore-version" },
  ]},
  { title: "Operations", items: [
    { label: "Data Retention",       icon: Archive,       path: "/admin/data-retention" },
    { label: "Bulk Operations",      icon: Layers,        path: "/admin/bulk-operations" },
    { label: "Report Generator",     icon: BarChart3,     path: "/admin/report-generator" },
    { label: "Secrets Manager",      icon: KeyRound,      path: "/admin/secrets-manager" },
    { label: "Knowledge Base",       icon: BookOpen,      path: "/admin/knowledge-base" },
    { label: "Data Archival",        icon: Archive,       path: "/admin/data-archival" },
    { label: "Cleanup Safety",       icon: Wrench,        path: "/admin/cleanup-safety" },
    { label: "Soft Delete Cleanup",  icon: Trash2,        path: "/admin/soft-delete-cleanup" },
    { label: "Export Format",        icon: Download,      path: "/admin/export-format" },
    { label: "Report Validation",    icon: ClipboardCheck,path: "/admin/report-validation" },
    { label: "Queue Management",     icon: Layers,        path: "/admin/queue-management" },
    { label: "Compliance Manager",   icon: Shield,        path: "/admin/compliance" },
    { label: "Comprehensive Audit",  icon: ClipboardList, path: "/admin/comprehensive-audit" },
  ]},
  { title: "Data Safety", items: [
    { label: "Data Integrity",          icon: Database,    path: "/admin/data-integrity" },
    { label: "Network Monitor",         icon: Wifi,        path: "/admin/network-monitor" },
    { label: "Deadlock Protection",     icon: Lock,        path: "/admin/deadlock-protection" },
    { label: "Notification Delivery",   icon: Bell,        path: "/admin/notification-delivery" },
    { label: "Change Approval",         icon: ShieldCheck, path: "/admin/change-approval" },
    { label: "Search Index",            icon: Search,      path: "/admin/search-index" },
    { label: "Duplicate Accounts",      icon: Users,       path: "/admin/duplicate-accounts" },
  ]},
  { title: "Time & Backup", items: [
    { label: "Time Sync",               icon: Clock,       path: "/admin/time-sync" },
    { label: "Backup Verification",     icon: Archive,     path: "/admin/backup-verification" },
    { label: "Lockout Recovery",        icon: UserCog,     path: "/admin/lockout-recovery" },
    { label: "System Resources",        icon: Server,      path: "/admin/system-resources" },
    { label: "API Validation",          icon: Zap,         path: "/admin/api-validation" },
  ]},
  { title: "System Health", items: [
    { label: "Session Management",    icon: Users,         path: "/admin/session-management" },
    { label: "Permission Sync",       icon: ShieldCheck,   path: "/admin/permission-sync" },
    { label: "Log Management",        icon: FileText,      path: "/admin/log-management" },
    { label: "Data Import",           icon: FileUp,        path: "/admin/data-import" },
    { label: "Config Rollback",       icon: Settings2,     path: "/admin/config-rollback" },
    { label: "Query Validation",      icon: Database,      path: "/admin/query-validation" },
    { label: "Pagination Validator",  icon: Monitor,       path: "/admin/pagination-validator" },
    { label: "Session Storage",       icon: Lock,          path: "/admin/session-storage" },
    { label: "Session Sync",          icon: Settings2,     path: "/admin/session-sync" },
    { label: "Session Expiry",        icon: Clock,         path: "/admin/session-expiry" },
  ]},
  { title: "Advanced Ops", items: [
    { label: "Monitoring Redundancy",   icon: Activity,      path: "/admin/monitoring-redundancy" },
    { label: "Data Sync",               icon: Database,      path: "/admin/data-sync" },
    { label: "Security Patch",          icon: Shield,        path: "/admin/security-patch" },
    { label: "Token Management",        icon: KeyRound,      path: "/admin/token-management" },
    { label: "Disaster Recovery",       icon: AlertTriangle, path: "/admin/disaster-recovery" },
    { label: "Config Drift",            icon: Settings2,     path: "/admin/config-drift" },
    { label: "Rate Limit Config",       icon: Gauge,         path: "/admin/rate-limit-config" },
  ]},
  { title: "Content & Config", items: [
    { label: "App Branding",        icon: ImageIcon,          path: "/admin/branding" },
    { label: "Reset Center",        icon: RotateCcw,          path: "/admin/reset" },
    { label: "Hero Slideshow",      icon: SlidersHorizontal,  path: "/admin/hero-slides" },
    { label: "Testimonials",        icon: MessageSquareQuote, path: "/admin/testimonials" },
    { label: "User Reviews",        icon: Star,               path: "/admin/reviews" },
    { label: "Legal Docs",          icon: FileText,           path: "/admin/legal-documents" },
    { label: "Countdowns",          icon: Clock,              path: "/admin/countdowns" },
    { label: "Referrals",           icon: UserPlus,           path: "/admin/referrals" },
    { label: "Site Visitors",       icon: Eye,                path: "/admin/visitors" },
    { label: "Settings",            icon: Settings,           path: "/admin/settings" },
    { label: "Localization",        icon: Languages,          path: "/admin/localization" },
    { label: "Timezone Manager",    icon: Clock,              path: "/admin/timezone-manager" },
    { label: "Time Slots",          icon: CalendarClock,      path: "/admin/time-slots" },
    { label: "Alert Visibility",    icon: Eye,                path: "/admin/alert-visibility" },
    { label: "Dashboard Accuracy",  icon: BarChart3,          path: "/admin/dashboard-accuracy" },
  ]},
  { title: "Fraud Detection", items: [
    { label: "Fraud Dashboard",       icon: ShieldAlert,    path: "/admin/fraud-dashboard" },
    { label: "User Risk Scores",      icon: TrendingUp,     path: "/admin/user-risk-score" },
    { label: "Suspicious Users",      icon: UserX,          path: "/admin/suspicious-users" },
    { label: "Payment Fraud",         icon: CreditCard,     path: "/admin/payment-fraud" },
    { label: "IP & Device Monitor",   icon: Monitor,        path: "/admin/ip-device-monitor" },
    { label: "Fraud Alerts",          icon: Bell,           path: "/admin/fraud-alerts" },
    { label: "Account Restrictions",  icon: Ban,            path: "/admin/account-restrictions" },
    { label: "Fraud Rules",           icon: Shield,         path: "/admin/fraud-rules" },
    { label: "Fraud Cases",           icon: Folder,         path: "/admin/fraud-cases" },
    { label: "Fraud Audit Log",       icon: ClipboardList,  path: "/admin/fraud-audit-log" },
    { label: "Notifications",         icon: Bell,           path: "/admin/fraud-notifications" },
    { label: "Automation",            icon: Zap,            path: "/admin/fraud-automation" },
    { label: "Fraud Reports",         icon: BarChart2,      path: "/admin/fraud-reports" },
    { label: "Security Settings",     icon: Settings,       path: "/admin/fraud-security" },
  ]},
];

const allNavItems = navSections.flatMap(s => s.items);

type NavItem = { label: string; icon: React.ElementType; path: string };
type NavGroup = { label: string; icon: React.ElementType; directPath: string | null; items: NavItem[] };

const navGroupItems: NavGroup[] = [
  { label: "Dashboard",      icon: LayoutDashboard, directPath: "/admin/dashboard", items: [] },
  { label: "Users",          icon: Users,            directPath: null, items: navSections.filter(s => s.title === "User Management").flatMap(s => s.items) },
  { label: "Financial",      icon: Wallet,           directPath: null, items: [{ label: "My Wallet", icon: Wallet, path: "/admin/wallet" }, ...navSections.filter(s => s.title === "Financial").flatMap(s => s.items)] },
  { label: "Verification",   icon: BadgeCheck,       directPath: null, items: navSections.filter(s => ["Verification","Projects & Work","Communication","Business & Growth"].includes(s.title)).flatMap(s => s.items) },
  { label: "Security",       icon: Shield,           directPath: null, items: navSections.filter(s => ["Security & Monitoring","Risk Prevention","Advanced Security"].includes(s.title)).flatMap(s => s.items) },
  { label: "Infrastructure", icon: Server,           directPath: null, items: navSections.filter(s => ["Infrastructure","System Stability","Monitoring","Platform Safety"].includes(s.title)).flatMap(s => s.items) },
  { label: "Operations",     icon: Activity,         directPath: null, items: navSections.filter(s => ["Reliability","Operations","Data Safety","Time & Backup","System Health","Advanced Ops"].includes(s.title)).flatMap(s => s.items) },
  { label: "Fraud",          icon: ShieldAlert,      directPath: null, items: navSections.filter(s => s.title === "Fraud Detection").flatMap(s => s.items) },
  { label: "Content",        icon: Layers,           directPath: null, items: navSections.filter(s => s.title === "Content & Config").flatMap(s => s.items) },
];

const LANGS = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "ml", label: "മലയാളം", flag: "🇮🇳" },
  { code: "ta", label: "தமிழ்", flag: "🇮🇳" },
];

const QUICK_ACTIONS = [
  { label: "Add User",       icon: UserPlus,   path: "/admin/users" },
  { label: "New Job",        icon: Briefcase,  path: "/admin/jobs" },
  { label: "View Reports",   icon: BarChart3,  path: "/admin/report-generator" },
  { label: "Audit Logs",     icon: ClipboardList, path: "/admin/audit-logs" },
  { label: "Settings",       icon: Settings,   path: "/admin/settings" },
];


/* ─── Clear Data config per admin route ─────────────────────────────────── */
interface ClearTableConfig {
  name: string;
  label: string;
  labelField: string;
  dateField?: string;
  filter?: Record<string, string>;
}
interface ClearConfig {
  pageLabel: string;
  tables: ClearTableConfig[];
  warning: string;
}
type FetchedRecord = { id: string; label: string; date?: string };

const CLEAR_DATA_MAP: Record<string, ClearConfig> = {
  "/admin/notifications":      { pageLabel: "Notifications",         tables: [{ name: "notifications",            label: "Notifications",           labelField: "message",           dateField: "created_at" }],                                                                                              warning: "Selected notification records will be permanently deleted." },
  "/admin/announcements":      { pageLabel: "Announcements",         tables: [{ name: "announcements",            label: "Announcements",           labelField: "title",             dateField: "created_at" }],                                                                                              warning: "Selected announcements will be permanently removed." },
  "/admin/hero-slides":        { pageLabel: "Hero Slides",           tables: [{ name: "hero_slides",              label: "Hero Slides",             labelField: "title",             dateField: "created_at" }],                                                                                              warning: "Selected hero slideshow entries will be permanently deleted." },
  "/admin/testimonials":       { pageLabel: "Testimonials",          tables: [{ name: "testimonials",             label: "Testimonials",            labelField: "name",              dateField: "created_at" }],                                                                                              warning: "Selected testimonials will be permanently removed." },
  "/admin/reviews":            { pageLabel: "User Reviews",          tables: [{ name: "user_reviews",             label: "User Reviews",            labelField: "comment",           dateField: "created_at" }],                                                                                              warning: "Selected user reviews will be permanently deleted." },
  "/admin/legal-documents":    { pageLabel: "Legal Documents",       tables: [{ name: "legal_documents",          label: "Legal Documents",         labelField: "title",             dateField: "updated_at" }],                                                                                              warning: "Selected legal documents will be permanently removed." },
  "/admin/countdowns":         { pageLabel: "Countdowns",            tables: [{ name: "countdowns",               label: "Countdown Timers",        labelField: "name",              dateField: "created_at" }],                                                                                              warning: "Selected countdown timers will be permanently deleted." },
  "/admin/referrals":          { pageLabel: "Referrals",             tables: [{ name: "referrals",                label: "Referral Records",        labelField: "id",                dateField: "created_at" }],                                                                                              warning: "Selected referral records will be permanently deleted." },
  "/admin/verifications":      { pageLabel: "Aadhaar Verifications", tables: [{ name: "aadhaar_verifications",    label: "Aadhaar Verifications",   labelField: "name_on_aadhaar",   dateField: "created_at" }],                                                                                              warning: "Selected Aadhaar KYC records will be permanently deleted." },
  "/admin/bank-verifications": { pageLabel: "Bank Verifications",    tables: [{ name: "bank_verifications",       label: "Bank Verifications",      labelField: "status",            dateField: "created_at" }],                                                                                              warning: "Selected bank verification records will be permanently deleted." },
  "/admin/withdrawals":        { pageLabel: "Withdrawals",           tables: [{ name: "withdrawals",              label: "Withdrawal Requests",     labelField: "amount",            dateField: "requested_at" }],                                                                                            warning: "Selected withdrawal records will be permanently deleted." },
  "/admin/recovery-requests":  { pageLabel: "Recovery Requests",     tables: [{ name: "recovery_requests",        label: "Recovery Requests",       labelField: "status",            dateField: "created_at" }],                                                                                              warning: "Selected recovery request records will be permanently deleted." },
  "/admin/ip-blocking":        { pageLabel: "IP Blocking",           tables: [{ name: "blocked_ips",              label: "Blocked IPs",             labelField: "ip_address",        dateField: "blocked_at" }],                                                                                              warning: "Selected blocked IP entries will be removed." },
  "/admin/wallet-upgrades":    { pageLabel: "Wallet Upgrades",       tables: [{ name: "wallet_upgrade_requests",  label: "Wallet Upgrade Requests", labelField: "status",            dateField: "created_at" }],                                                                                              warning: "Selected wallet upgrade request records will be permanently deleted." },
  "/admin/jobs":               { pageLabel: "Jobs",                  tables: [{ name: "projects",                 label: "Jobs / Projects",         labelField: "name",              dateField: "created_at" }],                                                                                              warning: "Selected job/project records will be permanently deleted." },
  "/admin/auto-responses":     { pageLabel: "Auto Responses",        tables: [{ name: "upgrade_auto_responses",   label: "Auto-Response Templates", labelField: "step_key",          dateField: "created_at" }, { name: "quick_reply_analytics", label: "Quick Reply Analytics", labelField: "template_text", dateField: "created_at" }], warning: "Selected auto-response and analytics records will be permanently deleted." },
  "/admin/services":           { pageLabel: "Services",              tables: [{ name: "service_categories",       label: "Service Categories",      labelField: "name",              dateField: "created_at" }, { name: "service_skills", label: "Service Skills", labelField: "name", dateField: "created_at" }],  warning: "Selected service categories/skills will be permanently deleted." },
  "/admin/payment-methods":    { pageLabel: "Payment Methods",       tables: [{ name: "payment_methods",          label: "Payment Methods",         labelField: "name",              dateField: "created_at" }],                                                                                              warning: "Selected payment method records will be permanently deleted." },
  "/admin/attendance":         { pageLabel: "Attendance",            tables: [{ name: "attendance",               label: "Attendance Records",      labelField: "date",              dateField: "created_at" }],                                                                                              warning: "Selected attendance records will be permanently deleted." },
  "/admin/pwa-installs":       { pageLabel: "App Installs",          tables: [{ name: "pwa_install_status",       label: "App Install Records",     labelField: "user_agent",        dateField: "created_at" }],                                                                                              warning: "Selected PWA install records will be permanently deleted." },
  "/admin/visitors":           { pageLabel: "Site Visitors",         tables: [{ name: "site_visitors",            label: "Site Visitor Records",    labelField: "ip_address",        dateField: "visited_at" }],                                                                                              warning: "Selected visitor records will be permanently deleted." },
  "/admin/audit-logs":         { pageLabel: "Audit Logs",            tables: [{ name: "admin_audit_logs",         label: "Audit Log Entries",       labelField: "action",            dateField: "created_at" }],                                                                                              warning: "Selected audit log entries will be permanently deleted." },
};

function useClickOutside(ref: React.RefObject<HTMLDivElement | null>, fn: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) fn(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, fn]);
}

const AdminLayout = () => {
  const [sessionWarning, setSessionWarning]   = useState(false);
  const [searchOpen, setSearchOpen]           = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearingData, setClearingData]       = useState(false);
  const [clearResult, setClearResult]         = useState<{ ok: boolean; msg: string } | null>(null);
  const [clearPhase, setClearPhase]           = useState<"confirm"|"countdown"|"result">("confirm");
  const [clearCountdown, setClearCountdown]   = useState(120);
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set());
  const [fetchedRecords, setFetchedRecords]   = useState<Record<string, FetchedRecord[]>>({});
  const [fetchingRecords, setFetchingRecords] = useState(false);
  const clearIntervalRef                       = useRef<ReturnType<typeof setInterval> | null>(null);
  const [searchQ, setSearchQ]               = useState("");
  const [profileOpen, setProfileOpen]       = useState(false);
  const [notifOpen, setNotifOpen]           = useState(false);
  const [langOpen, setLangOpen]             = useState(false);
  const [quickOpen, setQuickOpen]           = useState(false);
  const [rightOpen, setRightOpen]           = useState(false);
  const [lang, setLang]                     = useState("en");
  const [openNavGroup, setOpenNavGroup]     = useState<string | null>(null);
  const [appLogoUrl, setAppLogoUrl]         = useState<string | null>(null);
  const [appName, setAppName]               = useState("Freelancer India");

  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useAdminTheme();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef   = useRef<HTMLDivElement>(null);
  const langRef    = useRef<HTMLDivElement>(null);
  const quickRef   = useRef<HTMLDivElement>(null);
  const searchRef  = useRef<HTMLDivElement>(null);
  const navBarRef  = useRef<HTMLDivElement | null>(null);

  useClickOutside(profileRef, () => setProfileOpen(false));
  useClickOutside(notifRef,   () => setNotifOpen(false));
  useClickOutside(langRef,    () => setLangOpen(false));
  useClickOutside(quickRef,   () => setQuickOpen(false));
  useClickOutside(searchRef,  () => { if (!searchQ) setSearchOpen(false); });
  useClickOutside(navBarRef as React.RefObject<HTMLDivElement | null>, () => setOpenNavGroup(null));

  const tok = T;
  const css = buildCss(tok);

  const currentNav = allNavItems.find(item => location.pathname === item.path);
  const isSubPage  = location.pathname !== "/admin/dashboard";

  const searchResults = searchQ.length > 1
    ? allNavItems.filter(i => i.label.toLowerCase().includes(searchQ.toLowerCase())).slice(0, 8)
    : [];

  const resetSessionTimer = useCallback(() => {
    const minutes = parseInt(localStorage.getItem(SESSION_TIMEOUT_KEY) || "30");
    const ms = minutes * 60 * 1000;
    const warnMs = Math.max(ms - 2 * 60 * 1000, ms - ms * 0.1);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warnRef.current)    clearTimeout(warnRef.current);
    setSessionWarning(false);
    warnRef.current    = setTimeout(() => setSessionWarning(true), warnMs);
    timeoutRef.current = setTimeout(async () => { await signOut(); navigate("/login"); }, ms);
  }, [signOut, navigate]);

  useEffect(() => {
    resetSessionTimer();
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];
    const handler = () => { setSessionWarning(false); resetSessionTimer(); };
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warnRef.current)    clearTimeout(warnRef.current);
    };
  }, [resetSessionTimer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
      if (e.key === "Escape") { setSearchOpen(false); setSearchQ(""); setProfileOpen(false); setNotifOpen(false); setLangOpen(false); setQuickOpen(false); setOpenNavGroup(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    supabase.from("app_settings").select("key, value").in("key", ["app_logo_url", "app_name"])
      .then(({ data }) => {
        if (!data) return;
        const logo = data.find(r => r.key === "app_logo_url");
        const name = data.find(r => r.key === "app_name");
        if (logo?.value) setAppLogoUrl(logo.value);
        if (name?.value) setAppName(name.value);
      });
  }, []);

  const { data: pendingRecoveryCount = 0 } = useQuery({
    queryKey: ["admin-recovery-pending-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("recovery_requests").select("*", { count: "exact", head: true }).eq("status", "pending");
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const { data: recentAlerts = [] } = useQuery({
    queryKey: ["admin-layout-recent-alerts"],
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("id,message,type,created_at").order("created_at", { ascending: false }).limit(4);
      return (data || []).map(n => ({
        type: n.type || "info",
        msg: n.message || "",
        time: n.created_at ? new Date(n.created_at).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }) : "",
      }));
    },
    refetchInterval: 60000,
  });

  const { data: profile } = useQuery({
    queryKey: ["admin-layout-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from("profiles").select("full_name,email").eq("id", user.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const handleLogout = async () => { await signOut(); navigate("/login"); };

  const clearConfig = CLEAR_DATA_MAP[location.pathname] ?? null;

  const stopClearInterval = () => {
    if (clearIntervalRef.current) { clearInterval(clearIntervalRef.current); clearIntervalRef.current = null; }
  };

  const openClearDialog = async () => {
    stopClearInterval();
    setClearPhase("confirm");
    setClearCountdown(120);
    setClearResult(null);
    setSelectedRecordIds(new Set());
    setFetchedRecords({});
    setClearDialogOpen(true);
    if (!clearConfig) return;
    setFetchingRecords(true);
    const records: Record<string, FetchedRecord[]> = {};
    for (const t of clearConfig.tables) {
      const fields = ["id", t.labelField, ...(t.dateField ? [t.dateField] : [])].filter((v, i, a) => a.indexOf(v) === i).join(",");
      const { data } = await (supabase.from(t.name as any) as any).select(fields).order("id", { ascending: false }).limit(200);
      if (data) {
        records[t.name] = (data as any[]).map((row: any) => ({
          id: String(row.id ?? ""),
          label: row[t.labelField] != null ? String(row[t.labelField]).substring(0, 80) : `Record #${row.id}`,
          date: t.dateField && row[t.dateField] ? row[t.dateField] : undefined,
        }));
      }
    }
    setFetchedRecords(records);
    setFetchingRecords(false);
  };

  const cancelClear = () => {
    stopClearInterval();
    setClearDialogOpen(false);
    setClearPhase("confirm");
    setClearCountdown(120);
    setClearResult(null);
    setSelectedRecordIds(new Set());
    setFetchedRecords({});
  };

  const startCountdown = () => {
    if (!clearConfig || selectedRecordIds.size === 0) return;
    setClearPhase("countdown");
    setClearCountdown(120);
    clearIntervalRef.current = setInterval(() => {
      setClearCountdown(prev => {
        if (prev <= 1) {
          stopClearInterval();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (clearPhase === "countdown" && clearCountdown === 0) {
      executeClearData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearPhase, clearCountdown]);

  const executeClearData = async () => {
    if (!clearConfig) return;
    if (selectedRecordIds.size === 0) return;
    setClearingData(true);
    setClearPhase("result");
    setClearResult(null);
    try {
      for (const t of clearConfig.tables) {
        const tableRecords = fetchedRecords[t.name] || [];
        const idsToDelete = tableRecords.filter(r => selectedRecordIds.has(`${t.name}::${r.id}`)).map(r => r.id);
        if (idsToDelete.length === 0) continue;
        const { error } = await (supabase.from(t.name as any) as any).delete().in("id", idsToDelete);
        if (error) throw new Error(`Failed to clear ${t.label}: ${error.message}`);
      }
      setClearResult({ ok: true, msg: `${selectedRecordIds.size} record${selectedRecordIds.size === 1 ? "" : "s"} deleted successfully.` });
      setTimeout(() => { setClearDialogOpen(false); setClearPhase("confirm"); setClearResult(null); }, 2500);
    } catch (err: any) {
      setClearResult({ ok: false, msg: err.message || "Clear failed." });
    }
    setClearingData(false);
  };

  const userEmail   = profile?.email || user?.email || "admin@example.com";
  const userName    = (Array.isArray(profile?.full_name) ? profile.full_name[0] : profile?.full_name) || userEmail.split("@")[0] || "Admin";
  const userInitial = userName.charAt(0).toUpperCase();
  const currentLang = LANGS.find(l => l.code === lang) || LANGS[0];

  const alertIcon = (type: string) => {
    if (type === "success") return <CheckCircle2 size={12} color="#4ade80" />;
    if (type === "warning") return <AlertTriangle size={12} color="#fbbf24" />;
    if (type === "error")   return <XCircle size={12} color="#f87171" />;
    return <Info size={12} color="#a5b4fc" />;
  };

  const iconBtn = (onClick: () => void, children: React.ReactNode, badge?: number, title?: string) => (
    <button onClick={onClick} title={title}
      style={{ position: "relative", width: 34, height: 34, borderRadius: 9, background: tok.iconBtn, border: "1px solid rgba(0,0,0,.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: tok.mainSub, transition: "all .15s", flexShrink: 0 }}
      onMouseEnter={e => { e.currentTarget.style.background = tok.iconBtnHov; e.currentTarget.style.color = tok.mainText; }}
      onMouseLeave={e => { e.currentTarget.style.background = tok.iconBtn;    e.currentTarget.style.color = tok.mainSub;  }}>
      {children}
      {badge != null && badge > 0 && (
        <span style={{ position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, background: "#ef4444", color: "white", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px", lineHeight: 1 }}>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );

  const dropStyle: React.CSSProperties = {
    position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 200,
    background: tok.dropBg, border: `1px solid ${tok.dropBdr}`,
    borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,.25)", minWidth: 220,
    overflow: "hidden",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: tok.shell, color: tok.mainText, fontFamily: "Inter,system-ui,sans-serif" }}>
      <style>{css}</style>

      {/* Ambient background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle,${tok.orbA} 0%,transparent 70%)`, animation: "orbGlow 8s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "20%", right: "5%", width: 350, height: 350, borderRadius: "50%", background: `radial-gradient(circle,${tok.orbB} 0%,transparent 70%)`, animation: "orbGlow 10s ease-in-out infinite 3s" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${tok.gridLine} 1px,transparent 1px),linear-gradient(90deg,${tok.gridLine} 1px,transparent 1px)`, backgroundSize: "60px 60px" }} />
      </div>

      {/* ─── TOP HEADER BAR ─────────────────────────────────────────── */}
      <header style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 20px", height: 58, background: tok.header, borderBottom: `1px solid ${tok.headerBdr}`, borderTop: `3px solid ${A1}`, backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 30, flexShrink: 0 }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: appLogoUrl ? "transparent" : tok.logoBg, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: appLogoUrl ? "none" : `0 3px 12px ${tok.logoShadow}`, overflow: "hidden" }}>
            {appLogoUrl
              ? <img src={appLogoUrl} alt="App Logo" style={{ width: 34, height: 34, objectFit: "contain", borderRadius: 10 }} />
              : <ShieldCheck size={16} color="white" />}
          </div>
          <div className="hidden sm:block">
            <p style={{ fontWeight: 800, fontSize: 13, color: tok.mainText, lineHeight: 1.2, margin: 0 }}>{appName}</p>
            <p style={{ fontSize: 9, color: tok.mainSub, fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>Super Admin</p>
          </div>
        </div>

        {/* Search */}
        <div ref={searchRef} style={{ flex: 1, maxWidth: 380, margin: "0 16px", position: "relative" }}>
          {searchOpen ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: tok.searchBg, border: `1px solid ${A1}55`, borderRadius: 10, padding: "0 12px", height: 34 }}>
              <Search size={13} color={tok.mainSub} />
              <input autoFocus value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder="Search pages..."
                style={{ flex: 1, background: "none", border: "none", outline: "none", color: tok.mainText, fontSize: 13 }} />
              <kbd style={{ fontSize: 9, color: tok.mainSub, background: "rgba(0,0,0,.06)", borderRadius: 4, padding: "1px 5px" }}>ESC</kbd>
            </div>
          ) : (
            <button onClick={() => setSearchOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: 8, background: tok.searchBg, border: `1px solid ${tok.searchBdr}`, borderRadius: 10, padding: "0 12px", height: 34, width: "100%", cursor: "text", color: tok.mainSub, fontSize: 12.5 }}>
              <Search size={13} />
              <span style={{ flex: 1, textAlign: "left" }}>Search pages...</span>
              <kbd style={{ fontSize: 9, color: tok.mainSub, background: "rgba(0,0,0,.06)", borderRadius: 4, padding: "1px 5px" }}>⌘K</kbd>
            </button>
          )}
          {searchResults.length > 0 && (
            <div className="admin-drop" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: tok.dropBg, border: `1px solid ${tok.dropBdr}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 16px 40px rgba(0,0,0,.25)", zIndex: 300 }}>
              {searchResults.map(r => (
                <button key={r.path} onClick={() => { navigate(r.path); setSearchOpen(false); setSearchQ(""); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", background: "none", border: "none", cursor: "pointer", color: tok.mainText, fontSize: 13, textAlign: "left" }}
                  onMouseEnter={e => (e.currentTarget.style.background = tok.contentHoverBg)}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                  <r.icon size={13} color={A1} />
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right header actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", flexShrink: 0 }}>

          {/* Quick Create */}
          <div ref={quickRef} style={{ position: "relative" }}>
            {iconBtn(() => setQuickOpen(o => !o), <Plus size={15} />, undefined, "Quick Actions")}
            {quickOpen && (
              <div className="admin-drop" style={{ ...dropStyle, minWidth: 200 }}>
                <div style={{ padding: "10px 14px 8px", borderBottom: `1px solid ${tok.dropBdr}` }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: tok.mainSub, textTransform: "uppercase", letterSpacing: 1 }}>Quick Create</p>
                </div>
                {QUICK_ACTIONS.map(a => (
                  <button key={a.path} onClick={() => { navigate(a.path); setQuickOpen(false); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", background: "none", border: "none", cursor: "pointer", color: tok.mainText, fontSize: 13 }}
                    onMouseEnter={e => (e.currentTarget.style.background = tok.contentHoverBg)}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                    <a.icon size={13} color={A1} />
                    <span>{a.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          {iconBtn(() => navigate("/admin/notifications"), <MessageSquare size={15} />, undefined, "Messages")}

          {/* Notifications */}
          <div ref={notifRef} style={{ position: "relative" }}>
            {iconBtn(() => setNotifOpen(o => !o), <Bell size={15} />, pendingRecoveryCount, "Notifications")}
            {notifOpen && (
              <div className="admin-drop" style={{ ...dropStyle, minWidth: 300, maxHeight: 420, overflowY: "auto" }}>
                <div style={{ padding: "12px 16px 10px", borderBottom: `1px solid ${tok.dropBdr}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <p style={{ fontWeight: 700, fontSize: 13, color: tok.mainText, margin: 0 }}>Notifications</p>
                  {pendingRecoveryCount > 0 && <span style={{ fontSize: 10, background: `${A1}22`, color: A1, borderRadius: 20, padding: "2px 8px", fontWeight: 700 }}>{pendingRecoveryCount} pending</span>}
                </div>
                {recentAlerts.length === 0 ? (
                  <div style={{ padding: "16px", textAlign: "center", color: tok.mainSub, fontSize: 12 }}>No notifications yet</div>
                ) : recentAlerts.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 16px", borderBottom: i < recentAlerts.length - 1 ? `1px solid ${tok.dropBdr}` : "none" }}>
                    <div style={{ marginTop: 2, flexShrink: 0 }}>{alertIcon(a.type)}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 12.5, color: tok.mainText, margin: 0 }}>{a.msg}</p>
                      <p style={{ fontSize: 10.5, color: tok.mainSub, margin: "2px 0 0" }}>{a.time}</p>
                    </div>
                  </div>
                ))}
                <div style={{ padding: "10px 16px" }}>
                  <button onClick={() => { navigate("/admin/notifications"); setNotifOpen(false); }}
                    style={{ width: "100%", padding: "7px 0", borderRadius: 8, background: `${A1}15`, border: `1px solid ${A1}30`, color: A1, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Language */}
          <div ref={langRef} style={{ position: "relative" }}>
            <button onClick={() => setLangOpen(o => !o)} title="Language"
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 9, background: tok.iconBtn, border: "1px solid rgba(0,0,0,.08)", cursor: "pointer", color: tok.mainSub, fontSize: 12, fontWeight: 600, height: 34 }}
              onMouseEnter={e => { e.currentTarget.style.background = tok.iconBtnHov; e.currentTarget.style.color = tok.mainText; }}
              onMouseLeave={e => { e.currentTarget.style.background = tok.iconBtn;    e.currentTarget.style.color = tok.mainSub;  }}>
              <Languages size={13} />
              <span className="hidden sm:inline">{currentLang.flag} {currentLang.code.toUpperCase()}</span>
            </button>
            {langOpen && (
              <div className="admin-drop" style={{ ...dropStyle, minWidth: 160 }}>
                <div style={{ padding: "8px 12px 6px", borderBottom: `1px solid ${tok.dropBdr}` }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: tok.mainSub, textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>Language</p>
                </div>
                {LANGS.map(l => (
                  <button key={l.code} onClick={() => { setLang(l.code); setLangOpen(false); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", background: lang === l.code ? `${A1}12` : "none", border: "none", cursor: "pointer", color: lang === l.code ? tok.accent : tok.mainText, fontSize: 13, fontWeight: lang === l.code ? 600 : 400 }}
                    onMouseEnter={e => { if (lang !== l.code) e.currentTarget.style.background = tok.contentHoverBg; }}
                    onMouseLeave={e => { if (lang !== l.code) e.currentTarget.style.background = "none"; }}>
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                    {lang === l.code && <CheckCircle2 size={12} color={A1} style={{ marginLeft: "auto" }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel Toggle */}
          {iconBtn(() => setRightOpen(o => !o), rightOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />, undefined, "Quick Panel")}

          {/* Profile Dropdown */}
          <div ref={profileRef} style={{ position: "relative" }}>
            <button onClick={() => setProfileOpen(o => !o)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 10px 4px 4px", borderRadius: 10, background: tok.iconBtn, border: "1px solid rgba(0,0,0,.08)", cursor: "pointer", height: 36 }}
              onMouseEnter={e => (e.currentTarget.style.background = tok.iconBtnHov)}
              onMouseLeave={e => (e.currentTarget.style.background = tok.iconBtn)}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "white", flexShrink: 0 }}>
                {userInitial}
              </div>
              <div className="hidden sm:block" style={{ textAlign: "left" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: tok.mainText, margin: 0, lineHeight: 1.2, whiteSpace: "nowrap", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis" }}>{userName}</p>
                <p style={{ fontSize: 10, color: tok.mainSub, margin: 0, lineHeight: 1.2 }}>Super Admin</p>
              </div>
              <ChevronDown size={12} color={tok.mainSub} className="hidden sm:block" />
            </button>
            {profileOpen && (
              <div className="admin-drop" style={{ ...dropStyle, minWidth: 240 }}>
                <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${tok.dropBdr}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "white", flexShrink: 0 }}>
                      {userInitial}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 13, color: tok.mainText, margin: 0 }}>{userName}</p>
                      <p style={{ fontSize: 11, color: tok.mainSub, margin: 0 }}>{userEmail}</p>
                      <span style={{ fontSize: 9.5, background: `${A1}20`, color: A1, borderRadius: 20, padding: "1px 7px", fontWeight: 700, display: "inline-block", marginTop: 2 }}>Super Admin</span>
                    </div>
                  </div>
                </div>
                {[
                  { label: "My Profile",   icon: User,          path: "/admin/settings" },
                  { label: "Settings",     icon: Settings,      path: "/admin/settings" },
                  { label: "Audit Logs",   icon: ClipboardList, path: "/admin/audit-logs" },
                ].map(item => (
                  <button key={item.label} onClick={() => { navigate(item.path); setProfileOpen(false); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "none", border: "none", cursor: "pointer", color: tok.mainText, fontSize: 13 }}
                    onMouseEnter={e => (e.currentTarget.style.background = tok.contentHoverBg)}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                    <item.icon size={14} color={tok.mainSub} />
                    <span>{item.label}</span>
                  </button>
                ))}
                <div style={{ borderTop: `1px solid ${tok.dropBdr}`, margin: "4px 0" }} />
                <button onClick={handleLogout}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "none", border: "none", cursor: "pointer", color: tok.logoutFg, fontSize: 13, fontWeight: 500 }}
                  onMouseEnter={e => (e.currentTarget.style.background = tok.logoutHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── HORIZONTAL NAV BAR ─────────────────────────────────────── */}
      {/* overflow:visible is critical — lets absolute dropdowns escape the bar */}
      <div ref={navBarRef} style={{ background: tok.header, borderBottom: `1px solid ${tok.headerBdr}`, padding: "0 20px", display: "flex", alignItems: "stretch", overflow: "visible", zIndex: 29, position: "sticky", top: 58, flexShrink: 0, backdropFilter: "blur(20px)" }}>
        {navGroupItems.map(group => {
          const isGroupActive = group.directPath
            ? location.pathname === group.directPath
            : group.items.some(item => location.pathname === item.path);
          const isOpen = openNavGroup === group.label;
          const tabColor = isGroupActive ? A1 : tok.mainSub;
          const tabBorder = isGroupActive ? `2px solid ${A1}` : "2px solid transparent";
          return (
            <div key={group.label} style={{ position: "relative", flexShrink: 0 }}>
              {group.directPath ? (
                <NavLink to={group.directPath}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 16px", height: 44, color: tabColor, fontSize: 13, fontWeight: isGroupActive ? 700 : 500, borderBottom: tabBorder, textDecoration: "none", whiteSpace: "nowrap" }}>
                  <group.icon size={13} />
                  <span>{group.label}</span>
                </NavLink>
              ) : (
                <button
                  onClick={() => setOpenNavGroup(isOpen ? null : group.label)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 16px", height: 44, color: tabColor, fontSize: 13, fontWeight: isGroupActive ? 700 : 500, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: tabBorder, background: "transparent", cursor: "pointer", whiteSpace: "nowrap" }}>
                  <group.icon size={13} />
                  <span>{group.label}</span>
                  <ChevronDown size={10} style={{ opacity: 0.5, marginLeft: 2 }} />
                </button>
              )}
              {isOpen && group.items.length > 0 && (
                <div className="admin-drop" style={{ position: "absolute", top: "calc(100% + 2px)", left: 0, zIndex: 9999, background: tok.dropBg, border: `1px solid ${tok.dropBdr}`, borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,.2)", minWidth: 220, maxHeight: 480, overflowY: "auto" }}>
                  <div style={{ padding: "8px 14px 6px", borderBottom: `1px solid ${tok.dropBdr}` }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: tok.mainSub, textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>{group.label}</p>
                  </div>
                  <div style={{ padding: 6 }}>
                    {group.items.map(item => {
                      const isItemActive = location.pathname === item.path;
                      return (
                        <NavLink key={item.path} to={item.path}
                          onClick={() => setOpenNavGroup(null)}
                          style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 12px", borderRadius: 9, fontSize: 12.5, fontWeight: isItemActive ? 600 : 400, color: isItemActive ? A1 : tok.mainText, background: isItemActive ? `${A1}12` : "none", textDecoration: "none", border: isItemActive ? `1px solid ${A1}25` : "1px solid transparent" }}>
                          <item.icon size={13} color={isItemActive ? A1 : tok.mainSub} style={{ flexShrink: 0 }} />
                          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.label}
                            {item.path === "/admin/recovery-requests" && pendingRecoveryCount > 0 && (
                              <span style={{ marginLeft: 5, fontSize: 9, fontWeight: 700, color: "white", background: tok.badgeBg, borderRadius: 8, padding: "1px 5px" }}>{pendingRecoveryCount}</span>
                            )}
                          </span>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Breadcrumb + Clear Data on right */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: tok.mainSub, flexShrink: 0, padding: "0 4px" }}>
          {isSubPage ? (
            <>
              <button onClick={() => navigate("/admin/dashboard")}
                style={{ color: tok.mainSub, background: "none", border: "none", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 3, padding: 0 }}
                onMouseEnter={e => (e.currentTarget.style.color = tok.mainText)}
                onMouseLeave={e => (e.currentTarget.style.color = tok.mainSub)}>
                <ChevronLeft size={13} />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              {currentNav && (
                <>
                  <span style={{ opacity: .4 }}>/</span>
                  <span style={{ fontWeight: 600, color: tok.mainText }}>{currentNav.label}</span>
                </>
              )}
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: tok.statusDot, animation: "pulse-dot 2s ease-in-out infinite" }} />
              <span style={{ fontWeight: 700, color: tok.mainText, fontSize: 12 }}>Live</span>
            </div>
          )}

          {/* ── Clear Data Button ── */}
          <button
            onClick={openClearDialog}
            title="Clear page data"
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 8, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", color: "#dc2626", fontSize: 11.5, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,.15)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,.08)"; }}>
            <Trash2 size={12} />
            <span>Clear Data</span>
          </button>
        </div>
      </div>

      {/* ─── MAIN AREA ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, position: "relative", zIndex: 1 }}>

        {/* Session warning banner */}
        {sessionWarning && (
          <div style={{ background: "rgba(251,191,36,.15)", borderBottom: "1px solid rgba(251,191,36,.3)", padding: "7px 20px", display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
            <AlertTriangle size={13} color="#fbbf24" />
            <span style={{ fontSize: 12, color: "#fbbf24", fontWeight: 600 }}>Session expiring soon — move mouse or press a key to stay logged in</span>
            <button onClick={resetSessionTimer} style={{ marginLeft: "auto", padding: "3px 10px", borderRadius: 7, background: "rgba(251,191,36,.2)", border: "1px solid rgba(251,191,36,.3)", color: "#fbbf24", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              Stay Logged In
            </button>
          </div>
        )}

        {/* ─── CONTENT + RIGHT PANEL ──────────────────────────────── */}
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

          {/* Main content */}
          <main className="admin-main flex-1" style={{ background: tok.mainBg, padding: 24, overflowY: "auto", minWidth: 0 }}>
            <Outlet />
          </main>

          {/* ─── RIGHT QUICK PANEL ────────────────────────────────── */}
          {rightOpen && (
            <aside style={{ width: 280, background: tok.rightBg, borderLeft: `1px solid ${tok.rightBdr}`, display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto" }}>
              <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${tok.rightBdr}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: tok.mainText, margin: 0 }}>Quick Panel</p>
                <button onClick={() => setRightOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: tok.mainSub, display: "flex", alignItems: "center" }}>
                  <X size={15} />
                </button>
              </div>

              {/* System Status */}
              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${tok.rightBdr}` }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: tok.mainSub, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>System Status</p>
                {[
                  { label: "API Server",   ok: true },
                  { label: "Database",     ok: true },
                  { label: "Auth Service", ok: true },
                  { label: "Storage",      ok: false },
                ].map(s => (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0" }}>
                    <span style={{ fontSize: 12.5, color: tok.mainText }}>{s.label}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: s.ok ? tok.green : tok.red, background: s.ok ? `${tok.green}15` : `${tok.red}15`, borderRadius: 20, padding: "1px 8px" }}>
                      {s.ok ? "Operational" : "Degraded"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pending Approvals */}
              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${tok.rightBdr}` }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: tok.mainSub, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>Pending Approvals</p>
                {[
                  { label: "Recovery Requests", count: pendingRecoveryCount, path: "/admin/recovery-requests", color: "#f87171" },
                  { label: "Wallet Upgrades",   count: 3, path: "/admin/wallet-upgrades", color: "#fbbf24" },
                  { label: "Aadhaar Verify",    count: 7, path: "/admin/verifications", color: "#a5b4fc" },
                ].map(a => (
                  <button key={a.label} onClick={() => navigate(a.path)}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", background: "none", border: "none", cursor: "pointer" }}>
                    <span style={{ fontSize: 12.5, color: tok.mainText }}>{a.label}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: a.color, background: `${a.color}18`, borderRadius: 20, padding: "1px 8px" }}>{a.count}</span>
                  </button>
                ))}
              </div>

              {/* Recent Alerts */}
              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${tok.rightBdr}` }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: tok.mainSub, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>Recent Alerts</p>
                {recentAlerts.length === 0 ? (
                  <p style={{ fontSize: 11, color: tok.mainSub, margin: 0 }}>No recent alerts</p>
                ) : recentAlerts.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "5px 0" }}>
                    <div style={{ marginTop: 1, flexShrink: 0 }}>{alertIcon(a.type)}</div>
                    <div>
                      <p style={{ fontSize: 11.5, color: tok.mainText, margin: 0 }}>{a.msg}</p>
                      <p style={{ fontSize: 10, color: tok.mainSub, margin: "1px 0 0" }}>{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div style={{ padding: "14px 16px" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: tok.mainSub, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>Quick Actions</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {QUICK_ACTIONS.map(a => (
                    <button key={a.path} onClick={() => navigate(a.path)}
                      style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 12px", borderRadius: 9, background: `${A1}10`, border: `1px solid ${A1}20`, color: tok.accent, fontSize: 12.5, fontWeight: 500, cursor: "pointer", textAlign: "left" }}
                      onMouseEnter={e => (e.currentTarget.style.background = `${A1}20`)}
                      onMouseLeave={e => (e.currentTarget.style.background = `${A1}10`)}>
                      <a.icon size={13} />
                      <span>{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>

        {/* ─── FOOTER ─────────────────────────────────────────────── */}
        <footer style={{ background: tok.footerBg, borderTop: `1px solid ${tok.footerBdr}`, padding: "8px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, backdropFilter: "blur(12px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 11, color: tok.mainSub, fontWeight: 600 }}>{VER}</span>
            <span style={{ fontSize: 11, color: tok.mainSub }}>© {new Date().getFullYear()} {appName}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span className="admin-pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: tok.statusDot, display: "inline-block" }} />
              <span style={{ fontSize: 11, color: tok.green, fontWeight: 600 }}>All Systems Operational</span>
            </div>
            <span style={{ fontSize: 11, color: tok.mainSub }}>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </footer>
      </div>

      {/* ─── Clear Data Modal (3-phase) ─────────────────────────────── */}
      {clearDialogOpen && (() => {
        const mins = Math.floor(clearCountdown / 60);
        const secs = clearCountdown % 60;
        const timerLabel = `${mins}:${secs.toString().padStart(2, "0")}`;
        const progress = ((120 - clearCountdown) / 120) * 100;
        const circumference = 2 * Math.PI * 52;
        const dashOffset = circumference - (progress / 100) * circumference;
        const selectedCount = selectedRecordIds.size;

        const totalRecords = Object.values(fetchedRecords).reduce((s, arr) => s + arr.length, 0);

        const toggleTableAll = (tableName: string, records: FetchedRecord[]) => {
          const allSel = records.every(r => selectedRecordIds.has(`${tableName}::${r.id}`));
          const next = new Set(selectedRecordIds);
          if (allSel) records.forEach(r => next.delete(`${tableName}::${r.id}`));
          else records.forEach(r => next.add(`${tableName}::${r.id}`));
          setSelectedRecordIds(next);
        };

        const toggleRecord = (key: string) => {
          const next = new Set(selectedRecordIds);
          if (next.has(key)) next.delete(key); else next.add(key);
          setSelectedRecordIds(next);
        };

        const toggleSelectAll = () => {
          if (selectedCount === totalRecords) {
            setSelectedRecordIds(new Set());
          } else {
            const next = new Set<string>();
            Object.entries(fetchedRecords).forEach(([tn, recs]) => recs.forEach(r => next.add(`${tn}::${r.id}`)));
            setSelectedRecordIds(next);
          }
        };

        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div onClick={clearPhase === "countdown" ? undefined : cancelClear}
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)", backdropFilter: "blur(5px)" }} />
            <div style={{ position: "relative", background: "#ffffff", borderRadius: 22, boxShadow: "0 32px 90px rgba(0,0,0,.35)", padding: "28px 28px 24px", width: "100%", maxWidth: 540, margin: "0 16px", maxHeight: "92vh", overflowY: "auto" }}>

              {/* ── PHASE 1: Confirm + Select Records ── */}
              {clearPhase === "confirm" && (
                <>
                  <button onClick={cancelClear} style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,.06)", border: "none", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}>
                    <X size={15} />
                  </button>

                  <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(239,68,68,.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                    <Trash2 size={24} color="#dc2626" />
                  </div>

                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 4px", letterSpacing: "-0.3px" }}>
                    {clearConfig ? `Clear ${clearConfig.pageLabel} Records` : "Clear Page Data"}
                  </h2>

                  {clearConfig ? (
                    <>
                      <div style={{ display: "flex", gap: 9, padding: "10px 13px", background: "rgba(239,68,68,.07)", border: "1px solid rgba(239,68,68,.18)", borderRadius: 11, margin: "12px 0 16px" }}>
                        <AlertTriangle size={15} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", margin: "0 0 2px" }}>Permanent — Cannot Be Undone</p>
                          <p style={{ fontSize: 11.5, color: "#64748b", margin: 0, lineHeight: 1.5 }}>{clearConfig.warning}</p>
                        </div>
                      </div>

                      {/* Record list */}
                      {fetchingRecords ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "28px 0", gap: 10, color: "#64748b", fontSize: 13 }}>
                          <RotateCcw size={16} color="#6366f1" className="animate-spin" />
                          Loading records…
                        </div>
                      ) : totalRecords === 0 ? (
                        <div style={{ padding: "18px 0", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                          No records found in this section.
                        </div>
                      ) : (
                        <>
                          {/* Select all bar */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                            <button onClick={toggleSelectAll}
                              style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                              {selectedCount === totalRecords
                                ? <CheckSquare size={15} color="#dc2626" />
                                : selectedCount > 0
                                  ? <CheckSquare size={15} color="#94a3b8" />
                                  : <Square size={15} color="#94a3b8" />}
                              <span style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                                {selectedCount === totalRecords ? "Deselect All" : "Select All"} ({totalRecords})
                              </span>
                            </button>
                            {selectedCount > 0 && (
                              <span style={{ fontSize: 11.5, fontWeight: 700, color: "#dc2626", background: "rgba(239,68,68,.1)", borderRadius: 20, padding: "2px 9px" }}>
                                {selectedCount} selected
                              </span>
                            )}
                          </div>

                          {/* Records grouped by table */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18, maxHeight: 340, overflowY: "auto", paddingRight: 2 }}>
                            {clearConfig.tables.map(t => {
                              const records = fetchedRecords[t.name] || [];
                              if (records.length === 0) return null;
                              const allSel = records.every(r => selectedRecordIds.has(`${t.name}::${r.id}`));
                              const someSel = records.some(r => selectedRecordIds.has(`${t.name}::${r.id}`));
                              return (
                                <div key={t.name}>
                                  {/* Table section header */}
                                  <button onClick={() => toggleTableAll(t.name, records)}
                                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "#f1f5f9", border: "1px solid rgba(0,0,0,.07)", borderRadius: 8, cursor: "pointer", marginBottom: 5 }}>
                                    {allSel
                                      ? <CheckSquare size={14} color="#dc2626" style={{ flexShrink: 0 }} />
                                      : someSel
                                        ? <CheckSquare size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
                                        : <Square size={14} color="#94a3b8" style={{ flexShrink: 0 }} />}
                                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "#475569" }}>{t.label}</span>
                                    <span style={{ marginLeft: "auto", fontSize: 10.5, color: "#94a3b8", background: "rgba(0,0,0,.05)", borderRadius: 20, padding: "1px 7px", fontWeight: 600 }}>
                                      {records.length} record{records.length !== 1 ? "s" : ""}
                                    </span>
                                  </button>
                                  {/* Individual records */}
                                  <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingLeft: 6 }}>
                                    {records.map(r => {
                                      const key = `${t.name}::${r.id}`;
                                      const checked = selectedRecordIds.has(key);
                                      return (
                                        <button key={key} onClick={() => toggleRecord(key)}
                                          style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 7, background: checked ? "rgba(239,68,68,.05)" : "transparent", border: `1px solid ${checked ? "rgba(239,68,68,.2)" : "rgba(0,0,0,.06)"}`, cursor: "pointer", textAlign: "left" }}>
                                          {checked
                                            ? <CheckSquare size={13} color="#dc2626" style={{ flexShrink: 0 }} />
                                            : <Square size={13} color="#94a3b8" style={{ flexShrink: 0 }} />}
                                          <span style={{ flex: 1, fontSize: 12.5, color: checked ? "#0f172a" : "#64748b", fontWeight: checked ? 500 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {r.label || `Record #${r.id}`}
                                          </span>
                                          {r.date && (
                                            <span style={{ fontSize: 10.5, color: "#94a3b8", flexShrink: 0, marginLeft: 6 }}>
                                              {new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                            </span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}

                      <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={cancelClear}
                          style={{ flex: 1, padding: "11px", borderRadius: 10, background: "#f1f5f9", border: "1px solid rgba(0,0,0,.1)", color: "#374151", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
                          Cancel
                        </button>
                        <button
                          disabled={selectedCount === 0}
                          onClick={startCountdown}
                          style={{ flex: 1.5, padding: "11px", borderRadius: 10, background: selectedCount === 0 ? "rgba(239,68,68,.3)" : "#dc2626", border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: selectedCount === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                          <Trash2 size={14} />
                          Delete {selectedCount} Record{selectedCount !== 1 ? "s" : ""}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: 13.5, color: "#64748b", margin: "10px 0 22px", lineHeight: 1.6 }}>
                        This admin section does not have directly clearable database records.
                      </p>
                      <button onClick={cancelClear} style={{ width: "100%", padding: "11px", borderRadius: 10, background: "#f1f5f9", border: "1px solid rgba(0,0,0,.1)", color: "#374151", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
                        Close
                      </button>
                    </>
                  )}
                </>
              )}

              {/* ── PHASE 2: Countdown ── */}
              {clearPhase === "countdown" && (
                <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(239,68,68,.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <Timer size={24} color="#dc2626" />
                  </div>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>Deletion Scheduled</h2>
                  <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 24px" }}>Data will be permanently deleted when the timer reaches zero. Cancel to abort.</p>

                  {/* Circular countdown */}
                  <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto 20px" }}>
                    <svg width={140} height={140} style={{ transform: "rotate(-90deg)" }}>
                      <circle cx={70} cy={70} r={52} fill="none" stroke="rgba(239,68,68,.12)" strokeWidth={10} />
                      <circle cx={70} cy={70} r={52} fill="none" stroke="#dc2626" strokeWidth={10}
                        strokeDasharray={circumference} strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 1s linear" }} />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 32, fontWeight: 900, color: "#dc2626", letterSpacing: "-1px", fontVariantNumeric: "tabular-nums" }}>{timerLabel}</span>
                      <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>remaining</span>
                    </div>
                  </div>

                  {/* What will be deleted */}
                  <div style={{ background: "#fef2f2", border: "1px solid rgba(239,68,68,.2)", borderRadius: 12, padding: "12px 14px", marginBottom: 20, textAlign: "left" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.8 }}>Will be deleted:</p>
                    {clearConfig?.tables.map(t => {
                      const tableRecs = fetchedRecords[t.name] || [];
                      const selCount = tableRecs.filter(r => selectedRecordIds.has(`${t.name}::${r.id}`)).length;
                      if (selCount === 0) return null;
                      return (
                        <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 7, padding: "3px 0" }}>
                          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#dc2626", flexShrink: 0 }} />
                          <span style={{ fontSize: 12.5, color: "#0f172a" }}>{selCount} {t.label} record{selCount !== 1 ? "s" : ""}</span>
                        </div>
                      );
                    })}
                  </div>

                  <button onClick={cancelClear}
                    style={{ width: "100%", padding: "12px", borderRadius: 11, background: "#f1f5f9", border: "1px solid rgba(0,0,0,.12)", color: "#374151", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <X size={15} />
                    Cancel — Keep My Data
                  </button>
                </div>
              )}

              {/* ── PHASE 3: Result ── */}
              {clearPhase === "result" && (
                <div style={{ textAlign: "center", padding: "12px 0 8px" }}>
                  {clearingData ? (
                    <>
                      <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(239,68,68,.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                        <RotateCcw size={26} color="#dc2626" className="animate-spin" />
                      </div>
                      <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>Deleting Data…</h2>
                      <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Please wait, this may take a moment.</p>
                    </>
                  ) : clearResult?.ok ? (
                    <>
                      <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(34,197,94,.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                        <CheckCircle2 size={28} color="#22c55e" />
                      </div>
                      <h2 style={{ fontSize: 17, fontWeight: 800, color: "#16a34a", margin: "0 0 6px" }}>Data Cleared</h2>
                      <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>{clearResult.msg}</p>
                    </>
                  ) : (
                    <>
                      <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(239,68,68,.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                        <XCircle size={28} color="#dc2626" />
                      </div>
                      <h2 style={{ fontSize: 17, fontWeight: 800, color: "#dc2626", margin: "0 0 6px" }}>Clear Failed</h2>
                      <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 18px" }}>{clearResult?.msg}</p>
                      <button onClick={cancelClear} style={{ width: "100%", padding: "11px", borderRadius: 10, background: "#f1f5f9", border: "1px solid rgba(0,0,0,.1)", color: "#374151", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
                        Close
                      </button>
                    </>
                  )}
                </div>
              )}

            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default AdminLayout;
