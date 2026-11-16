export interface DataPoint {
  x: number;
  y: number;
}

export interface RegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  equation: string;
}

export function linearRegression(data: DataPoint[]): RegressionResult {
  const n = data.length;
  if (n === 0) {
    return { slope: 0, intercept: 0, rSquared: 0, equation: 'y = 0' };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  let sumYY = 0;

  for (const point of data) {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumXX += point.x * point.x;
    sumYY += point.y * point.y;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) {
    const meanY = sumY / n;
    return {
      slope: 0,
      intercept: meanY,
      rSquared: 0,
      equation: `y = ${meanY.toFixed(2)}`,
    };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const meanY = sumY / n;
  let totalSS = 0;
  let residualSS = 0;

  for (const point of data) {
    const predicted = slope * point.x + intercept;
    totalSS += Math.pow(point.y - meanY, 2);
    residualSS += Math.pow(point.y - predicted, 2);
  }

  const rSquared = totalSS === 0 ? 0 : Math.max(0, 1 - residualSS / totalSS);
  const sign = intercept >= 0 ? '+' : '-';
  const equation = `y = ${slope.toFixed(4)}x ${sign} ${Math.abs(intercept).toFixed(2)}`;

  return {
    slope,
    intercept,
    rSquared,
    equation,
  };
}