import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Bomb, Flame, TestTubes, Thermometer } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { assessBlastPotential } from '../utils/blastAssessment';

interface BlastAssessmentProps {
  chemicalType: string;
  concentration: number;
  temperature: number;
  pressure?: number;
}

const BlastAssessment: React.FC<BlastAssessmentProps> = ({
  chemicalType,
  concentration,
  temperature,
  pressure = 1.0
}) => {
  const blastData = assessBlastPotential(chemicalType, concentration, temperature, pressure);

  // Helper function to get color based on risk level
  const getRiskColor = (risk: 'None' | 'Low' | 'Moderate' | 'High' | 'Extreme') => {
    switch (risk) {
      case 'None': return 'bg-gray-100 text-gray-800';
      case 'Low': return 'bg-blue-100 text-blue-800';
      case 'Moderate': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Extreme': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to get icon based on risk level
  const getRiskIcon = (risk: 'None' | 'Low' | 'Moderate' | 'High' | 'Extreme') => {
    switch (risk) {
      case 'Extreme':
      case 'High':
        return <AlertTriangle className="h-5 w-5 mr-2" />;
      case 'Moderate':
        return <Flame className="h-5 w-5 mr-2" />;
      case 'Low':
      case 'None':
      default:
        return <TestTubes className="h-5 w-5 mr-2" />;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Bomb className="h-5 w-5 mr-2" />
          ALOHA Blast Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[450px]">
          <div className="p-4">
            <h3 className="font-bold text-lg mb-3">Explosion Risk Analysis</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className={`p-4 rounded-md ${getRiskColor(blastData.explosionRisk)}`}>
                <div className="font-bold flex items-center text-lg">
                  {getRiskIcon(blastData.explosionRisk)}
                  Explosion Risk: {blastData.explosionRisk}
                </div>
                <div className="mt-2">
                  <p>Potential overpressure: {blastData.potentialOverpressure.toFixed(2)} psi</p>
                  <p>Safe distance: {blastData.safeDistance.toFixed(0)} meters</p>
                </div>
              </div>
              
              <div className={`p-4 rounded-md ${getRiskColor(blastData.flammabilityRisk)}`}>
                <div className="font-bold flex items-center text-lg">
                  <Flame className="h-5 w-5 mr-2" />
                  Flammability Risk: {blastData.flammabilityRisk}
                </div>
                <div className="mt-2">
                  <p>Thermal radiation: {blastData.potentialThermalRadiation.toFixed(2)} kW/m²</p>
                  <p>Potential for flash fire: {blastData.flammabilityRisk !== 'None' ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-md mb-4">
              <div className="font-semibold mb-2">Analysis Conditions</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center">
                  <TestTubes className="h-4 w-4 mr-2 text-slate-500" />
                  <span>Chemical: {chemicalType}</span>
                </div>
                <div className="flex items-center">
                  <Thermometer className="h-4 w-4 mr-2 text-slate-500" />
                  <span>Temperature: {temperature}°C</span>
                </div>
                <div>
                  Concentration: {concentration.toFixed(2)} mg/m³
                </div>
                <div>
                  Pressure: {pressure.toFixed(2)} atm
                </div>
              </div>
            </div>
            
            <div className="border border-amber-200 bg-amber-50 p-4 rounded-md mb-4">
              <div className="font-bold text-amber-800 mb-2">ALOHA Assessment Comments</div>
              <p className="text-amber-900">{blastData.comments}</p>
            </div>
            
            <h3 className="font-bold text-lg mt-6 mb-3">ALOHA Protective Actions</h3>
            
            <div className="space-y-3">
              <ProtectiveActionItem 
                title="Immediate Actions"
                isRequired={blastData.explosionRisk === 'High' || blastData.explosionRisk === 'Extreme'}
              >
                {blastData.explosionRisk === 'Extreme' && (
                  <ul className="list-disc pl-5 space-y-1">
                    <li>EVACUATE all personnel to minimum {blastData.safeDistance.toFixed(0)} meters</li>
                    <li>ELIMINATE all ignition sources</li>
                    <li>SECURE the area to prevent entry</li>
                    <li>ACTIVATE emergency response team</li>
                  </ul>
                )}
                {blastData.explosionRisk === 'High' && (
                  <ul className="list-disc pl-5 space-y-1">
                    <li>EVACUATE non-essential personnel to {blastData.safeDistance.toFixed(0)} meters</li>
                    <li>ELIMINATE all ignition sources</li>
                    <li>ALERT emergency response team</li>
                  </ul>
                )}
                {blastData.explosionRisk === 'Moderate' && (
                  <ul className="list-disc pl-5 space-y-1">
                    <li>RESTRICT access to area</li>
                    <li>ELIMINATE ignition sources</li>
                    <li>MONITOR concentration levels</li>
                  </ul>
                )}
                {(blastData.explosionRisk === 'Low' || blastData.explosionRisk === 'None') && (
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Continue normal operations with caution</li>
                    <li>Monitor for changes in conditions</li>
                  </ul>
                )}
              </ProtectiveActionItem>

              <ProtectiveActionItem
                title="Isolation Distances"
                isRequired={true}
              >
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Initial isolation:</span>
                    <span className="font-semibold">{Math.round(blastData.safeDistance * 0.3)} meters</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Protective action distance:</span>
                    <span className="font-semibold">{Math.round(blastData.safeDistance)} meters</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Downwind evacuation:</span>
                    <span className="font-semibold">{Math.round(blastData.safeDistance * 1.5)} meters</span>
                  </div>
                </div>
              </ProtectiveActionItem>
              
              <ProtectiveActionItem
                title="Mitigation Strategy"
                isRequired={blastData.flammabilityRisk !== 'None'}
              >
                <ul className="list-disc pl-5 space-y-1">
                  {blastData.flammabilityRisk !== 'None' && (
                    <>
                      <li>Eliminate all ignition sources</li>
                      <li>Apply appropriate fire suppression techniques</li>
                    </>
                  )}
                  <li>Contain release if possible without risk</li>
                  <li>Ventilate closed spaces before entering</li>
                  <li>Dilute gas/vapor with water spray as appropriate</li>
                </ul>
              </ProtectiveActionItem>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

const ProtectiveActionItem: React.FC<{
  title: string;
  isRequired: boolean;
  children: React.ReactNode;
}> = ({ title, isRequired, children }) => (
  <div className="border rounded-md p-3">
    <div className="flex items-center justify-between mb-2">
      <h4 className="font-semibold">{title}</h4>
      <span className={`px-2 py-0.5 text-xs rounded-full ${isRequired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
        {isRequired ? 'Required' : 'Optional'}
      </span>
    </div>
    <div className="text-sm">
      {children}
    </div>
  </div>
);

export default BlastAssessment;
