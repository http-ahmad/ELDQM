
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CloudRain, Wind, Thermometer, RefreshCw, Droplets, Gauge, 
  CloudSun, MapPin, ThermometerSun, CloudFog, CloudSnow
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

interface WeatherDataProps {
  weatherData: {
    windSpeed: number;
    windDirection: number;
    temperature: number;
    conditions: string;
    humidity: number;
    pressure: number;
    timestamp: string;
    feelsLike?: number;
    precipitationRate?: number;
    visibility?: number;
    uvIndex?: number;
  } | null;
  isLoading: boolean;
  onRefresh: () => void;
  location: { lat: number; lng: number };
  onWeatherImpact?: (impact: {
    windFactor: number;
    stabilityClass: string;
    dispersionMultiplier: number;
  }) => void;
}

// Helper function to get wind direction as text
const getWindDirectionName = (degrees: number): string => {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(((degrees % 360) / 22.5)) % 16;
  return directions[index];
};

// Enhanced helper to get icon based on weather conditions
const getWeatherIcon = (conditions: string, temperature?: number) => {
  // First check for specific conditions
  if (conditions.toLowerCase().includes('rain') || 
      conditions.toLowerCase().includes('drizzle') || 
      conditions.toLowerCase().includes('shower')) {
    return <CloudRain className="h-8 w-8 text-blue-500" />;
  } else if (conditions.toLowerCase().includes('snow') || 
             conditions.toLowerCase().includes('sleet') || 
             conditions.toLowerCase().includes('ice')) {
    return <CloudSnow className="h-8 w-8 text-blue-200" />;
  } else if (conditions.toLowerCase().includes('fog') || 
             conditions.toLowerCase().includes('mist') || 
             conditions.toLowerCase().includes('haze')) {
    return <CloudFog className="h-8 w-8 text-gray-400" />;
  } else if (conditions.toLowerCase().includes('cloud')) {
    return <CloudSun className="h-8 w-8 text-gray-500" />;
  } else if (conditions.toLowerCase().includes('clear') || 
             conditions.toLowerCase().includes('sunny')) {
    // Use thermometer sun for hot clear days
    if (temperature && temperature > 25) {
      return <ThermometerSun className="h-8 w-8 text-amber-500" />;
    } else {
      return <CloudSun className="h-8 w-8 text-yellow-500" />;
    }
  } else {
    // Default
    return <CloudSun className="h-8 w-8 text-yellow-500" />;
  }
};

// Helper to determine atmospheric stability class based on weather parameters
const determineStabilityClass = (
  windSpeed: number,
  cloudCover: string,
  timeOfDay: 'day' | 'night' = 'day'
): string => {
  // Simplified Pasquill-Gifford stability class determination
  // A = Very Unstable, B = Unstable, C = Slightly Unstable
  // D = Neutral, E = Stable, F = Very Stable
  
  // First, check cloud cover as a string description
  const isCloudy = cloudCover.toLowerCase().includes('cloud') || 
                  cloudCover.toLowerCase().includes('overcast');
                  
  const isPartlyCloudy = cloudCover.toLowerCase().includes('partly');
  
  // For daytime conditions
  if (timeOfDay === 'day') {
    if (windSpeed < 2) {
      return isCloudy ? 'D' : 'A'; // Neutral if cloudy, very unstable if clear
    } else if (windSpeed < 3) {
      return isCloudy ? 'D' : 'B'; // Neutral if cloudy, unstable if clear
    } else if (windSpeed < 5) {
      return isCloudy ? 'D' : 'C'; // Neutral if cloudy, slightly unstable if clear
    } else {
      return 'D'; // Neutral for higher wind speeds
    }
  } 
  // For nighttime conditions
  else {
    if (windSpeed < 2) {
      return isCloudy ? 'F' : 'E'; // Very stable if clear, stable if cloudy
    } else if (windSpeed < 3) {
      return 'E'; // Stable
    } else {
      return 'D'; // Neutral for higher wind speeds
    }
  }
};

// Calculate wind impact factor for dispersion modeling
const calculateWindImpact = (windSpeed: number, conditions: string): number => {
  // Base factor starts at 1.0
  let factor = 1.0;
  
  // Adjust based on wind speed (higher wind usually means more dispersion)
  if (windSpeed < 2) {
    factor *= 0.8; // Low wind reduces dispersion
  } else if (windSpeed >= 2 && windSpeed < 5) {
    factor *= 1.0; // Moderate wind gives baseline dispersion
  } else if (windSpeed >= 5 && windSpeed < 10) {
    factor *= 1.3; // Higher wind increases dispersion
  } else {
    factor *= 1.5; // Very high wind significantly increases dispersion
  }
  
  // Further adjust based on conditions
  if (conditions.toLowerCase().includes('rain')) {
    factor *= 0.8; // Rain tends to reduce dispersion due to wet deposition
  } else if (conditions.toLowerCase().includes('fog')) {
    factor *= 0.9; // Fog can trap pollutants near the ground
  }
  
  return parseFloat(factor.toFixed(2)); // Round to 2 decimal places
};

const WeatherData = ({ 
  weatherData, 
  isLoading, 
  onRefresh, 
  location,
  onWeatherImpact 
}: WeatherDataProps) => {
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'night'>(
    new Date().getHours() > 6 && new Date().getHours() < 18 ? 'day' : 'night'
  );
  
  // When weather data changes, calculate and propagate the impact on dispersion
  React.useEffect(() => {
    if (weatherData && onWeatherImpact) {
      // Determine stability class
      const stabilityClass = determineStabilityClass(
        weatherData.windSpeed, 
        weatherData.conditions, 
        timeOfDay
      );
      
      // Calculate wind impact factor
      const windFactor = calculateWindImpact(weatherData.windSpeed, weatherData.conditions);
      
      // Calculate overall dispersion multiplier based on multiple factors
      let dispersionMultiplier = windFactor; 
      
      // Adjust for humidity (high humidity can affect dispersion)
      if (weatherData.humidity > 80) {
        dispersionMultiplier *= 0.9;
      } else if (weatherData.humidity < 40) {
        dispersionMultiplier *= 1.1;
      }
      
      // Adjust for extreme temperatures
      if (weatherData.temperature > 30) {
        dispersionMultiplier *= 1.15; // Hot air rises, increasing vertical dispersion
      } else if (weatherData.temperature < 5) {
        dispersionMultiplier *= 0.9; // Cold air tends to trap pollutants
      }
      
      // Notify parent component about weather impact
      onWeatherImpact({
        windFactor,
        stabilityClass,
        dispersionMultiplier: parseFloat(dispersionMultiplier.toFixed(2))
      });
      
      // Provide user feedback about significant weather impacts
      if (dispersionMultiplier > 1.3) {
        toast({
          title: "Weather Alert",
          description: "Current weather conditions significantly increase hazard dispersion area",
          variant: "destructive"
        });
      } else if (dispersionMultiplier < 0.7) {
        toast({
          title: "Weather Notice",
          description: "Current weather conditions reduce hazard dispersion area",
          variant: "default"
        });
      }
    }
  }, [weatherData, onWeatherImpact, timeOfDay]);
  
  // Toggle time of day for testing different stability classes
  const toggleTimeOfDay = () => {
    setTimeOfDay(prev => prev === 'day' ? 'night' : 'day');
    toast({
      title: `Switched to ${timeOfDay === 'day' ? 'night' : 'day'} mode`,
      description: "Atmospheric stability calculations updated",
    });
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-blue-50 to-sky-50">
        <CardTitle className="flex items-center gap-2">
          <CloudRain className="h-5 w-5 text-blue-500" /> 
          Real-Time Weather Data
        </CardTitle>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={toggleTimeOfDay}
            className="text-xs"
          >
            {timeOfDay === 'day' ? 'Day' : 'Night'} Mode
          </Button>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading} 
            className="bg-white hover:bg-gray-100">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : weatherData ? (
          <div className="space-y-4">
            {/* Conditions summary with icon */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg">
              <div>
                <div className="text-2xl font-bold">{weatherData.conditions}</div>
                <div className="text-sm text-muted-foreground">Current conditions</div>
              </div>
              <div>
                {getWeatherIcon(weatherData.conditions, weatherData.temperature)}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 bg-white rounded-lg border shadow-sm">
                <div className="text-xl font-semibold flex items-center">
                  <Thermometer className={`h-6 w-6 mr-2 ${
                    weatherData.temperature > 30 ? 'text-red-600' :
                    weatherData.temperature > 20 ? 'text-red-500' :
                    weatherData.temperature > 10 ? 'text-yellow-500' :
                    'text-blue-500'
                  }`} />
                  {weatherData.temperature}°C
                </div>
                <div className="text-sm text-muted-foreground">Temperature</div>
                {weatherData.feelsLike && (
                  <div className="text-xs text-muted-foreground">Feels like: {weatherData.feelsLike}°C</div>
                )}
              </div>
              
              <div className="p-3 bg-white rounded-lg border shadow-sm">
                <div className="text-xl font-semibold flex items-center">
                  <Wind className={`h-6 w-6 mr-2 ${
                    weatherData.windSpeed > 10 ? 'text-red-500' :
                    weatherData.windSpeed > 5 ? 'text-yellow-500' :
                    'text-blue-500'
                  }`} />
                  {weatherData.windSpeed} m/s
                </div>
                <div className="text-sm text-muted-foreground">Wind Speed</div>
              </div>
              
              <div className="p-3 bg-white rounded-lg border shadow-sm">
                <div className="text-xl font-semibold flex items-center">
                  <Wind className="h-6 w-6 mr-2 text-green-500" 
                    style={{ transform: `rotate(${weatherData.windDirection}deg)` }}
                  />
                  {weatherData.windDirection}° ({getWindDirectionName(weatherData.windDirection)})
                </div>
                <div className="text-sm text-muted-foreground">Wind Direction</div>
              </div>
              
              <div className="p-3 bg-white rounded-lg border shadow-sm">
                <div className="text-xl font-semibold flex items-center">
                  <Droplets className={`h-6 w-6 mr-2 ${
                    weatherData.humidity > 80 ? 'text-blue-700' :
                    weatherData.humidity > 60 ? 'text-blue-500' :
                    weatherData.humidity > 40 ? 'text-blue-400' :
                    'text-blue-300'
                  }`} />
                  {weatherData.humidity}%
                </div>
                <div className="text-sm text-muted-foreground">Humidity</div>
              </div>
              
              <div className="p-3 bg-white rounded-lg border shadow-sm">
                <div className="text-xl font-semibold flex items-center">
                  <Gauge className="h-6 w-6 mr-2 text-purple-500" />
                  {weatherData.pressure} hPa
                </div>
                <div className="text-sm text-muted-foreground">Pressure</div>
              </div>
              
              <div className="p-3 bg-white rounded-lg border shadow-sm">
                <div className="text-sm font-medium">Last Updated</div>
                <div className="text-base">{new Date(weatherData.timestamp).toLocaleTimeString()}</div>
                <div className="text-xs text-muted-foreground">{new Date(weatherData.timestamp).toLocaleDateString()}</div>
              </div>
            </div>
            
            {/* Display additional weather parameters if available */}
            {(weatherData.precipitationRate !== undefined || 
             weatherData.visibility !== undefined || 
             weatherData.uvIndex !== undefined) && (
              <div className="grid grid-cols-3 gap-4 mt-2">
                {weatherData.precipitationRate !== undefined && (
                  <div className="p-3 bg-white rounded-lg border shadow-sm">
                    <div className="text-lg font-semibold flex items-center">
                      <CloudRain className="h-5 w-5 mr-2 text-blue-500" />
                      {weatherData.precipitationRate} mm/h
                    </div>
                    <div className="text-xs text-muted-foreground">Precipitation</div>
                  </div>
                )}
                
                {weatherData.visibility !== undefined && (
                  <div className="p-3 bg-white rounded-lg border shadow-sm">
                    <div className="text-lg font-semibold flex items-center">
                      <CloudFog className="h-5 w-5 mr-2 text-gray-500" />
                      {weatherData.visibility} km
                    </div>
                    <div className="text-xs text-muted-foreground">Visibility</div>
                  </div>
                )}
                
                {weatherData.uvIndex !== undefined && (
                  <div className="p-3 bg-white rounded-lg border shadow-sm">
                    <div className="text-lg font-semibold flex items-center">
                      <ThermometerSun className="h-5 w-5 mr-2 text-yellow-500" />
                      {weatherData.uvIndex}
                    </div>
                    <div className="text-xs text-muted-foreground">UV Index</div>
                  </div>
                )}
              </div>
            )}
            
            {/* Atmospheric stability class indicator */}
            <div className="p-3 bg-gradient-to-r from-gray-50 to-sky-50 rounded-lg border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Atmospheric Stability</div>
                  <div className="text-lg font-bold">
                    Class {determineStabilityClass(weatherData.windSpeed, weatherData.conditions, timeOfDay)}
                  </div>
                </div>
                <div className="text-xs px-2 py-1 bg-white rounded-full border">
                  {timeOfDay === 'day' ? 'Daytime' : 'Nighttime'} Conditions
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {determineStabilityClass(weatherData.windSpeed, weatherData.conditions, timeOfDay) === 'A' ? 'Very unstable - increased vertical mixing' :
                 determineStabilityClass(weatherData.windSpeed, weatherData.conditions, timeOfDay) === 'B' ? 'Unstable conditions' :
                 determineStabilityClass(weatherData.windSpeed, weatherData.conditions, timeOfDay) === 'C' ? 'Slightly unstable' :
                 determineStabilityClass(weatherData.windSpeed, weatherData.conditions, timeOfDay) === 'D' ? 'Neutral conditions' :
                 determineStabilityClass(weatherData.windSpeed, weatherData.conditions, timeOfDay) === 'E' ? 'Stable conditions' :
                 'Very stable - limited vertical mixing'}
              </div>
            </div>
            
            <div className="p-3 mt-2 bg-blue-50 rounded-lg border border-blue-100 text-sm">
              <div className="flex items-center gap-1 mb-1 font-medium text-blue-700">
                <MapPin className="h-4 w-4" /> Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </div>
              <p className="text-blue-600 text-xs">
                Weather data adjusts dispersion modeling with a factor of {calculateWindImpact(weatherData.windSpeed, weatherData.conditions)}x
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 bg-gray-50 rounded-lg border border-dashed">
            <CloudRain className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-muted-foreground mb-4">No weather data available</p>
            <Button onClick={onRefresh} className="bg-blue-500 hover:bg-blue-600">
              <RefreshCw className="h-4 w-4 mr-2" />
              Fetch Weather Data
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeatherData;
