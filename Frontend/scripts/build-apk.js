const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const envPath = path.join(__dirname, '../.env');
const localApiUrl = 'EXPO_PUBLIC_API_URL=http://192.168.1.10:5000/api';
const prodApiUrl = 'EXPO_PUBLIC_API_URL=https://goodthing.vercel.app/api';

console.log('🚀 [Build APK] Starting production EAS Build helper...');

// 1. Read existing env
let originalEnv = '';
if (fs.existsSync(envPath)) {
  originalEnv = fs.readFileSync(envPath, 'utf8');
}

console.log('🔄 [Build APK] Swapping .env to production API URL...');
fs.writeFileSync(envPath, prodApiUrl + '\n');

try {
  console.log('📦 [Build APK] Running EAS Build for Android (preview profile)...');
  console.log('This may take some time. Please monitor the CLI output.');
  
  // Spawn EAS build
  const result = spawnSync('npx', ['eas-cli', 'build', '-p', 'android', '--profile', 'preview'], {
    stdio: 'inherit',
    shell: true,
  });

  if (result.status !== 0) {
    console.error('❌ [Build APK] EAS Build failed.');
  } else {
    console.log('✅ [Build APK] EAS Build completed successfully!');
  }
} catch (err) {
  console.error('❌ [Build APK] Error executing build:', err.message);
} finally {
  // Restore original env
  console.log('🔄 [Build APK] Restoring original .env configuration...');
  if (originalEnv) {
    fs.writeFileSync(envPath, originalEnv);
  } else {
    fs.writeFileSync(envPath, localApiUrl + '\n');
  }
  console.log('👍 [Build APK] Environment restored. Ready for local development.');
}
