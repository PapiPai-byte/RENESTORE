import { pool } from '../db';
import descriptiveService from './descriptive-service';
import { getChannelRoiMap } from './channel-roi';
import { getForecastMonthlyRevenue, getPeakMonthlyRevenue, ATTRIBUTION_SHARE } from './store-forecast';
import {
  calculateLinearRegression,
  calculateMovingAverage,
  getConsecutiveFutureMonth,
  getContiguousBlock,
  calculateEOQ,
  calculateROP,
  type MonthlyDataPoint,
} from './analytics-shared';

export interface ChannelModel {
  channel: string;
  historicalRoi: number;
  predictedRoi: number;
  historicalSpend: number;
  historicalRevenue: number;
  observations: number;
  trend: 'increasing' | 'stable' | 'diminishing';
}

export interface StockoutRiskItem {
  productId: number;
  name: string;
  category: string;
  currentStock: number;
  reorderLevel: number;
  monthlyDemand: number;
  leadTimeDays: number;
  daysOfInventory: number | null;
  riskLevel: 'High' | 'Medium' | 'Low';
  suggestedReorderQty: number;
  supplier: string;
}

export interface PredictiveAnalyticsResult {
  sharedDateRange: {
    startMonth: string;
    endMonth: string;
    totalHistoricalMonths: number;
  };
  models: {
    linearRegression: {
      equation: string;
      slope: number;
      intercept: number;
      rSquared: number;
      rmse: number;
      interpretation: string;
    };
    movingAverage: {
      windowSize: number;
      rmse: number;
      interpretation: string;
    };
    recommendedModel: 'Linear Regression' | 'Moving Average';
    recommendationReason: string;
  };
  history: {
    month: string;
    revenue: number;
    profit: number;
    orders: number;
    lrFitted: number | null;
    maFitted: number | null;
    isPartial?: boolean;
  }[];
  forecast: {
    month: string;
    linearRegression: number;
    movingAverage: number;
  }[];
  channelPredictions: ChannelModel[];
  stockoutRisks: StockoutRiskItem[];
  dataConfidenceNote: string;
  forecastMonthlyRevenue: number | null;
  peakMonthlyRevenue: number;
  naiveBaselineRmse: number;
}

export class PredictiveService {
  async getAnalytics(monthsAhead = 6): Promise<PredictiveAnalyticsResult> {
    const client = await pool.connect();
    try {
      // 1. Shared monthly sales from Descriptive Service
      const monthlyData = await descriptiveService.getMonthlySales();

      // Separate complete months for reliable statistical modeling
      const completeMonths = monthlyData.filter(m => !m.isPartial && (m.orders || 0) >= 5);
      const dataToFit = completeMonths;

      const lastCompleteMonth = dataToFit[dataToFit.length - 1]?.month;
      const startMonth = dataToFit[0]?.month;

      // 2. Linear Regression Model
      const regressionPoints = dataToFit.map((m, idx) => ({ x: idx, y: m.revenue }));
      const lrResult = calculateLinearRegression(regressionPoints);

      // Plain language R² interpretation (Bug 3e)
      const r2Percent = Math.round(lrResult.rSquared * 100);
      let r2Interpretation = '';
      if (lrResult.rSquared >= 0.7) {
        r2Interpretation = `The trend explains ${r2Percent}% of monthly variation, indicating a strong and reliable sales trajectory.`;
      } else if (lrResult.rSquared >= 0.4) {
        r2Interpretation = `The trend explains ${r2Percent}% of monthly variation, showing moderate seasonal influence.`;
      } else {
        r2Interpretation = `The trend explains only ${r2Percent}% of monthly variation due to seasonality and promotions; treat forecast as an indicative planning guide.`;
      }

      // 3. 3-Month Moving Average (SMA) Model
      const revenueSeries = dataToFit.map(m => m.revenue);
      const maResult = calculateMovingAverage(revenueSeries, 3, monthsAhead);

      // Model Recommendation based on RMSE (lower RMSE indicates better fit)
      const isLrBetter = lrResult.rmse <= maResult.rmse;
      const recommendedModel = isLrBetter ? 'Linear Regression' : 'Moving Average';
      const recommendationReason = isLrBetter
        ? `Linear Regression has a lower Root Mean Square Error (₱${lrResult.rmse.toLocaleString()} vs ₱${maResult.rmse.toLocaleString()}), effectively capturing long-term growth.`
        : `Moving Average has a lower Root Mean Square Error (₱${maResult.rmse.toLocaleString()} vs ₱${lrResult.rmse.toLocaleString()}), smoothing short-term monthly volatility better.`;

      // 4. Build Historical Series with fitted values
      const completeMonthIndexes = new Map(dataToFit.map((month, index) => [month.month, index]));
      const history = monthlyData.map((m) => {
        const idx = completeMonthIndexes.get(m.month);
        const lrFitted = idx === undefined ? null : Math.round(lrResult.slope * idx + lrResult.intercept);
        return {
          month: m.month,
          revenue: m.revenue,
          profit: m.profit,
          orders: m.orders,
          lrFitted: lrFitted === null ? null : Math.max(0, lrFitted),
          maFitted: idx === undefined ? null : maResult.fitted[idx],
          isPartial: m.isPartial,
        };
      });

      // Forecast labels are anchored to the last complete month in the shared series.
      const forecast: PredictiveAnalyticsResult['forecast'] = [];
      const baseIndex = dataToFit.length;

      if (lastCompleteMonth) {
        for (let f = 1; f <= monthsAhead; f++) {
          const forecastMonth = getConsecutiveFutureMonth(lastCompleteMonth, f);
          const lrForecast = Math.max(0, Math.round(lrResult.slope * (baseIndex + f - 1) + lrResult.intercept));
          const maForecast = Math.max(0, Math.round(maResult.forecast[f - 1]));

          forecast.push({
            month: forecastMonth,
            linearRegression: lrForecast,
            movingAverage: maForecast,
          });
        }
      }

      // Predict each channel's ROI from its observed campaign-month returns.
      const mktRes = await client.query(`
        SELECT
          mc.channel,
          to_char(date_trunc('month', mc.start_date), 'YYYY-MM') AS month,
          COALESCE(SUM(mc.spend), 0) AS total_spend,
          COALESCE(SUM(o.total_amount), 0) AS total_revenue
        FROM marketing_campaigns mc
        LEFT JOIN orders o ON o.campaign_id = mc.id AND o.status = 'completed'
        GROUP BY mc.channel, date_trunc('month', mc.start_date)
        ORDER BY mc.channel, date_trunc('month', mc.start_date)
      `);

      const channelRoiMap = await getChannelRoiMap();
      const campaignsByChannel = new Map<string, { spend: number; revenue: number; roi: number }[]>();
      for (const row of mktRes.rows) {
        const rows = campaignsByChannel.get(row.channel) || [];
        const spend = Number(row.total_spend);
        const revenue = Number(row.total_revenue);
        rows.push({ spend, revenue, roi: spend > 0 ? ((revenue - spend) / spend) * 100 : 0 });
        campaignsByChannel.set(row.channel, rows);
      }
      const channelPredictions: ChannelModel[] = [...campaignsByChannel.entries()].map(([channel, rows]) => {
        const spend = rows.reduce((total, row) => total + row.spend, 0);
        const revenue = rows.reduce((total, row) => total + row.revenue, 0);
        const recentRows = rows.slice(-3);
        const predictedRoi = recentRows.reduce((total, row) => total + row.roi, 0) / recentRows.length;
        const midpoint = Math.ceil(rows.length / 2);
        const firstHalf = rows.slice(0, midpoint).map(row => row.roi);
        const secondHalf = rows.slice(midpoint).map(row => row.roi);
        const firstAverage = firstHalf.reduce((total, roi) => total + roi, 0) / Math.max(1, firstHalf.length);
        const secondAverage = secondHalf.reduce((total, roi) => total + roi, 0) / Math.max(1, secondHalf.length);
        const shared = channelRoiMap[channel];

        return {
          channel,
          historicalRoi: shared ? shared.roi : Number((spend > 0 ? ((revenue - spend) / spend) * 100 : 0).toFixed(1)),
          predictedRoi: Number(predictedRoi.toFixed(1)),
          historicalSpend: Math.round(spend),
          historicalRevenue: Math.round(revenue),
          observations: rows.length,
          trend: secondAverage > firstAverage ? 'increasing' : secondAverage < firstAverage ? 'diminishing' : 'stable',
        };
      });

      // Compare completed-order demand with current stock and observed supplier lead time.
      const stockRes = await client.query(`
        WITH product_sales AS (
          SELECT oi.product_id, SUM(oi.quantity) AS total_units_sold
          FROM order_items oi
          JOIN orders o ON o.id = oi.order_id
          WHERE o.status = 'completed'
          GROUP BY oi.product_id
        ),
        purchase_history AS (
          SELECT product_id, AVG(lead_time_days) AS avg_lead_time, MAX(supplier) AS supplier
          FROM inventory_purchases
          GROUP BY product_id
        )
        SELECT
          p.id,
          p.name,
          p.category,
          p.cost,
          p.stock,
          p.reorder_level,
          COALESCE(ps.total_units_sold, 0) AS total_units_sold,
          ph.avg_lead_time,
          ph.supplier AS preferred_supplier
        FROM products p
        LEFT JOIN product_sales ps ON ps.product_id = p.id
        LEFT JOIN purchase_history ph ON ph.product_id = p.id
        ORDER BY p.stock ASC
      `);

      const totalMonths = dataToFit.length;
      const stockoutRisks: StockoutRiskItem[] = stockRes.rows.map((r: any) => {
        const currentStock = Number(r.stock);
        const dbReorderLevel = Number(r.reorder_level);
        const totalUnits = Number(r.total_units_sold);
        const leadTimeDays = Math.round(Number(r.avg_lead_time)) || 0;

        const monthlyDemand = totalMonths > 0 ? Math.round((totalUnits / totalMonths) * 10) / 10 : 0;
        const dailyDemand = monthlyDemand / 30;
        const daysOfInventory = dailyDemand > 0 ? Math.round(currentStock / dailyDemand) : null;

        const reorderPoint = calculateROP(monthlyDemand, leadTimeDays);
        const reorderLevel = reorderPoint > 0 ? reorderPoint : dbReorderLevel;

        let riskLevel: 'High' | 'Medium' | 'Low' = 'Low';
        if (monthlyDemand <= 0) {
          riskLevel = currentStock <= 0 ? 'High' : 'Low';
        } else if (currentStock <= 0) {
          riskLevel = 'High';
        } else if (daysOfInventory !== null && leadTimeDays > 0 && daysOfInventory <= leadTimeDays) {
          riskLevel = 'High';
        } else if (daysOfInventory !== null && leadTimeDays > 0 && daysOfInventory <= leadTimeDays * 2) {
          riskLevel = 'Medium';
        } else if (currentStock <= reorderLevel) {
          riskLevel = 'High';
        }

        const eoq = calculateEOQ(Math.max(1, monthlyDemand) * 12, Number(r.cost));
        const suggestedReorderQty = monthlyDemand <= 0
          ? 0
          : riskLevel === 'High'
            ? Math.max(1, Math.min(eoq, Math.ceil(monthlyDemand * 3)))
            : riskLevel === 'Medium'
              ? Math.max(1, Math.min(Math.ceil(eoq * 0.5), Math.ceil(monthlyDemand * 2)))
              : 0;

        return {
          productId: r.id,
          name: r.name,
          category: r.category,
          currentStock,
          reorderLevel,
          monthlyDemand,
          leadTimeDays,
          daysOfInventory,
          riskLevel,
          suggestedReorderQty,
          supplier: r.preferred_supplier || 'Supplier not set',
        };
      });

      const dataConfidenceNote = dataToFit.length < 3
        ? `Limited data: only ${dataToFit.length} complete historical month(s) are available. Treat forecasts as indicative, not a guarantee.`
        : `Forecasts use ${dataToFit.length} complete historical months (${startMonth} to ${lastCompleteMonth}); model fit does not guarantee future results.`;

      const forecastMonthlyRevenue = await getForecastMonthlyRevenue();
      const peakMonthlyRevenue = await getPeakMonthlyRevenue();
      const meanY = revenueSeries.reduce((a,b)=>a+b,0)/Math.max(1,revenueSeries.length);
      const naiveBaselineRmse = Math.sqrt(revenueSeries.reduce((s,y)=>s+Math.pow(y-meanY,2),0)/Math.max(1,revenueSeries.length));

      return {
        sharedDateRange: {
          startMonth: startMonth || '',
          endMonth: lastCompleteMonth || '',
          totalHistoricalMonths: dataToFit.length,
        },
        models: {
          linearRegression: {
            equation: lrResult.equation,
            slope: lrResult.slope,
            intercept: lrResult.intercept,
            rSquared: Number(lrResult.rSquared.toFixed(2)),
            rmse: lrResult.rmse,
            interpretation: r2Interpretation,
          },
          movingAverage: {
            windowSize: 3,
            rmse: maResult.rmse,
            interpretation: '3-month simple moving average smooths out monthly spikes to capture short-term baseline momentum.',
          },
          recommendedModel,
          recommendationReason,
        },
        history,
        forecast,
        channelPredictions,
        stockoutRisks,
        dataConfidenceNote,
        forecastMonthlyRevenue,
        peakMonthlyRevenue,
        naiveBaselineRmse: Number(naiveBaselineRmse.toFixed(2)),
      };
    } finally {
      client.release();
    }
  }
}

export default new PredictiveService();
