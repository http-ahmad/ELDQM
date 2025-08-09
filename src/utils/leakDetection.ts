
/**
 * Leak detection utilities based on concentration measurements
 */

import { chemicalDatabase } from './chemicalDatabase';
import { LeakDetectionResult, RiskLevel } from './chemicalTypes';
import { convertConcentrationUnit } from './chemicalUtils';

/**
 * Detect leakage based on concentration measurements and thresholds
 * @param chemical The chemical name
 * @param concentration Measured concentration in mg/m3
 * @param backgroundLevel Normal background level in mg/m3
 * @param thresholdMultiplier Multiplier for detection threshold
 * @returns Leak detection result
 */
export const detectLeakage = (
  chemical: string,
  concentration: number,
  backgroundLevel: number = 0.001,
  thresholdMultiplier: number = 5
): LeakDetectionResult => {
  const chemData = chemicalDatabase[chemical.toLowerCase()];
  if (!chemData) {
    return {
      isLeaking: false,
      confidence: 0,
      severityLevel: 'None',
      detectionThreshold: 0,
      exceedsFactor: 0,
      timeToAction: 60,
      recommendedActions: ['Verify chemical properties in database']
    };
  }
  
  // Calculate detection threshold based on background and multiplier
  const detectionThreshold = Math.max(
    backgroundLevel * thresholdMultiplier,
    0.01 * convertConcentrationUnit(chemData.aegl1 || 1, chemical, 'ppm', 'mg/m3')
  );
  
  // Check if concentration exceeds threshold
  const isLeaking = concentration > detectionThreshold;
  
  // Calculate by how much the threshold is exceeded
  const exceedsFactor = isLeaking ? concentration / detectionThreshold : 0;
  
  // Calculate confidence based on how much the threshold is exceeded
  let confidence = 0;
  if (isLeaking) {
    if (exceedsFactor >= 10) {
      confidence = 0.95; // Very high confidence
    } else if (exceedsFactor >= 5) {
      confidence = 0.85; // High confidence
    } else if (exceedsFactor >= 2) {
      confidence = 0.7; // Moderate confidence
    } else {
      confidence = 0.5; // Low confidence
    }
  }
  
  // Determine severity level
  let severityLevel: RiskLevel = 'None';
  if (isLeaking) {
    const aegl1 = convertConcentrationUnit(chemData.aegl1 || 0, chemical, 'ppm', 'mg/m3');
    const aegl2 = convertConcentrationUnit(chemData.aegl2 || 0, chemical, 'ppm', 'mg/m3');
    const aegl3 = convertConcentrationUnit(chemData.aegl3 || 0, chemical, 'ppm', 'mg/m3');
    
    if (aegl3 > 0 && concentration >= aegl3) {
      severityLevel = 'Extreme';
    } else if (aegl2 > 0 && concentration >= aegl2) {
      severityLevel = 'High';
    } else if (aegl1 > 0 && concentration >= aegl1) {
      severityLevel = 'Moderate';
    } else if (concentration >= detectionThreshold * 2) {
      severityLevel = 'Low';
    } else {
      severityLevel = 'Low';
    }
  }
  
  // Determine time to action in minutes
  let timeToAction = 60; // Default - 1 hour for non-leaking scenarios
  if (isLeaking) {
    switch (severityLevel) {
      case 'Extreme':
        timeToAction = 5; // Immediate action needed
        break;
      case 'High':
        timeToAction = 15; // Urgent action needed
        break;
      case 'Moderate':
        timeToAction = 30; // Prompt action needed
        break;
      case 'Low':
        timeToAction = 60; // Action within 1 hour
        break;
      default:
        timeToAction = 60;
    }
  }
  
  // Generate recommended actions based on severity
  const recommendedActions: string[] = [];
  
  if (isLeaking) {
    // Base recommendations that apply to all severity levels
    recommendedActions.push('Verify reading with additional monitoring');
    
    if (severityLevel === 'Extreme' || severityLevel === 'High') {
      recommendedActions.push('Activate emergency response protocol');
      recommendedActions.push('Consider evacuation of affected areas');
      recommendedActions.push('Use appropriate PPE for response personnel');
      recommendedActions.push('Identify and isolate the source of the leak');
    } else if (severityLevel === 'Moderate') {
      recommendedActions.push('Increase ventilation in the affected area');
      recommendedActions.push('Notify response team and prepare for potential escalation');
      recommendedActions.push('Begin source identification procedures');
    } else {
      recommendedActions.push('Continue monitoring at increased frequency');
      recommendedActions.push('Prepare response equipment as a precautionary measure');
    }
    
    // Add chemical-specific recommendations based on its properties
    if (chemData.lel > 0 && chemData.uel > 0) {
      recommendedActions.push('Eliminate all ignition sources in the vicinity');
    }
  } else {
    recommendedActions.push('Continue routine monitoring');
    recommendedActions.push('Check monitoring equipment calibration at next maintenance interval');
  }
  
  return {
    isLeaking,
    confidence,
    severityLevel,
    detectionThreshold,
    exceedsFactor,
    timeToAction,
    recommendedActions
  };
};
