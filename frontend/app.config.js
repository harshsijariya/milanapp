const fs = require('fs');
const path = require('path');

/**
 * Dynamic Expo config.
 *
 * Everything static lives in app.json. This wrapper handles the two things
 * that must vary by machine or by build profile.
 *
 * 1. google-services.json is required for FCM delivery but is gitignored and
 *    not present on every machine. Referencing it unconditionally from
 *    app.json makes `prebuild` fail with ENOENT for anyone who has not
 *    downloaded it, blocking the whole build over a feature they may not be
 *    touching. Attached only when the file exists:
 *      - with it    -> push notifications work
 *      - without it -> the app builds and runs, push is simply inactive
 *    Download from Firebase console -> Project settings -> Your apps ->
 *    Android (package com.jeevanmilansathi.frontend), next to this file.
 *
 * 2. Cleartext HTTP. Local development talks to http://10.0.2.2:8080, which
 *    Android blocks unless usesCleartextTraffic is on. Leaving it on in a
 *    release build would let anyone on the same network downgrade the
 *    connection and read profiles, phone numbers and auth tokens in the
 *    clear. So it follows the API URL: on for http://, off for https://.
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

  // Falls back to allowing cleartext when the URL is unset, because that is
  // the local-development case; a release build always sets it via eas.json.
  const apiUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
  const needsCleartext = !apiUrl || apiUrl.startsWith('http://');

  config.plugins = (config.plugins || []).map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === 'expo-build-properties') {
      return [
        plugin[0],
        {
          ...plugin[1],
          android: { ...(plugin[1].android || {}), usesCleartextTraffic: needsCleartext },
        },
      ];
    }
    return plugin;
  });

  console.log(
    `[expo config] API ${apiUrl || '(unset - local dev)'} | ` +
      `cleartext HTTP ${needsCleartext ? 'ALLOWED' : 'blocked'}`
  );

  return config;
};
