import { HashLoader } from "react-spinners";
import logo from "@/assets/images/evenxo_logo.png";

const LoadingScreen = ({
  message = "Loading Evenxo",
  fullScreen = true,
  overlay = false,
  className = "",
}) => {
  const positionClass = overlay
    ? "fixed inset-0 z-50"
    : fullScreen
      ? "relative min-h-screen w-full"
      : "relative w-full min-h-48";

  return (
    <div
      className={`${positionClass} flex items-center justify-center overflow-hidden bg-[#121120] text-white ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1744] via-[#171625] to-[#10231f]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,133,0.12)_0%,rgba(0,0,0,0)_34%,rgba(0,0,0,0.48)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px] sm:bg-[size:72px_72px]" />

      <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 px-4 sm:px-6 text-center max-w-xs sm:max-w-sm mx-auto">
        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border border-emerald-400/25 bg-white/5 shadow-[0_0_40px_rgba(0,255,133,0.18)] backdrop-blur-sm flex items-center justify-center shrink-0">
          <img
            src={logo}
            alt="Evenxo"
            className="h-9 w-9 sm:h-12 sm:w-12 object-contain"
          />
        </div>

        <div className="flex items-center justify-center">
          <HashLoader color="#00ff85" size={30} />
        </div>

        <div>
          <p className="text-sm sm:text-base font-medium tracking-wide text-emerald-300 break-words">
            {message}
          </p>
          <div className="mt-3 flex items-center justify-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-200 animate-pulse [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;