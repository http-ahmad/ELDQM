
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer } from "@/components/ui/chart";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar,
  ResponsiveContainer
} from 'recharts';
import { ChartLineIcon, Table as TableIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ComparisonData {
  heightData: Array<{height: number, concentration: number}>;
  windData: Array<{speed: number, area: number}>;
  rateData: Array<{rate: number, distance: number}>;
  simulationComparisons: Array<{
    name: string;
    redDistance: number;
    orangeDistance: number;
    yellowDistance: number;
    maxConcentration: number;
    notes: string;
  }>;
}

// Default comparison data
const defaultData: ComparisonData = {
  heightData: [
    { height: 0, concentration: 12.5 },
    { height: 2, concentration: 10.2 },
    { height: 5, concentration: 8.4 },
    { height: 10, concentration: 5.3 },
    { height: 15, concentration: 3.7 },
    { height: 20, concentration: 2.1 },
    { height: 25, concentration: 1.2 },
    { height: 30, concentration: 0.8 },
  ],
  windData: [
    { speed: 1, area: 25.3 },
    { speed: 2, area: 18.6 },
    { speed: 5, area: 12.4 },
    { speed: 8, area: 9.2 },
    { speed: 10, area: 7.5 },
    { speed: 15, area: 4.3 },
    { speed: 20, area: 3.1 },
  ],
  rateData: [
    { rate: 10, distance: 0.9 },
    { rate: 25, distance: 1.4 },
    { rate: 50, distance: 2.2 },
    { rate: 75, distance: 2.8 },
    { rate: 100, distance: 3.2 },
    { rate: 200, distance: 4.6 },
    { rate: 300, distance: 5.9 },
    { rate: 500, distance: 8.1 },
  ],
  simulationComparisons: [
    {
      name: "Current Simulation",
      redDistance: 1.2,
      orangeDistance: 1.6, 
      yellowDistance: 2.9,
      maxConcentration: 5.0,
      notes: "Current model output"
    },
    {
      name: "ALOHA Output",
      redDistance: 1.3,
      orangeDistance: 1.8,
      yellowDistance: 3.1,
      maxConcentration: 5.5,
      notes: "ALOHA comparable model"
    },
    {
      name: "Worst Case",
      redDistance: 2.4,
      orangeDistance: 3.2,
      yellowDistance: 5.8,
      maxConcentration: 12.1,
      notes: "Stability class F, wind speed 1.5 m/s"
    },
    {
      name: "Best Case",
      redDistance: 0.6,
      orangeDistance: 0.9,
      yellowDistance: 1.4,
      maxConcentration: 2.3,
      notes: "Stability class A, wind speed 8 m/s"
    }
  ]
};

interface SimulationComparisonProps {
  data?: ComparisonData;
}

const SimulationComparison = ({ data = defaultData }: SimulationComparisonProps) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <ChartLineIcon className="h-5 w-5" />
          Simulation Comparisons
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="height" className="w-full">
          <div className="px-4 pt-2">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="height">Release Height</TabsTrigger>
              <TabsTrigger value="wind">Wind Speed</TabsTrigger>
              <TabsTrigger value="rate">Emission Rate</TabsTrigger>
              <TabsTrigger value="compare">Benchmarks</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="height" className="p-4">
            <h3 className="text-sm font-medium mb-2">Release Height vs. Concentration</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.heightData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="height" 
                    label={{ value: 'Height (m)', position: 'insideBottomRight', offset: -5 }} 
                  />
                  <YAxis 
                    label={{ value: 'Concentration (mg/m³)', angle: -90, position: 'insideLeft' }} 
                  />
                  <Tooltip formatter={(value) => [`${value} mg/m³`, 'Concentration']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="concentration" 
                    stroke="#8884d8" 
                    name="Concentration" 
                    strokeWidth={2} 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>Higher release points generally result in lower ground-level concentrations due to increased dispersion before reaching ground level.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="wind" className="p-4">
            <h3 className="text-sm font-medium mb-2">Wind Speed vs. Affected Area</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.windData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="speed" 
                    label={{ value: 'Wind Speed (m/s)', position: 'insideBottomRight', offset: -5 }} 
                  />
                  <YAxis 
                    label={{ value: 'Area (km²)', angle: -90, position: 'insideLeft' }} 
                  />
                  <Tooltip formatter={(value) => [`${value} km²`, 'Area']} />
                  <Legend />
                  <Bar 
                    dataKey="area" 
                    fill="#82ca9d" 
                    name="Affected Area" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>Higher wind speeds typically reduce the affected area by increasing dispersion and dilution of the chemical release.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="rate" className="p-4">
            <h3 className="text-sm font-medium mb-2">Emission Rate vs. Zone Size</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.rateData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="rate" 
                    label={{ value: 'Release Rate (kg/min)', position: 'insideBottomRight', offset: -5 }} 
                  />
                  <YAxis 
                    label={{ value: 'Distance (km)', angle: -90, position: 'insideLeft' }} 
                  />
                  <Tooltip formatter={(value) => [`${value} km`, 'Distance']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="distance" 
                    stroke="#ff7300" 
                    name="Hazard Distance" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>Higher emission rates directly increase the hazard distance and affected area, though the relationship is not strictly linear.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="compare" className="p-4">
            <h3 className="text-sm font-medium mb-2">Benchmark Comparisons</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Red (km)</TableHead>
                  <TableHead>Orange (km)</TableHead>
                  <TableHead>Yellow (km)</TableHead>
                  <TableHead>Max Conc.</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.simulationComparisons.map((item, index) => (
                  <TableRow key={index} className={index === 0 ? "bg-blue-50" : ""}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-red-700">{item.redDistance.toFixed(1)}</TableCell>
                    <TableCell className="text-orange-700">{item.orangeDistance.toFixed(1)}</TableCell>
                    <TableCell className="text-yellow-700">{item.yellowDistance.toFixed(1)}</TableCell>
                    <TableCell>{item.maxConcentration.toFixed(1)} mg/m³</TableCell>
                    <TableCell className="text-xs">{item.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SimulationComparison;
