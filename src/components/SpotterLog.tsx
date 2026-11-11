import { Notebook, Plus, Trash2, X, Plane } from "lucide-react";
import { useState } from "react";
import { supabase, type SpotterLogEntry } from "@/lib/supabase";

export function SpotterLog({ entries, onChange }: { entries: SpotterLogEntry[]; onChange: () => void }) {
  const [adding, setAdding] = useState(false);

  async function remove(id: string) {
    await supabase.from("spotter_log").delete().eq("id", id);
    onChange();
  }

  const sorted = [...entries].sort((a, b) => b.spotted_at.localeCompare(a.spotted_at));

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Notebook className="h-5 w-5 text-sky-300" /> Spotter&rsquo;s log
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">Log what you see. {entries.length} {entries.length === 1 ? "entry" : "entries"}.</p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-400"
        >
          <Plus className="h-3.5 w-3.5" /> Log sighting
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {sorted.length === 0 && (
          <li className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">
            Nothing logged yet. Add your first sighting.
          </li>
        )}
        {sorted.map((e) => (
          <li key={e.id} className="group flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3">
            <div className="mt-0.5 shrink-0 rounded-lg bg-sky-500/10 p-2 text-sky-300 ring-1 ring-sky-500/20">
              <Plane className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-mono text-sm font-semibold text-white">{e.callsign}</span>
                <span className="text-xs text-slate-400">{e.aircraft_type}</span>
                {e.airline && <span className="text-xs text-slate-500">· {e.airline}</span>}
                {e.runway && <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">{e.runway}</span>}
              </div>
              {e.note && <p className="mt-1 text-xs text-slate-400">{e.note}</p>}
              <div className="mt-1 text-[11px] text-slate-500">
                {new Date(e.spotted_at).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </div>
            </div>
            <button
              onClick={() => remove(e.id)}
              aria-label="Delete"
              className="shrink-0 rounded-lg p-1.5 text-slate-600 opacity-0 transition hover:text-rose-300 group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      {adding && <AddSightingModal onClose={() => setAdding(false)} onSaved={() => { setAdding(false); onChange(); }} />}
    </section>
  );
}

function AddSightingModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ callsign: "", aircraft_type: "", airline: "", runway: "27L", note: "" });
  const [when, setWhen] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setErr(null);
    if (!form.callsign || !form.aircraft_type) {
      setErr("Callsign and aircraft type are required.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("spotter_log").insert({
      spotted_at: new Date(when).toISOString(),
      callsign: form.callsign.toUpperCase(),
      aircraft_type: form.aircraft_type,
      airline: form.airline || null,
      runway: form.runway || null,
      note: form.note || null,
    });
    setSaving(false);
    if (error) setErr(error.message);
    else onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Log a sighting</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">When</span>
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/60"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Callsign" placeholder="BAW117" value={form.callsign} onChange={(v) => setForm({ ...form, callsign: v })} />
            <Field label="Aircraft" placeholder="B777-300ER" value={form.aircraft_type} onChange={(v) => setForm({ ...form, aircraft_type: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Airline (optional)" placeholder="British Airways" value={form.airline} onChange={(v) => setForm({ ...form, airline: v })} />
            <label className="block">
              <span className="mb-1 block text-xs text-slate-400">Runway</span>
              <select
                value={form.runway}
                onChange={(e) => setForm({ ...form, runway: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/60"
              >
                {["27L","27R","09L","09R"].map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
          </div>
          <Field label="Note" placeholder="Perfect light, gear down short final" value={form.note} onChange={(v) => setForm({ ...form, note: v })} />
          {err && <p className="rounded-lg bg-rose-500/10 p-2 text-xs text-rose-300">{err}</p>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:text-white">Cancel</button>
          <button onClick={save} disabled={saving} className="rounded-lg bg-sky-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-50">
            {saving ? "Saving…" : "Save sighting"}
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
