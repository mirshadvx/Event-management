import { useSelector, useDispatch } from "react-redux";
import { Navigate } from "react-router-dom";
import { get_ProfileData } from "@/store/user/userSlice";
import { useEffect } from "react";

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useSelector((state) => state.user);
    console.log("ProtectedRoute - isAuthenticated:", isAuthenticated, "loading:", loading);

    console.log("is loading lis loading dsdfsdf");

    if (loading) {
        return (
            <>
                <div className="bg-white">Loading...</div>;
            </>
        );
    }

    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;

// import React from "react";
// import { useSelector } from "react-redux";
// import { Navigate } from "react-router-dom";

// const ProtectedRoute = ({ children, restrictToOrganizer = false }) => {
//     const { isAuthenticated, user, loading } = useSelector((state) => state.user);

//     if (loading) {
//         return <div>Loading...</div>; // Customize this (e.g., spinner)
//     }

//     if (!isAuthenticated) {
//         return <Navigate to="/login" replace />;
//     }

//     if (restrictToOrganizer && !user?.organizerVerified) {
//         return <Navigate to="/dashboard/participated" replace />;
//     }

//     return children;
// };

// export default ProtectedRoute;
