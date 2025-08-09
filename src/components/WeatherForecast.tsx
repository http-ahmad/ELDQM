
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  CloudRain, Wind, Thermometer, RefreshCw, Droplets, Cloud,
  Calendar, Clock, ArrowRight, ThermometerSun, CloudFog, CloudSnow,
  Umbrella, ChevronLeft, ChevronRight
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchWeatherForecast, ForecastData, getWeatherDescription } from '../services/weatherService';

interface WeatherForecastProps {
  location: { lat: number; lng: number };
  className?: string;
}

// Helper function to format date and time
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return {
    time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    day: date.toLocaleDateString([], { weekday: 'short' }),
    date: date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  };
};

// Helper to get weather icon based on weather code and time of day
const getWeatherIcon = (weatherCode: number, isDay: number, size: number = 6) => {
  const iconClass = `h-${size} w-${size}`;
  
  // Check weather conditions
  if ([95, 96, 99].includes(weatherCode)) {
    return <CloudRain className={`${iconClass} text-purple-500`} />; // Thunderstorms
  } else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
    return <CloudRain className={`${iconClass} text-blue-500`} />; // Rain
  } else if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    return <CloudSnow className={`${iconClass} text-blue-200`} />; // Snow
  } else if ([45, 48].includes(weatherCode)) {
    return <CloudFog className={`${iconClass} text-gray-400`} />; // Fog
  } else if ([1, 2, 3].includes(weatherCode)) {
    return <Cloud className={`${iconClass} text-gray-500`} />; // Cloudy
  } else if (weatherCode === 0) {
    if (isDay === 1) {
      return <ThermometerSun className={`${iconClass} text-yellow-500`} />; // Clear day
    } else {
      return <Cloud className={`${iconClass} text-blue-900`} />; // Clear night
    }
  }
  
  // Default
  return <Cloud className={`${iconClass} text-gray-400`} />;
};

// Helper to get color based on temperature
const getTemperatureColor = (temp: number) => {
  if (temp > 30) return "text-red-600";
  if (temp > 25) return "text-red-500";
  if (temp > 20) return "text-orange-500";
  if (temp > 15) return "text-yellow-500";
  if (temp > 10) return "text-green-500";
  if (temp > 5) return "text-blue-400";
  return "text-blue-600";
};

const WeatherForecast: React.FC<WeatherForecastProps> = ({ location, className = "" }) => {
  const [forecast, setForecast] = useState<ForecastData[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'hourly' | 'daily'>('hourly');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const itemsPerPage = viewMode === 'hourly' ? 6 : 5;
  
  // Fetch forecast data
  const fetchForecast = async () => {
    setIsLoading(true);
    try {
      const data = await fetchWeatherForecast(location.lat, location.lng, 48);
      setForecast(data);
    } catch (error) {
      console.error("Error fetching forecast:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Group forecast by day for daily view
  const getDailyForecast = () => {
    if (!forecast) return [];
    
    const dailyData: { [key: string]: ForecastData[] } = {};
    
    forecast.forEach(hourData => {
      const date = hourData.time.split('T')[0];
      
      if (!dailyData[date]) {
        dailyData[date] = [];
      }
      
      dailyData[date].push(hourData);
    });
    
    return Object.entries(dailyData).map(([date, hours]) => {
      // Find max/min temperature
      const maxTemp = Math.max(...hours.map(h => h.temperature || 0));
      const minTemp = Math.min(...hours.map(h => h.temperature || 0));
      
      // Calculate precipitation probability
      const maxPrecipProb = Math.max(...hours.map(h => h.precipitation_probability || 0));
      
      // Get most common weather condition
      const weatherCodeCounts: Record<number, number> = {};
      hours.forEach(h => {
        if (h.weatherCode !== undefined && h.isDay === 1) {
          weatherCodeCounts[h.weatherCode] = (weatherCodeCounts[h.weatherCode] || 0) + 1;
        }
      });
      
      let dominantWeatherCode = 0;
      let maxCount = 0;
      Object.entries(weatherCodeCounts).forEach(([code, count]) => {
        if (count > maxCount) {
          maxCount = count;
          dominantWeatherCode = parseInt(code);
        }
      });
      
      // Return summary data for this day
      return {
        date,
        maxTemp,
        minTemp,
        precipitationProb: maxPrecipProb,
        weatherCode: dominantWeatherCode,
        hourlyData: hours
      };
    });
  };
  
  // Calculate total pages
  const totalPages = forecast 
    ? Math.ceil((viewMode === 'hourly' ? forecast.length : getDailyForecast().length) / itemsPerPage) 
    : 0;
  
  // Handle page navigation
  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };
  
  // Get current items to display
  const getCurrentItems = () => {
    if (!forecast) return [];
    
    const startIdx = currentPage * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    
    if (viewMode === 'hourly') {
      return forecast.slice(startIdx, endIdx);
    } else {
      return getDailyForecast().slice(startIdx, endIdx);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchForecast();
  }, [location.lat, location.lng]);
  
  // Reset pagination when view mode changes
  useEffect(() => {
    setCurrentPage(0);
  }, [viewMode]);
  
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-blue-50 to-sky-50">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          Weather Forecast
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchForecast} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <Tabs defaultValue="hourly" className="w-full" onValueChange={(val) => setViewMode(val as 'hourly' | 'daily')}>
        <div className="px-4 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="hourly" className="flex-1">Hourly</TabsTrigger>
            <TabsTrigger value="daily" className="flex-1">Daily</TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="p-4">
          {isLoading ? (
            <div className="space-y-4">
              <div className="flex justify-between gap-2">
                {[...Array(viewMode === 'hourly' ? 6 : 5)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-md" />
                ))}
              </div>
            </div>
          ) : forecast ? (
            <>
              <TabsContent value="hourly" className="mt-0">
                <div className="flex justify-between items-center mb-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handlePrevPage}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="text-sm text-muted-foreground">
                    {currentPage + 1} / {totalPages}
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {getCurrentItems().map((item, i) => {
                    const datetime = formatDateTime(item.time);
                    return (
                      <div 
                        key={i} 
                        className="flex flex-col items-center p-2 border rounded-md bg-white hover:bg-gray-50"
                      >
                        <div className="text-xs font-medium">{datetime.day}</div>
                        <div className="text-xs text-muted-foreground">{datetime.time}</div>
                        
                        {getWeatherIcon(item.weatherCode || 0, item.isDay || 0)}
                        
                        <div className={`mt-1 font-bold ${getTemperatureColor(item.temperature || 0)}`}>
                          {item.temperature?.toFixed(1)}°C
                        </div>
                        
                        <div className="flex items-center gap-1 mt-1 text-xs">
                          <Wind className="h-3 w-3" style={{ transform: `rotate(${item.windDirection}deg)` }} />
                          <span>{item.windSpeed?.toFixed(1)} m/s</span>
                        </div>
                        
                        {item.precipitation_probability !== undefined && item.precipitation_probability > 10 && (
                          <div className="flex items-center gap-1 text-xs text-blue-500">
                            <Umbrella className="h-3 w-3" />
                            <span>{item.precipitation_probability}%</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
              
              <TabsContent value="daily" className="mt-0">
                <div className="flex justify-between items-center mb-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handlePrevPage}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="text-sm text-muted-foreground">
                    {currentPage + 1} / {totalPages}
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {getCurrentItems().map((day: any, i) => {
                    const date = new Date(day.date);
                    return (
                      <div 
                        key={i} 
                        className="flex items-center justify-between p-3 border rounded-md bg-white hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          {getWeatherIcon(day.weatherCode, 1, 8)}
                          
                          <div>
                            <div className="font-medium">
                              {date.toLocaleDateString([], { weekday: 'long' })}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {date.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {getWeatherDescription(day.weatherCode)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${getTemperatureColor(day.maxTemp)}`}>
                              {day.maxTemp.toFixed(1)}°C
                            </span>
                            <ArrowRight className="h-3 w-3 text-gray-400" />
                            <span className={`font-bold ${getTemperatureColor(day.minTemp)}`}>
                              {day.minTemp.toFixed(1)}°C
                            </span>
                          </div>
                          
                          {day.precipitationProb > 10 && (
                            <div className="flex items-center gap-1 mt-1 text-sm text-blue-500">
                              <Umbrella className="h-4 w-4" />
                              <span>{day.precipitationProb}% chance of rain</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 bg-gray-50 rounded-lg border border-dashed">
              <Calendar className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-muted-foreground mb-4">No forecast data available</p>
              <Button onClick={fetchForecast} className="bg-blue-500 hover:bg-blue-600">
                <RefreshCw className="h-4 w-4 mr-2" />
                Fetch Weather Forecast
              </Button>
            </div>
          )}
        </CardContent>
      </Tabs>
    </Card>
  );
};

export default WeatherForecast;
