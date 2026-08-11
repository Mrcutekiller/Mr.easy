/**
 * MR.easy Post-Launch Website Health Monitoring
 * Checks availability, response time, SSL status, and stale content alerts for deployed sites.
 */

'use strict';

const http  = require('http');
const https = require('https');

function checkWebsiteHealth(targetUrl) {
  return new Promise((resolve) => {
    if (!targetUrl || (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://'))) {
      targetUrl = 'https://' + targetUrl;
    }

    const start = Date.now();
    const client = targetUrl.startsWith('https://') ? https : http;

    const req = client.get(targetUrl, (res) => {
      const responseTimeMs = Date.now() - start;
      const statusCode = res.statusCode;
      const isOk = statusCode >= 200 && statusCode < 400;

      const lastModified = res.headers['last-modified'];
      let staleNotice = null;
      if (lastModified) {
        const lastDate = new Date(lastModified);
        const monthsAgo = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (monthsAgo > 6) {
          staleNotice = `Your website content has not been updated in ${Math.round(monthsAgo)} months. Consider updating opening hours and prices!`;
        }
      }

      resolve({
        url: targetUrl,
        isOnline: isOk,
        statusCode,
        responseTimeMs,
        sslValid: targetUrl.startsWith('https://'),
        staleNotice,
        checkedAt: new Date().toISOString()
      });
    });

    req.on('error', (err) => {
      resolve({
        url: targetUrl,
        isOnline: false,
        statusCode: 0,
        responseTimeMs: Date.now() - start,
        sslValid: false,
        error: err.message,
        checkedAt: new Date().toISOString()
      });
    });

    req.setTimeout(8000, () => {
      req.destroy();
      resolve({
        url: targetUrl,
        isOnline: false,
        statusCode: 408,
        responseTimeMs: 8000,
        sslValid: false,
        error: 'Connection timed out',
        checkedAt: new Date().toISOString()
      });
    });
  });
}

module.exports = { checkWebsiteHealth };
