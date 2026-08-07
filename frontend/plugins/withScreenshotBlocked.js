const { withMainActivity } = require('expo/config-plugins');

const MARKER = '// @generated withScreenshotBlocked';

/**
 * Block screenshots and screen recording on Android.
 *
 * Members' photos, phone numbers and family details are the whole content of
 * this app, and the usual complaint about a matrimony platform is that profiles
 * get screenshotted and circulated. FLAG_SECURE is Android's answer: the window
 * is excluded from screen capture, screen recording, and the recent-apps
 * thumbnail, and non-secure displays refuse to mirror it.
 *
 * Set in onCreate BEFORE super.onCreate, because the flag has to be on the
 * window before the first frame is composed; setting it later leaves a window
 * where the content is capturable.
 *
 * Worth being honest about the limits of this:
 *
 *  - It stops the OS screenshot path, not a camera pointed at the screen. It
 *    raises effort, it does not make photos unshareable.
 *  - iOS has no equivalent. UIKit offers no way to refuse a screenshot; the
 *    most an iOS app can do is detect one after the fact
 *    (userDidTakeScreenshot) or hide content in the app switcher. So this is
 *    Android-only by necessity, and the iOS build is unaffected.
 *  - Rooted devices and some OEM builds can bypass it.
 *
 * It also blocks YOUR OWN screenshots when testing, including `adb screencap`,
 * which returns a black image with no error. That is the expected symptom, not
 * a broken emulator.
 */
const withScreenshotBlocked = (config) =>
  withMainActivity(config, (cfg) => {
    const { language } = cfg.modResults;
    let src = cfg.modResults.contents;

    if (src.includes(MARKER)) return cfg;

    const isKotlin = language === 'kt';
    const importLine = isKotlin
      ? 'import android.view.WindowManager'
      : 'import android.view.WindowManager;';

    if (!src.includes('import android.view.WindowManager')) {
      // After the package declaration, which every MainActivity opens with.
      src = src.replace(/^(package .*\n)/m, `$1\n${importLine}\n`);
    }

    const flagCall = isKotlin
      ? `    ${MARKER}\n` +
        `    window.setFlags(\n` +
        `      WindowManager.LayoutParams.FLAG_SECURE,\n` +
        `      WindowManager.LayoutParams.FLAG_SECURE\n` +
        `    )\n`
      : `    ${MARKER}\n` +
        `    getWindow().setFlags(\n` +
        `      WindowManager.LayoutParams.FLAG_SECURE,\n` +
        `      WindowManager.LayoutParams.FLAG_SECURE\n` +
        `    );\n`;

    // Match the onCreate signature in either language and insert at its top.
    const onCreate = isKotlin
      ? /(override fun onCreate\(savedInstanceState: Bundle\?\) \{\n)/
      : /(protected void onCreate\(Bundle savedInstanceState\) \{\n)/;

    if (!onCreate.test(src)) {
      throw new Error(
        'withScreenshotBlocked: could not find onCreate in MainActivity - the ' +
          'Expo template changed shape and this plugin needs updating.'
      );
    }

    src = src.replace(onCreate, `$1${flagCall}`);
    cfg.modResults.contents = src;
    return cfg;
  });

module.exports = withScreenshotBlocked;
