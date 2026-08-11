/**
 * MR.easy Live Page Weight & Health Meter
 * Calculates page size, asset count, accessibility score, and load time estimates.
 */

'use strict';

function calculatePageHealth(html, ir) {
  const bytes = Buffer.byteLength(html || '', 'utf-8');
  const sizeKB = Math.round(bytes / 1024 * 10) / 10;

  let imageCount = 0;
  let buttonCount = 0;
  let linkCount = 0;
  let altMissingCount = 0;

  const inspect = (nodes) => {
    for (const n of nodes) {
      if (n.type === 'image' || n.type === 'img') {
        imageCount++;
        if (!n.props?.alt && !n.label) altMissingCount++;
      }
      if (n.type === 'button') buttonCount++;
      if (n.type === 'link') linkCount++;
      if (n.children) inspect(n.children);
    }
  };
  if (ir?.nodes) inspect(ir.nodes);

  const estimatedImageWeightKB = imageCount * 120; // ~120KB per image assumption
  const totalWeightKB = Math.round(sizeKB + estimatedImageWeightKB);

  // Estimated load time on 3G (1.5 Mbps)
  const loadTimeSec = Math.max(0.2, Math.round((totalWeightKB / 180) * 10) / 10);

  // Accessibility Score (0-100)
  let a11yScore = 100;
  if (altMissingCount > 0) a11yScore -= (altMissingCount * 15);
  if (!ir?.title || ir.title === 'My MR.easy Page') a11yScore -= 20;
  a11yScore = Math.max(0, Math.min(100, a11yScore));

  // Mobile readiness
  let mobileReadiness = 'Good';
  if (totalWeightKB > 1500) mobileReadiness = 'Needs Attention';
  else if (totalWeightKB > 800) mobileReadiness = 'Warning';

  let beginnerAdvice = 'Your page is lightweight and fast!';
  if (totalWeightKB > 1000) {
    beginnerAdvice = 'Your page is getting heavy. Try reducing large images for faster loading.';
  } else if (a11yScore < 80) {
    beginnerAdvice = 'Add descriptions (alt) to your images so everyone can view your site.';
  }

  return {
    totalWeightKB,
    htmlSizeKB: sizeKB,
    imageWeightKB: estimatedImageWeightKB,
    imageCount,
    buttonCount,
    linkCount,
    loadTimeSec,
    a11yScore,
    mobileReadiness,
    beginnerAdvice
  };
}

module.exports = { calculatePageHealth };
