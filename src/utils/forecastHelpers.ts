
/**
 * Utility functions for financial forecasting
 */

/**
 * Simple Moving Average forecasting
 * @param data Array of numeric values to create forecast from
 * @param periods Number of periods to use for the moving average
 * @returns The forecasted value based on moving average
 */
export const movingAverageForecast = (data: number[], periods: number = 3): number => {
  if (!data || data.length === 0) return 0;
  
  // If we have less data points than periods, use all available data
  const periodsToUse = Math.min(periods, data.length);
  
  // Get the most recent data points
  const recentData = data.slice(-periodsToUse);
  
  // Calculate the average
  return recentData.reduce((sum, val) => sum + val, 0) / periodsToUse;
};

/**
 * Exponential Smoothing forecast
 * @param data Array of numeric values to create forecast from
 * @param alpha Smoothing factor between 0 and 1 (higher means more weight on recent observations)
 * @returns The forecasted value based on exponential smoothing
 */
export const exponentialSmoothingForecast = (data: number[], alpha: number = 0.3): number => {
  if (!data || data.length === 0) return 0;
  if (data.length === 1) return data[0];
  
  // Initialize with the first value
  let forecast = data[0];
  
  // Apply exponential smoothing formula for each data point
  for (let i = 1; i < data.length; i++) {
    forecast = alpha * data[i] + (1 - alpha) * forecast;
  }
  
  return forecast;
};

/**
 * Weighted Moving Average forecast with more weight on recent data
 * @param data Array of numeric values
 * @param weights Array of weights (should sum to 1)
 * @returns The forecasted value based on weighted moving average
 */
export const weightedMovingAverageForecast = (data: number[], weights?: number[]): number => {
  if (!data || data.length === 0) return 0;
  
  // If no weights provided, create linear weights (more recent = more weight)
  if (!weights || weights.length !== data.length) {
    const total = (data.length * (data.length + 1)) / 2; // Sum of 1 to n
    weights = Array.from({ length: data.length }, (_, i) => (i + 1) / total);
  }
  
  // Calculate weighted sum
  let weightedSum = 0;
  for (let i = 0; i < data.length; i++) {
    weightedSum += data[i] * weights[i];
  }
  
  return weightedSum;
};

/**
 * Select the best forecasting method based on available data
 * @param data Historical data array
 * @returns Forecasted value using the most appropriate method
 */
export const getBestForecast = (data: number[]): number => {
  if (!data || data.length === 0) return 0;
  
  // With very few data points, use last value or simple average
  if (data.length < 3) {
    return data.reduce((sum, val) => sum + val, 0) / data.length;
  }
  
  // Check if the data is seasonal or trending
  const isVolatile = checkVolatility(data);
  
  // Choose method based on data characteristics
  if (isVolatile) {
    // For volatile data, exponential smoothing works better
    return exponentialSmoothingForecast(data, 0.3);
  } else {
    // For stable data, weighted moving average works well
    return weightedMovingAverageForecast(data);
  }
};

/**
 * Check if the data has significant volatility
 * @param data Data array
 * @returns Boolean indicating if the data is volatile
 */
const checkVolatility = (data: number[]): boolean => {
  if (data.length < 2) return false;
  
  // Calculate mean
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  
  // Calculate standard deviation
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);
  
  // Calculate coefficient of variation (CV)
  const cv = stdDev / mean;
  
  // If CV is high, data is considered volatile
  return cv > 0.25; // This threshold can be adjusted
};

/**
 * Generate forecast with error handling
 * @param data Historical data array
 * @returns Object with forecast value and reliability score
 */
export const generateForecastWithReliability = (data: number[]): { forecast: number, reliability: string } => {
  if (!data || data.length === 0) {
    return { forecast: 0, reliability: 'não confiável' };
  }
  
  try {
    const forecast = getBestForecast(data);
    
    // Determine reliability based on data points available
    let reliability = 'baixa';
    if (data.length >= 12) {
      reliability = 'alta';
    } else if (data.length >= 6) {
      reliability = 'média';
    }
    
    return { forecast, reliability };
  } catch (error) {
    console.error("Error generating forecast:", error);
    return { forecast: data[data.length - 1] || 0, reliability: 'não confiável' };
  }
};
