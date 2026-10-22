import { Link } from "react-router-dom";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#11121b] px-6 py-16 text-white">
      <div aria-hidden="true" className="absolute -left-32 top-[-10rem] h-[28rem] w-[28rem] rounded-full bg-emerald-400/10 blur-[110px]" />
      <div aria-hidden="true" className="absolute -right-40 bottom-[-14rem] h-[34rem] w-[34rem] rounded-full bg-violet-500/10 blur-[130px]" />

      <section className="relative w-full max-w-2xl text-center">
        <Link to="/" className="mb-16 inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-white/90 hover:text-[#00FF85]">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00FF85] text-sm font-black text-[#11121b]">e</span>
          evenxo
        </Link>

        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#00FF85]">Page not found</p>
        <h1 className="mt-4 text-6xl font-semibold tracking-tight sm:text-8xl">Lost your way?</h1>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#00FF85] px-6 font-semibold text-[#11121b] transition hover:bg-[#6dffb8]">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <Link to="/explore" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 px-6 font-medium text-white/85 transition hover:border-white/30 hover:bg-white/5">
            Explore events
          </Link>
        </div>

        <div className="mx-auto mt-16 h-px w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <p className="mt-5 text-xs text-white/35">EVENXO <span className="mx-2">·</span> FIND YOUR NEXT MOMENT</p>
      </section>
    </main>
  );
}
