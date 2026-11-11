import { MapPin, Compass, Camera, Clock, Navigation, Info } from "lucide-react";

export function LocationInfo() {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
        <MapPin className="h-5 w-5 text-sky-300" /> The spot
      </h2>
      <p className="mt-1 text-sm text-slate-400">
        Myrtle Avenue runs along the southern perimeter of Heathrow. It&rsquo;s one of the
        best public places in the world to watch heavy aircraft on short final.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <InfoTile icon={<Compass className="h-4 w-4" />} title="Best runway" body="27L landings pass directly overhead — often below 200ft." />
        <InfoTile icon={<Clock className="h-4 w-4" />} title="Best time" body="Morning to early afternoon for the heaviest long-haul arrivals." />
        <InfoTile icon={<Navigation className="h-4 w-4" />} title="Wind matters" body="Westerly winds mean 27s in use. Easterly flips to 09s." />
        <InfoTile icon={<Camera className="h-4 w-4" />} title="Light" body="Mornings give clean front-lit shots from the south side." />
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-sky-500/15 bg-sky-500/5 p-3 text-xs text-slate-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
        <span>
          Runway alternation is weekly and weather-dependent. Confirm the official
          landing runway with the update control above before you travel.
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
        <iframe
          title="Myrtle Avenue spotting location"
          className="h-48 w-full grayscale-[0.2]"
          src="https://www.openstreetmap.org/export/embed.html?bbox=-0.453%2C51.461%2C-0.439%2C51.467&amp;layer=mapnik&amp;marker=51.464%2C-0.446"
          loading="lazy"
        />
      </div>
    </section>
  );
}

function InfoTile({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-sky-200">
        {icon}{title}
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{body}</p>
    </div>
  );
}
