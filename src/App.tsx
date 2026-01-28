import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { XPProvider } from "@/contexts/XPContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ChatWidget from "@/components/ChatWidget";
import ErrorBoundary from "@/components/ErrorBoundary";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import DashboardPage from "./pages/DashboardPage";
import ScreenerPage from "./pages/ScreenerPage";
import TradePage from "./pages/TradePage";
import HistoryPage from "./pages/HistoryPage";
import LearnPage from "./pages/LearnPage";
import LessonPage from "./pages/LessonPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import StockPage from "./pages/StockPage";
import SettingsPage from "./pages/SettingsPage";
import AdminPage from "./pages/AdminPage";
import ProfilePage from "./pages/ProfilePage";
import InsightsPage from "./pages/InsightsPage";
import ResearchPage from "./pages/ResearchPage";
import GamifiedGarden from "./pages/GamifiedGarden";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const DebugRuntimeListeners = () => {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/744e271c-c7d9-439f-a2cd-18d8a6231997', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'H2',
          location: 'App.tsx:window.error',
          message: 'Unhandled window error',
          data: {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion agent log
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason =
        event.reason instanceof Error
          ? { name: event.reason.name, message: event.reason.message }
          : { message: String(event.reason) };
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/744e271c-c7d9-439f-a2cd-18d8a6231997', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'H2',
          location: 'App.tsx:window.unhandledrejection',
          message: 'Unhandled promise rejection',
          data: reason,
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion agent log
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SettingsProvider>
        <XPProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <DebugRuntimeListeners />
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/home" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/auth/callback" element={<AuthCallbackPage />} />
                  <Route path="/dashboard" element={<ProtectedRoute><ErrorBoundary><DashboardPage /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="/screener" element={<ProtectedRoute><ErrorBoundary><ScreenerPage /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="/trade" element={<ProtectedRoute><ErrorBoundary><TradePage /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="/history" element={<ProtectedRoute><ErrorBoundary><HistoryPage /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="/learn" element={<ProtectedRoute><ErrorBoundary><LearnPage /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="/learn/:moduleId" element={<ProtectedRoute><ErrorBoundary><LessonPage /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="/garden" element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <DashboardLayout>
                          <GamifiedGarden />
                        </DashboardLayout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } />
                  <Route path="/insights" element={<ProtectedRoute><ErrorBoundary><InsightsPage /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="/research" element={<ProtectedRoute><ErrorBoundary><ResearchPage /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="/leaderboard" element={<ProtectedRoute><ErrorBoundary><LeaderboardPage /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><ErrorBoundary><ProfilePage /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="/profile/:userId" element={<ProtectedRoute><ErrorBoundary><ProfilePage /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="/stocks/:symbol" element={<ProtectedRoute><ErrorBoundary><StockPage /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><ErrorBoundary><SettingsPage /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute><ErrorBoundary><AdminPage /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ErrorBoundary>
              <ChatWidget />
            </BrowserRouter>
          </TooltipProvider>
        </XPProvider>
      </SettingsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
