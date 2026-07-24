import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/store/GuardTicketValidator/guardAuthSlice";
import {
  getTicketScanHistory,
  logoutGuard,
} from "@/services/TickerValidator/guardApi";
import { Button } from "@/components/ui/button";
import { Ticket, LogOut, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";
import EventDetailsCard from "@/components/TicketValidator/Eventdetailscard";
import TicketScanner from "@/components/TicketValidator/Ticketscanner";
import StatPill from "@/components/TicketValidator/StatPill";
import { useNavigate, useParams } from "react-router-dom";

export default function ValidatorPage() {
  const [log, setLog] = useState([]);
  const [stats, setStats] = useState({ granted: 0, denied: 0, total: 0 });
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const dispatch = useDispatch();
  const { staff } = useSelector((state) => state.guardAuth);
  const navigate = useNavigate();
  const { event_id } = useParams();

  const loadScanHistory = async () => {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const response = await getTicketScanHistory(event_id);
      setLog(
        response.logs.map((entry) => ({
          ...entry,
          time: new Date(entry.time),
        }))
      );
      setStats(response.stats);
    } catch {
      setHistoryError("Could not load scan history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadScanHistory();
  }, [event_id]);

  const handleScanLogged = (entry) => {
    setLog((prev) => [
      { ...entry, time: entry.time || new Date() },
      ...prev,
    ].slice(0, 50));

    if (entry.stats) {
      setStats(entry.stats);
      return;
    }

    setStats((prev) => ({
      granted: prev.granted + (entry.status === "valid" ? 1 : 0),
      denied: prev.denied + (entry.status === "valid" ? 0 : 1),
      total: prev.total + 1,
    }));
  };

  const handleLogout = async () => {
    await logoutGuard();
    dispatch(logout());
    navigate(`/event/${event_id}/guard/login`, {
      replace: true,
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#0b0a17]">
      <header className="border-b border-white/10 bg-[#0b0a17]/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center">
              <Ticket className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-white text-sm font-medium leading-none">
                Evenxo <span className="text-emerald-400">Validator</span>
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                {staff?.username} · Guard
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5 mr-1.5" />
            Log out
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
          <div>
            <TicketScanner onScanLogged={handleScanLogged} />
          </div>
          <div className="space-y-5">
            <EventDetailsCard event={staff?.event} />
            <div className="flex gap-3">
              <StatPill label="Granted" value={stats.granted} tone="emerald" />
              <StatPill label="Denied" value={stats.denied} tone="red" />
              <StatPill label="Total scans" value={stats.total} tone="neutral" />
            </div>
            <div className="bg-[#131226] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-white font-medium text-sm">Recent scans</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadScanHistory}
                  disabled={historyLoading}
                  className="h-8 border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${historyLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
              {historyError && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">
                  {historyError}
                </p>
              )}
              {historyLoading ? (
                <p className="text-sm text-gray-500">Loading scan history...</p>
              ) : log.length === 0 ? (
                <p className="text-sm text-gray-500">No tickets scanned yet.</p>
              ) : (
                <ul className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {log.map((entry, i) => (
                    <li key={`${entry.code}-${i}`} className="flex items-center gap-2.5 text-sm">
                      {entry.status === "valid" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-gray-200 truncate">{entry.holder ?? "Unknown code"}</p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {entry.tier ? `${entry.tier} · ` : ""}
                          {Number.isInteger(entry.usedTickets) && Number.isInteger(entry.quantity)
                            ? `Used ${entry.usedTickets}/${entry.quantity}`
                            : entry.message || "Scanned ticket"}
                        </p>
                        <p className="text-[11px] text-gray-600 font-mono truncate">{entry.code}</p>
                      </div>
                      <span className="text-[11px] text-gray-500 flex items-center gap-1 shrink-0">
                        <Clock className="h-3 w-3" />
                        {entry.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
