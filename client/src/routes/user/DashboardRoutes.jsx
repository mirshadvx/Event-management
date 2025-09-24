import { Routes, Route } from "react-router-dom";
import Dashboard from "../../pages/User/Dashboard/Dashboard";
import Participated_Outlet from "../../components/layout/user/Dashboard/Participated_Outlet";
import Organized_Outlet from "../../components/layout/user/Dashboard/Organized_Outlet";
import ProtectedRoute from "../ProtectedRoute";
import CreateEvent_Outlet from "@/components/layout/user/Dashboard/CreateEvent_Outlet";
import OrganizerProtectedRoute from "./OrganizerProtectedRoute";



const DashboardRoutes = () => {
    return (
        <Route
            path="/dashboard"
            element={
                <ProtectedRoute>
                    <Dashboard />
                </ProtectedRoute>
            }>
            <Route path="participated" element={<Participated_Outlet />} />
            <Route index element={<Participated_Outlet />} />
            <Route
                path="organized"
                element={
                    <OrganizerProtectedRoute>
                        <Organized_Outlet />
                    </OrganizerProtectedRoute>
                }
            />
            <Route
                path="create-event"
                element={
                    <OrganizerProtectedRoute>
                        <CreateEvent_Outlet />
                    </OrganizerProtectedRoute>
                }
            />
        </Route>
    );
};

export default DashboardRoutes;

// const DashboardRoutes = () => {
//     return (
//             <Route
//                 path="/dashboard"
//                 element={
//                     <ProtectedRoute>
//                         <Dashboard />
//                     </ProtectedRoute>
//                 }
//             >
//                 <Route path="participated" element={<Participated_Outlet />} />
//                 <Route path="organized" element={<Organized_Outlet />} />
//                 <Route path="create-event" element={<CreateEvent_Outlet />} />
//                 <Route index element={<Participated_Outlet />} />
//             </Route>
//     );
// };


// DashboardRoutes.jsx
// import { Routes, Route } from "react-router-dom";
// import Dashboard from "../../pages/User/Dashboard/Dashboard";
// import Participated_Outlet from "../../components/layout/user/Dashboard/Participated_Outlet";
// import Organized_Outlet from "../../components/layout/user/Dashboard/Organized_Outlet";
// import ProtectedRoute from "../ProtectedRoute";
// import CreateEvent_Outlet from "@/components/layout/user/Dashboard/CreateEvent_Outlet";
// import { useSelector } from "react-redux";
// import { Navigate } from "react-router-dom";

// // Component to restrict organizer-only routes
// const OrganizerRoute = ({ children }) => {
//     const { user } = useSelector((state) => state.user);
//     return user?.organizerVerified ? children : <Navigate to="/dashboard/participated" replace />;
// };

// const DashboardRoutes = () => {
//     return (
//         <Route path="/dashboard" element={<Dashboard />}>
//             <Route path="participated" element={<Participated_Outlet />} />
//             <Route index element={<Participated_Outlet />} />
//             <Route
//                 path="organized"
//                 element={
//                     <OrganizerRoute>
//                         <Organized_Outlet />
//                     </OrganizerRoute>
//                 }
//             />
//             <Route
//                 path="create-event"
//                 element={
//                     <OrganizerRoute>
//                         <CreateEvent_Outlet />
//                     </OrganizerRoute>
//                 }
//             />
//         </Route>
//     );
// };

// export default DashboardRoutes;