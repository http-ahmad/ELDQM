
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { detectLeakage } from '../utils/leakDetection';
import { AlertTriangle, Gauge, CheckCircle, XCircle, Clock } from 'lucide-react';

interface LeakDetectionProps {
  chemicalType: string;
  concentration: number;
  backgroundLevel?: number;
  thresholdMultiplier?: number;
  onLeakDetected?: (isLeaking: boolean) => void;
}

const LeakDetection: React.FC<LeakDetectionProps> = ({
  chemicalType,
  concentration,
  backgroundLevel = 0.001,
  thresholdMultiplier = 5,
  onLeakDetected
}) => {
  const detection = detectLeakage(
    chemicalType, 
    concentration, 
    backgroundLevel,
    thresholdMultiplier
  );

  // Call callback when leak status changes
  React.useEffect(() => {
    if (onLeakDetected) {
      onLeakDetected(detection.isLeaking);
    }
  }, [detection.isLeaking, onLeakDetected]);

  const getSeverityColor = (severity: 'None' | 'Low' | 'Moderate' | 'High' | 'Extreme') => {
    switch (severity) {
      case 'None': return 'bg-gray-100 text-gray-800';
      case 'Low': return 'bg-blue-100 text-blue-800';
      case 'Moderate': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Extreme': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.7) return 'High';
    if (confidence >= 0.5) return 'Moderate';
    if (confidence >= 0.3) return 'Low';
    return 'Very Low';
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Gauge className="h-5 w-5 mr-2" />
          ALOHA Leak Detection
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`rounded-md p-4 flex items-center justify-between mb-4 ${detection.isLeaking ? 'bg-red-100' : 'bg-green-100'}`}>
          <div className="flex items-center">
            {detection.isLeaking ? (
              <AlertTriangle className="h-6 w-6 mr-2 text-red-600" />
            ) : (
              <CheckCircle className="h-6 w-6 mr-2 text-green-600" />
            )}
            <div>
              <h3 className={detection.isLeaking ? 'font-bold text-red-800' : 'font-bold text-green-800'}>
                {detection.isLeaking ? 'Leak Detected' : 'No Leak Detected'}
              </h3>
              <p className={detection.isLeaking ? 'text-sm text-red-700' : 'text-sm text-green-700'}>
                Confidence: {getConfidenceLevel(detection.confidence)}
              </p>
            </div>
          </div>
          {detection.isLeaking && (
            <div className={`text-center px-3 py-1 rounded-full text-xs font-bold ${getSeverityColor(detection.severityLevel)}`}>
              {detection.severityLevel} Severity
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="border rounded-md p-3">
            <h3 className="font-medium mb-2">Detection Parameters</h3>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <div>Chemical:</div>
              <div className="text-right font-medium">{chemicalType}</div>
              
              <div>Measured Concentration:</div>
              <div className="text-right font-medium">{concentration.toFixed(3)} mg/m³</div>
              
              <div>Detection Threshold:</div>
              <div className="text-right font-medium">{detection.detectionThreshold.toFixed(3)} mg/m³</div>
              
              {detection.isLeaking && (
                <>
                  <div>Exceeds Threshold By:</div>
                  <div className="text-right font-medium">{detection.exceedsFactor.toFixed(1)}×</div>
                </>
              )}
            </div>
          </div>

          {detection.isLeaking && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <div className="flex items-center mb-2">
                  <Clock className="h-4 w-4 mr-2 text-amber-600" />
                  <h3 className="font-medium text-amber-800">Required Response Time</h3>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-amber-800">Take action within:</span>
                  <span className="font-bold text-amber-900">{detection.timeToAction} minutes</span>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-md p-3">
                <h3 className="font-medium mb-2">Recommended Actions</h3>
                <ul className="space-y-2 text-sm">
                  {detection.recommendedActions.map((action, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-block bg-slate-200 text-slate-700 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">
                        {index + 1}
                      </span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {!detection.isLeaking && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <h3 className="font-medium mb-2 flex items-center text-green-800">
                <CheckCircle className="h-4 w-4 mr-2" />
                Normal Operation
              </h3>
              <p className="text-sm text-green-700">
                Concentration is below detection threshold. Continue regular monitoring.
              </p>
            </div>
          )}
          
          {/* ALOHA Detection Info */}
          <div className="text-xs text-gray-500 border-t pt-3 mt-4">
            <div className="font-medium mb-1">ALOHA Detection Parameters:</div>
            <div>Background Level: {backgroundLevel} mg/m³</div>
            <div>Threshold Multiplier: {thresholdMultiplier}×</div>
            <div>Detection Algorithm: Enhanced Concentration Pattern Analysis</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeakDetection;
