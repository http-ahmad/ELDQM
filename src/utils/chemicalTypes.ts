
/**
 * Type definitions for chemical-related data structures
 */

export interface ChemicalProperties {
  name: string;
  cas: string; // Chemical Abstracts Service registry number
  molecularWeight: number; // g/mol
  boilingPoint: number; // Celsius
  vaporPressure: number; // mmHg at 20°C
  specificGravity: number; // relative to water
  waterSolubility: string; // qualitative description
  idlh: number; // Immediately Dangerous to Life or Health (ppm)
  lel: number; // Lower Explosive Limit (% by volume)
  uel: number; // Upper Explosive Limit (% by volume)
  aegl1: number; // Acute Exposure Guideline Level 1 (ppm, 60 min)
  aegl2: number; // Acute Exposure Guideline Level 2 (ppm, 60 min)
  aegl3: number; // Acute Exposure Guideline Level 3 (ppm, 60 min)
  erpg1?: number; // Emergency Response Planning Guideline 1 (ppm)
  erpg2?: number; // Emergency Response Planning Guideline 2 (ppm)
  erpg3?: number; // Emergency Response Planning Guideline 3 (ppm)
  description: string;
  hazards: string[];
  color: string; // Color for UI representation
  
  // Added properties for enhanced ALOHA functionality
  flashPoint?: number; // Flash point in Celsius
  autoignitionTemp?: number; // Autoignition temperature in Celsius
  explosionEnergy?: number; // Explosion energy in kJ/mol
  reactivityHazard?: number; // Reactivity hazard rating (0-4)
  blastPotential?: number; // Blast potential rating (0-10)
  decompositionTemp?: number; // Decomposition temperature in Celsius
  criticalTemp?: number; // Critical temperature in Celsius
  criticalPressure?: number; // Critical pressure in atm
}

// Risk level type
export type RiskLevel = 'None' | 'Low' | 'Moderate' | 'High' | 'Extreme';

// Concentration units
export type ConcentrationUnit = 'mg/m3' | 'ppm' | 'percent';

// Blast assessment result
export interface BlastAssessmentResult {
  explosionRisk: RiskLevel;
  flammabilityRisk: RiskLevel;
  potentialOverpressure: number; // psi
  potentialThermalRadiation: number; // kW/m2
  safeDistance: number; // meters
  comments: string;
}

// Mass balance calculation result
export interface MassBalanceResult {
  totalReleased: number; // kg
  massReleaseRate: number; // kg/min
  vaporGenerated: number; // kg
  vaporGenerationRate: number; // kg/min
  poolFormation: number; // kg
  poolEvaporation: number; // kg
  poolEvaporationRate: number; // kg/min
  airborneRelease: number; // kg
  massBalance: Record<string, number>; // mass fractions
  timeToEmpty?: number; // min (if container volume provided)
  poolDuration?: number; // min
  poolArea?: number; // m2
}

// Leak detection result
export interface LeakDetectionResult {
  isLeaking: boolean;
  confidence: number; // 0-1
  severityLevel: RiskLevel;
  detectionThreshold: number;
  exceedsFactor: number;
  timeToAction: number; // minutes
  recommendedActions: string[];
}

// Exposure guidelines
export interface ExposureGuidelines {
  idlh: number;
  aegl1: number;
  aegl2: number;
  aegl3: number;
  erpg1?: number;
  erpg2?: number;
  erpg3?: number;
}
