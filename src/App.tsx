import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyOTP from "./pages/VerifyOTP";
import CompleteProfile from "./pages/CompleteProfile";
import EditProfile from "./pages/EditProfile";
import Layout from "./components/Layout";
import DashboardHome from "./pages/DashboardHome";
import Bookings from "./pages/Bookings";
import CalendarPage from "./pages/CalendarPage";
import Media from "./pages/Media";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";
import Wallet from "./pages/Wallet";
import NetworkIssue from "./pages/NetworkIssue";

const queryClient = new QueryClient();

function NetworkListener() {
  const navigate = useNavigate();
  React.useEffect(() => {
    const goIssue = () => navigate("/network-issue", { replace: true });
    const onOffline = () => goIssue();
    const onIssue = () => goIssue();
    const onUnauthorized = () => navigate("/login", { replace: true });
    window.addEventListener("offline", onOffline);
    window.addEventListener("network-issue", onIssue as EventListener);
    window.addEventListener("unauthorized", onUnauthorized as EventListener);
    if (!navigator.onLine) {
      goIssue();
    }
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("network-issue", onIssue as EventListener);
      window.removeEventListener("unauthorized", onUnauthorized as EventListener);
    };
  }, [navigate]);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <NetworkListener />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/network-issue" element={<NetworkIssue />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<DashboardHome />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="media" element={<Media />} />
              <Route path="pricing" element={<Pricing />} />
              <Route path="wallet" element={<Wallet />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
