/**
 * Frontend Monte Carlo utilities and configurations
 * Centralized config and helper functions for Going Concern analysis UI
 */

export const GOING_CONCERN_CONFIG = {
  COLORS: {
    SAFE: '#00c896',
    CAUTION: '#f5a623',
    DANGER: '#ff6b35',
    CRITICAL: '#e63946',
    PRIMARY: '#7c6af7',
  },
  
  DARK_THEME: {
    bg_primary: '#0d1b2a',
    bg_secondary: '#1a1f2e',
    bg_card: '#1a1f2e',
    border_light: 'rgba(255,255,255,0.08)',
    text_primary: '#fff',
    text_secondary: 'rgba(255,255,255,0.6)',
    text_muted: 'rgba(255,255,255,0.45)',
  },
  
  ANIMATION_DURATIONS: {
    FAST: 300,
    NORMAL: 600,
    SLOW: 1000,
  },
};

/**
 * Format currency values
 * @param {number} value - Amount to format
 * @param {string} currency - Currency symbol (default ₹)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, currency = '₹') => {
  if (value === null || value === undefined) return 'N/A';
  return `${currency}${Number(value).toLocaleString('en-IN', { 
    maximumFractionDigits: 0 
  })}`;
};

/**
 * Format percentage values
 * @param {number} value - Percentage value
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return 'N/A';
  return `${Number(value).toFixed(decimals)}%`;
};

/**
 * Get risk color based on survival probability
 * @param {number} probability - Survival probability (0-100)
 * @returns {string} Hex color code
 */
export const getRiskColor = (probability) => {
  if (probability >= 95) return GOING_CONCERN_CONFIG.COLORS.SAFE;
  if (probability >= 80) return GOING_CONCERN_CONFIG.COLORS.CAUTION;
  if (probability >= 60) return GOING_CONCERN_CONFIG.COLORS.DANGER;
  return GOING_CONCERN_CONFIG.COLORS.CRITICAL;
};

/**
 * Get risk label based on survival probability
 * @param {number} probability - Survival probability (0-100)
 * @returns {string} Risk level label
 */
export const getRiskLabel = (probability) => {
  if (probability >= 95) return 'SAFE';
  if (probability >= 80) return 'MODERATE';
  if (probability >= 60) return 'AT RISK';
  return 'CRITICAL';
};

/**
 * Calculate delta (change) from starting balance
 * @param {number} current - Current value
 * @param {number} starting - Starting balance
 * @returns {object} Delta object with value, percentage, and direction
 */
export const calculateDelta = (current, starting) => {
  if (!starting || starting === 0) return { value: 0, pct: 0, direction: 'neutral' };
  
  const delta = current - starting;
  const deltaPct = (delta / starting) * 100;
  
  return {
    value: delta,
    pct: deltaPct,
    direction: delta >= 0 ? 'positive' : 'negative',
  };
};

/**
 * Generate sparkline data for a band
 * Used for showing distribution within scenario bands
 * @param {array} data - Min balance data
 * @param {number} bandMin - Band minimum threshold
 * @param {number} bandMax - Band maximum threshold
 * @param {number} points - Number of sparkline points
 * @returns {array} Sparkline data
 */
export const generateSparklineData = (data, bandMin, bandMax, points = 20) => {
  const filtered = data.filter(v => v >= bandMin && v <= bandMax);
  if (filtered.length === 0) return [];
  
  const step = Math.max(1, Math.floor(filtered.length / points));
  return filtered.filter((_, i) => i % step === 0).map(v => ({
    value: v,
    normalized: (v - bandMin) / (bandMax - bandMin),
  }));
};

/**
 * Calculate confidence interval width
 * @param {number} lower - Lower bound
 * @param {number} upper - Upper bound
 * @returns {number} Interval width
 */
export const getConfidenceIntervalWidth = (lower, upper) => {
  return upper - lower;
};

/**
 * Parse scenario band probability string to number
 * @param {string} probStr - Probability string (e.g., "25.0%")
 * @returns {number} Parsed probability value
 */
export const parseProbability = (probStr) => {
  if (!probStr) return 0;
  return parseFloat(probStr.replace('%', ''));
};

export default {
  GOING_CONCERN_CONFIG,
  formatCurrency,
  formatPercentage,
  getRiskColor,
  getRiskLabel,
  calculateDelta,
  generateSparklineData,
  getConfidenceIntervalWidth,
  parseProbability,
};
