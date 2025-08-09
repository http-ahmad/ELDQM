
/**
 * Mass balance calculations for chemical releases
 */

import { chemicalDatabase } from './chemicalDatabase';
import { MassBalanceResult } from './chemicalTypes';

/**
 * Calculate mass balance for an advanced ALOHA-style analysis
 * @param chemical The chemical name
 * @param releaseRate Release rate in kg/min
 * @param duration Duration in minutes
 * @param temperature Temperature in Celsius
 * @param pressure Pressure in atm
 * @returns Detailed mass balance data
 */
export const calculateMassBalance = (
  chemical: string,
  releaseRate: number,
  duration: number,
  temperature: number,
  pressure: number = 1.0,
  containerVolume?: number,
  initialMass?: number
): MassBalanceResult => {
  const chemData = chemicalDatabase[chemical.toLowerCase()];
  if (!chemData) {
    return {
      totalReleased: 0,
      massReleaseRate: 0,
      vaporGenerated: 0,
      vaporGenerationRate: 0,
      poolFormation: 0,
      poolEvaporation: 0,
      poolEvaporationRate: 0,
      airborneRelease: 0,
      massBalance: {},
      timeToEmpty: undefined,
      poolDuration: undefined,
      poolArea: undefined
    };
  }

  // Total mass released
  const totalReleased = releaseRate * duration;
  
  // Temperature adjustment factor for evaporation
  const tempFactor = Math.exp(0.0555 * (temperature - 20));
  
  // Determine phase of release based on chemical properties
  const isGasAtAmbient = chemData.boilingPoint < temperature;
  
  // Calculate vapor generation ratio based on chemical properties and conditions
  let vaporFraction: number;
  
  if (isGasAtAmbient) {
    // Gases form 100% vapor
    vaporFraction = 1.0;
  } else {
    // Liquids partially evaporate based on vapor pressure
    // Higher vapor pressure = higher evaporation
    const vaporPressureFactor = chemData.vaporPressure / 760; // Normalize to atmospheric pressure
    vaporFraction = 0.2 + (0.8 * vaporPressureFactor * tempFactor);
    // Ensure fraction is in valid range
    vaporFraction = Math.min(1.0, Math.max(0.1, vaporFraction));
  }
  
  // Calculate mass fractions
  const vaporGenerated = totalReleased * vaporFraction;
  const vaporGenerationRate = releaseRate * vaporFraction;
  
  // Calculate liquid pool formation (only for liquids)
  const poolFormation = isGasAtAmbient ? 0 : totalReleased * (1 - vaporFraction);
  
  // Pool evaporation rate (kg/min) - simplified model based on chemical properties
  let poolEvaporationRate = 0;
  if (!isGasAtAmbient && poolFormation > 0) {
    // Factors affecting pool evaporation
    const vaporPressureFactor = chemData.vaporPressure / 100; // Normalize
    const molecularWeightFactor = Math.sqrt(18 / chemData.molecularWeight); // Lighter molecules evaporate faster (normalized to water)
    
    // Base evaporation rate (kg/min) - simplified model
    poolEvaporationRate = 0.005 * vaporPressureFactor * molecularWeightFactor * tempFactor * Math.sqrt(poolFormation);
    
    // Ensure rate is reasonable
    poolEvaporationRate = Math.min(poolEvaporationRate, poolFormation / 10); // Can't evaporate more than 10% of pool per minute
  }
  
  // Total pool evaporation during the scenario
  const poolEvaporation = Math.min(poolFormation, poolEvaporationRate * duration);
  
  // Total airborne release (initial vapor + pool evaporation)
  const airborneRelease = vaporGenerated + poolEvaporation;
  
  // Calculate time to empty if container volume provided
  let timeToEmpty: number | undefined;
  if (containerVolume && initialMass) {
    timeToEmpty = initialMass / releaseRate;
  }
  
  // Calculate pool area and duration
  let poolArea: number | undefined;
  let poolDuration: number | undefined;
  
  if (poolFormation > 0) {
    // Simplified pool area calculation (m²)
    // Assumes 1cm depth for spreading pool
    const liquidDensity = chemData.specificGravity * 1000; // kg/m³
    poolArea = (poolFormation / liquidDensity) * 100; // Area = volume/depth, *100 for 1cm depth
    
    // Pool duration (how long until fully evaporated)
    poolDuration = poolEvaporation > 0 ? poolFormation / poolEvaporationRate : undefined;
  }
  
  // Mass balance tracking
  const massBalance: Record<string, number> = {
    'Initial vapor': vaporGenerated,
    'Pool formation': poolFormation,
    'Pool evaporation': poolEvaporation,
    'Remaining in pool': poolFormation - poolEvaporation,
    'Total airborne': airborneRelease,
  };
  
  return {
    totalReleased,
    massReleaseRate: releaseRate,
    vaporGenerated,
    vaporGenerationRate,
    poolFormation,
    poolEvaporation,
    poolEvaporationRate,
    airborneRelease,
    massBalance,
    timeToEmpty,
    poolDuration,
    poolArea
  };
};
