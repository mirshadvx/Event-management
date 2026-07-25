import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { lazy, Suspense, useEffect } from "react";
import { verifyAuth, get_ProfileData } from "./store/user/userSlice";
import AuthRoutes from "./routes/user/AuthRoutes";
import DashboardRoutes from "./routes/user/DashboardRoutes";
import { Toaster } from "sonner";
import AdminRoutes from "./routes/admin/AdminRoutes";
import ProfileRoutes from "./routes/user/ProfileRoutes";
import LoadingScreen from "./components/common/LoadingScreen";

const Home = lazy(() => import("./pages/User/home/Home"));
const AdminLogin = lazy(() => import("./pages/Admin/Login"));
const Explore = lazy(() => import("./pages/User/Explore/Explore"));
const ForgotPassword = lazy(() => import("./pages/User/Auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/User/Auth/ResetPassword"));
const CheckoutPage = lazy(() => import("./pages/User/Checkout/CheckoutPage"));
const SubscriptionCheckout = lazy(() =>
  import("./pages/User/Checkout/SubscriptionCheckout")
);
const RenewSubscription = lazy(() =>
  import("./pages/User/Checkout/RenewSubscription")
);
const MainLayout = lazy(() => import("./components/layout/user/chat/MainLayout"));
const GlobalProfile = lazy(() => import("./pages/User/home/GlobalProfile"));
const UserSearch = lazy(() => import("./pages/User/UserSearch"));
const TicketValidatorProtectedRoute = lazy(() =>
  import("./routes/TicketValidator/TicketValidatorProtectedRoute")
);
const ValidatorLogin = lazy(() => import("./components/TicketValidator/ValidatorLogin"));

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading } = useSelector(
    (state) => state.user
  );

  useEffect(() => {
    dispatch(verifyAuth());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && !user && !loading) {
      dispatch(get_ProfileData());
    }
  }, [isAuthenticated, user, loading, dispatch]);

  return (
    <BrowserRouter>
      <div className="relative">
        <Toaster richColors position="top-right" />
        {loading && (
          <LoadingScreen overlay message="Checking your session" />
        )}
        <Suspense fallback={<LoadingScreen message="Preparing your page" />}>
          <Routes>
            <Route path="/test" element={<></>} />
            <Route path="/" element={<Home />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/checkout/:eventId" element={<CheckoutPage />} />
            <Route
              path="/checkout/subscription"
              element={<SubscriptionCheckout />}
            />
            <Route
              path="/checkout/renew-subscription"
              element={<RenewSubscription />}
            />
            <Route path="/chat" element={<MainLayout />} />
            <Route path="user/:username" element={<GlobalProfile />} />
            <Route path="search" element={<UserSearch />} />
            <Route path="event/:event_id/guard/login" element={<ValidatorLogin />} />
            <Route path="event/:event_id/guard/scanner" element={<TicketValidatorProtectedRoute />}/>
            {AuthRoutes()}
            {DashboardRoutes()}
            {AdminRoutes()}
            {ProfileRoutes()}
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}

export default App;
