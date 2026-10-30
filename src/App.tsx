
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProfilePage from "./pages/ProfilePage";
import StatusPage from "./pages/StatusPage";
import Dashboard from "./pages/Dashboard";
import AdminPage from "./pages/AdminPage";
import CompanyListingPage from "./pages/CompanyListingPage";
import LoginPage from "./pages/LoginPage";
import CreateProfilePage from "./pages/CreateProfilePage";
import SavedPage from "./pages/SavedPage";
import CreateStatusPage from "./pages/CreateStatusPage";
import NotificationsPage from "./pages/NotificationsPage";
import SettingsPage from "./pages/SettingsPage";
import { RequireRole } from "@/components/RequireRole";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/companies" element={<CompanyListingPage />} />
              <Route path="/profile/:id" element={<ProfilePage />} />
              <Route path="/saved" element={<SavedPage />} />
              <Route path="/status" element={<StatusPage />} />
              <Route path="/dashboard" element={<RequireRole roles={["business"]}><Dashboard /></RequireRole>} />
              <Route path="/admin" element={<RequireRole roles={["admin"]}><AdminPage /></RequireRole>} />
              <Route path="/create-profile" element={<RequireRole roles={["business"]}><CreateProfilePage /></RequireRole>} />
              <Route path="/edit-profile" element={<RequireRole roles={["business"]}><CreateProfilePage /></RequireRole>} />
              <Route path="/create-status" element={<RequireRole roles={["business"]}><CreateStatusPage /></RequireRole>} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
