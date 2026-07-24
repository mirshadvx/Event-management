import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "@/store/GuardTicketValidator/guardAuthSlice";
import { loginGuard } from "@/services/TickerValidator/guardApi";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Ticket, User, Lock, AlertCircle, Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function ValidatorLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const { error, isAuthenticated, loading } = useSelector((state) => state.guardAuth);
  const { event_id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate(`/event/${event_id}/guard/scanner`, { replace: true });
    }
  }, [event_id, isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      dispatch(loginFailure("Username and password are required."));
      return;
    }

    dispatch(loginStart());
    try {
      const response = await loginGuard(event_id, username.trim(), password);
      dispatch(loginSuccess(response.staff));
      navigate(`/event/${event_id}/guard/scanner`, { replace: true, });
    } catch {
      dispatch(loginFailure("Invalid username or password."));
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0b0a17] relative flex items-center justify-center px-4 overflow-hidden">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[420px] w-[620px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-[-200px] right-[-100px] h-[380px] w-[380px] rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center mb-4">
            <Ticket className="h-6 w-6 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Validator <span className="text-emerald-400">Access</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1.5 text-center">
            Sign in to scan tickets and manage entry for your assigned event.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#131226] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="username"
                className="text-gray-300 text-xs uppercase tracking-wide"
              >
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="username"
                  autoComplete="username"
                  placeholder="validator1"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9 bg-[#0e0d1c] border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-emerald-400/40"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-gray-300 text-xs uppercase tracking-wide"
              >
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 bg-[#0e0d1c] border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-emerald-400/40"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-emerald-400 hover:bg-emerald-300 text-[#0b0a17] font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
