export function Stat({ label, value, tone = "ink" }: { label: string; value: string | number; tone?: string }) {
  const toneClass = tone === "red" || tone === "cinnabar" ? "text-[#e60012]" : tone === "blue" ? "text-[#0a83ff]" : "text-[#111827]";

  return (
    <div className="border-l border-[#d9e7ff] pl-4">
      <div className="label">{label}</div>
      <div className={`mt-1 font-display text-3xl font-black ${toneClass}`}>{value}</div>
    </div>
  );
}
