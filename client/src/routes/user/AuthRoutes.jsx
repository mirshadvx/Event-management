import { Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Login from "../../pages/User/Auth/Login";
import Register from "../../pages/User/Auth/Register";


const UnauthenticatedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useSelector((state) => state.user);
    console.log("UnauthenticatedRoute - isAuthenticated:", isAuthenticated, "loading:", loading);

    if (loading) {
        return <div>Loading...</div>;
    }

    return isAuthenticated ? <Navigate to="/" replace /> : children;
};

const AuthRoutes = () => {
    return (
        <>
            <Route
                path="/login"
                element={
                    <UnauthenticatedRoute>
                        <Login />
                    </UnauthenticatedRoute>
                }
            />
            <Route
                path="/register"
                element={
                    <UnauthenticatedRoute>
                        <Register />
                    </UnauthenticatedRoute>
                }
            />
        </>
    );
};

export default AuthRoutes;

// import { Routes, Route, Navigate } from "react-router-dom";
// import { useSelector } from "react-redux";
// import Login from "../../pages/User/Auth/Login";
// import Register from "../../pages/User/Auth/Register";

// // UnauthenticatedRoute Component
// const UnauthenticatedRoute = ({ children }) => {
//     const { isAuthenticated, loading } = useSelector((state) => state.user);
//     console.log("UnauthenticatedRoute - isAuthenticated:", isAuthenticated, "loading:", loading);

//     if (loading) {
//         return <div>Loading...</div>;
//     }

//     return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
// };

// const AuthRoutes = () => {
//     return (
//         <>
//             <Route
//                 path="/login"
//                 element={
//                     <UnauthenticatedRoute>
//                         <Login />
//                     </UnauthenticatedRoute>
//                 }
//             />
//             <Route
//                 path="/register"
//                 element={
//                     <UnauthenticatedRoute>
//                         <Register />
//                     </UnauthenticatedRoute>
//                 }
//             />
//         </>
//     );
// };

// export default AuthRoutes;
