
import React, { useState, useEffect, useRef } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  Brush,
} from 'recharts';
import { ChemicalProperties, MassBalanceResult } from '../utils/chemicalTypes';
import { calculateMassBalance } from '../utils/massBalance';
import { chemicalDatabase } from '../utils/chemicalDatabase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { 
  DownloadCloud, 
  BarChart4, 
  LineChart, 
  PieChart, 
  AreaChart, 
  Share2, 
  SaveAll,
  Info
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MassBalanceAnalysisProps {
  chemical: string;
  releaseRate: number;
  duration: number;
  temperature: number;
  pressure?: number;
  containerVolume?: number;
  initialMass?: number;
}

const formatValue = (value: ValueType): string => {
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
  // Convert to number if possible, otherwise return as string
  const num = Number(value);
  return isNaN(num) ? String(value) : num.toFixed(2);
};

const formatTime = (time: number): string => {
  const hours = Math.floor(time / 60);
  const minutes = time % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border rounded shadow-md p-3">
        <p className="font-bold mb-1">Time: {formatTime(Number(label))}</p>
        {payload.map((item: any) => (
          <p key={item.name} className="text-gray-700 dark:text-gray-300 flex justify-between items-center gap-2 py-0.5">
            <span className="flex items-center">
              <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
              {item.name}:
            </span>
            <span className="font-medium">{formatValue(item.value)} kg</span>
          </p>
        ))}
      </div>
    );
  }

  return null;
};

const MassBalanceAnalysis: React.FC<MassBalanceAnalysisProps> = ({
  chemical,
  releaseRate,
  duration,
  temperature,
  pressure = 1.0,
  containerVolume,
  initialMass,
}) => {
  const [massBalanceResult, setMassBalanceResult] = useState<MassBalanceResult | null>(null);
  const [selectedChart, setSelectedChart] = useState('composed');
  const [sliderValue, setSliderValue] = useState([0, duration]);
  const [showDetails, setShowDetails] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [savedCharts, setSavedCharts] = useState<{name: string, data: any[]}[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const result = calculateMassBalance(
      chemical,
      releaseRate,
      duration,
      temperature,
      pressure,
      containerVolume,
      initialMass
    );
    setMassBalanceResult(result);
    // Reset slider to full range when duration changes
    setSliderValue([0, duration]);
  }, [chemical, releaseRate, duration, temperature, pressure, containerVolume, initialMass]);

  if (!massBalanceResult) {
    return <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-md">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>;
  }

  const { massBalance } = massBalanceResult;

  // Prepare chart data
  const chartData = Object.entries(massBalance).map(([name, value]) => ({
    name,
    value,
  }));

  // Prepare time-series data (simplified, assuming constant rates)
  const timeSeriesData = Array.from({ length: duration + 1 }, (_, i) => {
    const time = i;
    return {
      time,
      'Initial vapor': massBalanceResult.vaporGenerationRate * time,
      'Pool formation': massBalanceResult.poolFormation * time,
      'Pool evaporation': Math.min(massBalanceResult.poolEvaporationRate * time, massBalanceResult.poolFormation),
      'Remaining in pool': Math.max(massBalanceResult.poolFormation - massBalanceResult.poolEvaporationRate * time, 0),
      'Total airborne': (massBalanceResult.vaporGenerationRate * time) + Math.min(massBalanceResult.poolEvaporationRate * time, massBalanceResult.poolFormation),
    };
  });

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value);
  };

  const handleBrushChange = (brushData: any) => {
    if (brushData && brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
      setSliderValue([brushData.startIndex, brushData.endIndex]);
    }
  };

  const brushedTimeSeriesData = timeSeriesData.slice(sliderValue[0], sliderValue[1] + 1);

  // Export chart data as CSV
  const exportToCSV = () => {
    const headers = ['time', 'Initial vapor', 'Pool formation', 'Pool evaporation', 'Remaining in pool', 'Total airborne'];
    const csvContent = [
      headers.join(','),
      ...brushedTimeSeriesData.map(item => {
        return headers.map(header => item[header as keyof typeof item]).join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `mass-balance-${chemical}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save current chart for comparison
  const saveCurrentChart = () => {
    const newSavedChart = {
      name: `${chemical} - ${new Date().toLocaleTimeString()}`,
      data: brushedTimeSeriesData
    };
    setSavedCharts(prev => [...prev, newSavedChart]);
  };

  return (
    <Card className="w-full shadow-lg border-gray-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-t-lg">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl text-blue-800 dark:text-blue-300">Mass Balance Analysis</CardTitle>
            <CardDescription className="text-blue-600/80 dark:text-blue-400/80">
              Visual representation of chemical release mass balance for {chemical}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Chart Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedChart('composed')}>
                <BarChart4 className="h-4 w-4 mr-2" /> Composed Chart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedChart('bar')}>
                <BarChart4 className="h-4 w-4 mr-2" /> Bar Chart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedChart('line')}>
                <LineChart className="h-4 w-4 mr-2" /> Line Chart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedChart('area')}>
                <AreaChart className="h-4 w-4 mr-2" /> Area Chart
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportToCSV}>
                <DownloadCloud className="h-4 w-4 mr-2" /> Export Data
              </DropdownMenuItem>
              <DropdownMenuItem onClick={saveCurrentChart}>
                <SaveAll className="h-4 w-4 mr-2" /> Save for Comparison
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCompareMode(!compareMode)}>
                <PieChart className="h-4 w-4 mr-2" /> {compareMode ? 'Exit Comparison' : 'Compare Charts'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 pt-6">
        {showDetails && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Chemical Properties</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div>
                <span className="font-semibold">Release Rate:</span> {releaseRate.toFixed(2)} kg/min
              </div>
              <div>
                <span className="font-semibold">Duration:</span> {duration} min
              </div>
              <div>
                <span className="font-semibold">Temperature:</span> {temperature.toFixed(1)} °C
              </div>
              <div>
                <span className="font-semibold">Pressure:</span> {pressure.toFixed(2)} atm
              </div>
              {containerVolume && (
                <div>
                  <span className="font-semibold">Container Volume:</span> {containerVolume.toFixed(2)} m³
                </div>
              )}
              {initialMass && (
                <div>
                  <span className="font-semibold">Initial Mass:</span> {initialMass.toFixed(2)} kg
                </div>
              )}
              <div>
                <span className="font-semibold">Vapor Rate:</span> {massBalanceResult.vaporGenerationRate.toFixed(2)} kg/min
              </div>
              <div>
                <span className="font-semibold">Pool Rate:</span> {massBalanceResult.poolFormation.toFixed(2)} kg/min
              </div>
              <div>
                <span className="font-semibold">Evaporation:</span> {massBalanceResult.poolEvaporationRate.toFixed(2)} kg/min
              </div>
            </div>
          </div>
        )}

        {compareMode && savedCharts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Current Analysis</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={brushedTimeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="time" 
                      label={{ value: 'Time (min)', position: 'insideBottom', offset: -5 }} 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      label={{ value: 'Mass (kg)', angle: -90, position: 'insideLeft', offset: 15 }} 
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="Total airborne" stroke="#ff7300" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="Remaining in pool" stroke="#387908" dot={false} strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Saved Analysis</h3>
                <Select defaultValue={savedCharts[savedCharts.length - 1].name}>
                  <SelectTrigger className="w-[220px] h-8 text-xs">
                    <SelectValue placeholder="Select saved chart" />
                  </SelectTrigger>
                  <SelectContent>
                    {savedCharts.map((chart, i) => (
                      <SelectItem key={i} value={chart.name}>{chart.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={savedCharts[savedCharts.length - 1].data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="time" 
                      label={{ value: 'Time (min)', position: 'insideBottom', offset: -5 }} 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      label={{ value: 'Mass (kg)', angle: -90, position: 'insideLeft', offset: 15 }} 
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="Total airborne" stroke="#ff7300" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="Remaining in pool" stroke="#387908" dot={false} strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[400px]" ref={chartRef}>
            <ResponsiveContainer width="100%" height="100%">
              {selectedChart === 'composed' ? (
                <ComposedChart data={brushedTimeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="time" 
                    label={{ value: 'Time (min)', position: 'insideBottom', offset: -5 }} 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    label={{ value: 'Mass (kg)', angle: -90, position: 'insideLeft', offset: 15 }} 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area 
                    type="monotone" 
                    dataKey="Pool formation" 
                    fill="rgba(136, 132, 216, 0.6)" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Pool formation"
                  />
                  <Bar 
                    dataKey="Initial vapor" 
                    barSize={20} 
                    fill="rgba(65, 62, 160, 0.7)"
                    stroke="#413ea0"
                    strokeWidth={1}
                    name="Initial vapor"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Pool evaporation" 
                    stroke="#ff7300" 
                    strokeWidth={2}
                    dot={false}
                    name="Pool evaporation" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Remaining in pool" 
                    stroke="#387908" 
                    strokeWidth={2}
                    dot={false}
                    name="Remaining in pool"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Total airborne" 
                    stroke="#a3a3a3"
                    strokeWidth={2.5}
                    dot={false}
                    name="Total airborne"
                  />
                  <Brush 
                    dataKey="time" 
                    height={30} 
                    stroke="#8884d8" 
                    onChange={handleBrushChange}
                    startIndex={sliderValue[0]}
                    endIndex={sliderValue[1]}
                  />
                </ComposedChart>
              ) : selectedChart === 'bar' ? (
                <ComposedChart data={brushedTimeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="time" 
                    label={{ value: 'Time (min)', position: 'insideBottom', offset: -5 }} 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    label={{ value: 'Mass (kg)', angle: -90, position: 'insideLeft', offset: 15 }} 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Pool formation" barSize={20} fill="rgba(136, 132, 216, 0.8)" stroke="#8884d8" />
                  <Bar dataKey="Initial vapor" barSize={20} fill="rgba(65, 62, 160, 0.8)" stroke="#413ea0" />
                  <Bar dataKey="Pool evaporation" barSize={20} fill="rgba(255, 115, 0, 0.8)" stroke="#ff7300" />
                  <Bar dataKey="Total airborne" barSize={20} fill="rgba(163, 163, 163, 0.8)" stroke="#a3a3a3" />
                  <Brush 
                    dataKey="time" 
                    height={30} 
                    stroke="#8884d8" 
                    onChange={handleBrushChange}
                    startIndex={sliderValue[0]} 
                    endIndex={sliderValue[1]} 
                  />
                </ComposedChart>
              ) : selectedChart === 'line' ? (
                <ComposedChart data={brushedTimeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="time" 
                    label={{ value: 'Time (min)', position: 'insideBottom', offset: -5 }} 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    label={{ value: 'Mass (kg)', angle: -90, position: 'insideLeft', offset: 15 }} 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="Pool formation" 
                    stroke="#8884d8" 
                    strokeWidth={2} 
                    dot={{ stroke: '#8884d8', strokeWidth: 1, r: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Initial vapor" 
                    stroke="#413ea0" 
                    strokeWidth={2} 
                    dot={{ stroke: '#413ea0', strokeWidth: 1, r: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Pool evaporation" 
                    stroke="#ff7300" 
                    strokeWidth={2} 
                    dot={{ stroke: '#ff7300', strokeWidth: 1, r: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Remaining in pool" 
                    stroke="#387908" 
                    strokeWidth={2} 
                    dot={{ stroke: '#387908', strokeWidth: 1, r: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Total airborne" 
                    stroke="#a3a3a3" 
                    strokeWidth={2.5} 
                    dot={{ stroke: '#a3a3a3', strokeWidth: 1, r: 2 }}
                  />
                  <Brush 
                    dataKey="time" 
                    height={30} 
                    stroke="#8884d8" 
                    onChange={handleBrushChange}
                    startIndex={sliderValue[0]} 
                    endIndex={sliderValue[1]} 
                  />
                </ComposedChart>
              ) : (
                <ComposedChart data={brushedTimeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="time" 
                    label={{ value: 'Time (min)', position: 'insideBottom', offset: -5 }} 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    label={{ value: 'Mass (kg)', angle: -90, position: 'insideLeft', offset: 15 }} 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area 
                    type="monotone" 
                    dataKey="Pool formation" 
                    fill="rgba(136, 132, 216, 0.6)" 
                    stroke="#8884d8" 
                    strokeWidth={1.5}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Initial vapor" 
                    fill="rgba(65, 62, 160, 0.6)" 
                    stroke="#413ea0" 
                    strokeWidth={1.5}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Remaining in pool" 
                    fill="rgba(56, 121, 8, 0.6)" 
                    stroke="#387908" 
                    strokeWidth={1.5}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Total airborne" 
                    fill="rgba(163, 163, 163, 0.6)" 
                    stroke="#a3a3a3" 
                    strokeWidth={1.5}
                  />
                  <Brush 
                    dataKey="time" 
                    height={30} 
                    stroke="#8884d8" 
                    onChange={handleBrushChange}
                    startIndex={sliderValue[0]} 
                    endIndex={sliderValue[1]} 
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        <div className="flex flex-col space-y-4">
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm font-medium">Time Range (minutes)</Label>
              <span className="text-sm text-muted-foreground">
                Selected: {formatTime(sliderValue[0])} - {formatTime(sliderValue[1])}
              </span>
            </div>
            <Slider
              defaultValue={sliderValue}
              max={duration}
              step={1}
              value={sliderValue}
              onValueChange={handleSliderChange}
              className="py-4"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4 bg-gray-50 dark:bg-gray-800/50">
        <Button onClick={() => setShowDetails(!showDetails)} variant="outline" size="sm" className="gap-2">
          <Info className="h-4 w-4" />
          {showDetails ? "Hide Details" : "Show Details"}
        </Button>
        <Button variant="default" className="gap-2" onClick={exportToCSV}>
          <DownloadCloud className="h-4 w-4" />
          Export Data
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MassBalanceAnalysis;
