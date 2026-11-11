// Maps WMO weather codes (open-meteo) to short human descriptions + an icon key.
// https://open-meteo.com/en/docs (weather_code values)

export type WeatherInfo = {
  label: string;
  icon: "clear" | "partly" | "cloudy" | "fog" | "drizzle" | "rain" | "snow" | "thunder";
};

export function describeWeatherCode(code: number): WeatherInfo {
  if (code === 0) return { label: "Clear sky", icon: "clear" };
  if (code === 1) return { label: "Mainly clear", icon: "partly" };
  if (code === 2) return { label: "Partly cloudy", icon: "partly" };
  if (code === 3) return { label: "Overcast", icon: "cloudy" };
  if (code === 45 || code === 48) return { label: "Fog", icon: "fog" };
  if (code >= 51 && code <= 57) return { label: "Drizzle", icon: "drizzle" };
  if (code >= 61 && code <= 67) return { label: "Rain", icon: "rain" };
  if (code >= 71 && code <= 77) return { label: "Snow", icon: "snow" };
  if (code >= 80 && code <= 82) return { label: "Rain showers", icon: "rain" };
  if (code >= 85 && code <= 86) return { label: "Snow showers", icon: "snow" };
  if (code >= 95 && code <= 99) return { label: "Thunderstorm", icon: "thunder" };
  return { label: "Unknown", icon: "cloudy" };
}

export function windDirLabel(deg: number): string {
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  const idx = Math.round(deg / 22.5) % 16;
  return dirs[idx];
}

// Visibility in metres -> short description (open-meteo gives metres).
export function visibilityLabel(m: number): string {
  if (m >= 10000) return "Excellent (10km+)";
  if (m >= 5000) return "Good";
  if (m >= 2000) return "Moderate";
  return "Poor";
}

// Spotting conditions heuristic: good light needs low cloud and no heavy precip;
// wind direction affects which runway is in use (westerly => 27s).
export function spottingConditions(args: {
  cloudCover: number;
  weatherCode: number;
  windDirDeg: number;
  windSpeed: number;
}): { score: "great" | "good" | "fair" | "poor"; reason: string } {
  const { cloudCover, weatherCode, windDirDeg, windSpeed } = args;
  const westerly = windDirDeg >= 225 && windDirDeg <= 315;
  const precip = weatherCode >= 51 && weatherCode !== 45 && weatherCode !== 48;

  if (precip) return { score: "poor", reason: "Rain or precipitation reduces spotting quality." };
  if (cloudCover <= 40 && westerly) return { score: "great", reason: "Bright skies and westerly wind — 27s likely in use." };
  if (cloudCover <= 70 && westerly) return { score: "good", reason: "Decent light, westerly wind favours 27s." };
  if (westerly && cloudCover > 70) return { score: "fair", reason: "Westerly wind (27s likely) but cloudy — flat light." };
  if (!westerly) return { score: "fair", reason: windDirLabel(windDirDeg) + " wind — easterly (09s) may be in use." };
  if (windSpeed > 35) return { score: "fair", reason: "Strong wind — keep an eye on conditions." };
  return { score: "good", reason: "Reasonable spotting conditions." };
}
