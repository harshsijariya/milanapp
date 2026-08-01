const fs = require('fs');
const path = require('path');

/**
 * Dynamic Expo config.
 *
 * Everything lives in app.json; this wrapper exists for one reason:
 * google-services.json is required for FCM delivery but is gitignored and not
 * present on every machine. Referencing it unconditionally from app.json makes
 * `prebuild` fail outright with ENOENT for anyone who has not downloaded it,
 * which blocks the whole build over a feature they may not be touching.
 *
 * Here it is attached only when the file actually exists, so:
 *   - with the file  -> push notifications work
 *   - without it     -> the app builds and runs, push is simply inactive
 *
 * Download from Firebase console -> Project settings -> Your apps -> Android
 * (package com.jeevanmilansathi.frontend) and drop it next to this file.
 */
module.exports = ({ config }) => {
  const googleServices = path.join(__dirname, 'google-services.json');

  if (fs.existsSync(googleServices)) {
    config.android = { ...(config.android || {}), googleServicesFile: './google-services.json' };
  } else {
    console.warn(
      '[expo config] google-services.json not found - building without FCM. ' +
        'Push notifications will not be delivered until you add it.'
    );
  }

  return config;
};
