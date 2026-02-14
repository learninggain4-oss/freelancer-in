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
const EmployeeRegister = lazy(() => import("./pages/register/EmployeeRegister"));
const ClientRegister = lazy(() => import("./pages/register/ClientRegister"));
const VerificationPending = lazy(() => import("./pages/VerificationPending"));
const EmployeeDashboard = lazy(() => import("./pages/employee/EmployeeDashboard"));
const EmployeeProjects = lazy(() => import("./pages/employee/EmployeeProjects"));
const EmployeeWallet = lazy(() => import("./pages/employee/EmployeeWallet"));
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
const AdminProfileEdit = lazy(() => import("./pages/admin/AdminProfileEdit"));
const AdminProfileEdits = lazy(() => import("./pages/admin/AdminProfileEdits"));
const AdminLegalDocuments = lazy(() => import("./pages/admin/AdminLegalDocuments"));
const AdminServiceCategories = lazy(() => import("./pages/admin/AdminServiceCategories"));
const LegalDocument = lazy(() => import("./pages/LegalDocument"));
import AdminLayout from "@/components/layout/AdminLayout";
import AdminRoute from "@/components/auth/AdminRoute";
import { useChatNotifications } from "@/hooks/use-chat-notifications";

const queryClient = new QueryClient();

/** Activates global chat toast notifications for logged-in users */
const GlobalChatNotifier = () => {
  useChatNotifications();
  return null;
};

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <GlobalChatNotifier />
          <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register/employee" element={<EmployeeRegister />} />
              <Route path="/register/client" element={<ClientRegister />} />
              <Route path="/verification-pending" element={<VerificationPending />} />
              <Route path="/install" element={<InstallApp />} />
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
                <Route path="projects" element={<EmployeeProjects />} />
                <Route path="projects/chat/:projectId" element={<ChatRoom />} />
                <Route path="wallet" element={<EmployeeWallet />} />
                <Route path="profile" element={<EmployeeProfile />} />
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
                <Route path="wallet" element={<ClientWallet />} />
                <Route path="projects" element={<ClientProjects />} />
                <Route path="projects/create" element={<CreateProject />} />
                <Route path="projects/chat/:projectId" element={<ChatRoom />} />
                <Route path="withdrawals" element={<ClientWithdrawals />} />
                <Route path="profile" element={<ClientProfile />} />
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
                <Route path="profile-edits" element={<AdminProfileEdits />} />
                <Route path="users/:profileId" element={<AdminProfileEdit />} />
                <Route path="legal-documents" element={<AdminLegalDocuments />} />
                <Route path="service-categories" element={<AdminServiceCategories />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
