
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { calculateMassBalance } from '../utils/massBalance';
import { AlertTriangle, RefreshCw, ArrowDownUp } from "lucide-react";

interface MassBalanceComparisonProps {
  chemicalType: string;
  initialMass?: number;
  containerVolume?: number;
  temperature: number;
  pressure: number;
}

const MassBalanceComparison = ({
  chemicalType,
  initialMass,
  containerVolume,
  temperature,
  pressure,
}: MassBalanceComparisonProps) => {
  // State for release parameters
  const [continuousParams, setContinuousParams] = useState({
    releaseRate: 5,
    duration: 30,
  });
  const [batchParams, setBatchParams] = useState({
    releaseAmount: 100,
    releaseDuration: 5,
  });
  
  // State for calculated results
  const [continuousResults, setContinuousResults] = useState<any>(null);
  const [batchResults, setBatchResults] = useState<any>(null);
  const [comparisonActive, setComparisonActive] = useState(false);
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  // Calculate continuous release mass balance
  const calculateContinuousBalance = () => {
    try {
      const results = calculateMassBalance(
        chemicalType,
        continuousParams.releaseRate,
        continuousParams.duration,
        temperature,
        pressure,
        containerVolume,
        initialMass
      );
      setContinuousResults(results);
      
      // Automatically calculate batch for comparison if not already done
      if (!batchResults && !comparisonActive) {
        calculateBatchBalance();
      } else {
        setComparisonActive(true);
      }
      
      toast({
        title: "Continuous Release Calculated",
        description: `Total ${results.totalReleased.toFixed(2)} kg released over ${continuousParams.duration} minutes.`,
      });
    } catch (error) {
      console.error("Error calculating continuous mass balance:", error);
      toast({
        title: "Calculation Error",
        description: "Failed to calculate continuous release mass balance.",
        variant: "destructive"
      });
    }
  };
  
  // Calculate batch release mass balance
  const calculateBatchBalance = () => {
    try {
      // For batch, we convert total amount to an equivalent rate over the duration
      const effectiveRate = batchParams.releaseAmount / batchParams.releaseDuration;
      
      const results = calculateMassBalance(
        chemicalType,
        effectiveRate,
        batchParams.releaseDuration,
        temperature,
        pressure,
        containerVolume,
        initialMass
      );
      setBatchResults(results);
      
      // Automatically calculate continuous for comparison if not already done
      if (!continuousResults && !comparisonActive) {
        calculateContinuousBalance();
      } else {
        setComparisonActive(true);
      }
      
      toast({
        title: "Batch Release Calculated",
        description: `${batchParams.releaseAmount.toFixed(2)} kg released over ${batchParams.releaseDuration} minutes.`,
      });
    } catch (error) {
      console.error("Error calculating batch mass balance:", error);
      toast({
        title: "Calculation Error",
        description: "Failed to calculate batch release mass balance.",
        variant: "destructive"
      });
    }
  };
  
  // Reset all calculations
  const resetCalculations = () => {
    setContinuousResults(null);
    setBatchResults(null);
    setComparisonActive(false);
    toast({
      title: "Calculations Reset",
      description: "All mass balance calculations have been reset."
    });
  };
  
  // Prepare data for comparison chart
  const prepareComparisonData = () => {
    if (!continuousResults || !batchResults) return [];
    
    return [
      {
        name: 'Total Released',
        Continuous: continuousResults.totalReleased,
        Batch: batchResults.totalReleased,
      },
      {
        name: 'Vapor Generated',
        Continuous: continuousResults.vaporGenerated,
        Batch: batchResults.vaporGenerated,
      },
      {
        name: 'Pool Formation',
        Continuous: continuousResults.poolFormation,
        Batch: batchResults.poolFormation,
      },
      {
        name: 'Pool Evaporation',
        Continuous: continuousResults.poolEvaporation,
        Batch: batchResults.poolEvaporation,
      },
      {
        name: 'Airborne Release',
        Continuous: continuousResults.airborneRelease,
        Batch: batchResults.airborneRelease,
      },
    ];
  };
  
  // Prepare data for pie charts
  const preparePieData = (results: any, prefix: string) => {
    if (!results) return [];
    
    return [
      { name: `${prefix} Initial Vapor`, value: results.vaporGenerated },
      { name: `${prefix} Pool Formation`, value: results.poolFormation },
      { name: `${prefix} Pool Evaporation`, value: results.poolEvaporation },
      { name: `${prefix} Remaining in Pool`, value: results.poolFormation - results.poolEvaporation },
    ].filter(item => item.value > 0);  // Only show non-zero values
  };
  
  // Calculate efficiency metric - what percentage of material is accounted for
  const calculateEfficiency = (results: any) => {
    if (!results) return 100;
    
    const totalIn = results.totalReleased;
    const totalOut = results.vaporGenerated + results.poolFormation;
    
    // Perfect mass balance would be 100%
    return (Math.min(totalOut / totalIn, 1) * 100).toFixed(2);
  };
  
  // Detect potential leakages based on mass balance discrepancies
  const detectLeakage = (results: any) => {
    if (!results) return { detected: false, amount: 0 };
    
    const totalIn = results.totalReleased;
    const totalOut = results.vaporGenerated + results.poolFormation;
    const discrepancy = totalIn - totalOut;
    
    // If more than 1% is unaccounted for, we might have a leak
    const leakThreshold = totalIn * 0.01;
    return {
      detected: discrepancy > leakThreshold,
      amount: Math.max(0, discrepancy)
    };
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ArrowDownUp className="h-5 w-5" />
          Mass Balance Comparison
        </CardTitle>
        <Button variant="outline" size="sm" onClick={resetCalculations}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="input" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="input">Input Parameters</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
          </TabsList>
          
          <TabsContent value="input" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Continuous Release Parameters */}
              <div className="space-y-3 border rounded-md p-4">
                <h3 className="font-medium text-lg">Continuous Release</h3>
                <div className="space-y-2">
                  <Label htmlFor="continuous-rate">Release Rate (kg/min)</Label>
                  <Input
                    id="continuous-rate"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={continuousParams.releaseRate}
                    onChange={(e) => setContinuousParams({
                      ...continuousParams,
                      releaseRate: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="continuous-duration">Duration (minutes)</Label>
                  <Input
                    id="continuous-duration"
                    type="number"
                    min="1"
                    step="1"
                    value={continuousParams.duration}
                    onChange={(e) => setContinuousParams({
                      ...continuousParams,
                      duration: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                <Button 
                  className="w-full mt-2" 
                  onClick={calculateContinuousBalance}
                  disabled={continuousParams.releaseRate <= 0 || continuousParams.duration <= 0}
                >
                  Calculate Continuous Release
                </Button>
              </div>
              
              {/* Batch Release Parameters */}
              <div className="space-y-3 border rounded-md p-4">
                <h3 className="font-medium text-lg">Batch Release</h3>
                <div className="space-y-2">
                  <Label htmlFor="batch-amount">Release Amount (kg)</Label>
                  <Input
                    id="batch-amount"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={batchParams.releaseAmount}
                    onChange={(e) => setBatchParams({
                      ...batchParams,
                      releaseAmount: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch-duration">Release Duration (minutes)</Label>
                  <Input
                    id="batch-duration"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={batchParams.releaseDuration}
                    onChange={(e) => setBatchParams({
                      ...batchParams,
                      releaseDuration: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                <Button 
                  className="w-full mt-2" 
                  onClick={calculateBatchBalance}
                  disabled={batchParams.releaseAmount <= 0 || batchParams.releaseDuration <= 0}
                >
                  Calculate Batch Release
                </Button>
              </div>
            </div>
            
            {/* Shared Parameters Display */}
            <div className="border rounded-md p-4 bg-slate-50">
              <h3 className="font-medium mb-2">Shared Parameters</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Chemical: </span>
                  <span className="font-medium">{chemicalType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Temperature: </span>
                  <span className="font-medium">{temperature}°C</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Pressure: </span>
                  <span className="font-medium">{pressure} atm</span>
                </div>
                {initialMass && (
                  <div>
                    <span className="text-muted-foreground">Initial Mass: </span>
                    <span className="font-medium">{initialMass} kg</span>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="results">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Continuous Release Results */}
              <div className="border rounded-md p-4">
                <h3 className="font-medium text-lg mb-3">Continuous Release Results</h3>
                {continuousResults ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="space-y-2">
                        <div>
                          <span className="text-muted-foreground">Total Released: </span>
                          <span className="font-medium">{continuousResults.totalReleased.toFixed(2)} kg</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Release Rate: </span>
                          <span className="font-medium">{continuousResults.massReleaseRate.toFixed(2)} kg/min</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Initial Vapor: </span>
                          <span className="font-medium">{continuousResults.vaporGenerated.toFixed(2)} kg</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Vapor Rate: </span>
                          <span className="font-medium">{continuousResults.vaporGenerationRate.toFixed(2)} kg/min</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-muted-foreground">Pool Formation: </span>
                          <span className="font-medium">{continuousResults.poolFormation.toFixed(2)} kg</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Pool Evaporation: </span>
                          <span className="font-medium">{continuousResults.poolEvaporation.toFixed(2)} kg</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Airborne Total: </span>
                          <span className="font-medium">{continuousResults.airborneRelease.toFixed(2)} kg</span>
                        </div>
                        {continuousResults.poolArea && (
                          <div>
                            <span className="text-muted-foreground">Pool Area: </span>
                            <span className="font-medium">{continuousResults.poolArea.toFixed(2)} m²</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={preparePieData(continuousResults, 'C')}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            fill="#8884d8"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {preparePieData(continuousResults, 'C').map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Mass Balance Efficiency */}
                    <div className="border rounded p-2 bg-gray-50 flex justify-between items-center">
                      <span>Mass Balance Efficiency:</span>
                      <span className="font-bold">{calculateEfficiency(continuousResults)}%</span>
                    </div>
                    
                    {/* Leakage Detection */}
                    {detectLeakage(continuousResults).detected && (
                      <div className="border border-red-200 rounded p-2 bg-red-50 flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-5 w-5" />
                        <div>
                          <strong>Potential Leakage Detected: </strong>
                          {detectLeakage(continuousResults).amount.toFixed(2)} kg unaccounted for
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <p>No continuous release data available.</p>
                    <p className="text-sm">Run a calculation first to see results.</p>
                  </div>
                )}
              </div>
              
              {/* Batch Release Results */}
              <div className="border rounded-md p-4">
                <h3 className="font-medium text-lg mb-3">Batch Release Results</h3>
                {batchResults ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="space-y-2">
                        <div>
                          <span className="text-muted-foreground">Total Released: </span>
                          <span className="font-medium">{batchResults.totalReleased.toFixed(2)} kg</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Avg. Release Rate: </span>
                          <span className="font-medium">{batchResults.massReleaseRate.toFixed(2)} kg/min</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Initial Vapor: </span>
                          <span className="font-medium">{batchResults.vaporGenerated.toFixed(2)} kg</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Vapor Rate: </span>
                          <span className="font-medium">{batchResults.vaporGenerationRate.toFixed(2)} kg/min</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-muted-foreground">Pool Formation: </span>
                          <span className="font-medium">{batchResults.poolFormation.toFixed(2)} kg</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Pool Evaporation: </span>
                          <span className="font-medium">{batchResults.poolEvaporation.toFixed(2)} kg</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Airborne Total: </span>
                          <span className="font-medium">{batchResults.airborneRelease.toFixed(2)} kg</span>
                        </div>
                        {batchResults.poolArea && (
                          <div>
                            <span className="text-muted-foreground">Pool Area: </span>
                            <span className="font-medium">{batchResults.poolArea.toFixed(2)} m²</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={preparePieData(batchResults, 'B')}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            fill="#8884d8"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {preparePieData(batchResults, 'B').map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Mass Balance Efficiency */}
                    <div className="border rounded p-2 bg-gray-50 flex justify-between items-center">
                      <span>Mass Balance Efficiency:</span>
                      <span className="font-bold">{calculateEfficiency(batchResults)}%</span>
                    </div>
                    
                    {/* Leakage Detection */}
                    {detectLeakage(batchResults).detected && (
                      <div className="border border-red-200 rounded p-2 bg-red-50 flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-5 w-5" />
                        <div>
                          <strong>Potential Leakage Detected: </strong>
                          {detectLeakage(batchResults).amount.toFixed(2)} kg unaccounted for
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <p>No batch release data available.</p>
                    <p className="text-sm">Run a calculation first to see results.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="comparison">
            {comparisonActive ? (
              <div className="space-y-6">
                {/* Side-by-side comparison chart */}
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={prepareComparisonData()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Continuous" fill="#0088FE" />
                      <Bar dataKey="Batch" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <Separator />
                
                {/* Comparison metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 bg-slate-50">
                    <h3 className="font-medium mb-3">Release Efficiency Comparison</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Continuous</div>
                        <div className="text-2xl font-bold">{calculateEfficiency(continuousResults)}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Batch</div>
                        <div className="text-2xl font-bold">{calculateEfficiency(batchResults)}%</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-slate-50">
                    <h3 className="font-medium mb-3">Airborne Release Comparison</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Continuous</div>
                        <div className="text-2xl font-bold">{continuousResults?.airborneRelease.toFixed(2)} kg</div>
                        <div className="text-xs text-muted-foreground">
                          {((continuousResults?.airborneRelease / continuousResults?.totalReleased) * 100).toFixed(1)}% of total
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Batch</div>
                        <div className="text-2xl font-bold">{batchResults?.airborneRelease.toFixed(2)} kg</div>
                        <div className="text-xs text-muted-foreground">
                          {((batchResults?.airborneRelease / batchResults?.totalReleased) * 100).toFixed(1)}% of total
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Leakage detection summary */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-3">Leakage Detection Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`border rounded p-3 ${detectLeakage(continuousResults).detected ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                      <div className="font-medium">Continuous Release</div>
                      {detectLeakage(continuousResults).detected ? (
                        <div className="flex items-center gap-2 text-red-700 mt-2">
                          <AlertTriangle className="h-5 w-5" />
                          <span>Potential leakage of {detectLeakage(continuousResults).amount.toFixed(2)} kg detected</span>
                        </div>
                      ) : (
                        <div className="text-green-700 mt-2">
                          No significant leakage detected
                        </div>
                      )}
                    </div>
                    
                    <div className={`border rounded p-3 ${detectLeakage(batchResults).detected ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                      <div className="font-medium">Batch Release</div>
                      {detectLeakage(batchResults).detected ? (
                        <div className="flex items-center gap-2 text-red-700 mt-2">
                          <AlertTriangle className="h-5 w-5" />
                          <span>Potential leakage of {detectLeakage(batchResults).amount.toFixed(2)} kg detected</span>
                        </div>
                      ) : (
                        <div className="text-green-700 mt-2">
                          No significant leakage detected
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <p>No comparison data available.</p>
                <p className="text-sm mb-4">Run calculations for both continuous and batch releases first.</p>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={calculateContinuousBalance}>Calculate Continuous</Button>
                  <Button variant="outline" onClick={calculateBatchBalance}>Calculate Batch</Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MassBalanceComparison;
