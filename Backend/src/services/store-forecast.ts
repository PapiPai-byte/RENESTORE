import { pool } from '../db';
import { calculateMovingAverage, getConsecutiveFutureMonth, getContiguousBlock } from './analytics-shared';
import descriptiveService from './descriptive-service';

export const ATTRIBUTION_SHARE = Number(process.env.ATTRIBUTION_SHARE) || 0.30;

export async function getPeakMonthlyRevenue(): Promise<number> {
  const months = await descriptiveService.getMonthlySales();
  const complete = months.filter(m => !m.isPartial);
  if (complete.length === 0) return 0;
  return Math.max(...complete.map(m => m.revenue));
}

/**
 * Average monthly store-revenue forecast for the next 3 calendar months.
 * Returns null when it cannot be computed (no data / non-positive).
 */
export async function getForecastMonthlyRevenue(): Promise<number | null> {
  const months = await descriptiveService.getMonthlySales();
  const complete = months.filter(m => !m.isPartial && (m.orders || 0) >= 5);
  if (complete.length < 3) return null;
  const series = complete.map(m => m.revenue);
  const result = calculateMovingAverage(series, 3, 3);
  const forecast = result.forecast;
  if (!forecast || forecast.length === 0) return null;
  const avg = forecast.reduce((a, b) => a + b, 0) / forecast.length;
  if (!Number.isFinite(avg) || avg <= 0) return null;
  return Math.round(avg);
}

export async function getForecastSeries(): Promise<{ month: string; value: number }[]> {
  const months = await descriptiveService.getMonthlySales();
  const complete = months.filter(m => !m.isPartial && (m.orders || 0) >= 5);
  if (complete.length < 3) return [];
  const lastMonth = complete[complete.length - 1].month;
  const series = complete.map(m => m.revenue);
  const result = calculateMovingAverage(series, 3, 3);
  return result.forecast.map((v, i) => ({
    month: getConsecutiveFutureMonth(lastMonth, i + 1),
    value: v,
  }));
}
