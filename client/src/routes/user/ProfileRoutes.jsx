import { lazy } from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoute";

const Profile = lazy(() => import("@/pages/Admin/Profile"));
const Event_outlet = lazy(() => import("@/components/layout/user/Profile/Event_outlet"));
const Profile_outlet = lazy(() => import("@/components/layout/user/Profile/Profile_outlet"));
const Wallet_outlet = lazy(() => import("@/components/layout/user/Profile/Wallet_outlet"));
const Subscription = lazy(() => import("@/components/layout/user/Profile/Subscription"));

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
