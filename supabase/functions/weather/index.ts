// Edge function: weather proxy for the Myrtle Avenue spotting location.
// Fetches current conditions + hourly forecast from open-meteo (no API key).
// open-meteo is free and keyless; we proxy it to avoid CORS and keep a clean
// server-side contract for the frontend.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Myrtle Avenue spotting location (LHR southern perimeter), approx coordinates.
const LAT = 51.4639;
const LON = -0.4463;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
        `&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code,cloud_cover,visibility` +
        `&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code,cloud_cover` +
        `&forecast_days=1&timezone=Europe%2FLondon`
    );

    const upstream = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ error: `Upstream weather service returned ${upstream.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await upstream.json();

    const payload = {
      location: "Myrtle Avenue (LHR)",
      current: data.current ?? null,
      hourly: data.hourly ?? null,
      timezone: data.timezone ?? "Europe/London",
      utc_offset_seconds: data.utc_offset_seconds ?? 0,
    };

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
