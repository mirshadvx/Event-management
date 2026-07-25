import { lazy } from "react";
import { Route } from "react-router-dom";
import Admin_ProtectedRoute from "./Admin_ProtectedRoute";

const Dashboard = lazy(() => import("../../pages/Admin/Dashboard"));
const Users_outlet = lazy(() => import("@/components/layout/admin/Users_outlet"));
const Organizer_Request = lazy(() => import("@/components/layout/admin/Organizer_Request"));
const Coupon_layout = lazy(() => import("@/components/layout/admin/Coupon_layout"));
const Achievements_layout = lazy(() => import("@/components/layout/admin/Achivements_layout"));
const Revenue_Overview = lazy(() => import("@/components/layout/admin/finance/Revenue_Overview"));
const Transaction_History = lazy(() => import("@/components/layout/admin/finance/Transaction_History"));
const Refund_History = lazy(() => import("@/components/layout/admin/finance/Refund_History"));
const Ticket_Purchases = lazy(() => import("@/components/layout/admin/Ticket_Purchases"));
const Plan = lazy(() => import("@/components/layout/admin/subscription/Plan"));
const SubsOverview = lazy(() => import("@/components/layout/admin/subscription/SubsOverview"));
const SubscriptionAnalytics = lazy(() => import("@/components/layout/admin/subscription/SubscriptionAnalytics"));
const Events = lazy(() => import("@/components/layout/admin/Events"));
const LandingPage = lazy(() => import("@/components/layout/admin/LandingPage"));

const AdminRoutes = () => {
    return (
        <Route
            path="/admin/"
            element={
                <Admin_ProtectedRoute>
                    <Dashboard />
                </Admin_ProtectedRoute>
            }
        >
            <Route path="dashboard" element={<LandingPage />} />
            <Route path="users" element={<Users_outlet />} />
            <Route path="oranizer-requests" element={<Organizer_Request />} />
            <Route path="coupons" element={<Coupon_layout />} />
            <Route path="achievements" element={<Achievements_layout />} />
            <Route path="ticket-purchase" element={<Ticket_Purchases />} />
            <Route path="finance/revenue" element={<Revenue_Overview />} />
            <Route path="finance/transactions-history" element={<Transaction_History />} />
            <Route path="finance/refunds-history" element={<Refund_History />} />
            <Route path="subscription/plan" element={<Plan />} />
            <Route path="subscription/overview" element={<SubsOverview />} />
            <Route path="subscription/analytics" element={<SubscriptionAnalytics />} />
            <Route path="events" element={<Events />} />
            <Route index element={ <LandingPage />} />
        </Route>
    );
};

export default AdminRoutes;
