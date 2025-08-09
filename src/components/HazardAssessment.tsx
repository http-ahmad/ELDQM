import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { AlertTriangle, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { chemicalDatabase } from '../utils/chemicalDatabase';
import { getExposureGuidelines, getThresholdDescriptions } from '../utils/chemicalUtils';
import { evaluateProtectiveActions } from '../utils/dispersionModel';

interface HazardAssessmentProps {
  chemicalType: string;
  releaseRate: number;
  windSpeed: number;
  detailedResults: any;
}

const HazardAssessment: React.FC<HazardAssessmentProps> = ({
  chemicalType,
  releaseRate,
  windSpeed,
  detailedResults
}) => {
  const chemical = chemicalDatabase[chemicalType] || null;
  const exposureGuidelines = chemical ? getExposureGuidelines(chemicalType) : null;
  const thresholdDescriptions = getThresholdDescriptions();
  
  // State for active safety protocol
  const [activeProtocol, setActiveProtocol] = useState<'shelter' | 'evacuation' | 'mixed'>('mixed');
  
  // Calculate protective action effectiveness
  const shelterEffectiveness = evaluateProtectiveActions(
    {
      chemicalType,
      releaseRate,
      windSpeed,
      windDirection: 90,
      stabilityClass: 'D',
      temperature: 20,
      sourceHeight: 1,
      sourceLocation: { lat: 0, lng: 0 }
    },
    detailedResults.evacuationTime,
    'indoor'
  );
  
  const evacuationEffectiveness = evaluateProtectiveActions(
    {
      chemicalType,
      releaseRate,
      windSpeed,
      windDirection: 90,
      stabilityClass: 'D',
      temperature: 20,
      sourceHeight: 1,
      sourceLocation: { lat: 0, lng: 0 }
    },
    detailedResults.evacuationTime,
    'fullEvacuation'
  );
  
  // Convert concentrationProfile to include threshold crossovers
  const processedConcentrationProfile = detailedResults.concentrationProfile.map((point: any) => {
    const result = { ...point };
    
    // Add calculated fields to track where guidelines are crossed
    if (exposureGuidelines) {
      if (chemical?.aegl1 && result.concentration >= chemical.aegl1) {
        result.aegl1Crossed = result.concentration;
      }
      if (chemical?.aegl2 && result.concentration >= chemical.aegl2) {
        result.aegl2Crossed = result.concentration;
      }
      if (chemical?.aegl3 && result.concentration >= chemical.aegl3) {
        result.aegl3Crossed = result.concentration;
      }
    }
    
    return result;
  });
  
  // Prepare health impact assessment data
  const healthImpactData = [
    {
      severity: 'Fatal/Life-threatening',
      distance: detailedResults.redZone.distance,
      population: detailedResults.redZone.populationAtRisk,
      area: detailedResults.redZone.area
    },
    {
      severity: 'Serious Health Effects',
      distance: detailedResults.orangeZone.distance,
      population: detailedResults.orangeZone.populationAtRisk,
      area: detailedResults.orangeZone.area
    },
    {
      severity: 'Mild Health Effects',
      distance: detailedResults.yellowZone.distance,
      population: detailedResults.yellowZone.populationAtRisk,
      area: detailedResults.yellowZone.area
    }
  ];
  
  // Calculate statistical safety factors
  const safetyFactorData = [
    {
      name: 'Evacuation Time',
      actual: detailedResults.evacuationTime,
      required: detailedResults.timeToDetection + 30,
      unit: 'minutes'
    },
    {
      name: 'Detection Time',
      actual: detailedResults.timeToDetection,
      target: 5,
      unit: 'minutes'
    },
    {
      name: 'Detection Probability',
      actual: detailedResults.detectionProbability * 100,
      target: 90,
      unit: '%'
    },
    {
      name: 'False Alarm Rate',
      actual: detailedResults.falseAlarmRate,
      target: 1,
      unit: 'per month'
    }
  ];
  
  // Enhanced safety recommendation data
  const safetyRecommendationData = [
    { name: 'Personal Protective Equipment', value: 80 },
    { name: 'Evacuation Routes', value: 75 },
    { name: 'Communication Systems', value: 85 },
    { name: 'Medical Response', value: 70 },
    { name: 'Decontamination', value: 60 }
  ];
  
  // Safety protocols comparison data
  const safetyProtocolsData = [
    {
      subject: 'Effectiveness',
      A: shelterEffectiveness.effectivenessPercent,
      B: evacuationEffectiveness.effectivenessPercent,
      fullMark: 100,
    },
    {
      subject: 'Time Required',
      A: 90, // Shelter in place is quick
      B: 60, // Evacuation takes longer
      fullMark: 100,
    },
    {
      subject: 'Resource Needs',
      A: 85, // Shelter needs fewer resources
      B: 50, // Evacuation needs more resources
      fullMark: 100,
    },
    {
      subject: 'Complication Risk',
      A: 70, // Moderate risk of complications for sheltering
      B: 40, // Higher risk for evacuation
      fullMark: 100,
    },
    {
      subject: 'Long-term Safety',
      A: 50, // Sheltering has limitations for long-term
      B: 80, // Evacuation may be better long-term
      fullMark: 100,
    },
  ];
  
  // PPE effectiveness data based on chemical type
  const ppeEffectivenessData = [
    { name: 'Level A Suit', value: 100 },
    { name: 'SCBA', value: 95 },
    { name: 'Level B Suit', value: 85 },
    { name: 'Full-face Respirator', value: 70 },
    { name: 'Half-face Respirator', value: 40 }
  ];
  
  // Calculate overall safety score based on multiple factors
  const calculateSafetyScore = () => {
    // Base the score on multiple factors
    const detectionFactor = Math.min(1, detailedResults.detectionProbability * 1.3);
    const responseFactor = Math.min(1, detailedResults.timeToDetection > 0 ? 
        5 / detailedResults.timeToDetection : 0.5);
    const evacuationFactor = Math.min(1, detailedResults.evacuationTime > 0 ?
        40 / detailedResults.evacuationTime : 0.3);
        
    // Weighted score
    return Math.round((detectionFactor * 0.4 + responseFactor * 0.3 + evacuationFactor * 0.3) * 100);
  };
  
  const safetyScore = calculateSafetyScore();
  
  // Get safety score color
  const getSafetyScoreColor = (score: number) => {
    if (score >= 80) return "#4CAF50"; // Green
    if (score >= 60) return "#FFC107"; // Amber
    return "#F44336"; // Red
  };
  
  // Wind speed vs. affected area correlation data
  const windSpeedData = [
    { speed: 1, area: 35.7 },
    { speed: 2, area: 24.3 },
    { speed: 3, area: 18.6 },
    { speed: 5, area: 12.4 },
    { speed: 8, area: 9.2 },
    { speed: 10, area: 7.5 },
    { speed: 15, area: 4.3 },
    { speed: 20, area: 3.1 }
  ];
  
  // Colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          ALOHA Hazard Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="exposure" className="w-full">
          <div className="px-4 pt-2 border-b">
            <ScrollArea className="w-full" orientation="horizontal">
              <TabsList className="w-full flex justify-start h-10 px-2">
                <TabsTrigger value="exposure" className="px-4">Exposure Analysis</TabsTrigger>
                <TabsTrigger value="population" className="px-4">Population Impact</TabsTrigger>
                <TabsTrigger value="safety" className="px-4">Safety Metrics</TabsTrigger>
                <TabsTrigger value="safetymeasures" className="px-4">
                  <Shield className="mr-1 h-3 w-3" />
                  Safety Measures
                </TabsTrigger>
              </TabsList>
            </ScrollArea>
          </div>
          
          <TabsContent value="exposure" className="p-4">
            <ScrollArea className="h-[600px] pr-4">
              <h3 className="text-sm font-medium mb-2">
                {chemical?.name || chemicalType} Concentration Over Distance
              </h3>
              
              {chemical && (
                <div className="p-4 bg-slate-50 rounded-md mb-4 text-sm">
                  <div className="font-medium text-base mb-2">{chemical.name} Properties:</div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-1">
                    <div><span className="text-slate-500 font-medium">CAS:</span> {chemical.cas}</div>
                    <div><span className="text-slate-500 font-medium">Mol. Weight:</span> {chemical.molecularWeight} g/mol</div>
                    <div><span className="text-slate-500 font-medium">LEL:</span> {chemical.lel}%</div>
                    <div><span className="text-slate-500 font-medium">IDLH:</span> {chemical.idlh} ppm</div>
                  </div>
                  <div className="mt-3 text-slate-700 p-2 bg-white rounded border">
                    {chemical.description}
                  </div>
                </div>
              )}
              
              <div className="h-[300px] w-full bg-white p-2 rounded-lg border mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={processedConcentrationProfile}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="distance" 
                      label={{ value: 'Distance (km)', position: 'insideBottomRight', offset: -5 }} 
                    />
                    <YAxis 
                      label={{ value: 'Concentration (mg/m³)', angle: -90, position: 'insideLeft' }} 
                    />
                    <Tooltip 
                      formatter={(value) => [`${value} mg/m³`, 'Concentration']} 
                      labelFormatter={(label) => `Distance: ${label} km`}
                    />
                    <Legend />
                    
                    {exposureGuidelines?.aegl3 && (
                      <ReferenceLine 
                        y={exposureGuidelines.aegl3} 
                        stroke="red" 
                        strokeDasharray="3 3" 
                        label={{ value: 'AEGL-3', position: 'right' }} 
                      />
                    )}
                    
                    {exposureGuidelines?.aegl2 && (
                      <ReferenceLine 
                        y={exposureGuidelines.aegl2} 
                        stroke="orange" 
                        strokeDasharray="3 3" 
                        label={{ value: 'AEGL-2', position: 'right' }} 
                      />
                    )}
                    
                    {exposureGuidelines?.aegl1 && (
                      <ReferenceLine 
                        y={exposureGuidelines.aegl1} 
                        stroke="#ffc107" 
                        strokeDasharray="3 3" 
                        label={{ value: 'AEGL-1', position: 'right' }} 
                      />
                    )}
                    
                    <Line 
                      type="monotone" 
                      dataKey="concentration" 
                      stroke="#1e88e5" 
                      name="Concentration" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }} 
                    />
                    
                    {exposureGuidelines?.aegl1 && (
                      <Line 
                        type="monotone" 
                        dataKey="aegl1Crossed" 
                        stroke="#ffc107" 
                        name="AEGL-1 Exceeded" 
                        strokeWidth={0}
                        dot={{ stroke: '#ffc107', strokeWidth: 2, r: 4, fill: '#ffc107' }}
                      />
                    )}
                    
                    {exposureGuidelines?.aegl2 && (
                      <Line 
                        type="monotone" 
                        dataKey="aegl2Crossed" 
                        stroke="orange" 
                        name="AEGL-2 Exceeded" 
                        strokeWidth={0}
                        dot={{ stroke: 'orange', strokeWidth: 2, r: 4, fill: 'orange' }}
                      />
                    )}
                    
                    {exposureGuidelines?.aegl3 && (
                      <Line 
                        type="monotone" 
                        dataKey="aegl3Crossed" 
                        stroke="red" 
                        name="AEGL-3 Exceeded" 
                        strokeWidth={0}
                        dot={{ stroke: 'red', strokeWidth: 2, r: 4, fill: 'red' }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {exposureGuidelines && (
                <div className="mt-6 space-y-3 text-sm">
                  <h4 className="font-medium text-base">Exposure Guidelines:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {exposureGuidelines.aegl1 && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                        <div className="font-medium text-yellow-800 text-base">AEGL-1: {exposureGuidelines.aegl1} ppm</div>
                        <div className="text-yellow-700 mt-2">{thresholdDescriptions.aegl1}</div>
                      </div>
                    )}
                    
                    {exposureGuidelines.aegl2 && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded text-sm">
                        <div className="font-medium text-orange-800 text-base">AEGL-2: {exposureGuidelines.aegl2} ppm</div>
                        <div className="text-orange-700 mt-2">{thresholdDescriptions.aegl2}</div>
                      </div>
                    )}
                    
                    {exposureGuidelines.aegl3 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded text-sm">
                        <div className="font-medium text-red-800 text-base">AEGL-3: {exposureGuidelines.aegl3} ppm</div>
                        <div className="text-red-700 mt-2">{thresholdDescriptions.aegl3}</div>
                      </div>
                    )}
                    
                    {exposureGuidelines.idlh && (
                      <div className="p-3 bg-red-100 border border-red-300 rounded text-sm">
                        <div className="font-medium text-red-900 text-base">IDLH: {exposureGuidelines.idlh} ppm</div>
                        <div className="text-red-800 mt-2">{thresholdDescriptions.idlh}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="population" className="p-4">
            <ScrollArea className="h-[600px] pr-4">
              <h3 className="text-sm font-medium mb-4 text-base">Population at Risk Assessment</h3>
              
              <div className="h-[300px] w-full bg-white p-2 rounded-lg border mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={healthImpactData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="severity" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="population" name="Population at Risk" fill="#8884d8" />
                    <Bar yAxisId="right" dataKey="area" name="Area (km²)" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-8 space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-3 text-base">Wind Speed vs. Affected Area</h4>
                  <div className="h-[250px] w-full bg-white p-2 rounded-lg border mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={windSpeedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="speed" 
                          label={{ value: 'Wind Speed (m/s)', position: 'insideBottom', offset: 0 }} 
                        />
                        <YAxis 
                          label={{ value: 'Affected Area (km²)', angle: -90, position: 'insideLeft' }} 
                        />
                        <Tooltip formatter={(value) => [`${value} km²`, 'Area']} />
                        <Legend />
                        <ReferenceLine x={windSpeed} stroke="red" strokeDasharray="3 3" label="Current" />
                        <Line type="monotone" dataKey="area" stroke="#ff7300" name="Affected Area" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-lg border text-sm">
                  <h4 className="font-medium mb-3 text-base">Protective Action Recommendations</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-red-50 border border-red-200 rounded">
                      <div className="font-medium text-red-800">Red Zone</div>
                      <div className="text-sm text-red-700 mt-1">
                        <p>Distance: {detailedResults.redZone.distance.toFixed(2)} km</p>
                        <p className="mt-1">Immediate evacuation, respirators required</p>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                      <div className="font-medium text-orange-800">Orange Zone</div>
                      <div className="text-sm text-orange-700 mt-1">
                        <p>Distance: {detailedResults.orangeZone.distance.toFixed(2)} km</p>
                        <p className="mt-1">Shelter in place, prepare for evacuation</p>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="font-medium text-yellow-800">Yellow Zone</div>
                      <div className="text-sm text-yellow-700 mt-1">
                        <p>Distance: {detailedResults.yellowZone.distance.toFixed(2)} km</p>
                        <p className="mt-1">Alert and prepare, assist vulnerable populations</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-white rounded border">
                    <span className="font-medium">Estimated total population affected:</span> {(
                      detailedResults.redZone.populationAtRisk + 
                      detailedResults.orangeZone.populationAtRisk + 
                      detailedResults.yellowZone.populationAtRisk
                    ).toFixed(0)} people
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="safety" className="p-4">
            <ScrollArea className="h-[600px] pr-4">
              <h3 className="text-sm font-medium mb-4 text-base">Safety Metrics</h3>
              
              <div className="space-y-3">
                {safetyFactorData.map((item, index) => (
                  <div key={index} className="border rounded-md p-3 bg-white">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{item.name}</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium
                        ${item.name === 'Evacuation Time' ? 
                          (item.actual > item.required ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800') :
                        item.name === 'False Alarm Rate' ?
                          (item.actual > item.target ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800') :
                          (item.actual < item.target ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800')
                        }`}
                      >
                        {item.actual} {item.unit}
                      </span>
                    </div>
                    
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full 
                          ${item.name === 'Evacuation Time' ? 
                            (item.actual > item.required ? 'bg-red-600' : 'bg-green-600') :
                          item.name === 'False Alarm Rate' ?
                            (item.actual > item.target ? 'bg-yellow-500' : 'bg-green-600') :
                            (item.actual < item.target ? 'bg-yellow-500' : 'bg-green-600')
                          }`}
                        style={{ 
                          width: `${
                            item.name === 'Evacuation Time' ? 
                              Math.min(100, (item.actual / item.required) * 100) :
                            item.name === 'False Alarm Rate' ?
                              Math.min(100, (item.actual / item.target) * 100) :
                              Math.min(100, (item.actual / item.target) * 100)
                          }%` 
                        }}
                      ></div>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-600">
                      {item.name === 'Evacuation Time' ? 
                        `Required: ${item.required} ${item.unit}` :
                        `Target: ${item.target} ${item.unit}`
                      }
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-slate-50 rounded-md border">
                <h4 className="text-base font-medium mb-3">ALOHA Safety Analysis</h4>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white rounded border shadow-sm">
                      <div className="font-medium">Mass Released</div>
                      <div className="text-lg mt-1">{detailedResults.massReleased} kg</div>
                    </div>
                    <div className="p-3 bg-white rounded border shadow-sm">
                      <div className="font-medium">Evaporation Rate</div>
                      <div className="text-lg mt-1">{detailedResults.evaporationRate} kg/s</div>
                    </div>
                    <div className="p-3 bg-white rounded border shadow-sm">
                      <div className="font-medium">Max. Concentration</div>
                      <div className="text-lg mt-1">{detailedResults.maximumConcentration} mg/m³</div>
                    </div>
                    <div className="p-3 bg-white rounded border shadow-sm">
                      <div className="font-medium">Lethal Distance</div>
                      <div className="text-lg mt-1">{detailedResults.lethalDistance} km</div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-white rounded border shadow-sm">
                    <div className="font-medium mb-2">Key Safety Concerns</div>
                    <ul className="list-disc pl-5 space-y-1">
                      {chemical?.hazards.map((hazard: string, i: number) => (
                        <li key={i}>{hazard}</li>
                      ))}
                      {!chemical && <li>Respiratory irritation</li>}
                      {!chemical && <li>Potential environmental damage</li>}
                      {releaseRate > 200 && <li>High release rate increases risk</li>}
                      {windSpeed < 3 && <li>Low wind speed limits dispersion</li>}
                    </ul>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="safetymeasures" className="p-4">
            <ScrollArea className="h-[600px] pr-4">
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-medium mb-4 text-base">Enhanced Safety Protocols</h3>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border shadow-sm">
                  <div className="text-sm text-gray-500">Safety Score:</div>
                  <div 
                    className="text-xl font-bold"
                    style={{ color: getSafetyScoreColor(safetyScore) }}
                  >
                    {safetyScore}%
                  </div>
                  {safetyScore >= 80 ? (
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                  ) : safetyScore >= 60 ? (
                    <Shield className="h-5 w-5 text-amber-500" />
                  ) : (
                    <ShieldAlert className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-white rounded-lg border shadow-sm">
                  <h4 className="text-base font-medium mb-3">Real-Time Safety Protocols</h4>
                  
                  <div className="space-y-2 mb-3">
                    <div className="text-sm font-medium">Recommended Response:</div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setActiveProtocol('shelter')}
                        className={`px-3 py-1.5 text-sm rounded-md flex items-center ${
                          activeProtocol === 'shelter' 
                            ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        Shelter in Place
                      </button>
                      <button 
                        onClick={() => setActiveProtocol('evacuation')}
                        className={`px-3 py-1.5 text-sm rounded-md flex items-center ${
                          activeProtocol === 'evacuation' 
                            ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        Evacuation
                      </button>
                      <button 
                        onClick={() => setActiveProtocol('mixed')}
                        className={`px-3 py-1.5 text-sm rounded-md flex items-center ${
                          activeProtocol === 'mixed' 
                            ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        Mixed Response
                      </button>
                    </div>
                  </div>
                  
                  <div className="h-[200px] w-full mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart 
                        outerRadius={90} 
                        width={500} 
                        height={200} 
                        data={safetyProtocolsData}
                      >
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar
                          name="Shelter in Place"
                          dataKey="A"
                          stroke="#8884d8"
                          fill="#8884d8"
                          fillOpacity={0.6}
                        />
                        <Radar
                          name="Evacuation"
                          dataKey="B"
                          stroke="#82ca9d"
                          fill="#82ca9d"
                          fillOpacity={0.6}
                        />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="text-sm">
                    {activeProtocol === 'shelter' && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <div className="font-medium text-blue-800 mb-1">Shelter in Place Protocol</div>
                        <ul className="list-disc pl-5 text-blue-700 space-y-1">
                          <li>Close all windows and doors</li>
                          <li>Turn off all ventilation systems</li>
                          <li>Seal gaps under doors with wet towels</li>
                          <li>Move to an interior room with fewest windows</li>
                          <li>Monitor emergency broadcasts for updates</li>
                        </ul>
                      </div>
                    )}
                    
                    {activeProtocol === 'evacuation' && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                        <div className="font-medium text-amber-800 mb-1">Evacuation Protocol</div>
                        <ul className="list-disc pl-5 text-amber-700 space-y-1">
                          <li>Leave immediately - do not delay to collect possessions</li>
                          <li>Move upwind and crosswind from release</li>
                          <li>Maintain minimum distance of {detailedResults.yellowZone.distance.toFixed(2)} km</li>
                          <li>Follow designated evacuation routes only</li>
                          <li>Report to assembly points for accountability</li>
                        </ul>
                      </div>
                    )}
                    
                    {activeProtocol === 'mixed' && (
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                        <div className="font-medium text-purple-800 mb-1">Mixed Response Protocol</div>
                        <ul className="list-disc pl-5 text-purple-700 space-y-1">
                          <li>Red zone ({detailedResults.redZone.distance.toFixed(2)} km): Immediate evacuation</li>
                          <li>Orange zone ({detailedResults.orangeZone.distance.toFixed(2)} km): Prepare to evacuate, shelter initially</li>
                          <li>Yellow zone ({detailedResults.yellowZone.distance.toFixed(2)} km): Shelter in place</li>
                          <li>Prioritize evacuation of vulnerable populations</li>
                          <li>Follow emergency service instructions</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-4 bg-white rounded-lg border shadow-sm">
                  <h4 className="text-base font-medium mb-3">Required PPE & Safety Equipment</h4>
                  
                  <div className="h-[200px] w-full mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart width={400} height={200}>
                        <Pie
                          data={ppeEffectivenessData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {ppeEffectivenessData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}% Effective`, 'Protection Level']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded">
                      <div className="font-medium text-rose-800">First Responder PPE Requirements</div>
                      <div className="mt-1">
                        {releaseRate > 100 ? (
                          <div className="text-rose-700">
                            <strong>Level A protection required:</strong> Fully encapsulated chemical suit with SCBA
                          </div>
                        ) : releaseRate > 50 ? (
                          <div className="text-rose-700">
                            <strong>Level B protection required:</strong> Chemical resistant suit with SCBA
                          </div>
                        ) : (
                          <div className="text-rose-700">
                            <strong>Level C protection required:</strong> Chemical resistant coveralls with APR
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <div className="font-medium text-green-800">Emergency Equipment</div>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-green-700">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          Gas monitors
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          Decontamination kits
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          First aid supplies
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          Communication devices
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 bg-white rounded-lg border shadow-sm">
                  <h4 className="text-base font-medium mb-3">Safety System Recommendations</h4>
                  
                  <div className="space-y-4">
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          width={500}
                          height={200}
                          data={safetyRecommendationData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip formatter={(value) => [`${value}%`, 'Readiness']} />
                          <Bar 
                            dataKey="value" 
                            name="System Readiness" 
                            fill="#8884d8"
                            background={{ fill: '#eee' }}
                          >
                            {safetyRecommendationData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.value >= 80 ? '#4CAF50' : 
                                      entry.value >= 60 ? '#FFC107' : '#F44336'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-50 border rounded">
                        <div className="font-medium">Critical Safety Improvements</div>
                        <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                          {releaseRate > 100 && (
                            <li>Install additional gas detection sensors upwind of facility</li>
                          )}
                          {detailedResults.detectionProbability < 0.8 && (
                            <li>Upgrade detection systems to improve response time</li>
                          )}
                          {chemical?.reactivityHazard && chemical.reactivityHazard > 2 && (
                            <li>Install chemical-specific monitoring for {chemical.name}</li>
                          )}
                          {detailedResults.evacuationTime > 30 && (
                            <li>Develop rapid evacuation procedures for high-risk areas</li>
                          )}
                          <li>Implement automatic notification system for surrounding communities</li>
                          <li>Establish regular drills based on this scenario</li>
                        </ul>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                          <div className="font-medium text-blue-800">Communication Protocol</div>
                          <div className="text-sm text-blue-700 mt-1">
                            {detailedResults.redZone.populationAtRisk > 1000 ? (
                              "Multi-channel emergency alert with sirens and SMS"
                            ) : detailedResults.redZone.populationAtRisk > 100 ? (
                              "Local area alerts with radio broadcast and phone notifications"
                            ) : (
                              "Direct contact through emergency services and local notifications"
                            )}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                          <div className="font-medium text-purple-800">Medical Response</div>
                          <div className="text-sm text-purple-700 mt-1">
                            {chemical ? (
                              `Special treatments for ${chemical.name} exposure: ${
                                chemical.cas.includes("7782-50-5") ? "Bronchodilators and oxygen therapy" :
                                chemical.cas.includes("7664-41-7") ? "Humidified oxygen and bronchodilators" :
                                "Standard decontamination and supportive care"
                              }`
                            ) : (
                              "Standard decontamination protocols and supportive care"
                            )}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-green-50 border border-green-200 rounded">
                          <div className="font-medium text-green-800">Environmental Protection</div>
                          <div className="text-sm text-green-700 mt-1">
                            Deploy containment systems to prevent soil/water contamination. 
                            Monitor air quality at perimeter.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default HazardAssessment;
