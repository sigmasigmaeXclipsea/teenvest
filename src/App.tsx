import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ChatWidget from "@/components/ChatWidget";
import ErrorBoundary from "@/components/ErrorBoundary";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import ScreenerPage from "./pages/ScreenerPage";
import TradePage from "./pages/TradePage";
import HistoryPage from "./pages/HistoryPage";
import LearnPage from "./pages/LearnPage";
import LessonPage from "./pages/LessonPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import StockPage from "./pages/StockPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/home" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><ErrorBoundary><DashboardPage /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/screener" element={<ProtectedRoute><ErrorBoundary><ScreenerPage /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/trade" element={<ProtectedRoute><ErrorBoundary><TradePage /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><ErrorBoundary><HistoryPage /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/learn" element={<ProtectedRoute><ErrorBoundary><LearnPage /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/learn/:moduleId" element={<ProtectedRoute><ErrorBoundary><LessonPage /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/leaderboard" element={<ProtectedRoute><ErrorBoundary><LeaderboardPage /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/stocks/:symbol" element={<ProtectedRoute><ErrorBoundary><StockPage /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><ErrorBoundary><SettingsPage /></ErrorBoundary></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
          <ChatWidget />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
