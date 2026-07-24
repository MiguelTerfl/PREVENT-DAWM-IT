import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Splash from "./pages/Splash";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import CoachDashboard from "./pages/CoachDashboard";
import NotFound from "./pages/NotFound";
import MainLayout from "./layout/MainLayout";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { session, loading, role } = useAuth()
  if (loading) return null
  if (!session) return <Navigate to="/login" replace />
  
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    if (role === "admin") return <Navigate to="/admin" replace />
    if (role === "health_coach") return <Navigate to="/coach" replace />
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Splash />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/onboarding" element={<Onboarding />} />

            {/* Protected routes with global layout */}
            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["patient", "admin"]}><Dashboard /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute allowedRoles={["patient", "admin"]}><Chat /></ProtectedRoute>} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><Admin /></ProtectedRoute>} />
              <Route path="/coach" element={<ProtectedRoute allowedRoles={["health_coach", "admin"]}><CoachDashboard /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);


export default App;
