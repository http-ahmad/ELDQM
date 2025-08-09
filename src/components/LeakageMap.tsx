
import React, { useState, useEffect, useRef } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  CircleMarker,
  Polygon,
  useMapEvents,
  useMap,
  LayersControl
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Wind, AlertCircle, AlertTriangle, Factory, Cloud, Droplets, ThermometerSun, CloudFog, RefreshCw } from 'lucide-react';
import L from 'leaflet';
import { 
  fetchWeatherData, 
  fetchWeatherForecast,
  calculateWeatherImpact, 
  getWeatherDescription, 
  WeatherData, 
  ForecastData 
} from '../services/weatherService';
import { toast } from 'sonner';

// Fix for Leaflet's default icon path issues
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Create the default icon to avoid issues with missing marker icons
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// Set the default icon for all markers
L.Marker.prototype.options.icon = DefaultIcon;

interface ZoneData {
  red: { distance: number; concentration: number };
  orange: { distance: number; concentration: number };
  yellow: { distance: number; concentration: number };
}

interface MapProps {
  showLeakage: boolean;
  windDirection: number;
  windSpeed: number;
  sourceLocation: { lat: number; lng: number };
  zoneData: ZoneData;
  onLocationChange: (location: { lat: number; lng: number }) => void;
  selectingLocation: boolean;
  detected?: boolean;
  sensorLocations?: Array<{ lat: number; lng: number; type: string }>;
  showTerrain?: boolean;
  industryType?: string;
  releaseType?: 'continuous' | 'batch';
  onWeatherDataUpdate?: (weatherData: WeatherData | null, weatherImpact: any) => void;
  autoRefreshWeather?: boolean;
}

// Use this component to update the map center whenever sourceLocation changes
const MapCenterHandler = ({ sourceLocation }: { sourceLocation: { lat: number; lng: number } }) => {
  const map = useMap();
  
  React.useEffect(() => {
    map.setView([sourceLocation.lat, sourceLocation.lng], map.getZoom());
  }, [map, sourceLocation.lat, sourceLocation.lng]);
  
  return null;
};

// MapClickHandler component to handle location selection
const MapClickHandler = ({ onLocationChange, selectingLocation }: { 
  onLocationChange: (location: { lat: number; lng: number }) => void,
  selectingLocation: boolean
}) => {
  useMapEvents({
    click: (e) => {
      if (selectingLocation) {
        onLocationChange({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    }
  });
  return null;
};

// WindDirectionArrow component to show wind direction
const WindDirectionArrow = ({ 
  position, 
  direction, 
  speed, 
  temperature,
  humidity,
  weatherData,
  forecastData
}: { 
  position: [number, number], 
  direction: number,
  speed: number,
  temperature?: number,
  humidity?: number,
  weatherData?: WeatherData,
  forecastData?: ForecastData[]
}) => {
  // Get stability class description if weather data is available
  const getStabilityDescription = (stabilityClass?: string) => {
    if (!stabilityClass) return '';
    
    switch(stabilityClass.charAt(0)) {
      case 'A': return 'Very Unstable';
      case 'B': return 'Unstable';
      case 'C': return 'Slightly Unstable';
      case 'D': return 'Neutral';
      case 'E': return 'Stable';
      case 'F': return 'Very Stable';
      default: return stabilityClass || '';
    }
  };

  // Determine wind speed category and color
  const getWindSpeedCategory = (speed: number) => {
    if (speed < 5) return { category: 'Light', color: 'text-blue-500' };
    if (speed < 15) return { category: 'Moderate', color: 'text-green-500' };
    if (speed < 30) return { category: 'Strong', color: 'text-yellow-500' };
    return { category: 'Very Strong', color: 'text-red-500' };
  };
  
  const windCategory = getWindSpeedCategory(speed);
  
  // Calculate stability class if we have weather data
  const weatherImpact = weatherData ? 
    calculateWeatherImpact(weatherData) : undefined;
  
  const stabilityClass = weatherImpact?.stabilityClass;
  
  // Check forecast for weather changes
  const hasWeatherChanges = () => {
    if (!forecastData || forecastData.length < 3) return false;
    
    const nextFewHours = forecastData.slice(0, 3);
    const windDirectionChange = Math.max(...nextFewHours.map(f => 
      f.windDirection ? Math.abs((f.windDirection - direction + 360) % 360) : 0
    ));
    
    const windSpeedChange = Math.max(...nextFewHours.map(f => 
      f.windSpeed ? Math.abs(f.windSpeed - speed) : 0
    ));
    
    return windDirectionChange > 45 || windSpeedChange > 5;
  };

  return (
    <div className="wind-arrow" style={{
      position: 'absolute',
      top: '50px',
      right: '50px',
      padding: '10px',
      backgroundColor: 'white',
      borderRadius: '4px',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      zIndex: 1000
    }}>
      <Wind size={16} 
            className={windCategory.color} 
            style={{ transform: `rotate(${direction}deg)` }} />
      <div className="flex flex-col">
        <span className="font-medium">
          {direction}° ({getWindDirectionLabel(direction)}) - {speed.toFixed(1)} m/s
        </span>
        <div className="flex items-center gap-2 text-xs">
          <span className={windCategory.color}>{windCategory.category}</span>
          {stabilityClass && (
            <>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">
                {getStabilityDescription(stabilityClass)} (Class {stabilityClass})
              </span>
            </>
          )}
          {temperature !== undefined && (
            <>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">
                <ThermometerSun className="inline h-3 w-3 mr-1" />{temperature}°C
              </span>
            </>
          )}
          {humidity !== undefined && (
            <>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">
                <Droplets className="inline h-3 w-3 mr-1" />{humidity}%
              </span>
            </>
          )}
        </div>
        {weatherData?.weatherCode !== undefined && (
          <div className="text-xs text-gray-600 mt-1">
            {getWeatherDescription(weatherData.weatherCode)}
          </div>
        )}
        {forecastData && hasWeatherChanges() && (
          <div className="text-xs text-amber-600 mt-1 font-medium">
            <AlertTriangle className="inline h-3 w-3 mr-1" />
            Weather changes expected
          </div>
        )}
      </div>
    </div>
  );
};

// Function to generate directional plume coordinates with enhanced weather effects
const generateDirectionalPlume = (
  center: L.LatLngExpression,
  distance: number,
  direction: number,
  windSpeed: number,
  spreadFactor = 120,
  weatherImpact?: {
    windFactor: number;
    stabilityClass: string;
    dispersionMultiplier: number;
  },
  releaseType: 'continuous' | 'batch' = 'continuous'
): L.LatLngExpression[] => {
  // Convert center to array if it's not already
  const centerPoint: [number, number] = (Array.isArray(center)) 
    ? center as [number, number] 
    : [center.lat, center.lng];
    
  // Apply weather impact if available
  const dispersionMultiplier = weatherImpact?.dispersionMultiplier || 1.0;
  const adjustedDistance = distance * dispersionMultiplier;
  
  // Get stability class for plume shape
  let stabilityFactor = 1.0;
  if (weatherImpact) {
    const stabilityClass = weatherImpact.stabilityClass.charAt(0);
    switch(stabilityClass) {
      case 'A': stabilityFactor = 1.3; break; // Very unstable - wider plume
      case 'B': stabilityFactor = 1.15; break; // Unstable
      case 'C': stabilityFactor = 1.0; break; // Slightly unstable
      case 'D': stabilityFactor = 0.9; break; // Neutral conditions
      case 'E': stabilityFactor = 0.7; break; // Stable
      case 'F': stabilityFactor = 0.55; break; // Very stable - narrower plume
      default: stabilityFactor = 0.9; // Default to neutral
    }
  }
  
  // Wind factor affects elongation and spread
  const windFactor = Math.min(Math.max(windSpeed, 1), 15) / 5;
  
  // Calculate downwind distance based on release type, wind speed and stability
  const downwindDistance = adjustedDistance * (1 + windFactor * (releaseType === 'batch' ? 0.5 : 0.8));
  
  // Convert to radians
  const directionRad = (direction * Math.PI) / 180;
  
  // Calculate crosswind spread based on stability and wind speed
  const crosswindSpread = (spreadFactor * Math.PI / 180) * stabilityFactor * (1 - windFactor * 0.3);
  
  // Generate points along an arc
  const points: L.LatLngExpression[] = [];
  points.push(centerPoint); // Start with the center point
  
  // Number of points to create a smooth arc
  const numPoints = 24;
  
  for (let i = 0; i <= numPoints; i++) {
    const angle = directionRad - crosswindSpread/2 + (crosswindSpread * i / numPoints);
    
    // Create more realistic plume shape by adjusting points based on angle from centerline
    const angleOffset = Math.abs(angle - directionRad) / (crosswindSpread/2);
    let distanceFactor;
    
    if (releaseType === 'batch') {
      // For batch releases, create a more concentrated, shorter plume
      distanceFactor = (i / numPoints) * downwindDistance * (1 - 0.3 * Math.pow(angleOffset, 1.5));
    } else {
      // For continuous releases, create a more traditional elongated plume
      distanceFactor = (i / numPoints) * downwindDistance * (1 - 0.15 * Math.pow(angleOffset, 2));
    }
    
    // Calculate coordinates with Haversine formula approximation
    const lat = centerPoint[0] + (distanceFactor * Math.cos(angle)) / 111.32; // km per degree lat
    const lng = centerPoint[1] + (distanceFactor * Math.sin(angle)) / (111.32 * Math.cos(centerPoint[0] * (Math.PI / 180)));
    
    points.push([lat, lng] as [number, number]);
  }
  
  return points;
};

// Function to generate specialized plume based on industry type
const generateIndustryPlume = (
  center: L.LatLngExpression,
  distance: number,
  direction: number,
  windSpeed: number,
  industryType: string = 'chemical',
  releaseType: 'continuous' | 'batch' = 'continuous',
  weatherImpact?: {
    windFactor: number;
    stabilityClass: string;
    dispersionMultiplier: number;
  }
): L.LatLngExpression[] => {
  // Get base plume with weather effects
  const basePlume = generateDirectionalPlume(
    center, 
    distance, 
    direction, 
    windSpeed, 
    120, 
    weatherImpact,
    releaseType
  );
  
  // Adjust based on industry type
  switch (industryType) {
    case 'petrochemical':
      // Wider, more intense plume for petrochemical
      return generateDirectionalPlume(
        center, 
        distance * 1.2, 
        direction, 
        windSpeed, 
        140, 
        weatherImpact,
        releaseType
      );
    case 'agricultural':
      // Narrower, longer plume for agricultural chemicals
      return generateDirectionalPlume(
        center, 
        distance * 1.3, 
        direction, 
        windSpeed, 
        80, 
        weatherImpact,
        releaseType
      );
    case 'pharmaceutical':
      // More precise, contained plume for pharmaceutical
      return generateDirectionalPlume(
        center, 
        distance * 0.9, 
        direction, 
        windSpeed, 
        100,
        weatherImpact,
        releaseType
      );
    // Default 'chemical' case uses the base plume
    default:
      return basePlume;
  }
};

// Calculate distance between two lat/lng points in km
function getDistanceFromLatLngInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2-lat1);
  const dLon = deg2rad(lon2-lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180);
}

export const Map = ({ 
  showLeakage, 
  windDirection, 
  windSpeed,
  sourceLocation, 
  zoneData,
  onLocationChange,
  selectingLocation,
  detected = false,
  sensorLocations = [],
  showTerrain = false,
  industryType = 'chemical',
  releaseType = 'continuous',
  onWeatherDataUpdate,
  autoRefreshWeather = true
}: MapProps) => {
  // State for real weather data
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecastData, setForecastData] = useState<ForecastData[] | null>(null);
  const [weatherImpact, setWeatherImpact] = useState<{
    windFactor: number;
    stabilityClass: string;
    dispersionMultiplier: number;
  } | undefined>(undefined);
  
  // Add a reference for the auto-refresh interval
  const weatherRefreshInterval = useRef<number | null>(null);
  
  // State for tracking loading state
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  
  // Fetch real weather data and forecast when source location changes
  const fetchAndUpdateWeather = async () => {
    if (isLoadingWeather) return; // Prevent multiple simultaneous requests
    
    try {
      setIsLoadingWeather(true);
      const data = await fetchWeatherData(sourceLocation.lat, sourceLocation.lng);
      if (data) {
        setWeatherData(data);
        
        // Calculate weather impact on dispersion
        const impact = calculateWeatherImpact(data);
        setWeatherImpact(impact);
        
        // Notify parent component about weather data update
        if (onWeatherDataUpdate) {
          onWeatherDataUpdate(data, impact);
        }
        
        // Use real wind data if available
        if (data.windSpeed && data.windDirection) {
          toast.info("Updated weather data from the selected location");
        }
        
        // Also fetch forecast data
        const forecast = await fetchWeatherForecast(sourceLocation.lat, sourceLocation.lng, 12);
        if (forecast) {
          setForecastData(forecast);
          
          // Check for significant weather changes in the forecast
          if (forecast.length > 0) {
            const nextHour = forecast[0];
            const significantChanges = [];
            
            if (nextHour.windSpeed && Math.abs((nextHour.windSpeed - (data.windSpeed || 0))) > 5) {
              significantChanges.push("wind speed");
            }
            
            if (nextHour.windDirection && Math.abs(((nextHour.windDirection - (data.windDirection || 0) + 180) % 360) - 180) > 45) {
              significantChanges.push("wind direction");
            }
            
            if (nextHour.precipitation && nextHour.precipitation > 0.5 && (!data.precipitation || data.precipitation < 0.1)) {
              significantChanges.push("precipitation");
            }
            
            if (significantChanges.length > 0) {
              toast.warning(`Weather forecast shows changes in ${significantChanges.join(", ")} in the next hour`);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching weather data:", error);
      toast.error("Failed to refresh weather data");
    } finally {
      setIsLoadingWeather(false);
    }
  };
  
  // Set up weather data fetch effect
  useEffect(() => {
    if (showLeakage) {
      fetchAndUpdateWeather();
      
      // Clean up any existing interval
      if (weatherRefreshInterval.current) {
        clearInterval(weatherRefreshInterval.current);
        weatherRefreshInterval.current = null;
      }
      
      // Set up automatic refresh if enabled
      if (autoRefreshWeather) {
        // Refresh every 10 minutes (600000 ms)
        weatherRefreshInterval.current = window.setInterval(fetchAndUpdateWeather, 600000) as unknown as number;
      }
    }
    
    return () => {
      if (weatherRefreshInterval.current) {
        clearInterval(weatherRefreshInterval.current);
        weatherRefreshInterval.current = null;
      }
    };
  }, [sourceLocation.lat, sourceLocation.lng, showLeakage, autoRefreshWeather]);
  
  // Convert to LatLng type for Leaflet
  const position: L.LatLngExpression = [sourceLocation.lat, sourceLocation.lng];
  
  // Generate directional plumes based on industry type, release type and weather
  const redZonePlume = generateIndustryPlume(
    position, zoneData.red.distance, windDirection, windSpeed, industryType, releaseType, weatherImpact
  );
  const orangeZonePlume = generateIndustryPlume(
    position, zoneData.orange.distance, windDirection, windSpeed, industryType, releaseType, weatherImpact
  );
  const yellowZonePlume = generateIndustryPlume(
    position, zoneData.yellow.distance, windDirection, windSpeed, industryType, releaseType, weatherImpact
  );
  
  // Calculate adjusted zone distances based on weather
  const dispersionMultiplier = weatherImpact?.dispersionMultiplier || 1.0;
  const adjustedRedDistance = zoneData.red.distance * dispersionMultiplier;
  const adjustedOrangeDistance = zoneData.orange.distance * dispersionMultiplier;
  const adjustedYellowDistance = zoneData.yellow.distance * dispersionMultiplier;
  
  // Create polygon elements for the hazard zones
  const redZone = (
    <Polygon 
      positions={redZonePlume}
      pathOptions={{ 
        fillColor: 'red', 
        fillOpacity: 0.3, 
        color: 'red',
        weight: 1
      }}
    >
      <Popup>
        <div>
          <h3 className="font-bold text-red-600">Red Zone</h3>
          <p>Base Distance: {Number(zoneData.red.distance).toFixed(2)} km</p>
          <p>Adjusted Distance: {adjustedRedDistance.toFixed(2)} km</p>
          <p>Concentration: {Number(zoneData.red.concentration).toFixed(2)} mg/m³</p>
          <p className="font-semibold">Immediate evacuation required</p>
          {weatherImpact && weatherImpact.dispersionMultiplier !== 1.0 && (
            <p className="text-xs mt-1 text-gray-700">
              Weather impact factor: {weatherImpact.dispersionMultiplier.toFixed(2)}x
            </p>
          )}
          {releaseType === 'batch' && (
            <p className="text-xs mt-1 text-red-500">Batch release - Higher initial concentration</p>
          )}
        </div>
      </Popup>
    </Polygon>
  );
  
  const orangeZone = (
    <Polygon 
      positions={orangeZonePlume}
      pathOptions={{ 
        fillColor: 'orange', 
        fillOpacity: 0.3, 
        color: 'orange',
        weight: 1
      }}
    >
      <Popup>
        <div>
          <h3 className="font-bold text-orange-600">Orange Zone</h3>
          <p>Base Distance: {Number(zoneData.orange.distance).toFixed(2)} km</p>
          <p>Adjusted Distance: {adjustedOrangeDistance.toFixed(2)} km</p>
          <p>Concentration: {Number(zoneData.orange.concentration).toFixed(2)} mg/m³</p>
          <p className="font-semibold">Shelter in place or evacuate</p>
          {weatherImpact && weatherImpact.dispersionMultiplier !== 1.0 && (
            <p className="text-xs mt-1 text-gray-700">
              Weather impact factor: {weatherImpact.dispersionMultiplier.toFixed(2)}x
            </p>
          )}
          {releaseType === 'batch' && (
            <p className="text-xs mt-1 text-orange-500">Batch release - Moderate dispersion over time</p>
          )}
        </div>
      </Popup>
    </Polygon>
  );
  
  const yellowZone = (
    <Polygon 
      positions={yellowZonePlume}
      pathOptions={{ 
        fillColor: 'yellow', 
        fillOpacity: 0.3, 
        color: 'yellow',
        weight: 1
      }}
    >
      <Popup>
        <div>
          <h3 className="font-bold text-yellow-600">Yellow Zone</h3>
          <p>Base Distance: {Number(zoneData.yellow.distance).toFixed(2)} km</p>
          <p>Adjusted Distance: {adjustedYellowDistance.toFixed(2)} km</p>
          <p>Concentration: {Number(zoneData.yellow.concentration).toFixed(2)} mg/m³</p>
          <p className="font-semibold">Be alert and monitor situation</p>
          {weatherImpact && weatherImpact.dispersionMultiplier !== 1.0 && (
            <p className="text-xs mt-1 text-gray-700">
              Weather impact factor: {weatherImpact.dispersionMultiplier.toFixed(2)}x
            </p>
          )}
          {releaseType === 'batch' && (
            <p className="text-xs mt-1 text-yellow-500">Batch release - Extended monitoring recommended</p>
          )}
        </div>
      </Popup>
    </Polygon>
  );
  
  return (
    <div className="w-full h-full relative">
      <MapContainer 
        key={`map-${sourceLocation.lat.toFixed(5)}-${sourceLocation.lng.toFixed(5)}`}
        center={position}
        zoom={12} 
        style={{ height: '100%', width: '100%' }}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked={!showTerrain} name="Streets">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer checked={showTerrain} name="Terrain">
            <TileLayer
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; <a href="http://www.esri.com/">Esri</a>, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        
        <MapCenterHandler sourceLocation={sourceLocation} />
        
        <Marker position={position}>
          <Popup>
            <div>
              <h3 className="font-bold">Source Point</h3>
              <p>Chemical release location</p>
              <p>Wind Direction: {windDirection}° ({getWindDirectionLabel(windDirection)})</p>
              <p>Coordinates: {sourceLocation.lat.toFixed(5)}, {sourceLocation.lng.toFixed(5)}</p>
              <p>Industry Type: {industryType.charAt(0).toUpperCase() + industryType.slice(1)}</p>
              <p>Release Type: {releaseType.charAt(0).toUpperCase() + releaseType.slice(1)}</p>
              
              {weatherData && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <h4 className="font-semibold">Current Weather:</h4>
                  {weatherData.temperature !== undefined && (
                    <p>Temperature: {weatherData.temperature}°C</p>
                  )}
                  {weatherData.humidity !== undefined && (
                    <p>Humidity: {weatherData.humidity}%</p>
                  )}
                  {weatherData.weatherCode !== undefined && (
                    <p>Condition: {getWeatherDescription(weatherData.weatherCode)}</p>
                  )}
                  {weatherImpact && (
                    <p className="text-sm italic mt-1">
                      Weather dispersion factor: {weatherImpact.dispersionMultiplier.toFixed(2)}x
                    </p>
                  )}
                </div>
              )}
              
              {forecastData && forecastData.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <h4 className="font-semibold">Forecast (Next Hour):</h4>
                  <p>Wind: {forecastData[0].windDirection}° at {forecastData[0].windSpeed?.toFixed(1)} m/s</p>
                  <p>Temp: {forecastData[0].temperature}°C</p>
                  {forecastData[0].precipitation_probability !== undefined && (
                    <p>Precip. Chance: {forecastData[0].precipitation_probability}%</p>
                  )}
                </div>
              )}
            </div>
          </Popup>
        </Marker>

        {/* Map click handler for location selection */}
        <MapClickHandler onLocationChange={onLocationChange} selectingLocation={selectingLocation} />
        
        {/* Draw the hazard zones if showLeakage is true */}
        {showLeakage && (
          <>
            {yellowZone}
            {orangeZone}
            {redZone}
          </>
        )}
        
        {/* Show sensor locations if available */}
        {sensorLocations.map((sensor, index) => (
          <CircleMarker 
            key={`sensor-${index}`}
            center={[sensor.lat, sensor.lng]}
            radius={5}
            pathOptions={{ 
              fillColor: sensor.type === 'fixed' ? 'blue' : 'green', 
              color: 'white',
              weight: 2,
              fillOpacity: 0.8
            }}
          >
            <Popup>
              <div>
                <h3 className="font-bold">Sensor {index + 1}</h3>
                <p>Type: {sensor.type === 'fixed' ? 'Fixed' : 'Mobile'}</p>
                <p>Coordinates: {sensor.lat.toFixed(5)}, {sensor.lng.toFixed(5)}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      
      {/* Wind direction indicator with weather data and forecast */}
      {showLeakage && (
        <WindDirectionArrow 
          position={[sourceLocation.lat, sourceLocation.lng]} 
          direction={windDirection}
          speed={windSpeed}
          temperature={weatherData?.temperature}
          humidity={weatherData?.humidity}
          weatherData={weatherData || undefined}
          forecastData={forecastData || undefined}
        />
      )}
      
      {/* Selection mode indicator */}
      {selectingLocation && (
        <div className="absolute top-2 left-2 bg-white p-2 rounded z-50 shadow-md text-sm">
          Click on the map to select the industrial site location
        </div>
      )}
      
      {/* Leak detection indicator */}
      {detected && (
        <div className="absolute top-2 left-2 bg-red-600 text-white p-2 rounded z-50 shadow-md animate-pulse flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>Leak Detected - Emergency Response Required</span>
        </div>
      )}
      
      {/* Weather impact indicator */}
      {showLeakage && weatherImpact && weatherImpact.dispersionMultiplier !== 1.0 && (
        <div className="absolute top-16 right-2 bg-white p-2 rounded z-50 shadow-md">
          <div className="flex items-center gap-2 text-sm">
            <CloudFog className={`h-4 w-4 ${
              weatherImpact.dispersionMultiplier > 1.2 ? 'text-red-500' : 
              weatherImpact.dispersionMultiplier < 0.8 ? 'text-green-500' : 
              'text-blue-500'
            }`} />
            <span>Weather Impact: {weatherImpact.dispersionMultiplier.toFixed(2)}x</span>
          </div>
          <div className="text-xs text-gray-600">
            {weatherImpact.dispersionMultiplier > 1.2 
              ? 'Weather conditions increase hazard zones' 
              : weatherImpact.dispersionMultiplier < 0.8
              ? 'Weather conditions reduce hazard zones'
              : 'Normal dispersion conditions'}
          </div>
        </div>
      )}
      
      {/* Auto refresh indicator */}
      {autoRefreshWeather && (
        <div className="absolute top-28 right-2 bg-white p-2 rounded z-50 shadow-md">
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <RefreshCw className={`h-3 w-3 ${weatherRefreshInterval.current ? 'animate-spin' : ''}`} />
            <span>Auto-refreshing weather data every 10 minutes</span>
          </div>
        </div>
      )}
      
      {/* Manual refresh button */}
      <div className="absolute bottom-36 right-2 z-50">
        <button 
          onClick={fetchAndUpdateWeather}
          disabled={isLoadingWeather}
          className={`flex items-center gap-2 bg-white p-2 rounded shadow-md text-sm ${isLoadingWeather ? 'opacity-50' : 'hover:bg-gray-100'}`}
        >
          <RefreshCw className={`h-4 w-4 ${isLoadingWeather ? 'animate-spin' : ''}`} />
          {isLoadingWeather ? 'Updating...' : 'Refresh Weather'}
        </button>
      </div>
      
      {/* Release type indicator */}
      {showLeakage && (
        <div className="absolute top-40 right-2 bg-white p-2 rounded z-50 shadow-md">
          <div className="flex items-center gap-2 text-sm">
            {releaseType === 'continuous' ? (
              <>
                <Cloud className="h-4 w-4 text-blue-500" />
                <span>Continuous Release</span>
              </>
            ) : (
              <>
                <Droplets className="h-4 w-4 text-purple-500" />
                <span>Batch Release</span>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Industry type indicator */}
      {showLeakage && (
        <div className="absolute top-52 right-2 bg-white p-2 rounded z-50 shadow-md">
          <div className="flex items-center gap-2 text-sm">
            <Factory className="h-4 w-4 text-gray-700" />
            <span>{industryType.charAt(0).toUpperCase() + industryType.slice(1)} Industry</span>
          </div>
        </div>
      )}
      
      {/* Legend with weather info */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded shadow-lg z-50">
        <h4 className="font-bold text-sm mb-2">Map Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
            <span>Red Zone: Immediate Danger</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
            <span>Orange Zone: Hazardous</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
            <span>Yellow Zone: Caution</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Fixed Sensor</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Mobile Sensor</span>
          </div>
          
          {weatherData && (
            <div className="border-t border-gray-200 pt-1 mt-1">
              <div className="font-medium">Weather Conditions:</div>
              {weatherData.temperature !== undefined && (
                <div className="flex items-center gap-1">
                  <ThermometerSun className="h-3 w-3 text-gray-600" />
                  <span>{weatherData.temperature}°C</span>
                </div>
              )}
              {weatherData.humidity !== undefined && (
                <div className="flex items-center gap-1">
                  <Droplets className="h-3 w-3 text-gray-600" />
                  <span>{weatherData.humidity}% humidity</span>
                </div>
              )}
              {weatherData.weatherCode !== undefined && (
                <div className="flex items-center gap-1">
                  <Cloud className="h-3 w-3 text-gray-600" />
                  <span>{getWeatherDescription(weatherData.weatherCode)}</span>
                </div>
              )}
            </div>
          )}
          
          {releaseType === 'batch' && (
            <div className="flex items-center gap-2">
              <Droplets className="h-3 w-3 text-purple-500" />
              <span>Batch Release Pattern</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to get a readable wind direction label
const getWindDirectionLabel = (direction: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((direction % 360) / 45)) % 8;
  return directions[index];
};

export default Map;
