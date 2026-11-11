import { Star, Plane, Plus, Trash2, X, Clock } from "lucide-react";
import { useState } from "react";
import { supabase, type HeavyArrival } from "@/lib/supabase";
import { operatesToday, todayDayCode } from "@/lib/runway";

const DAYS_FULL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function aircraftBadge(type: string) {
  const t = type.toUpperCase();
  if (t.includes("A380")) return { label: "A380", cls: "bg-violet-500/15 text-violet-200 ring-violet-500/30" };
  if (t.includes("A350")) return { label: "A350", cls: "bg-sky-500/15 text-sky-200 ring-sky-500/30" };
  if (t.includes("B747") || t.includes("747")) return { label: "B747", cls: "bg-amber-500/15 text-amber-200 ring-amber-500/30" };
  if (t.includes("B777") || t.includes("777")) return { label: "B777", cls: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30" };
  if (t.includes("B787") || t.includes("787")) return { label: "B787", cls: "bg-cyan-500/15 text-cyan-200 ring-cyan-500/30" };
  return { label: type.slice(0, 6), cls: "bg-slate-500/15 text-slate-200 ring-slate-500/30" };
}

export function HeavyArrivals({ arrivals, onChange }: { arrivals: HeavyArrival[]; onChange: () => void }) {
  const [adding, setAdding] = useState(false);
  const [filterToday, setFilterToday] = useState(true);

  const today = todayDayCode();
  const visible = filterToday ? arrivals.filter((a) => operatesToday(a.days) || a.is_watched) : arrivals;
  const sorted = [...visible].sort((a, b) => {
    if (a.is_watched !== b.is_watched) return a.is_watched ? -1 : 1;
    return (a.scheduled_time ?? "99:99").localeCompare(b.scheduled_time ?? "99:99");
  });

  async function toggleWatch(a: HeavyArrival) {
    await supabase.from("heavy_arrivals").update({ is_watched: !a.is_watched }).eq("id", a.id);
    onChange();
  }
  async function remove(id: string) {
    await supabase.from("heavy_arrivals").delete().eq("id", id);
    onChange();
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Plane className="h-5 w-5 text-sky-300" /> Big flights to watch
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">Heavy &amp; interesting arrivals worth the wait.</p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-400"
        >
          <Plus className="h-3.5 w-3.5" /> Add flight
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs">
        <button
          onClick={() => setFilterToday((v) => !v)}
          className={"rounded-full px-3 py-1 ring-1 transition " + (filterToday ? "bg-sky-500/20 text-sky-200 ring-sky-500/40" : "bg-white/5 text-slate-400 ring-white/10")}
        >
          {filterToday ? `Today (${today}) + watched` : "All flights"}
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {sorted.length === 0 && (
          <li className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">
            No flights match this filter. Add one to start your watchlist.
          </li>
        )}
        {sorted.map((a) => {
          const badge = aircraftBadge(a.aircraft_type);
          const todayOp = operatesToday(a.days);
          return (
            <li
              key={a.id}
              className="group flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3 transition hover:border-sky-400/20 hover:bg-white/[0.06]"
            >
              <button
                onClick={() => toggleWatch(a)}
                aria-label={a.is_watched ? "Unstar" : "Star"}
                className={
                  "shrink-0 rounded-lg p-1.5 transition " +
                  (a.is_watched ? "text-amber-300" : "text-slate-500 hover:text-amber-300")
                }
              >
                <Star className={"h-5 w-5 " + (a.is_watched ? "fill-amber-300" : "")} />
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold tracking-wide text-white">{a.callsign}</span>
                  <span className={"rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 " + badge.cls}>
                    {badge.label}
                  </span>
                  {!todayOp && (
                    <span className="rounded bg-slate-500/15 px-1.5 py-0.5 text-[10px] text-slate-400">not today</span>
                  )}
                </div>
                <div className="mt-0.5 truncate text-xs text-slate-400">
                  {a.airline} · from {a.origin ?? "—"} · {a.aircraft_type}
                </div>
                {a.notes && <div className="mt-0.5 truncate text-[11px] text-slate-500">{a.notes}</div>}
              </div>

              <div className="hidden shrink-0 text-right sm:block">
                {a.scheduled_time && (
                  <div className="flex items-center justify-end gap-1 text-xs text-slate-300">
                    <Clock className="h-3 w-3" /> {a.scheduled_time}
                  </div>
                )}
                <div className="mt-0.5 text-[10px] text-slate-500">{a.days.join(" · ")}</div>
              </div>

              <button
                onClick={() => remove(a.id)}
                aria-label="Delete"
                className="shrink-0 rounded-lg p-1.5 text-slate-600 opacity-0 transition hover:text-rose-300 group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>

      {adding && <AddFlightModal onClose={() => setAdding(false)} onSaved={() => { setAdding(false); onChange(); }} />}
    </section>
  );
}

function AddFlightModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    callsign: "",
    airline: "",
    aircraft_type: "",
    origin: "",
    scheduled_time: "",
    notes: "",
  });
  const [days, setDays] = useState<string[]>(["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function toggleDay(d: string) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  async function save() {
    setErr(null);
    if (!form.callsign || !form.airline || !form.aircraft_type) {
      setErr("Callsign, airline and aircraft type are required.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("heavy_arrivals").insert({
      callsign: form.callsign.toUpperCase(),
      airline: form.airline,
      aircraft_type: form.aircraft_type,
      origin: form.origin.toUpperCase() || null,
      scheduled_time: form.scheduled_time || null,
      days,
      notes: form.notes || null,
      is_watched: true,
    });
    setSaving(false);
    if (error) setErr(error.message);
    else onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Add a flight</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-4 space-y-3">
          <Field label="Callsign" placeholder="BAW117" value={form.callsign} onChange={(v) => setForm({ ...form, callsign: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Airline" placeholder="British Airways" value={form.airline} onChange={(v) => setForm({ ...form, airline: v })} />
            <Field label="Aircraft" placeholder="A380-800" value={form.aircraft_type} onChange={(v) => setForm({ ...form, aircraft_type: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Origin" placeholder="JFK" value={form.origin} onChange={(v) => setForm({ ...form, origin: v })} />
            <Field label="Arrival (local)" placeholder="11:55" value={form.scheduled_time} onChange={(v) => setForm({ ...form, scheduled_time: v })} />
          </div>
          <Field label="Notes" placeholder="Morning heavy from New York" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
          <div>
            <div className="mb-1.5 text-xs text-slate-400">Operates on</div>
            <div className="flex flex-wrap gap-1.5">
              {DAYS_FULL.map((d) => (
                <button
                  key={d}
                  onClick={() => toggleDay(d)}
                  className={"rounded-md px-2 py-1 text-xs ring-1 transition " + (days.includes(d) ? "bg-sky-500/20 text-sky-200 ring-sky-500/40" : "bg-white/5 text-slate-500 ring-white/10")}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          {err && <p className="rounded-lg bg-rose-500/10 p-2 text-xs text-rose-300">{err}</p>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:text-white">Cancel</button>
          <button onClick={save} disabled={saving} className="rounded-lg bg-sky-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-50">
            {saving ? "Saving…" : "Add to watchlist"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-slate-400">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-sky-400/60"
      />
    </label>
  );
}
