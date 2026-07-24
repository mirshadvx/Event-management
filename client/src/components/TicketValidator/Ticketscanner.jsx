import { useCallback, useRef, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { CheckCircle2, XCircle, ScanLine, Camera } from "lucide-react";
import { verifyTicket } from "@/services/TickerValidator/guardApi";
import { useParams } from "react-router-dom";

const RESULT_COOLDOWN_MS = 2200;

export default function TicketScanner({ onScanLogged }) {
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const { event_id } = useParams();
  const lastCodeRef = useRef(null);
  const lastScanTimeRef = useRef(0);

  const resumeScanning = useCallback(() => {
    setResult(null);
    setPaused(false);
    lastCodeRef.current = null;
  }, []);

  const handleScan = useCallback(
    async (detected) => {
      const code = detected?.[0]?.rawValue?.trim();
      if (!code) return;

      const now = Date.now();
      const isSameAsLast = code === lastCodeRef.current;
      const withinCooldown = now - lastScanTimeRef.current < RESULT_COOLDOWN_MS;

      if (isSameAsLast && withinCooldown) return;
      if (paused) return;

      lastCodeRef.current = code;
      lastScanTimeRef.current = now;
      setPaused(true);

      try {
        const response = await verifyTicket(event_id, code);

        const entry = {
          status: response.status,
          code,
          holder: response.holder || "Unknown ticket",
          tier: response.tier,
          message: response.message,
          usedTickets: response.used_tickets,
          quantity: response.quantity,
          remainingTickets: response.remaining_tickets,
          bookingId: response.booking_id,
          stats: response.stats,
          time: response.scanned_at ? new Date(response.scanned_at) : new Date(),
        };

        setResult(entry);
        onScanLogged?.(entry);
      } catch (error) {
        const response = error.response?.data;
        const entry = {
          status: response?.status || "invalid",
          code,
          holder: response?.holder || "Verification Failed",
          tier: response?.tier,
          message: response?.message || "Unable to verify this ticket.",
          usedTickets: response?.used_tickets,
          quantity: response?.quantity,
          remainingTickets: response?.remaining_tickets,
          stats: response?.stats,
          time: response?.scanned_at ? new Date(response.scanned_at) : new Date(),
        };
        setResult(entry);
        onScanLogged?.(entry);
      }

      window.setTimeout(resumeScanning, RESULT_COOLDOWN_MS);
    },
    [event_id, paused, onScanLogged, resumeScanning]
  );

  return (
    <div className="bg-[#131226] border border-white/10 rounded-2xl p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ScanLine className="h-4.5 w-4.5 text-emerald-400" />
          <h3 className="text-white font-medium">Scan ticket QR code</h3>
        </div>
        <span
          className={`text-[11px] font-medium rounded-full px-2.5 py-0.5 border ${
            paused
              ? "text-gray-400 border-white/10 bg-white/5"
              : "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
          }`}
        >
          {paused ? "Paused" : "Scanning"}
        </span>
      </div>

      <div className="relative aspect-square sm:aspect-[4/3] w-full rounded-xl overflow-hidden bg-black border border-white/10">
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6">
            <Camera className="h-6 w-6 text-gray-500" />
            <p className="text-sm text-gray-400">{cameraError}</p>
          </div>
        ) : (
          <Scanner
            paused={paused}
            onScan={handleScan}
            onError={() =>
              setCameraError(
                "Camera unavailable. Check permissions and try again."
              )
            }
            constraints={{ facingMode: "environment" }}
            components={{ finder: false, torch: true }}
            styles={{ container: { width: "100%", height: "100%" } }}
          />
        )}

        {!cameraError && !result && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[62%] w-[62%] rounded-2xl border-2 border-emerald-400/70" />
          </div>
        )}

        {result && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center gap-3 backdrop-blur-sm ${
              result.status === "valid"
                ? "bg-emerald-500/20"
                : "bg-red-500/20"
            }`}
          >
            {result.status === "valid" ? (
              <CheckCircle2 className="h-16 w-16 text-emerald-400" />
            ) : (
              <XCircle className="h-16 w-16 text-red-400" />
            )}
            <p className="text-white font-semibold text-lg">
              {result.status === "valid" && "Entry granted"}
              {result.status === "used" && "Ticket already used"}
              {result.status === "invalid" && "Invalid ticket"}
            </p>
            {result.message && (
              <p className="max-w-[82%] text-center text-sm text-white/75">
                {result.message}
              </p>
            )}
            {result.holder && (
              <p className="text-sm text-white/80">
                {result.holder} · {result.tier}
              </p>
            )}
            {Number.isInteger(result.usedTickets) && Number.isInteger(result.quantity) && (
              <p className="text-xs text-white/70">
                Used {result.usedTickets} / {result.quantity}
                {Number.isInteger(result.remainingTickets)
                  ? ` · ${result.remainingTickets} remaining`
                  : ""}
              </p>
            )}
            <p className="text-xs text-white/50 font-mono">{result.code}</p>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-3 text-center">
        Hold the attendee's ticket QR code steady inside the frame.
      </p>
    </div>
  );
}
