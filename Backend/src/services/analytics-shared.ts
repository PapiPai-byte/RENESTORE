/**
 * Shared Statistical and Mathematical Utilities for Business Analytics
 * Contains helper functions for Descriptive, Predictive, and Prescriptive analytics
 */

export interface MonthlyDataPoint {
  month: string;      // 'YYYY-MM'
  revenue: number;
  profit: number;
  orders: number;
  isPartial?: boolean;
}

export interface DescriptiveStats {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
}

/**
 * Calculates Descriptive Statistics (Mean, Median, Standard Deviation, Min, Max)
 */
export function calculateDescriptiveStats(values: number[]): DescriptiveStats {
  if (values.length === 0) {
    return { mean: 0, median: 0, stdDev: 0, min: 0, max: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const min = sorted[0];
  const max = sorted[n - 1];

  // Mean
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const mean = sum / n;

  // Median
  let median = 0;
  if (n % 2 === 1) {
    median = sorted[Math.floor(n / 2)];
  } else {
    median = (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  }

  // Standard Deviation (sample std dev)
  let varianceSum = 0;
  for (const v of sorted) {
    varianceSum += Math.pow(v - mean, 2);
  }
  const variance = n > 1 ? varianceSum / (n - 1) : 0;
  const stdDev = Math.sqrt(variance);

  return {
    mean: Number(mean.toFixed(2)),
    median: Number(median.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
  };
}

/**
 * Linear Regression calculation
 * Returns slope, intercept, R², RMSE, and regression equation
 */
export function calculateLinearRegression(points: { x: number; y: number }[]): {
  slope: number;
  intercept: number;
  rSquared: number;
  rmse: number;
  equation: string;
} {
  const n = points.length;
  if (n < 2) {
    return {
      slope: 0,
      intercept: points[0]?.y || 0,
      rSquared: 0,
      rmse: 0,
      equation: 'y = 0',
    };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (Math.abs(denominator) < 1e-10) {
    const meanY = sumY / n;
    return {
      slope: 0,
      intercept: meanY,
      rSquared: 0,
      rmse: 0,
      equation: `y = ${meanY.toFixed(2)}`,
    };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R² and RMSE
  const meanY = sumY / n;
  let ssTot = 0;
  let ssRes = 0;

  for (const p of points) {
    const yPred = slope * p.x + intercept;
    ssTot += Math.pow(p.y - meanY, 2);
    ssRes += Math.pow(p.y - yPred, 2);
  }

  const rSquared = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;
  const rmse = Math.sqrt(ssRes / n);
  const sign = intercept >= 0 ? '+' : '-';
  const equation = `y = ${slope.toFixed(2)}x ${sign} ${Math.abs(intercept).toFixed(2)}`;

  return {
    slope: Number(slope.toFixed(2)),
    intercept: Number(intercept.toFixed(2)),
    rSquared: Number(rSquared.toFixed(4)),
    rmse: Number(rmse.toFixed(2)),
    equation,
  };
}

/**
 * 3-Month Simple Moving Average (SMA)
 * Computes historical moving average and forecasts future months using the latest average
 */
export function calculateMovingAverage(
  series: number[],
  windowSize = 3,
  forecastMonths = 6
): {
  fitted: (number | null)[];
  forecast: number[];
  rmse: number;
} {
  const n = series.length;
  const fitted: (number | null)[] = [];
  let ssRes = 0;
  let countFitted = 0;

  for (let i = 0; i < n; i++) {
    if (i < windowSize) {
      fitted.push(null); // Not enough prior data for full window
    } else {
      let windowSum = 0;
      for (let w = 0; w < windowSize; w++) {
        windowSum += series[i - w - 1];
      }
      const ma = windowSum / windowSize;
      fitted.push(Number(ma.toFixed(2)));

      ssRes += Math.pow(series[i] - ma, 2);
      countFitted++;
    }
  }

  const rmse = countFitted > 0 ? Math.sqrt(ssRes / countFitted) : 0;

  // Future forecast: latest moving average projected forward
  const forecast: number[] = [];
  const forecastSeries = [...series];
  for (let f = 0; f < forecastMonths; f++) {
    const lastWindow = forecastSeries.slice(-windowSize);
    const currentAverage = lastWindow.length
      ? lastWindow.reduce((a, b) => a + b, 0) / lastWindow.length
      : 0;
    forecast.push(Number(currentAverage.toFixed(2)));
    forecastSeries.push(currentAverage);
  }

  return {
    fitted,
    forecast,
    rmse: Number(rmse.toFixed(2)),
  };
}

/**
 * Generates consecutive future month strings
 * Example: given '2025-12' and offset 1 => '2026-01', offset 2 => '2026-02'
 */
/**
 * Returns the longest contiguous run of monthly data points (no calendar gaps).
 * Useful for forecasting when the full series contains isolated trailing months.
 */
export function getContiguousBlock(months: { month: string }[]): { month: string }[] {
  if (months.length === 0) return [];
  let best: { month: string }[] = [months[0]];
  let current: { month: string }[] = [months[0]];
  for (let i = 1; i < months.length; i++) {
    const prev = new Date(months[i - 1].month + '-01T00:00:00Z');
    const curr = new Date(months[i].month + '-01T00:00:00Z');
    const diffMonths = (curr.getUTCFullYear() - prev.getUTCFullYear()) * 12 + (curr.getUTCMonth() - prev.getUTCMonth());
    if (diffMonths === 1) {
      current.push(months[i]);
      if (current.length > best.length) best = [...current];
    } else {
      current = [months[i]];
    }
  }
  return best;
}

export function getConsecutiveFutureMonth(baseYearMonth: string, offset: number): string {
  const parts = baseYearMonth.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10); // 1-12

  // Add offset to 0-indexed month
  const targetDate = new Date(year, month - 1 + offset, 1);
  const y = targetDate.getFullYear();
  const m = String(targetDate.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Economic Order Quantity (EOQ) Formula:
 * EOQ = sqrt((2 * D * S) / H)
 * D = Annual Demand (units)
 * S = Order / Setup Cost per purchase order (standard ~₱1,500)
 * H = Annual Holding Cost per unit (standard ~20% of unit cost)
 */
export function calculateEOQ(annualDemand: number, unitCost: number, orderCost = 1500, holdingRate = 0.20): number {
  if (annualDemand <= 0 || unitCost <= 0) return 0;
  const holdingCost = Math.max(1, unitCost * holdingRate);
  const eoq = Math.sqrt((2 * annualDemand * orderCost) / holdingCost);
  return Math.max(1, Math.round(eoq));
}

/**
 * Reorder Point (ROP) Formula:
 * ROP = (Daily Demand * Lead Time Days) + Safety Stock
 * Safety Stock = Z * sqrt(Lead Time) * stdDev(daily demand)
 */
export function calculateROP(monthlyDemand: number, leadTimeDays: number, safetyFactor = 1.65): number {
  if (monthlyDemand <= 0 || leadTimeDays <= 0) return 0;
  const dailyDemand = Math.max(0.1, monthlyDemand / 30);
  const leadTimeDemand = dailyDemand * leadTimeDays;
  const safetyStock = Math.ceil(safetyFactor * Math.sqrt(leadTimeDays) * (dailyDemand * 0.3));
  return Math.ceil(leadTimeDemand + safetyStock);
}
