
import { toast } from "sonner";

export interface WeatherData {
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  windDirection?: number;
  cloudCover?: number;
  precipitation?: number;
  pressure?: number;
  weatherCode?: number;
  isDay?: number;  // Changed from boolean to number to match API response
}

export interface WeatherResponse {
  latitude: number;
  longitude: number;
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;  // API returns 0 or 1, not boolean
    precipitation: number;
    rain: number;
    weather_code: number;
    cloud_cover: number;
    pressure_msl: number;
    surface_pressure: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
  };
}

// Future weather forecast interface
export interface ForecastData extends WeatherData {
  time: string;
  precipitation_probability?: number;
}

export interface ForecastResponse extends WeatherResponse {
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    precipitation_probability: number[];
    precipitation: number[];
    weather_code: number[];
    cloud_cover: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    is_day: number[];
  };
  hourly_units: {
    time: string;
    temperature_2m: string;
    relative_humidity_2m: string;
    precipitation_probability: string;
    precipitation: string;
    weather_code: string;
    cloud_cover: string;
    wind_speed_10m: string;
    wind_direction_10m: string;
    is_day: string;
  };
}

/**
 * Converts weather code to a user-friendly description
 */
export function getWeatherDescription(code: number): string {
  // WMO Weather interpretation codes (WW)
  // https://open-meteo.com/en/docs
  const weatherCodes: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
  };
  
  return weatherCodes[code] || "Unknown";
}

/**
 * Calculate atmospheric stability class (Pasquill-Gifford) based on weather conditions
 * A - Very unstable
 * B - Unstable
 * C - Slightly unstable
 * D - Neutral
 * E - Stable
 * F - Very stable
 */
export function calculateStabilityClass(
  windSpeed: number, 
  cloudCover: number, 
  isDay: number  // Changed from boolean to number
): string {
  // Convert wind speed from km/h to m/s if necessary
  const windSpeedMS = windSpeed > 20 ? windSpeed / 3.6 : windSpeed;
  
  // Day conditions
  if (isDay === 1) {  // Changed condition from boolean to number comparison
    // Strong solar radiation (clear sky)
    if (cloudCover < 40) {
      if (windSpeedMS < 2) return "A"; // Very unstable
      if (windSpeedMS < 3) return "A-B"; // Very unstable to unstable
      if (windSpeedMS < 5) return "B"; // Unstable
      if (windSpeedMS < 6) return "C"; // Slightly unstable
      return "D"; // Neutral
    }
    // Moderate solar radiation (partly cloudy)
    else if (cloudCover < 70) {
      if (windSpeedMS < 2) return "B"; // Unstable
      if (windSpeedMS < 3) return "B-C"; // Unstable to slightly unstable
      if (windSpeedMS < 5) return "C"; // Slightly unstable
      if (windSpeedMS < 6) return "C-D"; // Slightly unstable to neutral
      return "D"; // Neutral
    }
    // Slight solar radiation (overcast)
    else {
      if (windSpeedMS < 2) return "C"; // Slightly unstable
      if (windSpeedMS < 5) return "D"; // Neutral
      return "D"; // Neutral
    }
  } 
  // Night conditions
  else {
    // Cloudy
    if (cloudCover >= 50) {
      if (windSpeedMS < 2.5) return "E"; // Stable
      return "D"; // Neutral
    }
    // Clear
    else {
      if (windSpeedMS < 2.5) return "F"; // Very stable
      if (windSpeedMS < 4) return "E"; // Stable
      return "D"; // Neutral
    }
  }
}

/**
 * Calculate weather impact on dispersion
 */
export function calculateWeatherImpact(weatherData: WeatherData): {
  windFactor: number;
  stabilityClass: string;
  dispersionMultiplier: number;
} {
  if (!weatherData.windSpeed || weatherData.cloudCover === undefined || weatherData.isDay === undefined) {
    return {
      windFactor: 1.0,
      stabilityClass: 'D',
      dispersionMultiplier: 1.0
    };
  }

  const stabilityClass = calculateStabilityClass(
    weatherData.windSpeed,
    weatherData.cloudCover,
    weatherData.isDay
  );
  
  // Wind impact (stronger winds generally increase dispersion)
  let windFactor = 1.0;
  if (weatherData.windSpeed < 5) windFactor = 0.8;
  else if (weatherData.windSpeed > 15) windFactor = 1.3;
  else windFactor = 1.0 + (weatherData.windSpeed - 5) * 0.03;
  
  // Stability impact
  let stabilityFactor = 1.0;
  switch(stabilityClass.charAt(0)) {
    case 'A': stabilityFactor = 1.3; break; // Very unstable - wider plume
    case 'B': stabilityFactor = 1.2; break; // Unstable
    case 'C': stabilityFactor = 1.1; break; // Slightly unstable
    case 'D': stabilityFactor = 1.0; break; // Neutral conditions
    case 'E': stabilityFactor = 0.8; break; // Stable
    case 'F': stabilityFactor = 0.6; break; // Very stable - narrower plume
  }
  
  // Precipitation impact (rain can reduce dispersion through wet deposition)
  let precipFactor = 1.0;
  if (weatherData.precipitation && weatherData.precipitation > 0) {
    precipFactor = Math.max(0.7, 1.0 - weatherData.precipitation * 0.1);
  }
  
  // Calculate overall dispersion multiplier
  const dispersionMultiplier = windFactor * stabilityFactor * precipFactor;
  
  return {
    windFactor,
    stabilityClass,
    dispersionMultiplier
  };
}

/**
 * Fetches current weather data from Open-Meteo API for a given location
 */
export async function fetchWeatherData(lat: number, lng: number): Promise<WeatherData | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m&timezone=auto`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json() as WeatherResponse;
    
    return {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      windDirection: data.current.wind_direction_10m,
      cloudCover: data.current.cloud_cover,
      precipitation: data.current.precipitation,
      pressure: data.current.pressure_msl,
      weatherCode: data.current.weather_code,
      isDay: data.current.is_day
    };
  } catch (error) {
    console.error("Failed to fetch weather data:", error);
    toast.error("Failed to fetch weather data. Using default values.");
    return null;
  }
}

/**
 * Fetches weather forecast for the next 24 hours
 */
export async function fetchWeatherForecast(lat: number, lng: number, hours: number = 24): Promise<ForecastData[] | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,is_day&forecast_hours=${hours}&timezone=auto`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json() as ForecastResponse;
    const forecast: ForecastData[] = [];
    
    // Process hourly data into a more convenient format
    for (let i = 0; i < data.hourly.time.length; i++) {
      forecast.push({
        time: data.hourly.time[i],
        temperature: data.hourly.temperature_2m[i],
        humidity: data.hourly.relative_humidity_2m[i],
        windSpeed: data.hourly.wind_speed_10m[i],
        windDirection: data.hourly.wind_direction_10m[i],
        cloudCover: data.hourly.cloud_cover[i],
        precipitation: data.hourly.precipitation[i],
        precipitation_probability: data.hourly.precipitation_probability[i],
        weatherCode: data.hourly.weather_code[i],
        isDay: data.hourly.is_day[i]
      });
    }
    
    return forecast;
  } catch (error) {
    console.error("Failed to fetch weather forecast:", error);
    toast.error("Failed to fetch weather forecast.");
    return null;
  }
}

/**
 * Gets a weather forecast summary for a specific timeframe
 */
export function getWeatherSummary(forecast: ForecastData[]): string {
  if (!forecast || forecast.length === 0) {
    return "No forecast data available";
  }

  // Analyze the forecast data
  const avgTemp = forecast.reduce((sum, item) => sum + (item.temperature || 0), 0) / forecast.length;
  const maxTemp = Math.max(...forecast.map(item => item.temperature || 0));
  const minTemp = Math.min(...forecast.map(item => item.temperature || 0));
  
  // Check for precipitation
  const precipHours = forecast.filter(item => (item.precipitation || 0) > 0.1).length;
  const highPrecipHours = forecast.filter(item => (item.precipitation || 0) > 1.0).length;
  
  // Wind conditions
  const maxWind = Math.max(...forecast.map(item => item.windSpeed || 0));
  const avgWind = forecast.reduce((sum, item) => sum + (item.windSpeed || 0), 0) / forecast.length;
  
  // Generate a human-readable summary
  let summary = `Temperature range: ${minTemp.toFixed(1)}°C to ${maxTemp.toFixed(1)}°C, average ${avgTemp.toFixed(1)}°C. `;
  
  if (precipHours > 0) {
    summary += `Precipitation expected for ${precipHours} hours`;
    if (highPrecipHours > 0) {
      summary += ` (heavy precipitation for ${highPrecipHours} hours). `;
    } else {
      summary += `. `;
    }
  } else {
    summary += `No significant precipitation expected. `;
  }
  
  summary += `Wind speeds up to ${maxWind.toFixed(1)} m/s, average ${avgWind.toFixed(1)} m/s.`;
  
  return summary;
}

/**
 * Gets the dominant weather condition from a forecast array
 */
export function getDominantWeatherCondition(forecast: ForecastData[]): string {
  if (!forecast || forecast.length === 0) {
    return "Unknown";
  }
  
  // Count occurrences of each weather code
  const weatherCounts: Record<number, number> = {};
  forecast.forEach(item => {
    if (item.weatherCode !== undefined) {
      weatherCounts[item.weatherCode] = (weatherCounts[item.weatherCode] || 0) + 1;
    }
  });
  
  // Find the most common weather code
  let maxCount = 0;
  let dominantCode = 0;
  
  Object.entries(weatherCounts).forEach(([code, count]) => {
    if (count > maxCount) {
      maxCount = count;
      dominantCode = parseInt(code);
    }
  });
  
  return getWeatherDescription(dominantCode);
}
