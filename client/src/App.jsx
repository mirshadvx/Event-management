import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { verifyAuth, get_ProfileData } from "./store/user/userSlice";
import Home from "./pages/User/home/Home";
import Test from "./pages/User/Test";
import AuthRoutes from "./routes/user/authRoutes";
import DashboardRoutes from "./routes/user/DashboardRoutes";
import { Toaster } from "sonner";
import AdminRoutes from "./routes/admin/AdminRoutes";
import Login from "./pages/Admin/Login";
import ProfileRoutes from "./routes/user/ProfileRoutes";
import Explore from "./pages/User/Explore/Explore";
import { HashLoader } from "react-spinners";
import CheckoutPage from "./pages/User/Checkout/CheckoutPage";
import ForgotPassword from "./pages/User/Auth/ForgotPassword";
import ResetPassword from "./pages/User/Auth/ResetPassword";
// import { SkeletonTheme } from "react-loading-skeleton";
import SubscriptionCheckout from "./pages/User/Checkout/SubscriptionCheckout";
import RenewSubscription from "./pages/User/Checkout/RenewSubscription";
import MainLayout from "./components/layout/user/chat/MainLayout";
import GlobalProfile from "./pages/User/home/GlobalProfile";

function App() {
    const dispatch = useDispatch();
    const { isAuthenticated, role, user, loading } = useSelector((state) => state.user);

    useEffect(() => {
        dispatch(verifyAuth());
    }, [dispatch]);

    useEffect(() => {
        if (isAuthenticated && !user && !loading) {
            dispatch(get_ProfileData());
            console.log(user);
        }
    }, [isAuthenticated, user, loading, dispatch]);

    return (
        <BrowserRouter>
            <div className="relative">
                <Toaster richColors position="top-right" />
                <Routes>
                    <Route path="/test" element={<></>} />
                    <Route path="/" element={<Home />} />
                    <Route path="/admin/login" element={<Login />} />
                    <Route path="/explore" element={<Explore />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="/checkout/:eventId" element={<CheckoutPage />} />
                    <Route path="/checkout/subscription" element={<SubscriptionCheckout />} />
                    <Route path="/checkout/renew-subscription" element={<RenewSubscription />} />
                    <Route path="/chat" element={<MainLayout />} />
                    <Route path="user/:username" element={<GlobalProfile />} />
                    {AuthRoutes()}
                    {DashboardRoutes()}
                    {AdminRoutes()}
                    {ProfileRoutes()}
                </Routes>

                {/* Loading Overlay */}
                {/* {loading && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div>
                            <HashLoader color="#00ff20" />
                        </div>
                    </div>
                )} */}
            </div>
        </BrowserRouter>
        // </SkeletonTheme>
    );
}

export default App;

// import "./App.css";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";
// import { useEffect } from "react";
// import { verifyAuth, get_ProfileData } from "./store/user/userSlice";
// import Home from "./pages/User/home/Home";
// import Test from "./pages/User/Test";
// import AuthRoutes from "./routes/user/authRoutes";
// import DashboardRoutes from "./routes/user/DashboardRoutes";
// import { Toaster } from "sonner";
// import AdminRoutes from "./routes/admin/AdminRoutes";
// import Login from "./pages/Admin/Login";
// import ProfileRoutes from "./routes/user/ProfileRoutes";
// import Explore from "./pages/User/Explore/Explore";

// function App() {
//     const dispatch = useDispatch();
//     const { isAuthenticated, role, user, loading } = useSelector((state) => state.user);

//     useEffect(() => {
//         dispatch(verifyAuth());
//     }, [dispatch]);

//     useEffect(() => {
//         if (isAuthenticated && !user && !loading) {
//             dispatch(get_ProfileData());
//             console.log(user);
//         }
//     }, [isAuthenticated, user, loading, dispatch]);

//     if (loading) {
//     return (
//         <div className="flex items-center bg-black/50 justify-center min-h-screen">
//             <div className="animate-spin inline-block w-8 h-8 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full" role="status">
//                 <span className="sr-only">Loading...</span>
//             </div>
//         </div>
//     );
//     }

//     return (
//         <BrowserRouter>
//             <Toaster richColors position="top-right" />
//             <Routes>
//                 <Route path="/test" element={<Test />} />
//                 <Route path="/" element={<Home />} />
//                 <Route path="/admin/login" element={<Login />} />
//                 <Route path="/explore" element={<Explore />} />
//                 {AuthRoutes()}
//                 {DashboardRoutes()}
//                 {AdminRoutes()}
//                 {ProfileRoutes()}
//             </Routes>
//         </BrowserRouter>
//     );
// }

// export default App;

{
    /* Authenticated Routes */
}
{
    /* <Route element={<ProtectedRoute />}>
        <Route path="/event/:id/buy-ticket" element={<BuyTicketPage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<EditProfilePage />} />
        <Route path="/my-tickets" element={<MyTicketsPage />} />
        <Route path="/my-events" element={<MyEventsPage />} />
        <Route path="/create-event" element={<CreateEventPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/wallet/add-money" element={<AddMoneyPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/chat/:id" element={<ChatDetailPage />} />
      </Route> */
}
