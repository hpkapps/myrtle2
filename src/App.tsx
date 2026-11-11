import { useCallback, useEffect, useState } from "react";
import { Plane, Sparkles } from "lucide-react";
import { supabase, type RunwayConfig, type HeavyArrival, type SpotterLogEntry } from "@/lib/supabase";
import { currentRunwayConfig, isGoodForMyrtle, programmeStatus } from "@/lib/runway";
import { RunwayCard } from "@/components/RunwayCard";
import { WeatherCard } from "@/components/WeatherCard";
import { HeavyArrivals } from "@/components/HeavyArrivals";
import { SpotterLog } from "@/components/SpotterLog";
import { LocationInfo } from "@/components/LocationInfo";

type Tab = "home" | "watchlist" | "log" | "spot";

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [configs, setConfigs] = useState<RunwayConfig[]>([]);
  const [arrivals, setArrivals] = useState<HeavyArrival[]>([]);
  const [log, setLog] = useState<SpotterLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [c, a, l] = await Promise.all([
      supabase.from("runway_config").select("*").order("week_start", { ascending: false }).limit(8),
      supabase.from("heavy_arrivals").select("*").order("scheduled_time", { ascending: true }),
      supabase.from("spotter_log").select("*").order("spotted_at", { ascending: false }),
    ]);
    if (c.data) setConfigs(c.data as RunwayConfig[]);
    if (a.data) setArrivals(a.data as HeavyArrival[]);
    if (l.data) setLog(l.data as SpotterLogEntry[]);
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const current = currentRunwayConfig(configs);
  const manual = current && !current.note?.startsWith("Auto-seeded") ? current : null;
  const landing = programmeStatus(new Date(), manual).runway;
  const goodForMyrtle = isGoodForMyrtle(landing);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Ambient gradient backdrop */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-sky-600/10 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(56,189,248,0.08),transparent_60%)]" />
      </div>

      <Header tab={tab} setTab={setTab} goodForMyrtle={goodForMyrtle} />

      <main className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:px-6">
        {tab === "home" && (
          loading ? (
            <Skeleton />
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              <RunwayCard configs={configs} onChange={reload} />
              <WeatherCard />
              <div className="lg:col-span-2">
                <LocationInfo />
              </div>
              <div className="lg:col-span-2">
                <HeavyArrivals arrivals={arrivals} onChange={reload} />
              </div>
            </div>
          )
        )}

        {tab === "watchlist" && (
          <HeavyArrivals arrivals={arrivals} onChange={reload} />
        )}

        {tab === "log" && (
          <SpotterLog entries={log} onChange={reload} />
        )}

        {tab === "spot" && <LocationInfo />}
      </main>

      <footer className="border-t border-white/5 px-6 py-8 text-center text-xs text-slate-600">
        <div className="flex items-center justify-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> Made for spotters at the Myrtle Avenue perimeter.
        </div>
        <p className="mt-1">Runway programme based on Heathrow&rsquo;s supplied 2026 schedule. Actual use can vary.</p>
      </footer>
    </div>
  );
}

function Header({ tab, setTab, goodForMyrtle }: { tab: Tab; setTab: (t: Tab) => void; goodForMyrtle: boolean }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "home", label: "Home" },
    { id: "watchlist", label: "Watchlist" },
    { id: "log", label: "My log" },
    { id: "spot", label: "The spot" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 ring-1 ring-sky-500/30">
            <Plane className="h-5 w-5 -rotate-45 text-sky-300" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight text-white">Myrtle Spotters</div>
            <div className="text-[11px] text-slate-500">LHR · southern perimeter</div>
          </div>
        </div>

        <nav className="ml-auto hidden items-center gap-1 rounded-full border border-white/5 bg-white/5 p-1 sm:flex">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                "rounded-full px-3.5 py-1.5 text-xs font-medium transition " +
                (tab === t.id ? "bg-sky-500 text-white shadow" : "text-slate-400 hover:text-white")
              }
            >
              {t.label}
            </button>
          ))}
        </nav>

        <span
          className={
            "ml-2 hidden rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 sm:inline " +
            (goodForMyrtle ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30" : "bg-amber-500/15 text-amber-300 ring-amber-500/30")
          }
        >
          {goodForMyrtle ? "27L live" : "27R today"}
        </span>
      </div>

      {/* Mobile tab bar */}
      <nav className="flex items-center gap-1 overflow-x-auto px-4 pb-2 sm:hidden">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition " +
              (tab === t.id ? "bg-sky-500 text-white" : "bg-white/5 text-slate-400")
            }
          >
            {t.label}
          </button>
        ))}
      </nav>
    </header>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="h-56 animate-pulse rounded-3xl border border-white/5 bg-white/5" />
      <div className="h-72 animate-pulse rounded-3xl border border-white/5 bg-white/5" />
      <div className="h-64 animate-pulse rounded-3xl border border-white/5 bg-white/5 lg:col-span-2" />
    </div>
  );
}
