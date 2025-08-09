import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Map as LeakageMap } from "../components/LeakageMap";
import { SlidingTabNavigation } from "../components/SlidingTabNavigation";
import { IndustryTypeSelector } from "../components/IndustryTypeSelector";
import { ReleaseTypeSelector } from "../components/ReleaseTypeSelector";

import { 
  calculateDispersion, 
  calculateDetailedDispersion, 
  simulateLeakDetection, 
  DetailedCalculationResults,
  generateSensorRecommendations,
  evaluateProtectiveActions
} from "../utils/dispersionModel";
import { chemicalDatabase } from "../utils/chemicalDatabase";
import { AlertCircle, Database, MapPin, Shield, AlertTriangle, CloudRain, Users, Info, FileText, Beaker, Radio } from 'lucide-react';
import ConcentrationChart from "../components/ConcentrationChart";
import CalculationDetails from "../components/CalculationDetails";
import InfrastructureAssessment from "../components/InfrastructureAssessment";
import SimulationComparison from "../components/SimulationComparison";
import WeatherData from "../components/WeatherData";
import SensorManagement from "../components/SensorManagement";
import HazardAssessment from "../components/HazardAssessment";
import MassBalanceComparison from "../components/MassBalanceComparison";

interface WeatherDataType {
  windSpeed: number;
  windDirection: number;
  temperature: number;
  conditions: string;
  humidity: number;
  pressure: number;
  timestamp: string;
}

interface SensorLocation {
  id: string;
  lat: number;
  lng: number;
  type: string;
  status: 'active' | 'inactive' | 'maintenance';
  battery?: number;
  signalStrength?: number;
  lastReading?: number;
  threshold: number;
}

// Function to determine weather condition based on WMO code
const getWeatherCondition = (wmoCode: number): string => {
  if (wmoCode <= 3) return "Clear";
  if (wmoCode <= 9) return "Partly Cloudy";
  if (wmoCode <= 19) return "Foggy";
  if (wmoCode <= 29) return "Precipitation";
  if (wmoCode <= 49) return "Drizzle";
  if (wmoCode <= 69) return "Rain";
  if (wmoCode <= 79) return "Snow";
  if (wmoCode <= 99) return "Thunderstorm";
  return "Unknown";
};

const EmergencyModel = () => {
  const [modelParams, setModelParams] = useState({
    chemicalType: "chlorine",
    releaseRate: 100, // kg/min
    windSpeed: 5, // m/s
    windDirection: 0, // degrees (0 = North, 90 = East)
    stabilityClass: "D", // Pasquill stability class
    temperature: 25, // Celsius
    sourceHeight: 1, // meters
    sourceLocation: { lat: 40.7128, lng: -74.006 }, // Default location
    terrain: "urban", // Default terrain type
    isIndoor: false, // Default to outdoor
    containmentType: "none", // Default containment
    sensorThreshold: 1.0, // Default sensor threshold
    leakDuration: 60, // Default leak duration in minutes
    sensorCount: 5, // Default sensor count
    monitoringMode: "continuous" as "continuous" | "batch", // Default monitoring mode
    relativeHumidity: 50, // Default humidity
    industryType: "chemical", // Default industry type
    releaseType: "continuous" as "continuous" | "batch", // Default release type
    evaporationRateMultiplier: 1.0, // Multiplier for evaporation rate
    poolFormation: false, // Whether a liquid pool forms
    detailedDispersionModel: "gaussian", // Type of dispersion model
    terrainComplexity: "simple", // Terrain complexity
    populationDensity: 1000, // People per square km
    evacuationSpeed: 2.0, // km/h for evacuation calculations
    inverseLapseRate: false, // Weather condition that can trap pollutants
  });

  const [showLeakage, setShowLeakage] = useState(false);
  const [selectingLocation, setSelectingLocation] = useState(false);
  const [zoneData, setZoneData] = useState({
    red: { distance: 1.2, concentration: 5 },
    orange: { distance: 1.6, concentration: 3 },
    yellow: { distance: 2.9, concentration: 1 },
  });
  const [leakDetected, setLeakDetected] = useState(false);
  const [autoDetection, setAutoDetection] = useState(false);
  const [detectionInterval, setDetectionInterval] = useState<NodeJS.Timeout | null>(null);
  
  const [activeTab, setActiveTab] = useState('parameters');
  const [weatherData, setWeatherData] = useState<WeatherDataType | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [showTerrain, setShowTerrain] = useState(false);
  const [sensorLocations, setSensorLocations] = useState<SensorLocation[]>([]);
  const [showSensorOptimization, setShowSensorOptimization] = useState(false);
  
  const [detailedResults, setDetailedResults] = useState<DetailedCalculationResults>({
    redZone: {
      distance: 1.2,
      concentration: 5,
      area: 4.52,
      populationAtRisk: 2260,
    },
    orangeZone: {
      distance: 1.6,
      concentration: 3,
      area: 3.77,
      populationAtRisk: 1885,
    },
    yellowZone: {
      distance: 2.9,
      concentration: 1,
      area: 18.74,
      populationAtRisk: 9370,
    },
    massReleased: 6000,
    evaporationRate: 1.67,
    dispersionCoefficients: {
      sigmaY: 220,
      sigmaZ: 120,
    },
    maximumConcentration: 12.5,
    lethalDistance: 0.84,
    concentrationProfile: Array.from({ length: 21 }, (_, i) => ({
      distance: i * (2.9 * 1.2 / 20),
      concentration: 5 * Math.exp(-3 * i / 20),
    })),
    detectionProbability: 0.85,
    timeToDetection: 5.2,
    detectionThreshold: 1.0,
    falseAlarmRate: 0.5,
    evacuationTime: 45,
    recommendedSensorLocations: []
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setModelParams({
      ...modelParams,
      [name]: value,
    });
  };

  const handleSliderChange = (name: string, value: number[]) => {
    setModelParams({
      ...modelParams,
      [name]: value[0],
    });
  };
  
  const handleLocationChange = (location: { lat: number; lng: number }) => {
    setModelParams({
      ...modelParams,
      sourceLocation: location,
    });
    setSelectingLocation(false);
    fetchWeatherData(location.lat, location.lng);
    toast({
      title: "Location Updated",
      description: `New coordinates: ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`,
    });
  };
  
  const handleLocationSelection = () => {
    setSelectingLocation(true);
    toast({
      title: "Select Location",
      description: "Click on the map to select the industrial site location",
    });
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setModelParams({
      ...modelParams,
      [name]: value,
    });
  };
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setModelParams({
      ...modelParams,
      [name]: checked,
    });
  };

  const handleIndustryTypeChange = (value: string) => {
    setModelParams({
      ...modelParams,
      industryType: value,
    });
    
    toast({
      title: "Industry Type Updated",
      description: `Model parameters adjusted for ${value} industry type`,
    });
  };
  
  const handleReleaseTypeChange = (value: 'continuous' | 'batch') => {
    setModelParams({
      ...modelParams,
      releaseType: value,
      // Adjust other parameters based on release type
      leakDuration: value === 'batch' ? 30 : 60, // Shorter duration for batch releases
    });
    
    toast({
      title: "Release Type Updated",
      description: `${value === 'continuous' ? 'Continuous' : 'Batch'} release pattern selected`,
    });
  };

  const fetchWeatherData = async (lat: number, lng: number) => {
    try {
      setIsLoadingWeather(true);
      
      // Open-Meteo API endpoint (doesn't require API key)
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m&timezone=auto`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract current weather data from Open-Meteo response
      const current = data.current;
      
      // Create weather data object from Open-Meteo response
      const weatherInfo: WeatherDataType = {
        windSpeed: current.wind_speed_10m || 0,
        windDirection: current.wind_direction_10m || 0,
        temperature: current.temperature_2m || 0,
        conditions: getWeatherCondition(current.weather_code),
        humidity: current.relative_humidity_2m || 0,
        pressure: current.surface_pressure || 0,
        timestamp: current.time || new Date().toISOString()
      };
      
      setWeatherData(weatherInfo);
      
      // Update model parameters with real weather data
      setModelParams(prev => ({
        ...prev,
        windSpeed: weatherInfo.windSpeed,
        windDirection: weatherInfo.windDirection,
        temperature: weatherInfo.temperature,
        relativeHumidity: weatherInfo.humidity
      }));
      
      toast({
        title: "Weather Data Updated",
        description: "Model parameters adjusted based on current weather conditions",
      });
    } catch (error) {
      console.error('Error fetching weather:', error);
      toast({
        title: "Weather Data Error",
        description: error instanceof Error ? error.message : "Unable to fetch current weather data",
        variant: "destructive",
      });
    } finally {
      setIsLoadingWeather(false);
    }
  };
  
  const checkForLeaks = useCallback(() => {
    if (autoDetection) {
      const detected = simulateLeakDetection(modelParams);
      if (detected && !leakDetected) {
        setLeakDetected(true);
        setShowLeakage(true);
        // Calculate immediately when a leak is detected
        handleCalculation();
        
        toast({
          title: "ALERT: Leak Detected!",
          description: "Automatic monitoring system has detected a chemical leak. Emergency procedures activated.",
          variant: "destructive",
        });
      }
    }
  }, [autoDetection, modelParams, leakDetected]);
  
  useEffect(() => {
    // Clear any existing interval
    if (detectionInterval) {
      clearInterval(detectionInterval);
    }
    
    // Set up new interval if auto detection is enabled
    if (autoDetection) {
      const interval = setInterval(() => {
        checkForLeaks();
      }, 10000); // Check every 10 seconds
      setDetectionInterval(interval);
    }
    
    // Clean up on component unmount
    return () => {
      if (detectionInterval) clearInterval(detectionInterval);
    };
  }, [autoDetection, checkForLeaks]);

  useEffect(() => {
    fetchWeatherData(modelParams.sourceLocation.lat, modelParams.sourceLocation.lng);
  }, []);

  const handleCalculation = () => {
    try {
      // Call the calculation function with the current parameters
      const result = calculateDispersion(modelParams);
      const detailedResult = calculateDetailedDispersion(modelParams);
      
      // Update the zone data with the calculation results
      setZoneData(result);
      setDetailedResults(detailedResult);
      
      setShowLeakage(true);
      setActiveTab('simulation'); // Switch to simulation tab after calculation
      
      // Update sensor readings if sensors are placed
      if (sensorLocations.length > 0) {
        // Simulate sensor readings based on their distance from the source
        const updatedSensors = sensorLocations.map(sensor => {
          // Calculate distance from source to sensor in km
          const dLat = sensor.lat - modelParams.sourceLocation.lat;
          const dLng = sensor.lng - modelParams.sourceLocation.lng;
          const distance = Math.sqrt(
            Math.pow(dLat * 111.32, 2) + 
            Math.pow(dLng * 111.32 * Math.cos(modelParams.sourceLocation.lat * (Math.PI / 180)), 2)
          );
          
          // Calculate concentration at sensor based on distance
          let reading = 0;
          
          // Find the closest profile point
          const profile = detailedResult.concentrationProfile;
          for (let i = 0; i < profile.length; i++) {
            if (profile[i].distance >= distance || i === profile.length - 1) {
              // Linear interpolation between points
              if (i === 0) {
                reading = profile[i].concentration;
              } else {
                const d1 = profile[i-1].distance;
                const d2 = profile[i].distance;
                const c1 = profile[i-1].concentration;
                const c2 = profile[i].concentration;
                reading = c1 + (c2 - c1) * (distance - d1) / (d2 - d1);
              }
              break;
            }
          }
          
          // Add some randomness
          const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
          reading *= randomFactor;
          
          // Check if the sensor would detect the leak
          return {
            ...sensor,
            lastReading: reading
          };
        });
        
        setSensorLocations(updatedSensors);
        
        // Check if any sensors detected a leak
        const detectedByAnySensor = updatedSensors.some(
          sensor => (sensor.lastReading || 0) > sensor.threshold && sensor.status === 'active'
        );
        
        if (detectedByAnySensor && !leakDetected) {
          setLeakDetected(true);
          toast({
            title: "Leak Detected by Sensors!",
            description: "One or more sensors have detected concentrations above threshold levels.",
            variant: "destructive",
          });
        }
      }
      
      toast({
        title: "Calculation Complete",
        description: "Dispersion modeling has been completed successfully.",
      });
    } catch (error) {
      toast({
        title: "Calculation Error",
        description: "An error occurred during dispersion calculation.",
        variant: "destructive",
      });
    }
  };

  const simulateLeakage = () => {
    toast({
      title: "Leak Detected!",
      description: "Emergency procedure activated. Alert sent to emergency response team.",
      variant: "destructive",
    });
    setShowLeakage(true);
    setLeakDetected(true);
    handleCalculation();
  };

  const refreshWeatherData = () => {
    fetchWeatherData(modelParams.sourceLocation.lat, modelParams.sourceLocation.lng);
  };
  
  const toggleAutoDetection = (checked: boolean) => {
    setAutoDetection(checked);
    if (checked) {
      toast({
        title: "Auto-Detection Enabled",
        description: "System will automatically monitor for leaks.",
      });
    } else {
      toast({
        title: "Auto-Detection Disabled",
        description: "Manual monitoring mode activated.",
      });
    }
  };
  
  const resetLeakDetection = () => {
    setLeakDetected(false);
    setShowLeakage(false);
    // Reset sensor readings
    const resetSensors = sensorLocations.map(sensor => ({
      ...sensor,
      lastReading: 0
    }));
    setSensorLocations(resetSensors);
    toast({
      title: "System Reset",
      description: "Leak detection system has been reset.",
    });
  };
  
  const navigateToAbout = () => {
    window.location.href = '/about';
  };
  
  const toggleTerrainView = (checked: boolean) => {
    setShowTerrain(checked);
  };
  
  const handleOptimizeSensors = () => {
    // Use the helper function to generate optimal sensor placements
    const recommendations = generateSensorRecommendations(
      modelParams,
      zoneData,
      8 // Number of sensors to recommend
    );
    
    // Convert recommendations to sensor locations
    const optimizedSensors: SensorLocation[] = recommendations.map((rec, index) => ({
      id: `sensor-opt-${index}`,
      lat: rec.lat,
      lng: rec.lng,
      type: rec.type,
      status: 'active',
      battery: 100,
      signalStrength: 95,
      lastReading: 0,
      threshold: modelParams.sensorThreshold
    }));
    
    setSensorLocations(optimizedSensors);
    
    toast({
      title: "Sensor Network Optimized",
      description: "Sensors have been placed in strategic locations based on wind direction and terrain.",
    });
  };

  // Define tabs for the sliding navigation - now including "about" tab
  const mainTabs = ['parameters', 'simulation', 'alerts', 'sensors', 'calculations', 'weather', 'industry', 'report', 'mass-balance'];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Emergency Leakage and Dispersion Quantification Model (ELDQM)</h1>
        <p className="text-xl text-muted-foreground">
          Advanced industrial safety monitoring and hazardous material dispersion simulation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Control Panel with Sliding Navigation */}
        <div className="lg:col-span-1">
          <div className="mb-4">
            <SlidingTabNavigation 
              tabs={mainTabs} 
              activeTab={activeTab} 
              onTabChange={setActiveTab}
              includeAboutTab={true}
            />
          </div>
          
          {/* Parameters Tab */}
          {activeTab === 'parameters' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" /> Model Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="chemicalType">Chemical Type</Label>
                  <Select 
                    value={modelParams.chemicalType}
                    onValueChange={(value) => handleSelectChange("chemicalType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select chemical" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chlorine">Chlorine</SelectItem>
                      <SelectItem value="ammonia">Ammonia</SelectItem>
                      <SelectItem value="hydrogen sulfide">Hydrogen Sulfide</SelectItem>
                      <SelectItem value="sulfur dioxide">Sulfur Dioxide</SelectItem>
                      <SelectItem value="methane">Methane</SelectItem>
                      <SelectItem value="carbon monoxide">Carbon Monoxide</SelectItem>
                      <SelectItem value="benzene">Benzene</SelectItem>
                      <SelectItem value="ethylene oxide">Ethylene Oxide</SelectItem>
                      <SelectItem value="hydrogen cyanide">Hydrogen Cyanide</SelectItem>
                      <SelectItem value="phosgene">Phosgene</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="releaseRate">Release Rate (kg/min)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="releaseRate"
                      min={1}
                      max={500}
                      step={1}
                      value={[modelParams.releaseRate]}
                      onValueChange={(value) => handleSliderChange("releaseRate", value)}
                    />
                    <span className="w-12 text-right">{modelParams.releaseRate}</span>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="leakDuration">Leak Duration (min)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="leakDuration"
                      min={1}
                      max={180}
                      step={1}
                      value={[modelParams.leakDuration]}
                      onValueChange={(value) => handleSliderChange("leakDuration", value)}
                    />
                    <span className="w-12 text-right">{modelParams.leakDuration}</span>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="windSpeed">Wind Speed (m/s)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="windSpeed"
                      min={0}
                      max={30}
                      step={0.1}
                      value={[modelParams.windSpeed]}
                      onValueChange={(value) => handleSliderChange("windSpeed", value)}
                    />
                    <span className="w-12 text-right">{modelParams.windSpeed}</span>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="windDirection">Wind Direction (degrees)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="windDirection"
                      min={0}
                      max={359}
                      step={1}
                      value={[modelParams.windDirection]}
                      onValueChange={(value) => handleSliderChange("windDirection", value)}
                    />
                    <span className="w-12 text-right">{modelParams.windDirection}</span>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="temperature">Temperature (°C)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="temperature"
                      min={-50}
                      max={50}
                      step={0.1}
                      value={[modelParams.temperature]}
                      onValueChange={(value) => handleSliderChange("temperature", value)}
                    />
                    <span className="w-12 text-right">{modelParams.temperature}</span>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="relativeHumidity">Relative Humidity (%)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="relativeHumidity"
                      min={0}
                      max={100}
                      step={1}
                      value={[modelParams.relativeHumidity]}
                      onValueChange={(value) => handleSliderChange("relativeHumidity", value)}
                    />
                    <span className="w-12 text-right">{modelParams.relativeHumidity}</span>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="sourceHeight">Source Height (m)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="sourceHeight"
                      min={0}
                      max={100}
                      step={0.1}
                      value={[modelParams.sourceHeight]}
                      onValueChange={(value) => handleSliderChange("sourceHeight", value)}
                    />
                    <span className="w-12 text-right">{modelParams.sourceHeight}</span>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label>Environment Type</Label>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isIndoor" className="cursor-pointer">Indoor Environment</Label>
                    <Switch 
                      id="isIndoor" 
                      checked={modelParams.isIndoor} 
                      onCheckedChange={(checked) => handleSwitchChange("isIndoor", checked)}
                    />
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="terrain">Terrain Type</Label>
                  <Select 
                    value={modelParams.terrain}
                    onValueChange={(value) => handleSelectChange("terrain", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select terrain" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urban">Urban</SelectItem>
                      <SelectItem value="suburban">Suburban</SelectItem>
                      <SelectItem value="rural">Rural</SelectItem>
                      <SelectItem value="forest">Forest</SelectItem>
                      <SelectItem value="water">Water Body</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label>Location</Label>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      Lat: {modelParams.sourceLocation.lat.toFixed(5)}, 
                      Lng: {modelParams.sourceLocation.lng.toFixed(5)}
                    </div>
                    <Button variant="outline" size="sm" onClick={handleLocationSelection}>
                      Select on Map
                    </Button>
                  </div>
                </div>

                <Button className="w-full" onClick={handleCalculation}>
                  Calculate Dispersion
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Simulation Tab */}
          {activeTab === 'simulation' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" /> Simulation Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="stabilityClass">Atmospheric Stability</Label>
                  <Select 
                    value={modelParams.stabilityClass}
                    onValueChange={(value) => handleSelectChange("stabilityClass", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stability class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Class A (Very unstable)</SelectItem>
                      <SelectItem value="B">Class B (Unstable)</SelectItem>
                      <SelectItem value="C">Class C (Slightly unstable)</SelectItem>
                      <SelectItem value="D">Class D (Neutral)</SelectItem>
                      <SelectItem value="E">Class E (Stable)</SelectItem>
                      <SelectItem value="F">Class F (Very stable)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="detailedDispersionModel">Dispersion Model Type</Label>
                  <Select 
                    value={modelParams.detailedDispersionModel}
                    onValueChange={(value) => handleSelectChange("detailedDispersionModel", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select dispersion model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gaussian">Gaussian Plume</SelectItem>
                      <SelectItem value="puff">Gaussian Puff</SelectItem>
                      <SelectItem value="slab">Dense Gas (SLAB)</SelectItem>
                      <SelectItem value="computational">Computational Fluid Dynamics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="monitoringMode">Monitoring Mode</Label>
                  <Select 
                    value={modelParams.monitoringMode}
                    onValueChange={(value: "continuous" | "batch") => handleSelectChange("monitoringMode", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select monitoring mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="continuous">Continuous</SelectItem>
                      <SelectItem value="batch">Batch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="sensorThreshold">Sensor Threshold (mg/m³)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="sensorThreshold"
                      min={0.1}
                      max={5}
                      step={0.1}
                      value={[modelParams.sensorThreshold]}
                      onValueChange={(value) => handleSliderChange("sensorThreshold", value)}
                    />
                    <span className="w-12 text-right">{modelParams.sensorThreshold}</span>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="poolFormation">Pool Formation</Label>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="poolFormation" className="cursor-pointer">Enable Liquid Pool Modeling</Label>
                    <Switch 
                      id="poolFormation" 
                      checked={modelParams.poolFormation} 
                      onCheckedChange={(checked) => handleSwitchChange("poolFormation", checked)}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="sensorCount">Number of Sensors</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="sensorCount"
                      min={1}
                      max={20}
                      step={1}
                      value={[modelParams.sensorCount]}
                      onValueChange={(value) => handleSliderChange("sensorCount", value)}
                    />
                    <span className="w-12 text-right">{modelParams.sensorCount}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-4 pt-2">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex flex-col">
                      <span className="font-medium">Auto Detection</span>
                      <span className="text-sm text-muted-foreground">
                        {autoDetection ? "System is actively monitoring" : "Monitoring disabled"}
                      </span>
                    </div>
                    <Switch checked={autoDetection} onCheckedChange={toggleAutoDetection} />
                  </div>
                  
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex flex-col">
                      <span className="font-medium">Terrain View</span>
                      <span className="text-sm text-muted-foreground">
                        {showTerrain ? "Topographic map" : "Standard map"}
                      </span>
                    </div>
                    <Switch checked={showTerrain} onCheckedChange={toggleTerrainView} />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={simulateLeakage} variant="destructive" disabled={leakDetected}>
                      Simulate Leakage Detection
                    </Button>
                    
                    <Button className="flex-1" onClick={resetLeakDetection} variant="outline" disabled={!leakDetected}>
                      Reset Detection
                    </Button>
                  </div>
                </div>
                
                {showLeakage && <HazardAssessment 
                  chemicalType={modelParams.chemicalType}
                  releaseRate={modelParams.releaseRate}
                  windSpeed={modelParams.windSpeed}
                  detailedResults={detailedResults}
                />}
              </CardContent>
            </Card>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" /> Safety Protocols
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-md bg-red-50 p-4 border border-red-200">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Shield className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Red Zone Protocol</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Immediate evacuation required</li>
                            <li>Respiratory protection mandatory</li>
                            <li>Only emergency response teams with Level A PPE</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-md bg-orange-50 p-4 border border-orange-200">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Shield className="h-5 w-5 text-orange-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-orange-800">Orange Zone Protocol</h3>
                        <div className="mt-2 text-sm text-orange-700">
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Shelter in place or evacuate</li>
                            <li>Respiratory protection recommended</li>
                            <li>Limited access for emergency personnel</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Shield className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Yellow Zone Protocol</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Be alert and monitor situation</li>
                            <li>Prepare for possible evacuation</li>
                            <li>Individuals with respiratory sensitivities should exercise caution</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* ALOHA protective action effectiveness */}
                  <div className="mt-8">
                    <h3 className="text-sm font-medium mb-3">Protective Action Effectiveness</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Full Evacuation</span>
                          <span className="text-sm">{detailedResults.evacuationTime} minutes</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }} />
                        </div>
                      </div>
                      
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Shelter-in-Place</span>
                          <span className="text-sm">70% effective</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '70%' }} />
                        </div>
                      </div>
                      
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Respirator Masks</span>
                          <span className="text-sm">90% effective</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '90%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Industry Tab */}
          {activeTab === 'industry' && (
            <div className="space-y-8">
              <ReleaseTypeSelector 
                value={modelParams.releaseType}
                onChange={handleReleaseTypeChange}
              />
              <IndustryTypeSelector 
                value={modelParams.industryType}
                onChange={handleIndustryTypeChange}
              />
            </div>
          )}

          {/* Report Tab */}
          {activeTab === 'report' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Report Generation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Generate comprehensive reports about the dispersion modeling results and chemical hazards.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Full Report</span>
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span>Safety Report</span>
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Beaker className="h-4 w-4" />
                      <span>Chemical Info</span>
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>Map Export</span>
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg p-4 mt-4">
                    <h3 className="text-sm font-bold mb-2">Executive Summary</h3>
                    <div className="grid grid-cols-2 gap-y-2 text-xs">
                      <div className="font-medium">Chemical:</div>
                      <div>{modelParams.chemicalType}</div>
                      
                      <div className="font-medium">Affected Area:</div>
                      <div>{(detailedResults.redZone.area + detailedResults.orangeZone.area + detailedResults.yellowZone.area).toFixed(2)} km²</div>
                      
                      <div className="font-medium">Population at Risk:</div>
                      <div>{(detailedResults.redZone.populationAtRisk + detailedResults.orangeZone.populationAtRisk + detailedResults.yellowZone.populationAtRisk).toLocaleString()} people</div>
                      
                      <div className="font-medium">Hazard Level:</div>
                      <div className="text-red-500 font-medium">Severe</div>
                      
                      <div className="font-medium">Recommended Action:</div>
                      <div>Full Evacuation</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weather Data Tab */}
          {activeTab === 'weather' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CloudRain className="h-5 w-5" /> Weather Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weatherData ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium text-sm">Current Conditions:</span>
                      <span className="text-sm">{weatherData.conditions}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <span>Temperature:</span>
                      <span>{weatherData.temperature.toFixed(1)}°C</span>
                      
                      <span>Wind Speed:</span>
                      <span>{weatherData.windSpeed.toFixed(1)} m/s</span>
                      
                      <span>Wind Direction:</span>
                      <span>{weatherData.windDirection}°</span>
                      
                      <span>Humidity:</span>
                      <span>{weatherData.humidity.toFixed(0)}%</span>
                      
                      <span>Pressure:</span>
                      <span>{weatherData.pressure.toFixed(0)} hPa</span>
                      
                      <span>Updated:</span>
                      <span>{new Date(weatherData.timestamp).toLocaleTimeString()}</span>
                    </div>
                    
                    <div className="pt-2">
                      <Button onClick={refreshWeatherData} size="sm" className="w-full" variant="outline">
                        Refresh Weather Data
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40">
                    {isLoadingWeather ? (
                      <div className="text-center">
                        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-sm text-muted-foreground">Loading weather data...</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">No weather data available.</p>
                        <Button onClick={refreshWeatherData} size="sm">
                          Get Weather Data
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Sensors Tab */}
          {activeTab === 'sensors' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="h-5 w-5" /> Sensor Network
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Configure and optimize the sensor network for maximum coverage and early detection.
                  </p>
                  
                  <Button onClick={handleOptimizeSensors} className="w-full">
                    Optimize Sensor Placement
                  </Button>
                  
                  <div className="border rounded-lg p-3">
                    <h3 className="text-sm font-medium mb-2">Sensor Statistics</h3>
                    <div className="grid grid-cols-2 gap-y-2 text-xs">
                      <div>Total Sensors:</div>
                      <div>{sensorLocations.length}</div>
                      
                      <div>Active:</div>
                      <div>{sensorLocations.filter(s => s.status === 'active').length}</div>
                      
                      <div>Fixed Sensors:</div>
                      <div>{sensorLocations.filter(s => s.type === 'fixed').length}</div>
                      
                      <div>Mobile Sensors:</div>
                      <div>{sensorLocations.filter(s => s.type === 'mobile').length}</div>
                      
                      <div>Detection Threshold:</div>
                      <div>{modelParams.sensorThreshold} mg/m³</div>
                      
                      <div>Detection Probability:</div>
                      <div>{(detailedResults.detectionProbability * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                  
                  {sensorLocations.length > 0 && (
                    <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
                      <h3 className="text-sm font-medium mb-2">Sensor List</h3>
                      <div className="space-y-2">
                        {sensorLocations.map((sensor, index) => (
                          <div key={sensor.id} className="flex justify-between text-xs items-center p-1 bg-slate-50 rounded">
                            <div>
                              <div className="font-medium">Sensor {index + 1}</div>
                              <div className="text-muted-foreground">
                                {sensor.type}, {sensor.status}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={
                                (sensor.lastReading || 0) > sensor.threshold 
                                  ? "text-red-500 font-medium" 
                                  : "text-green-600"
                              }>
                                {sensor.lastReading ? sensor.lastReading.toFixed(2) : "0.00"} mg/m³
                              </div>
                              <div className="text-muted-foreground">
                                Threshold: {sensor.threshold} mg/m³
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Calculations Tab */}
          {activeTab === 'calculations' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Detailed Calculations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Dispersion Model Results</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="font-medium">Red Zone Distance:</div>
                    <div>{detailedResults.redZone.distance.toFixed(2)} km</div>
                    
                    <div className="font-medium">Orange Zone Distance:</div>
                    <div>{detailedResults.orangeZone.distance.toFixed(2)} km</div>
                    
                    <div className="font-medium">Yellow Zone Distance:</div>
                    <div>{detailedResults.yellowZone.distance.toFixed(2)} km</div>
                    
                    <div className="font-medium">Total Affected Area:</div>
                    <div>{(detailedResults.redZone.area + detailedResults.orangeZone.area + detailedResults.yellowZone.area).toFixed(2)} km²</div>
                    
                    <div className="font-medium">Total Population at Risk:</div>
                    <div>{(detailedResults.redZone.populationAtRisk + detailedResults.orangeZone.populationAtRisk + detailedResults.yellowZone.populationAtRisk).toLocaleString()}</div>
                    
                    <div className="font-medium">Mass Released:</div>
                    <div>{detailedResults.massReleased.toLocaleString()} kg</div>
                    
                    <div className="font-medium">Evaporation Rate:</div>
                    <div>{detailedResults.evaporationRate.toFixed(2)} kg/min</div>
                    
                    <div className="font-medium">Maximum Concentration:</div>
                    <div>{detailedResults.maximumConcentration.toFixed(2)} mg/m³</div>
                    
                    <div className="font-medium">Lethal Distance:</div>
                    <div>{detailedResults.lethalDistance.toFixed(2)} km</div>
                    
                    <div className="font-medium">Detection Time:</div>
                    <div>{detailedResults.timeToDetection.toFixed(1)} min</div>
                    
                    <div className="font-medium">Chemical Type:</div>
                    <div>{modelParams.chemicalType}</div>
                    
                    <div className="font-medium">Industry Type:</div>
                    <div>{modelParams.industryType}</div>
                    
                    <div className="font-medium">Release Type:</div>
                    <div>{modelParams.releaseType}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Mass Balance Tab */}
          {activeTab === 'mass-balance' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Beaker className="h-5 w-5" /> Mass Balance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MassBalanceComparison
                  chemicalType={modelParams.chemicalType}
                  initialMass={modelParams.releaseRate * modelParams.leakDuration}
                  temperature={modelParams.temperature}
                  pressure={1.0} // Default to 1 atm
                />
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Map and Data Display Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map Display */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="h-[600px]">
                <LeakageMap
                  showLeakage={showLeakage}
                  windDirection={modelParams.windDirection}
                  windSpeed={modelParams.windSpeed}
                  sourceLocation={modelParams.sourceLocation}
                  zoneData={zoneData}
                  onLocationChange={handleLocationChange}
                  selectingLocation={selectingLocation}
                  detected={leakDetected}
                  sensorLocations={sensorLocations}
                  showTerrain={showTerrain}
                  industryType={modelParams.industryType}
                  releaseType={modelParams.releaseType}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Data Visualization Section */}
          {showLeakage && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md">Concentration Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <ConcentrationChart data={detailedResults.concentrationProfile} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md">Health Impact Assessment</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">Population at Risk</div>
                        <div className="text-2xl font-bold">
                          {(detailedResults.redZone.populationAtRisk + 
                           detailedResults.orangeZone.populationAtRisk + 
                           detailedResults.yellowZone.populationAtRisk).toLocaleString()}
                        </div>
                      </div>
                      <Users className="h-8 w-8 text-primary opacity-80" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Red Zone (Critical):</span>
                        <span className="font-medium">{detailedResults.redZone.populationAtRisk.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, (detailedResults.redZone.populationAtRisk / 
                              (detailedResults.redZone.populationAtRisk + 
                               detailedResults.orangeZone.populationAtRisk + 
                               detailedResults.yellowZone.populationAtRisk)) * 100)}%` 
                          }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>Orange Zone (Serious):</span>
                        <span className="font-medium">{detailedResults.orangeZone.populationAtRisk.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, (detailedResults.orangeZone.populationAtRisk / 
                              (detailedResults.redZone.populationAtRisk + 
                               detailedResults.orangeZone.populationAtRisk + 
                               detailedResults.yellowZone.populationAtRisk)) * 100)}%` 
                          }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>Yellow Zone (Moderate):</span>
                        <span className="font-medium">{detailedResults.yellowZone.populationAtRisk.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, (detailedResults.yellowZone.populationAtRisk / 
                              (detailedResults.redZone.populationAtRisk + 
                               detailedResults.orangeZone.populationAtRisk + 
                               detailedResults.yellowZone.populationAtRisk)) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyModel;
