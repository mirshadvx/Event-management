import React from "react";

const StatPill = ({ label, value, tone = "neutral" }) => {
  const toneClasses = {
    emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    red: "text-red-400 bg-red-400/10 border-red-400/20",
    neutral: "text-gray-300 bg-white/5 border-white/10",
  }[tone];

  return (
    <div className={`flex-1 rounded-xl border px-4 py-3 ${toneClasses}`}>
      <p className="text-2xl font-semibold leading-none">{value}</p>
      <p className="text-xs mt-1 opacity-80">{label}</p>
    </div>
  );
};

export default StatPill;