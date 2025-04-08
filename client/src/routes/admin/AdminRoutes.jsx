import React from "react";
import { Route, Routes } from "react-router-dom";
import Dashboard from "../../pages/Admin/Dashboard";
import Users_outlet from "@/components/layout/admin/Users_outlet";
import Admin_ProtectedRoute from "./Admin_ProtectedRoute";
import Organizer_Request from "@/components/layout/admin/Organizer_Request";
import Coupon_layout from "@/components/layout/admin/Coupon_layout";
import Achievements_layout from "@/components/layout/admin/Achivements_layout";
import Refund_management from "@/components/layout/admin/Refund_management";
import Revenue_Overview from "@/components/layout/admin/finance/Revenue_Overview";
import Transaction_History from "@/components/layout/admin/finance/Transaction_History";

function fun() {
    return <h1>hit out let</h1>;
}

const AdminRoutes = () => {
    return (
        <Route
            path="/admin"
            element={
                <Admin_ProtectedRoute>
                    <Dashboard />
                </Admin_ProtectedRoute>
            }
        >
            <Route path="dashboard" element={<Users_outlet />} />
            <Route path="users" element={<Users_outlet />} />
            <Route path="oranizer-requests" element={<Organizer_Request />} />
            <Route path="coupons" element={<Coupon_layout />} />
            <Route path="achievements" element={<Achievements_layout />} />
            <Route path="refund" element={<Refund_management />} />
            <Route path="finance/revenue" element={<Revenue_Overview />} />
            <Route path="finance/transactions-history" element={<Transaction_History />} />
            <Route index element={fun()} />
        </Route>
    );
};

export default AdminRoutes;
