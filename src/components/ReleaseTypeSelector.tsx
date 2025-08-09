
import React from 'react';
import { Cloud, Droplets, TimerReset, Timer, Waves, ArrowRight, Gauge } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ReleaseModeProps {
  value: 'continuous' | 'batch';
  onChange: (value: 'continuous' | 'batch') => void;
}

export const ReleaseTypeSelector = ({ value, onChange }: ReleaseModeProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Release Type</CardTitle>
        <CardDescription>
          Select the appropriate chemical release pattern for your scenario
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs 
          value={value} 
          onValueChange={(val: 'continuous' | 'batch') => onChange(val)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="continuous">Continuous</TabsTrigger>
            <TabsTrigger value="batch">Batch</TabsTrigger>
          </TabsList>
          
          {value === 'continuous' && (
            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
              <Cloud className="h-10 w-10 text-blue-600 mt-1" />
              <div>
                <h4 className="font-medium text-blue-700">Continuous Release</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Models a steady, ongoing release of chemicals over time, resulting in a 
                  consistent, elongated dispersion pattern. Typical for pipeline leaks, 
                  vent emissions, or process failures.
                </p>
                <div className="space-y-2 mt-3">
                  <div className="flex items-center gap-2 text-xs text-blue-600">
                    <Timer className="h-4 w-4" />
                    <span>Extended duration with steady concentration gradient</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-600">
                    <Waves className="h-4 w-4" />
                    <span>Wider dispersion pattern downwind</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-600">
                    <Gauge className="h-4 w-4" />
                    <span>Constant emission rate ({'>'}5 min duration)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {value === 'batch' && (
            <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg">
              <Droplets className="h-10 w-10 text-purple-600 mt-1" />
              <div>
                <h4 className="font-medium text-purple-700">Batch Release</h4>
                <p className="text-sm text-purple-700 mt-1">
                  Models a sudden, finite quantity release that creates a concentrated cloud 
                  that disperses over time. Typical for tank ruptures, pressure relief events, 
                  or transportation accidents.
                </p>
                <div className="space-y-2 mt-3">
                  <div className="flex items-center gap-2 text-xs text-purple-600">
                    <TimerReset className="h-4 w-4" />
                    <span>Higher initial concentration with more rapid dilution</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-purple-600">
                    <ArrowRight className="h-4 w-4" />
                    <span>Concentration peak moves downwind with time</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-purple-600">
                    <Gauge className="h-4 w-4" />
                    <span>Fixed total quantity released in short duration</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};
