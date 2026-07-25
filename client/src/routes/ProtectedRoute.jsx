import { useSelector, useDispatch } from "react-redux";
import { Navigate } from "react-router-dom";
import { get_ProfileData } from "@/store/user/userSlice";
import { useEffect } from "react";
import LoadingScreen from "@/components/common/LoadingScreen";

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useSelector((state) => state.user);
    console.log("ProtectedRoute - isAuthenticated:", isAuthenticated, "loading:", loading);

    console.log("is loading lis loading dsdfsdf");

    if (loading) {
        return <LoadingScreen message="Checking access" />;
    }

    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;