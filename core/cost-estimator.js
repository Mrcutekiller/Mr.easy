/**
 * MR.easy Hosting Cost Estimator
 * Calculates expected bandwidth & monthly hosting costs in Ethiopian Birr (ETB).
 */

'use strict';

const DEFAULT_PROVIDER_PRICING = {
  name: 'Standard Ethiopian Web Host',
  freeTierBandwidthGB: 5.0,
  freeTierStorageMB: 500,
  baseMonthlyFeeETB: 50,
  perGBBandwidthETB: 20,
  currency: 'ETB'
};

function estimateHostingCost(pageHealth, monthlyVisitors = 1000, providerPricing = DEFAULT_PROVIDER_PRICING) {
  const pageViewsPerVisitor = 2.2;
  const totalPageViews = monthlyVisitors * pageViewsPerVisitor;
  const pageWeightMB = (pageHealth.totalWeightKB || 500) / 1024;

  const estimatedBandwidthGB = Math.round((totalPageViews * pageWeightMB) / 1024 * 100) / 100;
  const extraBandwidthGB = Math.max(0, estimatedBandwidthGB - providerPricing.freeTierBandwidthGB);

  const extraBandwidthCost = extraBandwidthGB * providerPricing.perGBBandwidthETB;
  const totalMonthlyCostETB = Math.round(providerPricing.baseMonthlyFeeETB + extraBandwidthCost);

  return {
    monthlyVisitors,
    totalPageViews: Math.round(totalPageViews),
    bandwidthGB: estimatedBandwidthGB,
    baseCostETB: providerPricing.baseMonthlyFeeETB,
    totalCostETB: totalMonthlyCostETB,
    currency: 'ETB',
    summaryText: `Estimated hosting cost: ≈ ${totalMonthlyCostETB} ETB/month (${estimatedBandwidthGB} GB bandwidth for ~${monthlyVisitors.toLocaleString()} visitors/mo)`
  };
}

module.exports = { estimateHostingCost, DEFAULT_PROVIDER_PRICING };
