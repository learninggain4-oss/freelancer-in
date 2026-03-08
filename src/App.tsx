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
import { Loader2 } from "lucide-react";

// Lazy loaded pages
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const CompleteProfile = lazy(() => import("./pages/CompleteProfile"));
const EmployeeRegister = lazy(() => import("./pages/register/EmployeeRegister"));
const ClientRegister = lazy(() => import("./pages/register/ClientRegister"));
const VerificationPending = lazy(() => import("./pages/VerificationPending"));
const EmployeeDashboard = lazy(() => import("./pages/employee/EmployeeDashboard"));
const EmployeeProjects = lazy(() => import("./pages/employee/EmployeeProjects"));
const EmployeeWallet = lazy(() => import("./pages/employee/EmployeeWallet"));
const EmployeeAttendance = lazy(() => import("./pages/employee/EmployeeAttendance"));
const EmployeeProfile = lazy(() => import("./pages/employee/EmployeeProfile"));
const ClientDashboard = lazy(() => import("./pages/client/ClientDashboard"));
const ClientWallet = lazy(() => import("./pages/client/ClientWallet"));
const ClientProjects = lazy(() => import("./pages/client/ClientProjects"));
const CreateProject = lazy(() => import("./pages/client/CreateProject"));
const ClientWithdrawals = lazy(() => import("./pages/client/ClientWithdrawals"));
const ClientProfile = lazy(() => import("./pages/client/ClientProfile"));
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
const GetFree = lazy(() => import("./pages/GetFree"));
const GetCoins = lazy(() => import("./pages/GetCoins"));
const AppPage = lazy(() => import("./pages/AppPage"));
const EmployeeSupportChat = lazy(() => import("./pages/employee/EmployeeSupportChat"));
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
const Categories = lazy(() => import("./pages/Categories"));
const ProfilePersonalInfo = lazy(() => import("./pages/profile/ProfilePersonalInfo"));
const ProfileProfessional = lazy(() => import("./pages/profile/ProfileProfessional"));
const ProfileBankDetails = lazy(() => import("./pages/profile/ProfileBankDetails"));
const ProfileWorkExperience = lazy(() => import("./pages/profile/ProfileWorkExperience"));
const ProfileServices = lazy(() => import("./pages/profile/ProfileServices"));
const ProfileEmergencyContacts = lazy(() => import("./pages/profile/ProfileEmergencyContacts"));
const ProfileAadhaarVerification = lazy(() => import("./pages/profile/ProfileAadhaarVerification"));
const ProfileBankVerification = lazy(() => import("./pages/profile/ProfileBankVerification"));
import AdminLayout from "@/components/layout/AdminLayout";
import AdminRoute from "@/components/auth/AdminRoute";
import { useChatNotifications } from "@/hooks/use-chat-notifications";
import { usePresenceHeartbeat } from "@/hooks/use-presence-heartbeat";
import { useVisitorTracking } from "@/hooks/use-visitor-tracking";
import { useIpBlockCheck } from "@/hooks/use-ip-block-check";
import AnnouncementPopup from "@/components/announcements/AnnouncementPopup";
import UpdatePrompt from "@/components/pwa/UpdatePrompt";
import BlockedScreen from "@/components/BlockedScreen";

const queryClient = new QueryClient();

/** Activates global chat toast notifications for logged-in users */
const GlobalChatNotifier = () => {
  useChatNotifications();
  usePresenceHeartbeat();
  useVisitorTracking();
  return null;
};

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const AppContent = () => {
  const { blocked, loading } = useIpBlockCheck();

  if (loading) return <PageLoader />;
  if (blocked) return <BlockedScreen />;

  return (
    <>
      <GlobalChatNotifier />
      <AnnouncementPopup />
      <UpdatePrompt />
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/register/employee" element={<EmployeeRegister />} />
            <Route path="/register/client" element={<ClientRegister />} />
            <Route path="/verification-pending" element={<VerificationPending />} />
            <Route path="/install" element={<InstallApp />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route path="/legal/:slug" element={<LegalDocument />} />

            {/* Employee Routes */}
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
              <Route path="projects/chat/:projectId" element={<ChatRoom />} />
              <Route path="projects/support-chat/:projectId" element={<EmployeeSupportChat />} />
              <Route path="wallet" element={<EmployeeWallet />} />
              <Route path="profile" element={<EmployeeProfile />} />
              <Route path="profile/personal" element={<ProfilePersonalInfo />} />
              <Route path="profile/professional" element={<ProfileProfessional />} />
              <Route path="profile/bank-details" element={<ProfileBankDetails />} />
              <Route path="profile/work-experience" element={<ProfileWorkExperience />} />
              <Route path="profile/services" element={<ProfileServices />} />
              <Route path="profile/emergency-contacts" element={<ProfileEmergencyContacts />} />
              <Route path="profile/aadhaar-verification" element={<ProfileAadhaarVerification />} />
              <Route path="profile/bank-verification" element={<ProfileBankVerification />} />
              <Route path="settings" element={<AccountSettings />} />
              <Route path="get-free" element={<GetFree />} />
              <Route path="get-coins" element={<GetCoins />} />
              <Route path="app" element={<AppPage />} />
              <Route path="help-support" element={<HelpSupport />} />
            </Route>

            {/* Client Routes */}
            <Route
              path="/client"
              element={
                <ProtectedRoute>
                  <AppLayout userType="client" />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<ClientDashboard />} />
              <Route path="attendance" element={<EmployeeAttendance />} />
              <Route path="wallet" element={<ClientWallet />} />
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
              <Route path="settings" element={<AccountSettings />} />
              <Route path="get-free" element={<GetFree />} />
              <Route path="get-coins" element={<GetCoins />} />
              <Route path="app" element={<AppPage />} />
              <Route path="help-support" element={<HelpSupport />} />
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
              <Route path="employees" element={<AdminEmployees />} />
              <Route path="clients" element={<AdminClients />} />
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
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
