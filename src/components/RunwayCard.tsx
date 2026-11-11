import { Plane, RefreshCw, Check, X, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase, type RunwayConfig } from "@/lib/supabase";
import { currentRunwayConfig, isGoodForMyrtle, programmeStatus, runwayLabel, startOfWeek, isoDate } from "@/lib/runway";

function StatusPill({ good }: { good: boolean }) {
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide " +
        (good ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30" : "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30")
      }
    >
      {good ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      {good ? "Great for Myrtle" : "Other side today"}
    </span>
  );
}

export function RunwayCard({ configs, onChange }: { configs: RunwayConfig[]; onChange: () => void }) {
  const current = currentRunwayConfig(configs);
  const manual = current && !current.note?.startsWith("Auto-seeded") ? current : null;
  const status = programmeStatus(new Date(), manual);
  const landing = status.runway;
  const goodForMyrtle = isGoodForMyrtle(landing);
  const [editing, setEditing] = useState(false);
  const [pick, setPick] = useState<string>(landing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPick(landing);
  }, [landing]);

  async function save() {
    setSaving(true);
    const weekStart = isoDate(startOfWeek());
    const row = {
      week_start: weekStart,
      landing_runway: pick as RunwayConfig["landing_runway"],
      note: current?.note ?? "Set by spotter from the app.",
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from("runway_config")
      .upsert(row, { onConflict: "week_start" });
    setSaving(false);
    if (!error) {
      setEditing(false);
      onChange();
    }
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/60 p-6 shadow-2xl backdrop-blur">
      <div className="absolute -right-10 -top-10 opacity-10">
        <Plane className="h-40 w-40 -rotate-12" />
      </div>
      <div className="relative">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-sky-300/80">
          <MapPin className="h-3.5 w-3.5" /> Myrtle Avenue · LHR
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <h2 className="text-sm text-slate-300">Current landing runway</h2>
          <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-slate-400 ring-1 ring-white/10">
            {status.period === "night" ? "Overnight · until 06:00" : status.period === "day" ? "06:00–15:00" : "15:00–last departure"}
          </span>
        </div>
        <div className="mt-1 flex items-end gap-3">
          <span className="font-mono text-6xl font-bold tracking-tight text-white tabular-nums">
            {landing}
          </span>
          <span className="mb-2 text-sm text-slate-400">{runwayLabel(landing)}</span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <StatusPill good={goodForMyrtle} />
          <span className="text-xs text-slate-500">
            Week of {startOfWeek().toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {status.source}
          </span>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-sky-400/40 hover:text-sky-300"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Update
            </button>
          ) : (
            <div className="ml-auto flex items-center gap-2">
              <select
                value={pick}
                onChange={(e) => setPick(e.target.value)}
                className="rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1.5 text-sm text-white outline-none focus:border-sky-400/60"
              >
                {(["27L", "27R", "09L", "09R"] as const).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <button
                onClick={save}
                disabled={saving}
                className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-400 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => { setEditing(false); setPick(landing); }}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <p className="mt-4 rounded-xl border border-white/5 bg-white/5 p-3 text-xs leading-relaxed text-slate-400">
          {status.note} Actual runway use can change with air traffic control, weather, or airport operations.
        </p>
        <a
          href="https://www.runwaydirectionforecast.com/en/united-kingdom/london-egll/"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex text-xs font-medium text-sky-300 transition hover:text-sky-200"
        >
          View wind-based runway forecast ↗
        </a>
      </div>
    </section>
  );
}
