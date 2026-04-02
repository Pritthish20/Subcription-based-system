import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/ui/AppShell";
import { ErrorState } from "./components/ui/ErrorState";
import { LoadingState } from "./components/ui/LoadingState";
import { ProtectedRoute } from "./components/ui/ProtectedRoute";
import { request } from "./lib";
import { useCachedRequest } from "./lib/hooks/useCachedRequest";
import type { Charity, Plan, SessionUser } from "./lib/types/app";

const HomePage = lazy(() => import("./pages/home").then((module) => ({ default: module.HomePage })));
const CharitiesPage = lazy(() => import("./pages/charities").then((module) => ({ default: module.CharitiesPage })));
const CharityDetailPage = lazy(() => import("./pages/charity-detail").then((module) => ({ default: module.CharityDetailPage })));
const DrawExplainerPage = lazy(() => import("./pages/draw-explainer").then((module) => ({ default: module.DrawExplainerPage })));
const DrawResultsPage = lazy(() => import("./pages/draw-results").then((module) => ({ default: module.DrawResultsPage })));
const AuthPage = lazy(() => import("./pages/auth").then((module) => ({ default: module.AuthPage })));
const DashboardPage = lazy(() => import("./pages/dashboard").then((module) => ({ default: module.DashboardPage })));
const AdminPage = lazy(() => import("./pages/admin").then((module) => ({ default: module.AdminPage })));

export default function App() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [sessionResolved, setSessionResolved] = useState(false);
  const { data: charities, isLoading: charitiesLoading, error: charitiesError, refresh: refreshCharities } = useCachedRequest<Charity[]>({ cacheKey: "charities:home", path: "/charities", fallback: [], useAuth: false });
  const { data: plans, isLoading: plansLoading, error: plansError, refresh: refreshPlans } = useCachedRequest<Plan[]>({ cacheKey: "plans", path: "/billing/plans", fallback: [], useAuth: false });

  useEffect(() => {
    async function hydrateSession() {
      try {
        setSession(await request<SessionUser>("/me"));
      } catch {
        setSession(null);
      } finally {
        setSessionResolved(true);
      }
    }

    void hydrateSession();
  }, []);

  return (
    <AppShell session={session} setSession={setSession}>
      <Suspense fallback={<LoadingState label="Loading page" />}>
        <Routes>
          <Route path="/" element={<HomePage charities={charities} plans={plans} isLoading={charitiesLoading || plansLoading} error={charitiesError || plansError} onRetry={() => { void refreshCharities(true); void refreshPlans(true); }} />} />
          <Route path="/charities" element={<CharitiesPage initialCharities={charities} />} />
          <Route path="/charities/:slug" element={<CharityDetailPage charities={charities} />} />
          <Route path="/draws/explainer" element={<DrawExplainerPage />} />
          <Route path="/draws/results" element={<DrawResultsPage />} />
          <Route path="/auth" element={sessionResolved && session?._id ? <Navigate to={session.role === "admin" ? "/admin" : "/dashboard"} replace /> : <AuthPage charities={charities} plans={plans} setSession={setSession} />} />
          <Route path="/dashboard" element={<ProtectedRoute session={session} sessionResolved={sessionResolved}><DashboardPage charities={charities} /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute session={session} sessionResolved={sessionResolved} requiredRole="admin"><AdminPage /></ProtectedRoute>} />
          <Route path="*" element={plansLoading ? <LoadingState label="Loading page" /> : <ErrorState title="Page not found" message="This route does not exist in the current build." />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
