import React from "react";
import { Route, Routes } from "react-router-dom";
import Dashboard from "../../pages/Admin/Dashboard";
import Users_outlet from "@/components/layout/admin/Users_outlet";
import Admin_ProtectedRoute from "./Admin_ProtectedRoute";
import Organizer_Request from "@/components/layout/admin/Organizer_Request";
import Coupon_layout from "@/components/layout/admin/Coupon_layout";
import Achievements_layout from "@/components/layout/admin/Achivements_layout";
import Revenue_Overview from "@/components/layout/admin/finance/Revenue_Overview";
import Transaction_History from "@/components/layout/admin/finance/Transaction_History";
import Refund_History from "@/components/layout/admin/finance/Refund_History";
import Ticket_Purchases from "@/components/layout/admin/Ticket_Purchases";
import Plan from "@/components/layout/admin/subscription/Plan";
import SubsOverview from "@/components/layout/admin/subscription/SubsOverview";
import SubscriptionAnalytics from "@/components/layout/admin/subscription/SubscriptionAnalytics";
import Events from "@/components/layout/admin/Events";
import LandingPage from "@/components/layout/admin/LandingPage";

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