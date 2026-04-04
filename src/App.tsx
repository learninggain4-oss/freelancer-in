import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import LoadingScreen from "@/components/LoadingScreen";

// Lazy loaded pages
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const CompleteProfile = lazy(() => import("./pages/CompleteProfile"));
const EmployeeRegister = lazy(() => import("./pages/register/FreelancerRegister"));
const ClientRegister = lazy(() => import("./pages/register/EmployerRegister"));
const VerificationPending = lazy(() => import("./pages/VerificationPending"));
const EmployeeDashboard = lazy(() => import("./pages/freelancer/EmployeeDashboard"));
const EmployeeProjects = lazy(() => import("./pages/freelancer/EmployeeProjects"));
const EmployeeRequests = lazy(() => import("./pages/freelancer/EmployeeRequests"));
const EmployeeWallet = lazy(() => import("./pages/freelancer/EmployeeWallet"));
const EmployeeAttendance = lazy(() => import("./pages/freelancer/EmployeeAttendance"));
const EmployeeProfile = lazy(() => import("./pages/freelancer/EmployeeProfile"));
const EmployeeBids = lazy(() => import("./pages/freelancer/EmployeeBids"));
const EmployeeEarnings = lazy(() => import("./pages/freelancer/EmployeeEarnings"));
const EmployeeReviews = lazy(() => import("./pages/freelancer/EmployeeReviews"));
const EmployeeBadges = lazy(() => import("./pages/freelancer/EmployeeBadges"));
const EmployeePortfolio = lazy(() => import("./pages/freelancer/EmployeePortfolio"));
const ClientDashboard = lazy(() => import("./pages/employer/ClientDashboard"));
const ClientWallet = lazy(() => import("./pages/employer/ClientWallet"));
const ClientProjects = lazy(() => import("./pages/employer/ClientProjects"));
const CreateProject = lazy(() => import("./pages/employer/CreateProject"));
const ClientWithdrawals = lazy(() => import("./pages/employer/ClientWithdrawals"));
const ClientProfile = lazy(() => import("./pages/employer/ClientProfile"));
const ClientAttendance = lazy(() => import("./pages/employer/ClientAttendance"));
const ChatRoom = lazy(() => import("./components/chat/ChatRoom"));
const NotFound = lazy(() => import("./pages/NotFound"));
const InstallApp = lazy(() => import("./pages/InstallApp"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminEmployees = lazy(() => import("./pages/admin/AdminEmployees"));
const AdminClients = lazy(() => import("./pages/admin/AdminClients"));
const AdminWithdrawals = lazy(() => import("./pages/admin/AdminWithdrawals"));
const AdminVerifications = lazy(() => import("./pages/admin/AdminVerifications"));
const AdminBankVerifications = lazy(() => import("./pages/admin/AdminBankVerifications"));
const AdminProfileEdit = lazy(() => import("./pages/admin/AdminProfileEdit"));
const AdminProfileEdits = lazy(() => import("./pages/admin/AdminProfileEdits"));
const AdminLegalDocuments = lazy(() => import("./pages/admin/AdminLegalDocuments"));
const AdminServiceManagement = lazy(() => import("./pages/admin/AdminServiceManagement"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminAnnouncements = lazy(() => import("./pages/admin/AdminAnnouncements"));
const AdminJobs = lazy(() => import("./pages/admin/AdminJobs"));
const AdminRecoveryRequests = lazy(() => import("./pages/admin/AdminRecoveryRequests"));
const AdminRecoveryChat = lazy(() => import("./pages/admin/AdminRecoveryChat"));
const AdminWalletManagement = lazy(() => import("./pages/admin/AdminWalletManagement"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const LegalDocument = lazy(() => import("./pages/LegalDocument"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const GetFree = lazy(() => import("./pages/GetFree"));
const GetCoins = lazy(() => import("./pages/GetCoins"));
const AppPage = lazy(() => import("./pages/AppPage"));
const EmployeeSupportChat = lazy(() => import("./pages/freelancer/EmployeeSupportChat"));
const HelpSupport = lazy(() => import("./pages/HelpSupport"));
const AdminHelpSupport = lazy(() => import("./pages/admin/AdminHelpSupport"));
const AdminSupportReporting = lazy(() => import("./pages/admin/AdminSupportReporting"));
const AdminPaymentMethods = lazy(() => import("./pages/admin/AdminPaymentMethods"));
const AdminCountdowns = lazy(() => import("./pages/admin/AdminCountdowns"));
const AdminValidation = lazy(() => import("./pages/admin/AdminValidation"));
const AdminSessions = lazy(() => import("./pages/admin/AdminSessions"));
const AdminTestimonials = lazy(() => import("./pages/admin/AdminTestimonials"));
const AdminReferrals = lazy(() => import("./pages/admin/AdminReferrals"));
const AdminOnlineStatus = lazy(() => import("./pages/admin/AdminOnlineStatus"));
const AdminHeroSlides = lazy(() => import("./pages/admin/AdminHeroSlides"));
const AdminVisitors = lazy(() => import("./pages/admin/AdminVisitors"));
const AdminWallet = lazy(() => import("./pages/admin/AdminWallet"));
const AdminWalletTransactions = lazy(() => import("./pages/admin/AdminWalletTransactions"));
const AdminAttendance = lazy(() => import("./pages/admin/AdminAttendance"));
const AdminBanks = lazy(() => import("./pages/admin/AdminBanks"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminWalletTypes = lazy(() => import("./pages/admin/AdminWalletTypes"));
const AdminWalletUpgrades = lazy(() => import("./pages/admin/AdminWalletUpgrades"));
const AdminAutoResponses = lazy(() => import("./pages/admin/AdminAutoResponses"));
const AdminIpBlocking = lazy(() => import("./pages/admin/AdminIpBlocking"));
const AdminPwaInstalls = lazy(() => import("./pages/admin/AdminPwaInstalls"));
const AdminSafetyCenter = lazy(() => import("./pages/admin/AdminSafetyCenter"));
const AdminAuditLogs = lazy(() => import("./pages/admin/AdminAuditLogs"));
const AdminRBAC = lazy(() => import("./pages/admin/AdminRBAC"));
const AdminDatabaseManager = lazy(() => import("./pages/admin/AdminDatabaseManager"));
const AdminEnvVars = lazy(() => import("./pages/admin/AdminEnvVars"));
const AdminServerMonitor = lazy(() => import("./pages/admin/AdminServerMonitor"));
const AdminBackups = lazy(() => import("./pages/admin/AdminBackups"));
const AdminApprovalCenter = lazy(() => import("./pages/admin/AdminApprovalCenter"));
const AdminDataPrivacy = lazy(() => import("./pages/admin/AdminDataPrivacy"));
const AdminAlertSystem = lazy(() => import("./pages/admin/AdminAlertSystem"));
const AdminVersionControl = lazy(() => import("./pages/admin/AdminVersionControl"));
const AdminSessionSecurity = lazy(() => import("./pages/admin/AdminSessionSecurity"));
const AdminDataMigration = lazy(() => import("./pages/admin/AdminDataMigration"));
const AdminJobQueue = lazy(() => import("./pages/admin/AdminJobQueue"));
const AdminTransactionControl = lazy(() => import("./pages/admin/AdminTransactionControl"));
const AdminResourceMonitor = lazy(() => import("./pages/admin/AdminResourceMonitor"));
const AdminServiceResilience = lazy(() => import("./pages/admin/AdminServiceResilience"));
const AdminDataRetention = lazy(() => import("./pages/admin/AdminDataRetention"));
const AdminBulkOperations = lazy(() => import("./pages/admin/AdminBulkOperations"));
const AdminReportGenerator = lazy(() => import("./pages/admin/AdminReportGenerator"));
const AdminSecretsManager = lazy(() => import("./pages/admin/AdminSecretsManager"));
const AdminKnowledgeBase = lazy(() => import("./pages/admin/AdminKnowledgeBase"));
const AdminCacheManager = lazy(() => import("./pages/admin/AdminCacheManager"));
const AdminApiManager = lazy(() => import("./pages/admin/AdminApiManager"));
const AdminSessionManager = lazy(() => import("./pages/admin/AdminSessionManager"));
const AdminNotificationCenter = lazy(() => import("./pages/admin/AdminNotificationCenter"));
const AdminFileManager = lazy(() => import("./pages/admin/AdminFileManager"));
const AdminHighAvailability = lazy(() => import("./pages/admin/AdminHighAvailability"));
const AdminDataIntegrity = lazy(() => import("./pages/admin/AdminDataIntegrity"));
const AdminNetworkMonitor = lazy(() => import("./pages/admin/AdminNetworkMonitor"));
const AdminDeadlockProtection = lazy(() => import("./pages/admin/AdminDeadlockProtection"));
const AdminNotificationDelivery = lazy(() => import("./pages/admin/AdminNotificationDelivery"));
const AdminChangeApproval = lazy(() => import("./pages/admin/AdminChangeApproval"));
const AdminTimeSyncSystem = lazy(() => import("./pages/admin/AdminTimeSyncSystem"));
const AdminBackupVerification = lazy(() => import("./pages/admin/AdminBackupVerification"));
const AdminLockoutRecovery = lazy(() => import("./pages/admin/AdminLockoutRecovery"));
const AdminSystemResources = lazy(() => import("./pages/admin/AdminSystemResources"));
const AdminApiValidation = lazy(() => import("./pages/admin/AdminApiValidation"));
const AdminSessionManagement = lazy(() => import("./pages/admin/AdminSessionManagement"));
const AdminPermissionSync = lazy(() => import("./pages/admin/AdminPermissionSync"));
const AdminLogManagement = lazy(() => import("./pages/admin/AdminLogManagement"));
const AdminDataImport = lazy(() => import("./pages/admin/AdminDataImport"));
const AdminConfigRollback = lazy(() => import("./pages/admin/AdminConfigRollback"));
const AdminMonitoringRedundancy = lazy(() => import("./pages/admin/AdminMonitoringRedundancy"));
const AdminDataSync = lazy(() => import("./pages/admin/AdminDataSync"));
const AdminSecurityPatch = lazy(() => import("./pages/admin/AdminSecurityPatch"));
const AdminTokenManagement = lazy(() => import("./pages/admin/AdminTokenManagement"));
const AdminDisasterRecovery = lazy(() => import("./pages/admin/AdminDisasterRecovery"));
const AdminFraudDashboard = lazy(() => import("./pages/admin/AdminFraudDashboard"));
const AdminUserRiskScore = lazy(() => import("./pages/admin/AdminUserRiskScore"));
const AdminSuspiciousUsers = lazy(() => import("./pages/admin/AdminSuspiciousUsers"));
const AdminPaymentFraud = lazy(() => import("./pages/admin/AdminPaymentFraud"));
const AdminIPDeviceMonitor = lazy(() => import("./pages/admin/AdminIPDeviceMonitor"));
const AdminFraudAlerts = lazy(() => import("./pages/admin/AdminFraudAlerts"));
const AdminAccountRestrictions = lazy(() => import("./pages/admin/AdminAccountRestrictions"));
const AdminFraudRules = lazy(() => import("./pages/admin/AdminFraudRules"));
const AdminFraudCases = lazy(() => import("./pages/admin/AdminFraudCases"));
const AdminFraudAuditLog = lazy(() => import("./pages/admin/AdminFraudAuditLog"));
const AdminFraudNotifications = lazy(() => import("./pages/admin/AdminFraudNotifications"));
const AdminFraudAutomation = lazy(() => import("./pages/admin/AdminFraudAutomation"));
const AdminFraudReports = lazy(() => import("./pages/admin/AdminFraudReports"));
const AdminFraudSecuritySettings = lazy(() => import("./pages/admin/AdminFraudSecuritySettings"));
const AdminConfigManagement = lazy(() => import("./pages/admin/AdminConfigManagement"));
const AdminMaintenanceCenter = lazy(() => import("./pages/admin/AdminMaintenanceCenter"));
const AdminRateLimiting = lazy(() => import("./pages/admin/AdminRateLimiting"));
const AdminScheduler = lazy(() => import("./pages/admin/AdminScheduler"));
const AdminPermissionValidator = lazy(() => import("./pages/admin/AdminPermissionValidator"));
const AdminExportControl = lazy(() => import("./pages/admin/AdminExportControl"));
const AdminVendorManager = lazy(() => import("./pages/admin/AdminVendorManager"));
const WalletTypes = lazy(() => import("./pages/WalletTypes"));
const UserReview = lazy(() => import("./pages/UserReview"));
const Categories = lazy(() => import("./pages/Categories"));
const Projects = lazy(() => import("./pages/Projects"));
const Pricing = lazy(() => import("./pages/Pricing"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Community = lazy(() => import("./pages/Community"));
const TransactionHistory = lazy(() => import("./pages/wallet/TransactionHistory"));
const WithdrawalHistory = lazy(() => import("./pages/wallet/WithdrawalHistory"));
const WalletQRPage = lazy(() => import("./pages/wallet/WalletQRPage"));
const WalletScanPage = lazy(() => import("./pages/wallet/WalletScanPage"));
const RequestWithdrawal = lazy(() => import("./pages/wallet/RequestWithdrawal"));
const UpgradeChat = lazy(() => import("./pages/wallet/UpgradeChat"));
const ProfilePersonalInfo = lazy(() => import("./pages/profile/ProfilePersonalInfo"));
const ProfileProfessional = lazy(() => import("./pages/profile/ProfileProfessional"));
const ProfileBankDetails = lazy(() => import("./pages/profile/ProfileBankDetails"));
const ProfileWorkExperience = lazy(() => import("./pages/profile/ProfileWorkExperience"));
const ProfileServices = lazy(() => import("./pages/profile/ProfileServices"));
const ProfileEmergencyContacts = lazy(() => import("./pages/profile/ProfileEmergencyContacts"));
const ProfileAadhaarVerification = lazy(() => import("./pages/profile/ProfileAadhaarVerification"));
const ProfileBankVerification = lazy(() => import("./pages/profile/ProfileBankVerification"));
const ProfileUpiApps = lazy(() => import("./pages/profile/ProfileUpiApps"));
const Notifications = lazy(() => import("./pages/Notifications"));
import AdminLayout from "@/components/layout/AdminLayout";
import AdminRoute from "@/components/auth/AdminRoute";
import { useChatNotifications } from "@/hooks/use-chat-notifications";
import { usePwaInstallTracking } from "@/hooks/use-pwa-install-tracking";
import { usePresenceHeartbeat } from "@/hooks/use-presence-heartbeat";
import { useVisitorTracking } from "@/hooks/use-visitor-tracking";
import { useIpBlockCheck } from "@/hooks/use-ip-block-check";
import AnnouncementPopup from "@/components/announcements/AnnouncementPopup";

import BlockedScreen from "@/components/BlockedScreen";

const queryClient = new QueryClient();

/** Activates global chat toast notifications for logged-in users */
const GlobalChatNotifier = () => {
  useChatNotifications();
  usePresenceHeartbeat();
  useVisitorTracking();
  usePwaInstallTracking();
  return null;
};

const PageLoader = () => <LoadingScreen />;

/** Show landing page in browser, login in installed PWA */
const SmartRoot = () => {
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true;
  return isStandalone ? <Login /> : <Index />;
};

const AppContent = () => {
  const { blocked, loading } = useIpBlockCheck();

  if (loading) return <PageLoader />;
  if (blocked) return <BlockedScreen />;

  return (
    <>
      <GlobalChatNotifier />
      <AnnouncementPopup />
      
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<SmartRoot />} />
            <Route path="/landing" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/register/employee" element={<EmployeeRegister />} />
            <Route path="/register/employer" element={<ClientRegister />} />
            <Route path="/verification-pending" element={<VerificationPending />} />
            <Route path="/install" element={<InstallApp />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/community" element={<Community />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route path="/legal/:slug" element={<LegalDocument />} />

            {/* Freelancer Routes */}
            <Route
              path="/employee"
              element={
                <ProtectedRoute>
                  <AppLayout userType="employee" />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<EmployeeDashboard />} />
              <Route path="attendance" element={<EmployeeAttendance />} />
              <Route path="projects" element={<EmployeeProjects />} />
              <Route path="requests" element={<EmployeeRequests />} />
              <Route path="projects/chat/:projectId" element={<ChatRoom />} />
              <Route path="projects/support-chat/:projectId" element={<EmployeeSupportChat />} />
              <Route path="wallet" element={<EmployeeWallet />} />
              <Route path="wallet/transactions" element={<TransactionHistory />} />
              <Route path="wallet/withdrawals" element={<WithdrawalHistory />} />
              <Route path="wallet/qr" element={<WalletQRPage />} />
              <Route path="wallet/scan" element={<WalletScanPage />} />
              <Route path="wallet/withdraw" element={<RequestWithdrawal />} />
              <Route path="bids" element={<EmployeeBids />} />
              <Route path="earnings" element={<EmployeeEarnings />} />
              <Route path="reviews" element={<EmployeeReviews />} />
              <Route path="badges" element={<EmployeeBadges />} />
              <Route path="portfolio" element={<EmployeePortfolio />} />
              <Route path="profile" element={<EmployeeProfile />} />
              <Route path="profile/personal" element={<ProfilePersonalInfo />} />
              <Route path="profile/professional" element={<ProfileProfessional />} />
              <Route path="profile/bank-details" element={<ProfileBankDetails />} />
              <Route path="profile/work-experience" element={<ProfileWorkExperience />} />
              <Route path="profile/services" element={<ProfileServices />} />
              <Route path="profile/emergency-contacts" element={<ProfileEmergencyContacts />} />
              <Route path="profile/aadhaar-verification" element={<ProfileAadhaarVerification />} />
              <Route path="profile/bank-verification" element={<ProfileBankVerification />} />
              <Route path="profile/upi-apps" element={<ProfileUpiApps />} />
              <Route path="settings" element={<AccountSettings />} />
              <Route path="notification-settings" element={<NotificationSettings />} />
              <Route path="get-free" element={<GetFree />} />
              <Route path="get-coins" element={<GetCoins />} />
              <Route path="app" element={<AppPage />} />
              <Route path="help-support" element={<HelpSupport />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="review" element={<UserReview />} />
              <Route path="wallet-types" element={<WalletTypes />} />
              <Route path="wallet/upgrade-chat/:requestId" element={<UpgradeChat />} />
            </Route>

            {/* Employer Routes */}
            <Route
              path="/employer"
              element={
                <ProtectedRoute>
                  <AppLayout userType="employer" />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<ClientDashboard />} />
              <Route path="attendance" element={<ClientAttendance />} />
              <Route path="wallet" element={<ClientWallet />} />
              <Route path="wallet/transactions" element={<TransactionHistory />} />
              <Route path="wallet/withdrawals" element={<WithdrawalHistory />} />
              <Route path="wallet/qr" element={<WalletQRPage />} />
              <Route path="wallet/scan" element={<WalletScanPage />} />
              <Route path="wallet/withdraw" element={<RequestWithdrawal />} />
              <Route path="projects" element={<ClientProjects />} />
              <Route path="projects/create" element={<CreateProject />} />
              <Route path="projects/chat/:projectId" element={<ChatRoom />} />
              <Route path="withdrawals" element={<ClientWithdrawals />} />
              <Route path="profile" element={<ClientProfile />} />
              <Route path="profile/personal" element={<ProfilePersonalInfo />} />
              <Route path="profile/professional" element={<ProfileProfessional />} />
              <Route path="profile/bank-details" element={<ProfileBankDetails />} />
              <Route path="profile/work-experience" element={<ProfileWorkExperience />} />
              <Route path="profile/services" element={<ProfileServices />} />
              <Route path="profile/emergency-contacts" element={<ProfileEmergencyContacts />} />
              <Route path="profile/aadhaar-verification" element={<ProfileAadhaarVerification />} />
              <Route path="profile/bank-verification" element={<ProfileBankVerification />} />
              <Route path="profile/upi-apps" element={<ProfileUpiApps />} />
              <Route path="settings" element={<AccountSettings />} />
              <Route path="notification-settings" element={<NotificationSettings />} />
              <Route path="get-free" element={<GetFree />} />
              <Route path="get-coins" element={<GetCoins />} />
              <Route path="app" element={<AppPage />} />
              <Route path="help-support" element={<HelpSupport />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="review" element={<UserReview />} />
              <Route path="wallet-types" element={<WalletTypes />} />
              <Route path="wallet/upgrade-chat/:requestId" element={<UpgradeChat />} />
            </Route>

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="freelancers" element={<AdminEmployees />} />
              <Route path="employers" element={<AdminClients />} />
              <Route path="withdrawals" element={<AdminWithdrawals />} />
              <Route path="verifications" element={<AdminVerifications />} />
              <Route path="bank-verifications" element={<AdminBankVerifications />} />
              <Route path="profile-edits" element={<AdminProfileEdits />} />
              <Route path="users/:profileId" element={<AdminProfileEdit />} />
              <Route path="legal-documents" element={<AdminLegalDocuments />} />
              <Route path="jobs" element={<AdminJobs />} />
              <Route path="recovery-requests" element={<AdminRecoveryRequests />} />
              <Route path="recovery-chat/:projectId" element={<AdminRecoveryChat />} />
              <Route path="services" element={<AdminServiceManagement />} />
              <Route path="wallet-management" element={<AdminWalletManagement />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="help-support" element={<AdminHelpSupport />} />
              <Route path="support-reporting" element={<AdminSupportReporting />} />
              <Route path="payment-methods" element={<AdminPaymentMethods />} />
              <Route path="countdowns" element={<AdminCountdowns />} />
              <Route path="validation" element={<AdminValidation />} />
              <Route path="sessions" element={<AdminSessions />} />
              <Route path="testimonials" element={<AdminTestimonials />} />
              <Route path="referrals" element={<AdminReferrals />} />
              <Route path="online-status" element={<AdminOnlineStatus />} />
              <Route path="hero-slides" element={<AdminHeroSlides />} />
              <Route path="visitors" element={<AdminVisitors />} />
              <Route path="wallet" element={<AdminWallet />} />
              <Route path="wallet/transactions" element={<AdminWalletTransactions />} />
              <Route path="attendance" element={<AdminAttendance />} />
              <Route path="banks" element={<AdminBanks />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="wallet-types" element={<AdminWalletTypes />} />
              <Route path="wallet-upgrades" element={<AdminWalletUpgrades />} />
              <Route path="auto-responses" element={<AdminAutoResponses />} />
              <Route path="ip-blocking" element={<AdminIpBlocking />} />
              <Route path="pwa-installs" element={<AdminPwaInstalls />} />
              <Route path="safety-center" element={<AdminSafetyCenter />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
              <Route path="rbac" element={<AdminRBAC />} />
              <Route path="database-manager" element={<AdminDatabaseManager />} />
              <Route path="env-vars" element={<AdminEnvVars />} />
              <Route path="server-monitor" element={<AdminServerMonitor />} />
              <Route path="backups" element={<AdminBackups />} />
              <Route path="approval-center" element={<AdminApprovalCenter />} />
              <Route path="data-privacy" element={<AdminDataPrivacy />} />
              <Route path="alert-system" element={<AdminAlertSystem />} />
              <Route path="version-control" element={<AdminVersionControl />} />
              <Route path="session-security" element={<AdminSessionSecurity />} />
              <Route path="data-migration" element={<AdminDataMigration />} />
              <Route path="job-queue" element={<AdminJobQueue />} />
              <Route path="transaction-control" element={<AdminTransactionControl />} />
              <Route path="resource-monitor" element={<AdminResourceMonitor />} />
              <Route path="service-resilience" element={<AdminServiceResilience />} />
              <Route path="data-retention" element={<AdminDataRetention />} />
              <Route path="bulk-operations" element={<AdminBulkOperations />} />
              <Route path="report-generator" element={<AdminReportGenerator />} />
              <Route path="secrets-manager" element={<AdminSecretsManager />} />
              <Route path="knowledge-base" element={<AdminKnowledgeBase />} />
              <Route path="config-management" element={<AdminConfigManagement />} />
              <Route path="maintenance-center" element={<AdminMaintenanceCenter />} />
              <Route path="rate-limiting" element={<AdminRateLimiting />} />
              <Route path="scheduler" element={<AdminScheduler />} />
              <Route path="permission-validator" element={<AdminPermissionValidator />} />
              <Route path="export-control" element={<AdminExportControl />} />
              <Route path="vendor-manager" element={<AdminVendorManager />} />
              <Route path="cache-manager" element={<AdminCacheManager />} />
              <Route path="api-manager" element={<AdminApiManager />} />
              <Route path="session-manager" element={<AdminSessionManager />} />
              <Route path="notification-center" element={<AdminNotificationCenter />} />
              <Route path="file-manager" element={<AdminFileManager />} />
              <Route path="high-availability" element={<AdminHighAvailability />} />
              <Route path="data-integrity" element={<AdminDataIntegrity />} />
              <Route path="network-monitor" element={<AdminNetworkMonitor />} />
              <Route path="deadlock-protection" element={<AdminDeadlockProtection />} />
              <Route path="notification-delivery" element={<AdminNotificationDelivery />} />
              <Route path="change-approval" element={<AdminChangeApproval />} />
              <Route path="time-sync" element={<AdminTimeSyncSystem />} />
              <Route path="backup-verification" element={<AdminBackupVerification />} />
              <Route path="lockout-recovery" element={<AdminLockoutRecovery />} />
              <Route path="system-resources" element={<AdminSystemResources />} />
              <Route path="api-validation" element={<AdminApiValidation />} />
              <Route path="session-management" element={<AdminSessionManagement />} />
              <Route path="permission-sync" element={<AdminPermissionSync />} />
              <Route path="log-management" element={<AdminLogManagement />} />
              <Route path="data-import" element={<AdminDataImport />} />
              <Route path="config-rollback" element={<AdminConfigRollback />} />
              <Route path="monitoring-redundancy" element={<AdminMonitoringRedundancy />} />
              <Route path="data-sync" element={<AdminDataSync />} />
              <Route path="security-patch" element={<AdminSecurityPatch />} />
              <Route path="token-management" element={<AdminTokenManagement />} />
              <Route path="disaster-recovery" element={<AdminDisasterRecovery />} />
              <Route path="fraud-dashboard" element={<AdminFraudDashboard />} />
              <Route path="user-risk-score" element={<AdminUserRiskScore />} />
              <Route path="suspicious-users" element={<AdminSuspiciousUsers />} />
              <Route path="payment-fraud" element={<AdminPaymentFraud />} />
              <Route path="ip-device-monitor" element={<AdminIPDeviceMonitor />} />
              <Route path="fraud-alerts" element={<AdminFraudAlerts />} />
              <Route path="account-restrictions" element={<AdminAccountRestrictions />} />
              <Route path="fraud-rules" element={<AdminFraudRules />} />
              <Route path="fraud-cases" element={<AdminFraudCases />} />
              <Route path="fraud-audit-log" element={<AdminFraudAuditLog />} />
              <Route path="fraud-notifications" element={<AdminFraudNotifications />} />
              <Route path="fraud-automation" element={<AdminFraudAutomation />} />
              <Route path="fraud-reports" element={<AdminFraudReports />} />
              <Route path="fraud-security" element={<AdminFraudSecuritySettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
