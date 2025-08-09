
import React, { useState } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  CircleMarker,
  Polygon,
  useMapEvents,
  useMap,
  LayersControl,
  Tooltip
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Wind, AlertCircle, MapPin, Droplets, Radar, ThermometerSun, CloudFog } from 'lucide-react';
import L from 'leaflet';

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

// Custom marker icons for different sensor types
const createCustomIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
    iconSize: [15, 15],
    iconAnchor: [8, 8]
  });
};

interface ZoneData {
  red: { distance: number; concentration: number };
  orange: { distance: number; concentration: number };
  yellow: { distance: number; concentration: number };
}

interface SensorLocation {
  lat: number;
  lng: number;
  type: string;
  priority?: number;
  name?: string;
  reading?: number;
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
  sensorLocations?: Array<SensorLocation>;
  showTerrain?: boolean;
  showSatellite?: boolean;
  leakConfidence?: number;
  poolData?: {
    radius: number;
    evaporationRate: number;
  };
  stabilityClass?: string;
  enableTopographicEffects?: boolean;
  weatherImpact?: {
    windFactor: number;
    stabilityClass: string;
    dispersionMultiplier: number;
  };
  temperature?: number;
  humidity?: number;
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
const WindDirectionArrow = ({ position, direction, speed, stabilityClass, temperature }: { 
  position: [number, number], 
  direction: number,
  speed: number,
  stabilityClass?: string,
  temperature?: number
}) => {
  // Get stability class description
  const getStabilityDescription = (stabilityClass?: string) => {
    switch(stabilityClass) {
      case 'A': return 'Very Unstable';
      case 'B': return 'Unstable';
      case 'C': return 'Slightly Unstable';
      case 'D': return 'Neutral';
      case 'E': return 'Stable';
      case 'F': return 'Very Stable';
      default: return stabilityClass || 'Unknown';
    }
  };

  // Determine wind speed category and color
  const getWindSpeedCategory = (speed: number) => {
    if (speed < 2) return { category: 'Light', color: 'text-blue-500' };
    if (speed < 5) return { category: 'Moderate', color: 'text-green-500' };
    if (speed < 10) return { category: 'Strong', color: 'text-yellow-500' };
    return { category: 'Very Strong', color: 'text-red-500' };
  };
  
  const windCategory = getWindSpeedCategory(speed);

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
        </div>
      </div>
    </div>
  );
};

// Function to generate directional plume coordinates with enhanced ALOHA modeling and Gaussian principles
const generateDirectionalPlume = (
  center: L.LatLngExpression,
  distance: number,
  direction: number,
  windSpeed: number,
  stabilityClass: string = 'D',
  spreadFactor = 120,
  enableTopographicEffects: boolean = false,
  weatherDispersionMultiplier: number = 1.0
): L.LatLngExpression[] => {
  // Convert center to array if it's not already
  const centerPoint = (Array.isArray(center)) ? center as [number, number] : [center.lat, center.lng];
  
  // Adjust dispersion based on stability class (ALOHA method)
  let stabilityFactor: number;
  switch(stabilityClass) {
    case 'A': stabilityFactor = 1.3; break; // Very unstable - wider plume
    case 'B': stabilityFactor = 1.15; break; // Unstable
    case 'C': stabilityFactor = 1.0; break; // Slightly unstable
    case 'D': stabilityFactor = 0.9; break; // Neutral conditions
    case 'E': stabilityFactor = 0.7; break; // Stable
    case 'F': stabilityFactor = 0.55; break; // Very stable - narrower plume
    default: stabilityFactor = 0.9; // Default neutral
  }
  
  // Calculate windFactor for elongation based on ALOHA algorithms
  // Stronger winds elongate plume downwind but reduce crosswind spread
  const windFactor = Math.min(Math.max(windSpeed, 1), 15) / 5; 
  
  // Apply weather impact multiplier to distance
  const adjustedDistance = distance * weatherDispersionMultiplier;
  
  // Calculate downwind distance (elongated based on wind speed)
  const downwindDistance = adjustedDistance * (1 + windFactor * 0.7);
  
  // Convert to radians
  const directionRad = (direction * Math.PI) / 180;
  
  // Calculate crosswind spread (inversely related to wind speed, affected by stability)
  const crosswindSpread = (spreadFactor * Math.PI / 180) * stabilityFactor * (1 - windFactor * 0.25);
  
  // Generate points for a more realistic plume shape
  const points: L.LatLngExpression[] = [];
  
  // Add source point
  points.push(centerPoint as L.LatLngExpression);
  
  // Number of points for smooth contour
  const numRadialPoints = 36; // More points for smoother shape
  const numDistanceSteps = 8; // Create multiple contour rings for better shape
  
  // Create a more realistic plume shape with multiple contour rings
  for (let distStep = 1; distStep <= numDistanceSteps; distStep++) {
    // Distance increases non-linearly for better plume shape
    const distFraction = Math.pow(distStep / numDistanceSteps, 1.5);
    const currentDistance = downwindDistance * distFraction;
    
    // Width of plume increases with distance (Gaussian dispersion principle)
    const spreadMultiplier = 0.3 + 0.7 * distFraction;
    const currentSpread = crosswindSpread * spreadMultiplier;
    
    // For each distance step, create points around an arc
    for (let i = 0; i <= numRadialPoints; i++) {
      // Generate points in an arc around the wind direction
      // Adjust the angle distribution to create a teardrop shape
      const angleFraction = i / numRadialPoints;
      const adjustedAngle = Math.pow(angleFraction * 2 - 1, 3) * 0.5 + 0.5; // Skewed distribution
      const angle = directionRad - currentSpread/2 + (currentSpread * adjustedAngle);
      
      // Distance from centerline affects downwind reach (Gaussian principle)
      const angleFromCenterline = Math.abs(angle - directionRad);
      const gaussianFactor = Math.exp(-Math.pow(angleFromCenterline / (currentSpread/5), 2) / 2);
      
      // Calculate actual distance for this point (reduced for points away from centerline)
      const pointDistance = currentDistance * gaussianFactor;
      
      // Apply small random variations if topographic effects are enabled
      const randomVariation = enableTopographicEffects ? 
        (Math.random() * 0.2 - 0.1) * pointDistance * distFraction : 0;
      
      // Calculate coordinates with Haversine formula approximation
      const lat = centerPoint[0] + ((pointDistance + randomVariation) * Math.cos(angle)) / 111.32;
      const lng = centerPoint[1] + ((pointDistance + randomVariation) * Math.sin(angle)) / 
        (111.32 * Math.cos(centerPoint[0] * (Math.PI / 180)));
      
      // Only add the point if it's not too close to an existing point (reduce density)
      if (distStep === numDistanceSteps || i % 2 === 0) {
        points.push([lat, lng] as L.LatLngExpression);
      }
    }
  }
  
  // Add closure points to create proper polygon (connect back to center)
  if (points.length > 2) {
    points.push(centerPoint as L.LatLngExpression);
  }
  
  return points;
};

const EnhancedLeakageMap = ({ 
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
  showSatellite = false,
  leakConfidence = 0,
  poolData,
  stabilityClass = 'D',
  enableTopographicEffects = false,
  weatherImpact,
  temperature,
  humidity
}: MapProps) => {
  const [activeLayer, setActiveLayer] = useState<'streets' | 'satellite' | 'terrain'>('streets');
  
  // Convert to LatLng type for Leaflet
  const position: L.LatLngExpression = [sourceLocation.lat, sourceLocation.lng];
  
  // Get the weather impact dispersion multiplier if available, otherwise use 1.0
  const weatherDispersionMultiplier = weatherImpact?.dispersionMultiplier || 1.0;
  
  // Use the stability class from weather impact if available, otherwise use the provided one
  const effectiveStabilityClass = weatherImpact?.stabilityClass || stabilityClass;
  
  // Generate directional plumes with enhanced ALOHA modeling and weather impacts
  // Each zone uses slightly different parameters for visual distinction
  const redZonePlume = generateDirectionalPlume(
    position, 
    zoneData.red.distance, 
    windDirection, 
    windSpeed, 
    effectiveStabilityClass,
    90, // Narrower spread for red zone
    enableTopographicEffects,
    weatherDispersionMultiplier
  );
  
  const orangeZonePlume = generateDirectionalPlume(
    position, 
    zoneData.orange.distance, 
    windDirection, 
    windSpeed, 
    effectiveStabilityClass,
    105, // Medium spread for orange zone
    enableTopographicEffects,
    weatherDispersionMultiplier
  );
  
  const yellowZonePlume = generateDirectionalPlume(
    position, 
    zoneData.yellow.distance, 
    windDirection, 
    windSpeed, 
    effectiveStabilityClass,
    120, // Wider spread for yellow zone
    enableTopographicEffects,
    weatherDispersionMultiplier
  );
  
  // Create weather-aware zone descriptions
  const getWeatherAwareDescription = (zone: string) => {
    if (!weatherImpact) return "";
    
    const { dispersionMultiplier } = weatherImpact;
    if (dispersionMultiplier > 1.2) {
      return `Current weather conditions increase the ${zone} zone area by ${Math.round((dispersionMultiplier - 1) * 100)}%`;
    } else if (dispersionMultiplier < 0.8) {
      return `Current weather conditions reduce the ${zone} zone area by ${Math.round((1 - dispersionMultiplier) * 100)}%`;
    }
    return "";
  };
  
  // Create specific visualization elements
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
          <p>Distance: {Number(zoneData.red.distance * weatherDispersionMultiplier).toFixed(2)} km</p>
          <p>Concentration: {Number(zoneData.red.concentration).toFixed(2)} mg/m³</p>
          <p className="font-semibold">Immediate evacuation required</p>
          {weatherImpact && (
            <p className="text-xs mt-1 text-gray-600">{getWeatherAwareDescription("red")}</p>
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
          <p>Distance: {Number(zoneData.orange.distance * weatherDispersionMultiplier).toFixed(2)} km</p>
          <p>Concentration: {Number(zoneData.orange.concentration).toFixed(2)} mg/m³</p>
          <p className="font-semibold">Shelter in place or evacuate</p>
          {weatherImpact && (
            <p className="text-xs mt-1 text-gray-600">{getWeatherAwareDescription("orange")}</p>
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
          <p>Distance: {Number(zoneData.yellow.distance * weatherDispersionMultiplier).toFixed(2)} km</p>
          <p>Concentration: {Number(zoneData.yellow.concentration).toFixed(2)} mg/m³</p>
          <p className="font-semibold">Be alert and monitor situation</p>
          {weatherImpact && (
            <p className="text-xs mt-1 text-gray-600">{getWeatherAwareDescription("yellow")}</p>
          )}
        </div>
      </Popup>
    </Polygon>
  );
  
  // Draw liquid pool if available
  const liquidPool = poolData?.radius ? (
    <CircleMarker 
      center={position}
      radius={Math.max(5, Math.min(30, poolData.radius * 20))}
      pathOptions={{ 
        fillColor: '#4fc3f7', 
        fillOpacity: 0.7, 
        color: '#0288d1',
        weight: 1
      }}
    >
      <Popup>
        <div>
          <h3 className="font-bold text-blue-600">Liquid Pool</h3>
          <p>Radius: {(poolData.radius).toFixed(2)} km</p>
          <p>Evaporation Rate: {poolData.evaporationRate.toFixed(3)} kg/min</p>
          <p>Area: {(Math.PI * Math.pow(poolData.radius, 2)).toFixed(2)} km²</p>
        </div>
      </Popup>
    </CircleMarker>
  ) : null;
  
  return (
    <div className="w-full h-full relative">
      <MapContainer 
        key={`map-${sourceLocation.lat.toFixed(5)}-${sourceLocation.lng.toFixed(5)}`}
        center={position}
        zoom={12} 
        style={{ height: '100%', width: '100%' }}
      >
        <LayersControl>
          <LayersControl.BaseLayer checked={!showSatellite && !showTerrain} name="Streets">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer checked={showTerrain} name="Terrain">
            <TileLayer
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer checked={showSatellite} name="Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
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
              <p>Wind Speed: {windSpeed} m/s</p>
              <p>Coordinates: {sourceLocation.lat.toFixed(5)}, {sourceLocation.lng.toFixed(5)}</p>
              {weatherImpact && (
                <p className="text-sm font-medium mt-1">
                  Weather Impact: {weatherImpact.dispersionMultiplier.toFixed(2)}x
                </p>
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
            {liquidPool}
          </>
        )}
        
        {/* Show sensor locations with improved visualization */}
        {sensorLocations.map((sensor, index) => {
          // Determine color based on sensor type or priority
          let sensorColor = sensor.type === 'fixed' ? '#1976d2' : '#43a047';
          if (sensor.priority) {
            if (sensor.priority === 1) sensorColor = '#d32f2f';
            if (sensor.priority === 2) sensorColor = '#f57c00';
          }
          
          // If sensor has reading, adjust visualization
          const hasReading = typeof sensor.reading === 'number';
          
          return (
            <CircleMarker 
              key={`sensor-${index}`}
              center={[sensor.lat, sensor.lng]}
              radius={5}
              pathOptions={{ 
                fillColor: sensorColor, 
                color: 'white',
                weight: 2,
                fillOpacity: 0.8
              }}
            >
              {sensor.name && (
                <Tooltip>
                  <span className="text-xs">{sensor.name}</span>
                </Tooltip>
              )}
              <Popup>
                <div>
                  <h3 className="font-bold">Sensor {sensor.name || (index + 1)}</h3>
                  <p>Type: {sensor.type === 'fixed' ? 'Fixed' : 'Mobile'}</p>
                  {sensor.priority && (
                    <p>Priority: {sensor.priority}</p>
                  )}
                  {hasReading && (
                    <p>Reading: {sensor.reading} mg/m³</p>
                  )}
                  <p>Coordinates: {sensor.lat.toFixed(5)}, {sensor.lng.toFixed(5)}</p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      
      {/* Wind direction indicator with weather data */}
      {showLeakage && (
        <WindDirectionArrow 
          position={[sourceLocation.lat, sourceLocation.lng]} 
          direction={windDirection}
          speed={windSpeed}
          stabilityClass={effectiveStabilityClass}
          temperature={temperature}
        />
      )}
      
      {/* Selection mode indicator */}
      {selectingLocation && (
        <div className="absolute top-2 left-2 bg-white p-2 rounded z-50 shadow-md text-sm">
          Click on the map to select the industrial site location
        </div>
      )}
      
      {/* Enhanced Leak detection indicator */}
      {detected && (
        <div className="absolute top-2 left-2 bg-red-600 text-white p-2 rounded z-50 shadow-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4 animate-pulse" />
          <div>
            <div>Leak Detected - Emergency Response Required</div>
            {leakConfidence > 0 && (
              <div className="text-xs">Detection confidence: {Math.round(leakConfidence * 100)}%</div>
            )}
          </div>
        </div>
      )}
      
      {/* Weather impact indicator */}
      {showLeakage && weatherImpact && weatherImpact.dispersionMultiplier !== 1.0 && (
        <div className="absolute top-40 right-2 bg-white p-2 rounded z-50 shadow-md">
          <div className="flex items-center gap-2 text-sm">
            <CloudFog className={`h-4 w-4 ${
              weatherImpact.dispersionMultiplier > 1.2 ? 'text-red-500' : 
              weatherImpact.dispersionMultiplier < 0.8 ? 'text-green-500' : 
              'text-blue-500'
            }`} />
            <span>Weather Impact: {weatherImpact.dispersionMultiplier.toFixed(2)}x</span>
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {weatherImpact.dispersionMultiplier > 1.2 
              ? 'Weather conditions increase hazard zone' 
              : weatherImpact.dispersionMultiplier < 0.8
              ? 'Weather conditions reduce hazard zone'
              : 'Normal dispersion conditions'}
          </div>
        </div>
      )}
      
      {/* Humidity indicator */}
      {showLeakage && humidity !== undefined && (
        <div className="absolute top-64 right-2 bg-white p-2 rounded z-50 shadow-md">
          <div className="flex items-center gap-2 text-sm">
            <Droplets className={`h-4 w-4 ${
              humidity > 80 ? 'text-blue-600' : 
              humidity < 30 ? 'text-yellow-500' : 
              'text-blue-400'
            }`} />
            <span>Humidity: {humidity}%</span>
          </div>
        </div>
      )}
      
      {/* ALOHA Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded shadow-lg z-50">
        <h4 className="font-bold text-sm mb-2">ELDQM Map Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
            <span>Red Zone: Immediate Danger (AEGL-3/ERPG-3)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
            <span>Orange Zone: Hazardous (AEGL-2/ERPG-2)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
            <span>Yellow Zone: Caution (AEGL-1/ERPG-1)</span>
          </div>
          {liquidPool && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Liquid Pool Formation</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full border border-white"></div>
            <span>Fixed Sensor</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full border border-white"></div>
            <span>Mobile Sensor</span>
          </div>
          <div className="border-t border-gray-200 pt-1 mt-1">
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-gray-500" />
              <span>Atmospheric Stability: Class {effectiveStabilityClass}</span>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="h-3 w-3 text-gray-500" />
              <span>Wind Speed: {windSpeed.toFixed(1)} m/s</span>
            </div>
            {weatherImpact && (
              <div className="flex items-center gap-2 text-sm font-medium mt-1">
                <CloudFog className="h-3 w-3 text-blue-500" />
                <span className={`${
                  weatherImpact.dispersionMultiplier > 1.2 ? 'text-red-600' : 
                  weatherImpact.dispersionMultiplier < 0.8 ? 'text-green-600' : 
                  'text-blue-600'
                }`}>
                  Weather Factor: {weatherImpact.dispersionMultiplier.toFixed(2)}x
                </span>
              </div>
            )}
          </div>
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

export default EnhancedLeakageMap;
