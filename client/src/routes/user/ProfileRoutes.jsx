import React from "react";
import { Route } from "react-router-dom";
import Profile from "@/pages/Admin/Profile";
import Event_outlet from "@/components/layout/user/Profile/Event_outlet";
import Profile_outlet from "@/components/layout/user/Profile/Profile_outlet";
import ProtectedRoute from "../ProtectedRoute";
import Wallet_outlet from "@/components/layout/user/Profile/Wallet_outlet";
import Subscription from "@/components/layout/user/Profile/Subscription";

const ProfileRoutes = () => {
    return (
        <Route
            path="/profile/"
            element={
                <ProtectedRoute>
                    <Profile />
                </ProtectedRoute>
            }>
            <Route path="" element={<Profile_outlet />} />
            <Route path="events" element={<Event_outlet />} />
            <Route path="achievements"></Route>
            <Route path="wallet" element={<Wallet_outlet />} />
            <Route path="subscription" element={<Subscription />} />
        </Route>
    );
};

export default ProfileRoutes;
