import { useCallback, useEffect, useRef, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import {
  CheckCircle2,
  XCircle,
  ScanLine,
  Camera,
} from "lucide-react";
import { verifyTicket } from "@/services/TickerValidator/guardApi";
import { useParams } from "react-router-dom";


function useCameraDevices() {
  const [devices, setDevices] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDevices() {
      setReady(false);
      let tempStream = null;

      try {
        tempStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
      } catch {
        //
      }

      try {
        const all = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = all.filter((d) => d.kind === "videoinput");
        if (!cancelled) setDevices(videoInputs);
      } catch {
        if (!cancelled) setDevices([]);
      } finally {
        if (tempStream) {
          tempStream.getTracks().forEach((t) => t.stop());
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
        if (!cancelled) setReady(true);
      }
    }

    loadDevices();

    navigator.mediaDevices.addEventListener("devicechange", loadDevices);
    return () => {
      cancelled = true;
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        loadDevices
      );
    };
  }, []);

  return { devices, ready };
}

export default function TicketScanner({ onScanLogged }) {
  const { event_id } = useParams();

  const { devices, ready } = useCameraDevices();

  const [selectedDevice, setSelectedDevice] = useState("");
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState(null);
  const [cameraError, setCameraError] = useState("");

  const lastCodeRef = useRef(null);
  const lastScanTimeRef = useRef(0);

  useEffect(() => {
    if (!devices.length) return;

    if (!selectedDevice) {
      const backCamera =
        devices.find((d) => d.label.toLowerCase().includes("back")) ||
        devices.find((d) => d.label.toLowerCase().includes("rear")) ||
        devices.find((d) =>
          d.label.toLowerCase().includes("environment")
        ) ||
        devices[0];

      setSelectedDevice(backCamera.deviceId);
    }
  }, [devices, selectedDevice]);

  const resumeScanning = useCallback(() => {
    setPaused(false);
    setResult(null);
    lastCodeRef.current = null;
    lastScanTimeRef.current = 0;
  }, []);

  const handleScan = useCallback(
    async (detected) => {
      const code = detected?.[0]?.rawValue?.trim();

      if (!code) return;
      if (paused) return;

      const now = Date.now();

      if (
        code === lastCodeRef.current &&
        now - lastScanTimeRef.current < 1000
      ) {
        return;
      }

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
          time: response.scanned_at
            ? new Date(response.scanned_at)
            : new Date(),
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
          message:
            response?.message || "Unable to verify this ticket.",
          usedTickets: response?.used_tickets,
          quantity: response?.quantity,
          remainingTickets: response?.remaining_tickets,
          stats: response?.stats,
          time: response?.scanned_at
            ? new Date(response.scanned_at)
            : new Date(),
        };

        setResult(entry);
        onScanLogged?.(entry);
      }
    },
    [event_id, paused, onScanLogged]
  );

  return (
    <div className="bg-[#131226] border border-white/10 rounded-2xl p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ScanLine className="h-5 w-5 text-emerald-400" />
          <h3 className="text-white font-medium">Scan ticket QR code</h3>
        </div>

        <span
          className={`text-xs font-medium rounded-full px-3 py-1 border ${
            paused
              ? "text-gray-400 border-white/10 bg-white/5"
              : "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
          }`}
        >
          {paused ? "Paused" : "Scanning"}
        </span>
      </div>

      {devices.length >= 1 && (
        <div className="mb-4">
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="w-full rounded-lg bg-[#1c1b34] border border-white/10 px-3 py-2 text-sm text-white"
          >
            {devices.map((device, index) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${index + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="relative aspect-square sm:aspect-[4/3] rounded-xl overflow-hidden bg-black border border-white/10">
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Camera className="h-8 w-8 text-gray-500" />
            <p className="text-gray-400 text-sm">{cameraError}</p>
          </div>
        ) : !ready ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Camera className="h-8 w-8 text-gray-500 animate-pulse" />
            <p className="text-gray-400 text-sm">Preparing camera...</p>
          </div>
        ) : (
          <Scanner
            key={selectedDevice || "default"}
            paused={paused}
            onScan={handleScan}
            onError={() =>
              setCameraError(
                "Camera unavailable. Check permissions and try again."
              )
            }
            constraints={{
              deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
              facingMode: selectedDevice ? undefined : "environment",
            }}
            components={{
              finder: false,
              torch: true,
            }}
            styles={{
              container: {
                width: "100%",
                height: "100%",
              },
            }}
          />
        )}

        {!cameraError && ready && !result && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[62%] w-[62%] rounded-2xl border-2 border-emerald-400/70" />
          </div>
        )}

        {result && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center gap-3 px-5 backdrop-blur-md ${
              result.status === "valid" ? "bg-black/80" : "bg-red-950/80"
            }`}
          >
            {result.status === "valid" ? (
              <CheckCircle2 className="h-16 w-16 text-emerald-400" />
            ) : (
              <XCircle className="h-16 w-16 text-red-400" />
            )}

            <h2 className="text-xl font-bold text-white">
              {result.status === "valid" && "Entry granted"}
              {result.status === "used" && "Ticket already used"}
              {result.status === "invalid" && "Invalid ticket"}
            </h2>

            {result.message && (
              <p className="text-center text-gray-300">{result.message}</p>
            )}

            <p className="text-white">
              {result.holder}
              {result.tier && ` · ${result.tier}`}
            </p>

            {Number.isInteger(result.usedTickets) &&
              Number.isInteger(result.quantity) && (
                <p className="text-sm text-gray-300">
                  Used {result.usedTickets} / {result.quantity}
                  {Number.isInteger(result.remainingTickets) &&
                    ` • ${result.remainingTickets} remaining`}
                </p>
              )}

            <p className="text-xs text-gray-500 break-all">{result.code}</p>

            <button
              onClick={resumeScanning}
              className={`mt-3 px-8 py-3 rounded-lg font-semibold text-white transition ${
                result.status === "valid"
                  ? "bg-emerald-500 hover:bg-emerald-600"
                  : "bg-red-500 hover:bg-red-600"
              }`}
            >
              Continue
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-3 text-center">
        Hold the attendee's ticket QR code steady inside the frame.
      </p>
    </div>
  );
}