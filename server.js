/**
 * Hosting entry point (cPanel / Node App / platforms that look for root server.js).
 * Boots the Express API in server/src/index.js.
 */
import('./server/src/index.js').catch((err) => {
  console.error('Failed to start Prizren Heritage API:', err);
  process.exit(1);
});
