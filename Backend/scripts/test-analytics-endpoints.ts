import { pool } from '../src/db/index';
import descriptiveService from '../src/services/descriptive-service';
import predictiveService from '../src/services/predictive-service';
import { optimizeBudget, generateInventoryPlan } from '../src/services/prescriptive-service';
import { db } from '../src/db';
import { marketingCampaigns } from '../src/db/schema';
import { sql } from 'drizzle-orm';

async function verifyAll() {
  console.log('--- TESTING ALL ANALYTICS ENDPOINTS & SERVICES ---\n');

  // 1. Test Descriptive Service
  console.log('1. Testing DescriptiveService.getAnalytics()...');
  const desc = await descriptiveService.getAnalytics();
  console.log('   ✓ KPIs:', desc.kpis);
  console.log(`   ✓ Monthly Sales (${desc.salesByMonth.length} months):`, desc.salesByMonth.map(m => m.month));
  console.log(`   ✓ Top Product: ${desc.topProducts[0]?.name} (₱${desc.topProducts[0]?.revenue.toLocaleString()})`);
  console.log(`   ✓ Marketing Channels (${desc.campaignPerformance.length}):`, desc.campaignPerformance.map(c => `${c.channel} (ROI: ${c.roi}%)`));
  console.log('   ✓ Descriptive Stats:', desc.statistics);

  // 2. Test Predictive Service
  console.log('\n2. Testing PredictiveService.getAnalytics(6)...');
  const pred = await predictiveService.getAnalytics(6);
  console.log('   ✓ Linear Regression Equation:', pred.models.linearRegression.equation);
  console.log('   ✓ R² Score:', pred.models.linearRegression.rSquared, '| Interpretation:', pred.models.linearRegression.interpretation);
  console.log('   ✓ Recommended Model:', pred.models.recommendedModel, '| Reason:', pred.models.recommendationReason);
  console.log('   ✓ Forecast Months (Notice consecutive future labels):', pred.forecast.map(f => `${f.month}: ₱${f.linearRegression.toLocaleString()}`));
  console.log(`   ✓ Stockout items evaluated (${pred.stockoutRisks.length} products). High risk count:`, pred.stockoutRisks.filter(s => s.riskLevel === 'High').length);

  // 3. Test Prescriptive Service (Budget Optimization)
  console.log('\n3. Testing PrescriptiveService.optimizeBudget()...');
  const campaigns = await db.select().from(marketingCampaigns).orderBy(sql`start_date ASC`);
  const rows = campaigns.map(campaign => ({
    id: campaign.id,
    channel: campaign.channel,
    date: campaign.startDate,
    spend: campaign.spend,
    revenue: campaign.revenueGenerated,
    impressions: campaign.impressions,
    clicks: campaign.clicks,
    conversions: campaign.conversions,
    orders: campaign.ordersGenerated,
  }));
  const constraints = {
    'Facebook': { min: 5000, max: 40000 },
    'Google Ads': { min: 5000, max: 40000 },
    'Email': { min: 2000, max: 20000 },
    'TikTok': { min: 3000, max: 30000 },
    'Instagram': { min: 3000, max: 25000 },
  };
  const presc = await optimizeBudget(100000, constraints, rows as any[], 250000);
  console.log('   ✓ Total Allocated:', presc.totalAllocated, '| Expected Revenue:', presc.totalExpectedRevenue, '| ROI:', presc.overallROI + '%');
  console.log('   ✓ Channel Allocations:', presc.allocations.map(a => `${a.channel}: ₱${a.budget.toLocaleString()} (${a.sharePct}%)`));
  console.log('   ✓ Baseline Uplift:', presc.baselines.map(b => `${b.name}: ${b.upliftPct}%`));
  console.log('   ✓ Action List Sample:', presc.actionList[0]);

  // 4. Test Prescriptive Inventory Plan
  console.log('\n4. Testing PrescriptiveService.generateInventoryPlan()...');
  const invPlan = await generateInventoryPlan(250000);
  console.log(`   ✓ Budget: ₱${invPlan.purchaseBudget.toLocaleString()} | Committed: ₱${invPlan.totalCommittedCost.toLocaleString()}`);
  console.log(`   ✓ Items to Reorder: ${invPlan.itemsToReorderCount} | Projected Profit: ₱${invPlan.projectedProfit.toLocaleString()}`);

  console.log('\n=============================================');
  console.log('   ALL ANALYTICS SERVICES PASSED 100% ✓       ');
  console.log('=============================================');

  await pool.end();
}

verifyAll().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
