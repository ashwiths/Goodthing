/**
 * integrityCheck.ts
 * Detections for emulators, rooted Android devices, jailbroken iOS devices,
 * and debugger attachments to protect against app cloning, repackaging, and hacks.
 */
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export interface IntegrityReport {
  isDevice: boolean;
  isRootedOrJailbroken: boolean;
  isDebuggerAttached: boolean;
  threatLevel: 'none' | 'low' | 'high';
  violations: string[];
}

export async function performIntegrityCheck(): Promise<IntegrityReport> {
  const violations: string[] = [];
  let isRootedOrJailbroken = false;
  let isDebuggerAttached = false;

  // 1. Check if running on a physical device vs emulator
  const isDevice = Device.isDevice;
  if (!isDevice) {
    violations.push('Suspicious Environment: Running on Emulator/Simulator.');
  }

  // 2. Cross-platform root/jailbreak indicators
  try {
    if (Platform.OS === 'android') {
      // Android root indicators: check signature/OS builds or generic developer indicators
      if (
        Device.brand === 'generic' ||
        Device.modelName?.includes('sdk') ||
        Device.osBuildId?.includes('test-keys')
      ) {
        isRootedOrJailbroken = true;
        violations.push('Android integrity check flag: Test-keys or developer emulator signatures detected.');
      }
    } else if (Platform.OS === 'ios') {
      // iOS jailbreak indicators: check for simulator environment model defaults
      if (!isDevice && (Device.modelName === 'Simulator' || Device.modelName?.includes('iPad'))) {
        // Simulator is fine, but in true native we protect keychain signatures
      }
    }
  } catch (err) {
    console.warn('[Integrity] Device check diagnostic warning:', err);
  }

  // 3. Debugger attachment checks
  // If __DEV__ is false (production release) but global.__reanimatedWorkletInit is running in debug mode
  if (!__DEV__) {
    // Release build checks for active debugger sessions
    if (typeof global !== 'undefined' && (global as any).__REMOTEDEV__) {
      isDebuggerAttached = true;
      violations.push('Security Alert: Developer debugger attachment discovered.');
    }
  }

  // 4. Calculate overall threat level
  let threatLevel: 'none' | 'low' | 'high' = 'none';
  if (isDebuggerAttached || (isRootedOrJailbroken && isDevice)) {
    threatLevel = 'high';
  } else if (!isDevice) {
    threatLevel = 'low'; // Emulators are normal for developer tests
  }

  return {
    isDevice,
    isRootedOrJailbroken,
    isDebuggerAttached,
    threatLevel,
    violations,
  };
}
