
/**
 * Chemical utilities for calculations and assessments
 */

import { chemicalDatabase } from './chemicalDatabase';
import { 
  RiskLevel,
  ConcentrationUnit,
  BlastAssessmentResult,
  MassBalanceResult,
  LeakDetectionResult,
  ExposureGuidelines
} from './chemicalTypes';

/**
 * Convert between concentration units
 * @param value The concentration value
 * @param chemical The chemical name
 * @param fromUnit Source unit
 * @param toUnit Target unit
 * @returns Converted concentration value
 */
export const convertConcentrationUnit = (
  value: number, 
  chemical: string,
  fromUnit: ConcentrationUnit,
  toUnit: ConcentrationUnit
): number => {
  if (fromUnit === toUnit) return value;
  
  const chemData = chemicalDatabase[chemical.toLowerCase()];
  if (!chemData) return value; // If chemical not found, return original value
  
  const molecularWeight = chemData.molecularWeight;
  
  // First convert to mg/m3 as intermediate
  let intermediateMgM3: number;
  
  switch (fromUnit) {
    case 'ppm':
      // Convert from ppm to mg/m3 using: mg/m3 = (ppm × MW) / 24.45
      intermediateMgM3 = (value * molecularWeight) / 24.45;
      break;
    case 'percent':
      // Convert from percent to mg/m3 (1% = 10,000 ppm)
      intermediateMgM3 = (value * 10000 * molecularWeight) / 24.45;
      break;
    case 'mg/m3':
      intermediateMgM3 = value;
      break;
    default:
      return value;
  }
  
  // Then convert from mg/m3 to target unit
  switch (toUnit) {
    case 'ppm':
      // Convert from mg/m3 to ppm using: ppm = (mg/m3 × 24.45) / MW
      return (intermediateMgM3 * 24.45) / molecularWeight;
    case 'percent':
      // Convert from mg/m3 to percent (1% = 10,000 ppm)
      return ((intermediateMgM3 * 24.45) / molecularWeight) / 10000;
    case 'mg/m3':
      return intermediateMgM3;
    default:
      return value;
  }
};

/**
 * Get applicable exposure guidelines for a chemical
 * @param chemical The chemical name
 * @returns Object with exposure guidelines
 */
export const getExposureGuidelines = (chemical: string): ExposureGuidelines | null => {
  const chemData = chemicalDatabase[chemical.toLowerCase()];
  if (!chemData) return null;
  
  return {
    idlh: chemData.idlh,
    aegl1: chemData.aegl1,
    aegl2: chemData.aegl2,
    aegl3: chemData.aegl3,
    erpg1: chemData.erpg1,
    erpg2: chemData.erpg2,
    erpg3: chemData.erpg3
  };
};

/**
 * Get threshold descriptions for emergency planning
 */
export const getThresholdDescriptions = () => ({
  idlh: "Immediately Dangerous to Life or Health",
  aegl1: "Notable discomfort, irritation, or non-sensory effects. Effects are not disabling and are reversible upon cessation of exposure.",
  aegl2: "Irreversible or other serious, long-lasting adverse health effects or an impaired ability to escape.",
  aegl3: "Life-threatening health effects or death.",
  erpg1: "Maximum concentration with mild, transient health effects.",
  erpg2: "Maximum concentration below which most could be exposed up to 1 hour without serious health effects.",
  erpg3: "Maximum concentration below which most could be exposed up to 1 hour without life-threatening health effects."
});

/**
 * Helper function to raise risk level
 */
export function raiseRiskLevel(currentLevel: RiskLevel): RiskLevel {
  switch (currentLevel) {
    case 'None': return 'Low';
    case 'Low': return 'Moderate';
    case 'Moderate': return 'High';
    case 'High': return 'Extreme';
    case 'Extreme': return 'Extreme';
    default: return currentLevel;
  }
}
