// Lightweight inline SVG icons for weather so we don't depend on lucide for
// animated weather glyphs. lucide-react is still used elsewhere in the app.
import type { CSSProperties } from "react";

type Props = { className?: string; style?: CSSProperties };

export function WeatherIcon({ kind, className, style }: { kind: string } & Props) {
  const common = { className, style, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (kind) {
    case "clear":
      return (
        <svg {...common}><circle cx="12" cy="12" r="4.2" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      );
    case "partly":
      return (
        <svg {...common}><circle cx="8.5" cy="8.5" r="3.2" /><path d="M8.5 2v1.6M8.5 13.4V15M2 8.5h1.6M13.4 8.5H15M4 4l1.1 1.1M11.9 11.9 13 13" /><path d="M10 16a4 4 0 0 1 4-4 4 4 0 0 1 4 4 3 3 0 0 1-3 3h-7a3 3 0 0 1 0-6" /></svg>
      );
    case "cloudy":
      return (
        <svg {...common}><path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.4A4 4 0 0 1 17 18H7z" /></svg>
      );
    case "fog":
      return (
        <svg {...common}><path d="M6 14h12M6 17h12M6 11h12M8 8h8" /></svg>
      );
    case "drizzle":
    case "rain":
      return (
        <svg {...common}><path d="M7 15a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.4A4 4 0 0 1 17 15H7z" /><path d="M9 18l-1 3M13 18l-1 3M17 18l-1 3" /></svg>
      );
    case "snow":
      return (
        <svg {...common}><path d="M7 15a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.4A4 4 0 0 1 17 15H7z" /><path d="M9 19l.01 0M13 19l.01 0M17 19l.01 0" /></svg>
      );
    case "thunder":
      return (
        <svg {...common}><path d="M7 15a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.4A4 4 0 0 1 17 15H7z" /><path d="M13 16l-3 4h3l-1 4" /></svg>
      );
    default:
      return (
        <svg {...common}><circle cx="12" cy="12" r="9" /></svg>
      );
  }
}
