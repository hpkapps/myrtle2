import { CloudSun, Droplets, Eye, Wind, Thermometer, Sunrise, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { WeatherPayload } from "@/lib/supabase";
import { describeWeatherCode, windDirLabel, visibilityLabel, spottingConditions } from "@/lib/weather";
import { WeatherIcon } from "./Icons";

const scoreStyles: Record<string, string> = {
  great: "from-emerald-500/20 to-emerald-500/5 ring-emerald-500/30 text-emerald-300",
  good: "from-sky-500/20 to-sky-500/5 ring-sky-500/30 text-sky-300",
  fair: "from-amber-500/20 to-amber-500/5 ring-amber-500/30 text-amber-300",
  poor: "from-rose-500/20 to-rose-500/5 ring-rose-500/30 text-rose-300",
};

export function WeatherCard() {
  const [data, setData] = useState<WeatherPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/weather`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error(`Weather service ${res.status}`);
        const json = (await res.json()) as WeatherPayload;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load weather");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-400">
        Loading weather at the perimeter…
      </section>
    );
  }

  if (error || !data || !data.current) {
    return (
      <section className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6 text-sm text-amber-200">
        <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Weather unavailable</div>
        <p className="mt-1 text-xs text-amber-200/70">{error ?? "No current conditions returned."}</p>
      </section>
    );
  }

  const c = data.current;
  const w = describeWeatherCode(c.weather_code);
  const cond = spottingConditions({
    cloudCover: c.cloud_cover,
    weatherCode: c.weather_code,
    windDirDeg: c.wind_direction_10m,
    windSpeed: c.wind_speed_10m,
  });

  // Next 6 hours from the hourly array.
  const nowIdx = data.hourly ? data.hourly.time.findIndex((t) => new Date(t) >= new Date(c.time)) : -1;
  const nextHours = nowIdx >= 0 && data.hourly ? data.hourly.time.slice(nowIdx, nowIdx + 6) : [];
  const nextTemps = nowIdx >= 0 && data.hourly ? data.hourly.temperature_2m.slice(nowIdx, nowIdx + 6) : [];
  const nextCodes = nowIdx >= 0 && data.hourly ? data.hourly.weather_code.slice(nowIdx, nowIdx + 6) : [];

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-sky-300/80">
          <CloudSun className="h-3.5 w-3.5" /> Conditions
        </div>
        <div className="text-xs text-slate-500">{data.timezone.replace("_", " ")}</div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <WeatherIcon kind={w.icon} className="h-14 w-14 text-sky-200" />
        <div>
          <div className="font-mono text-4xl font-semibold text-white tabular-nums">
            {Math.round(c.temperature_2m)}°<span className="text-lg text-slate-400">C</span>
          </div>
          <div className="text-sm text-slate-300">{w.label}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<Wind className="h-4 w-4" />} label="Wind" value={`${Math.round(c.wind_speed_10m)} km/h`} sub={windDirLabel(c.wind_direction_10m)} />
        <Stat icon={<Droplets className="h-4 w-4" />} label="Cloud" value={`${Math.round(c.cloud_cover)}%`} />
        <Stat icon={<Eye className="h-4 w-4" />} label="Visibility" value={visibilityLabel(c.visibility ?? 10000)} />
        <Stat icon={<Thermometer className="h-4 w-4" />} label="Feels" value={`${Math.round(c.temperature_2m - 1)}°C`} />
      </div>

      <div className={`mt-4 rounded-2xl bg-gradient-to-br p-4 ring-1 ${scoreStyles[cond.score]}`}>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sunrise className="h-4 w-4" /> Spotting outlook: <span className="capitalize">{cond.score}</span>
        </div>
        <p className="mt-1 text-xs opacity-90">{cond.reason}</p>
      </div>

      {nextHours.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-xs uppercase tracking-wider text-slate-500">Next 6 hours</div>
          <div className="grid grid-cols-6 gap-1.5">
            {nextHours.map((t, i) => {
              const hw = describeWeatherCode(nextCodes[i] ?? 0);
              const hr = new Date(t).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
              return (
                <div key={t} className="rounded-xl border border-white/5 bg-white/5 px-1.5 py-2 text-center">
                  <div className="text-[10px] text-slate-400">{hr}</div>
                  <WeatherIcon kind={hw.icon} className="mx-auto my-1 h-5 w-5 text-slate-200" />
                  <div className="text-xs font-semibold text-white tabular-nums">{Math.round(nextTemps[i] ?? 0)}°</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/5 p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400">
        {icon}{label}
      </div>
      <div className="mt-1 text-sm font-semibold text-white tabular-nums">{value}</div>
      {sub && <div className="text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
}
