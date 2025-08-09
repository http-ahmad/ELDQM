
/**
 * Blast assessment utility functions for hazard modeling
 */

import { chemicalDatabase } from './chemicalDatabase';
import { BlastAssessmentResult, RiskLevel } from './chemicalTypes';
import { convertConcentrationUnit, raiseRiskLevel } from './chemicalUtils';

/**
 * Assess explosion/blast potential for a chemical
 * @param chemical The chemical name
 * @param concentration Concentration in mg/m3
 * @param temperature Ambient temperature in Celsius
 * @param pressure Ambient pressure in atm
 * @returns Object with blast assessment data
 */
export const assessBlastPotential = (
  chemical: string, 
  concentration: number, 
  temperature: number, 
  pressure: number = 1.0
): BlastAssessmentResult => {
  const chemData = chemicalDatabase[chemical.toLowerCase()];
  if (!chemData) {
    return {
      explosionRisk: 'None',
      flammabilityRisk: 'None',
      potentialOverpressure: 0,
      potentialThermalRadiation: 0,
      safeDistance: 100,
      comments: 'Chemical data not found'
    };
  }

  // Convert concentration to percent volume for comparison with LEL/UEL
  const concentrationPercent = convertConcentrationUnit(concentration, chemical, 'mg/m3', 'percent');
  
  // Calculate temperature effect (higher temp increases risk)
  const tempFactor = 1 + ((temperature - 20) / 100);
  
  // Calculate pressure effect (higher pressure increases risk)
  const pressureFactor = pressure / 1.0;
  
  // Check if concentration is in flammable range
  const isFlammable = 
    chemData.lel > 0 && 
    concentrationPercent >= chemData.lel && 
    concentrationPercent <= chemData.uel;
  
  // Base explosion risk on multiple factors
  let explosionRisk: RiskLevel = 'None';
  let flammabilityRisk: RiskLevel = 'None';
  
  // Determine flammability risk
  if (chemData.lel === 0 && chemData.uel === 0) {
    flammabilityRisk = 'None'; // Non-flammable
  } else if (concentrationPercent < chemData.lel * 0.1) {
    flammabilityRisk = 'Low'; // Below 10% of LEL
  } else if (concentrationPercent < chemData.lel * 0.5) {
    flammabilityRisk = 'Moderate'; // Between 10%-50% of LEL
  } else if (concentrationPercent < chemData.lel) {
    flammabilityRisk = 'High'; // Between 50%-100% of LEL
  } else if (isFlammable) {
    flammabilityRisk = 'Extreme'; // Within flammable range
  } else if (concentrationPercent > chemData.uel) {
    flammabilityRisk = 'Moderate'; // Above UEL (rich, but could become flammable if mixed with air)
  }
  
  // Determine explosion risk
  if (chemData.lel === 0 && chemData.uel === 0) {
    explosionRisk = 'None'; // Non-explosive
  } else if (chemData.reactivityHazard >= 3 || chemData.blastPotential >= 7) {
    // Highly reactive chemicals can explode even outside flammable range
    if (flammabilityRisk === 'Extreme') {
      explosionRisk = 'Extreme';
    } else if (flammabilityRisk === 'High') {
      explosionRisk = 'High';
    } else if (flammabilityRisk === 'Moderate') {
      explosionRisk = 'Moderate';
    } else {
      explosionRisk = 'Low';
    }
  } else if (isFlammable) {
    // For typical chemicals, explosion risk is directly related to being within flammable range
    explosionRisk = 'High';
  } else if (concentrationPercent >= chemData.lel * 0.5) {
    explosionRisk = 'Moderate';
  } else if (concentrationPercent >= chemData.lel * 0.1) {
    explosionRisk = 'Low';
  }
  
  // Apply temperature and pressure factors
  if (explosionRisk !== 'None') {
    // Increase risk based on temperature and pressure
    if (temperature > 50 && pressureFactor > 1.2) {
      explosionRisk = raiseRiskLevel(explosionRisk);
    }
    if (temperature > 100 || pressureFactor > 2) {
      explosionRisk = raiseRiskLevel(explosionRisk);
    }
  }
  
  // Potential overpressure (simplified estimation in psi)
  let potentialOverpressure = 0;
  if (explosionRisk === 'Extreme') {
    potentialOverpressure = 10 * tempFactor * pressureFactor * (chemData.explosionEnergy || 300) / 300;
  } else if (explosionRisk === 'High') {
    potentialOverpressure = 5 * tempFactor * pressureFactor * (chemData.explosionEnergy || 300) / 300;
  } else if (explosionRisk === 'Moderate') {
    potentialOverpressure = 2 * tempFactor * pressureFactor * (chemData.explosionEnergy || 300) / 300;
  } else if (explosionRisk === 'Low') {
    potentialOverpressure = 0.5 * tempFactor * pressureFactor * (chemData.explosionEnergy || 300) / 300;
  }
  
  // Potential thermal radiation (simplified estimation in kW/m2)
  let potentialThermalRadiation = 0;
  if (flammabilityRisk === 'Extreme') {
    potentialThermalRadiation = 25 * tempFactor * (chemData.explosionEnergy || 300) / 300;
  } else if (flammabilityRisk === 'High') {
    potentialThermalRadiation = 10 * tempFactor * (chemData.explosionEnergy || 300) / 300;
  } else if (flammabilityRisk === 'Moderate') {
    potentialThermalRadiation = 5 * tempFactor * (chemData.explosionEnergy || 300) / 300;
  } else if (flammabilityRisk === 'Low') {
    potentialThermalRadiation = 1 * tempFactor * (chemData.explosionEnergy || 300) / 300;
  }
  
  // Calculate safe distance estimation (simplified in meters)
  let safeDistance = 100; // Base safe distance
  if (explosionRisk === 'Extreme') {
    safeDistance = 1000 * Math.sqrt(potentialOverpressure / 10);
  } else if (explosionRisk === 'High') {
    safeDistance = 500 * Math.sqrt(potentialOverpressure / 5);
  } else if (explosionRisk === 'Moderate') {
    safeDistance = 250 * Math.sqrt(potentialOverpressure / 2);
  } else if (explosionRisk === 'Low') {
    safeDistance = 100 * Math.sqrt(potentialOverpressure / 0.5);
  }
  
  // Generate comments
  let comments = '';
  if (explosionRisk === 'None') {
    comments = 'This chemical does not present an explosion hazard under normal conditions.';
  } else if (isFlammable) {
    comments = `WARNING: Concentration is within flammable range (${chemData.lel}%-${chemData.uel}%). ` +
      'Avoid all ignition sources and implement emergency evacuation.';
  } else if (concentrationPercent < chemData.lel) {
    comments = `Concentration is below the Lower Explosive Limit (${chemData.lel}%), ` +
      'but caution should still be exercised. Avoid ignition sources and monitor concentration.';
  } else if (concentrationPercent > chemData.uel) {
    comments = `Concentration is above the Upper Explosive Limit (${chemData.uel}%), ` +
      'but mixture could become explosive if diluted with air. Ventilate carefully.';
  }
  
  if (temperature > 50) {
    comments += ' Elevated temperature increases explosion risk.';
  }
  
  if (pressure > 1.2) {
    comments += ' Elevated pressure increases explosion risk.';
  }
  
  return {
    explosionRisk,
    flammabilityRisk,
    potentialOverpressure,
    potentialThermalRadiation,
    safeDistance,
    comments
  };
};
