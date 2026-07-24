import { Navigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import ValidatorPage from "@/pages/TicketValidator/ValidatorPage";
import { getGuardSession } from "@/services/TickerValidator/guardApi";
import {
  loginFailure,
  loginStart,
  loginSuccess,
} from "@/store/GuardTicketValidator/guardAuthSlice";

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
    return (
      <div className="min-h-screen w-full bg-[#0b0a17] flex items-center justify-center text-sm text-gray-400">
        Checking validator access...
      </div>
    );
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
