import { pool } from '../db';
import { logger } from '../lib/logger';

export const MIN_CAMPAIGN_SPEND = Number(process.env.MIN_CAMPAIGN_SPEND) || 1000;

export interface ChannelRoiRow {
  channel: string;
  totalSpend: number;
  totalRevenue: number;
  campaignMonths: number;
  roi: number; // percent
}

/**
 * Shared channel ROI: attributed revenue comes from completed orders linked
 * to campaigns of that channel (orders.campaign_id -> marketing_campaigns).
 */
export async function getChannelRoi(): Promise<ChannelRoiRow[]> {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT mc.channel,
             mc.id AS campaign_id,
             mc.spend,
             COALESCE(SUM(o.total_amount), 0) AS revenue
      FROM marketing_campaigns mc
      LEFT JOIN orders o ON o.campaign_id = mc.id AND o.status = 'completed'
      GROUP BY mc.channel, mc.id, mc.spend
      ORDER BY mc.channel, mc.id
    `);

    const byChannel = new Map<string, { spend: number; revenue: number; campaigns: number; excluded: number }>();
    for (const row of res.rows) {
      const channel = row.channel as string;
      const spend = Number(row.spend) || 0;
      const revenue = Number(row.revenue) || 0;
      const entry = byChannel.get(channel) || { spend: 0, revenue: 0, campaigns: 0, excluded: 0 };
      if (spend < MIN_CAMPAIGN_SPEND) {
        entry.excluded += 1;
        byChannel.set(channel, entry);
        continue;
      }
      entry.spend += spend;
      entry.revenue += revenue;
      entry.campaigns += 1;
      byChannel.set(channel, entry);
    }

    const excludedTotal = [...byChannel.values()].reduce((t, e) => t + e.excluded, 0);
    if (excludedTotal > 0) {
      console.log(`[channel-roi] excluded ${excludedTotal} campaign(s) with spend below ${MIN_CAMPAIGN_SPEND}`);
    }

    return [...byChannel.entries()].map(([channel, e]) => ({
      channel,
      totalSpend: Math.round(e.spend),
      totalRevenue: Math.round(e.revenue),
      campaignMonths: e.campaigns,
      roi: e.spend > 0 ? Number((((e.revenue - e.spend) / e.spend) * 100).toFixed(1)) : 0,
    }));
  } finally {
    client.release();
  }
}

export async function getChannelRoiMap(): Promise<Record<string, ChannelRoiRow>> {
  const rows = await getChannelRoi();
  return Object.fromEntries(rows.map(r => [r.channel, r]));
}
