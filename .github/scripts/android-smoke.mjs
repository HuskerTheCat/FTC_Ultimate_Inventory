// Installs the debug APK on the running emulator and walks the main screens in the app's WebView:
// join a team, create an account and verify its email, see the inventory, check the phone header fits, open the scanner, open the demo,
// and tap the update banner (this build's version is older than the latest release) to open Android's installer.
// The test team lives in the local Firestore emulator (seed-emulator.mjs), reached through `adb reverse`.
import { mkdirSync } from 'node:fs';
import { _android } from 'playwright';

const PKG = 'io.github.huskerthecat.ftcinventory';
const JOIN_CODE = 'demo-ftc-smoketest23';
const SHOTS = 'android-screens';

mkdirSync(SHOTS, { recursive: true });
const [device] = await _android.devices();
if (!device) throw new Error('No Android device found');
const shot = (name) => device.screenshot({ path: `${SHOTS}/${name}.png` });

await device.installApk('android/app/build/outputs/apk/debug/app-debug.apk');
await device.shell(`pm grant ${PKG} android.permission.CAMERA`);
await device.shell(`am start -n ${PKG}/.MainActivity`);
const page = await (await device.webView({ pkg: PKG })).page();
page.on('console', (message) => console.log(`[webview ${message.type()}] ${message.text()}`));
page.setDefaultTimeout(30000);

console.log('Welcome screen');
await page.getByRole('button', { name: 'Try the demo' }).waitFor();
await shot('1-welcome');

console.log('Join the test team');
await page.getByPlaceholder('Join code').fill(JOIN_CODE);
await page.getByRole('button', { name: 'Join team' }).click();
await page.getByRole('button', { name: 'Create account' }).waitFor();
await shot('2-signin');

console.log('Create an account');
await page.getByPlaceholder('Your name (for new accounts)').fill('Android Test');
await page.getByPlaceholder('Email').fill('android@example.com');
await page.getByPlaceholder('Password').fill('smoke-test-password');
await page.locator('input[name=privacy]').check();
await page.getByRole('button', { name: 'Create account' }).click();
await page.getByText('Check your email').waitFor();

console.log('Verify the email through the Auth emulator');
const { oobCodes } = await (await fetch('http://127.0.0.1:9099/emulator/v1/projects/demo-ftc/oobCodes')).json();
const verify = oobCodes.find((code) => code.requestType === 'VERIFY_EMAIL' && code.email === 'android@example.com');
if (!verify) throw new Error('No verification email in the Auth emulator');
await fetch(verify.oobLink);
await page.getByText('Seeded test part').first().waitFor().catch(async (error) => {
  // The run's screenshots can't always be opened, so say what the screen shows.
  console.log(`Screen text: ${(await page.textContent('body')).replace(/\s+/g, ' ').trim()}`);
  throw error;
});
await shot('3-inventory');

console.log('Phone header fits the screen');
const layout = await page.evaluate(() => ({
  width: innerWidth,
  scrollWidth: document.documentElement.scrollWidth,
  menuRight: document.querySelector('#main-menu-toggle').getBoundingClientRect().right,
}));
console.log(JSON.stringify(layout));
if (layout.scrollWidth > layout.width || layout.menuRight > layout.width) throw new Error('The header is wider than the screen');

console.log('Scanner shows the camera');
await page.locator('#scan').click();
await page.waitForFunction(() => document.querySelector('#camera')?.videoWidth > 0);
await shot('4-scanner');
await page.getByRole('button', { name: 'Cancel' }).click();

console.log('Demo opens from the welcome screen');
await page.locator('#main-menu-toggle').click();
await page.locator('#signout').click();
await page.getByRole('button', { name: 'Use a different team' }).click();
await page.getByRole('button', { name: 'Try the demo' }).click();
await page.locator('#demo-banner').waitFor();
await shot('5-demo');

console.log('Update banner downloads the latest release and opens the installer');
await device.shell(`appops set ${PKG} REQUEST_INSTALL_PACKAGES allow`);
await page.getByText('Your app is out of date, tap here to update').click();
for (let tries = 0; ; tries++) {
  const focus = (await device.shell('dumpsys window | grep mCurrentFocus')).toString();
  if (focus.includes('packageinstaller')) break;
  if (tries === 60) throw new Error(`The installer didn't open: ${focus}`);
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
await shot('6-installer');

console.log('Android smoke test passed');
await device.close();
