import { Navigate, useParams } from "react-router-dom";
import { lazy, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getGuardSession } from "@/services/TickerValidator/guardApi";
import {
  loginFailure,
  loginStart,
  loginSuccess,
} from "@/store/GuardTicketValidator/guardAuthSlice";
import LoadingScreen from "@/components/common/LoadingScreen";

const ValidatorPage = lazy(() => import("@/pages/TicketValidator/ValidatorPage"));

export default function TicketValidatorProtectedRoute() {
  const { event_id } = useParams();
  const dispatch = useDispatch();
  const { isAuthenticated, staff, loading } = useSelector(
    (state) => state.guardAuth
  );

  useEffect(() => {
    if (isAuthenticated) return;

    const verifySession = async () => {
      dispatch(loginStart());
      try {
        const response = await getGuardSession(event_id);
        dispatch(loginSuccess(response.staff));
      } catch {
        dispatch(loginFailure(null));
      }
    };

    verifySession();
  }, [dispatch, event_id, isAuthenticated]);

  if (loading) {
    return <LoadingScreen message="Checking validator access" />;
  }

  if (!isAuthenticated || !staff) {
    return (
      <Navigate
        to={`/event/${event_id}/guard/login`}
        replace
      />
    );
  }

  return <ValidatorPage staff={staff} />;
}
