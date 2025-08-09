
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ConcentrationPoint {
  distance: number;
  concentration: number;
}

export interface ChartData {
  points: ConcentrationPoint[];
  chemicalType: string;
}

interface ConcentrationChartProps {
  data: ConcentrationPoint[] | ChartData;
}

const ConcentrationChart: React.FC<ConcentrationChartProps> = ({ data }) => {
  // Convert data to the correct format if it's an array
  const chartData = Array.isArray(data) 
    ? data 
    : data.points;
  
  const chemicalType = Array.isArray(data) 
    ? 'Chemical' 
    : data.chemicalType;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="distance" 
          label={{ value: 'Distance (km)', position: 'insideBottomRight', offset: -5 }}
        />
        <YAxis 
          label={{ value: 'Concentration (mg/m³)', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip formatter={(value) => [`${value} mg/m³`, 'Concentration']} />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="concentration" 
          name={chemicalType} 
          stroke="#8884d8" 
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ConcentrationChart;
