import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import EmployeeRegister from "./pages/register/EmployeeRegister";
import ClientRegister from "./pages/register/ClientRegister";
import VerificationPending from "./pages/VerificationPending";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployeeProjects from "./pages/employee/EmployeeProjects";
import EmployeeWallet from "./pages/employee/EmployeeWallet";
import EmployeeProfile from "./pages/employee/EmployeeProfile";
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientWallet from "./pages/client/ClientWallet";
import ClientProjects from "./pages/client/ClientProjects";
import CreateProject from "./pages/client/CreateProject";
import ClientWithdrawals from "./pages/client/ClientWithdrawals";
import ClientProfile from "./pages/client/ClientProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register/employee" element={<EmployeeRegister />} />
            <Route path="/register/client" element={<ClientRegister />} />
            <Route path="/verification-pending" element={<VerificationPending />} />

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
              <Route path="withdrawals" element={<ClientWithdrawals />} />
              <Route path="profile" element={<ClientProfile />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
