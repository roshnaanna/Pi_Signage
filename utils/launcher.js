const { spawn, exec } = require('child_process');
const os = require('os');
const path = require('path');

/**
 * Pi Signage - Automated Kiosk Launcher
 * Starts the server and automatically opens the browser in true full-screen mode.
 */

console.log('--- 📺 PiSignage Automated Launcher ---');

// 1. Start the actual server using nodemon
// Using 'npx' ensures we use the project's local nodemon if available
const serverProcess = spawn('npx', ['nodemon', 'server.js'], {
  stdio: 'inherit',
  shell: true,
});

// 2. Schedule the browser launch
// We wait a few seconds to ensure MongoDB connects and the server is listening
const BOOT_DELAY_MS = 5000; 

setTimeout(() => {
  const url = 'http://localhost:5000/display/';
  const platform = os.platform();
  let launchCmd;

  if (platform === 'win32') {
    // Windows Launcher
    // Tries to launch Chrome in kiosk mode
    launchCmd = `start chrome --kiosk --incognito --disable-features=Translate "${url}"`;
    console.log(`🪟 Windows detected. Launching Chrome Kiosk...`);
  } else if (platform === 'linux') {
    // Linux / Raspberry Pi Launcher
    // Uses Chromium with flags to hide error dialogs and infobars
    launchCmd = `DISPLAY=:0 chromium-browser --kiosk --incognito --noerrdialogs --disable-infobars --check-for-update-interval=31536000 "${url}" &`;
    console.log(`🍓 Linux/Pi detected. Launching Chromium Kiosk...`);
  } else if (platform === 'darwin') {
    // macOS Launcher
    launchCmd = `open -a "Google Chrome" --args --kiosk --incognito "${url}"`;
    console.log(`🍎 macOS detected. Launching Chrome Kiosk...`);
  }

  if (launchCmd) {
    exec(launchCmd, (error) => {
      if (error) {
        console.error(`❌ Launcher Error: ${error.message}`);
        console.log('💡 Note: Ensure Google Chrome or Chromium is installed.');
      } else {
        console.log('✅ Kiosk browser launched successfully.');
      }
    });
  } else {
    console.log(`⚠️ OS not supported for auto-launch.`);
    console.log(`🔗 Please open manually: ${url}`);
  }
}, BOOT_DELAY_MS);

// Handle process termination
process.on('SIGINT', () => {
  serverProcess.kill();
  process.exit();
});
