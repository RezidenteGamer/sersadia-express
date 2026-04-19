import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LoadingPage } from "./components/ui/loading-spinner";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Locations from "./pages/Locations";
import LocationDetails from "./pages/LocationDetails";
import MyReservations from "./pages/MyReservations";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLocations from "./pages/admin/AdminLocations";
import AdminReservations from "./pages/admin/AdminReservations";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminCheckin from "./pages/admin/AdminCheckin";
import AdminReports from "./pages/admin/AdminReports";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminBanners from "./pages/admin/AdminBanners";
import Support from "./pages/Support";
import AdminSupport from "./pages/admin/AdminSupport";
import MembershipCard from "./pages/MembershipCard";
import AdminDocs from "./pages/admin/AdminDocs";
import AdminFinancialReports from "./pages/admin/AdminFinancialReports";
import AdminPixSettings from "./pages/admin/AdminPixSettings";
import AdminRefunds from "./pages/admin/AdminRefunds";
import AccessDenied from "./pages/AccessDenied";
import { useAndroidBackButton } from "./hooks/useAndroidBackButton";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import { useAppResume } from "./hooks/useAppResume";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingPage />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children, permission }: { children: React.ReactNode; permission?: string }) {
  const { user, isAdmin, permissions, loading } = useAuth();

  if (loading) {
    return <LoadingPage />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (permission && !permissions.includes(permission)) {
    return <AccessDenied requiredPermission={permission} />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();

  if (loading) {
    return <LoadingPage />;
  }

  if (user) {
    const redirectTo = searchParams.get('redirect') || '/locations';
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { showExitDialog, confirmExit, cancelExit } = useAndroidBackButton();
  useNetworkStatus();
  useAppResume();

  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/locations/:id" element={<LocationDetails />} />
        <Route path="/my-reservations" element={<ProtectedRoute><MyReservations /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
        <Route path="/carteirinha" element={<ProtectedRoute><MembershipCard /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/locations" element={<AdminRoute permission="manage_locations"><AdminLocations /></AdminRoute>} />
        <Route path="/admin/reservations" element={<AdminRoute permission="manage_reservations"><AdminReservations /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute permission="manage_users"><AdminUsers /></AdminRoute>} />
        <Route path="/admin/payments" element={<AdminRoute permission="manage_payments"><AdminPayments /></AdminRoute>} />
        <Route path="/admin/checkin" element={<AdminRoute permission="manage_checkin"><AdminCheckin /></AdminRoute>} />
        <Route path="/admin/reports" element={<AdminRoute permission="view_reports"><AdminReports /></AdminRoute>} />
        <Route path="/admin/members" element={<AdminRoute permission="manage_members"><AdminMembers /></AdminRoute>} />
        <Route path="/admin/banners" element={<AdminRoute permission="manage_banners"><AdminBanners /></AdminRoute>} />
        <Route path="/admin/support" element={<AdminRoute permission="manage_support"><AdminSupport /></AdminRoute>} />
        <Route path="/admin/docs" element={<AdminRoute><AdminDocs /></AdminRoute>} />
        <Route path="/admin/financial-reports" element={<AdminRoute permission="view_financial_reports"><AdminFinancialReports /></AdminRoute>} />
        <Route path="/admin/pix-settings" element={<AdminRoute><AdminPixSettings /></AdminRoute>} />
        <Route path="/admin/refunds" element={<AdminRoute permission="manage_payments"><AdminRefunds /></AdminRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <AlertDialog open={showExitDialog} onOpenChange={cancelExit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja sair do app?</AlertDialogTitle>
            <AlertDialogDescription>
              Você será redirecionado para a tela inicial do seu dispositivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExit}>Sair</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;