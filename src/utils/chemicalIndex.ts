
/**
 * Index file to re-export all chemical-related functionality
 */

// Types
export * from './chemicalTypes';

// Database
export { chemicalDatabase } from './chemicalDatabase';

// Utility functions
export { 
  convertConcentrationUnit,
  getExposureGuidelines,
  getThresholdDescriptions,
  raiseRiskLevel
} from './chemicalUtils';

// Assessment functions
export { assessBlastPotential } from './blastAssessment';
export { calculateMassBalance } from './massBalance';
export { detectLeakage } from './leakDetection';
