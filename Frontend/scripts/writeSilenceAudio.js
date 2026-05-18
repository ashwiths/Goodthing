import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tiny, valid 1-second silent MP3 base64 encoded string
const SILENT_MP3_BASE64 = 
  'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjM2LjEwMAAAAAAAAAAAAAAA//OE' +
  'AAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDA' +
  'wMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq' +
  '6urq6urq6urq6urq6urq6urq6urq6urq////////////////////////////////' +
  'AAAAATGF2YzU2LjQxAAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hvAAAAAAAAAAAA' +
  'AAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAMAAAGkAAAAAAAAA0gAA' +
  'AAARTMu//MUZAYAAAGkAAAAAAAAA0gAAAAAOTku//MUZAkAAAGkAAAAAAAAA0gAAAA' +
  'ANVVV';

const AUDIO_DIR = path.join(__dirname, '..', 'assets', 'audio');

const AUDIO_FILES = [
  'rain.mp3',
  'forest.mp3',
  'lofi.mp3',
  'brown-noise.mp3',
  'ocean.mp3',
  'piano.mp3',
  'deep-space.mp3'
];

function generateSilence() {
  try {
    // Ensure directory exists
    if (!fs.existsSync(AUDIO_DIR)) {
      fs.mkdirSync(AUDIO_DIR, { recursive: true });
      console.log(`[Audio Setup] Created directory: ${AUDIO_DIR}`);
    }

    const buffer = Buffer.from(SILENT_MP3_BASE64, 'base64');

    for (const filename of AUDIO_FILES) {
      const filePath = path.join(AUDIO_DIR, filename);
      fs.writeFileSync(filePath, buffer);
      console.log(`[Audio Setup] ✅ Programmed loop track: ${filename} -> size: ${buffer.length} bytes`);
    }

    console.log('[Audio Setup] All ambient tracks successfully written! 🎧');
  } catch (error) {
    console.error('[Audio Setup] ❌ Failed to generate audio tracks:', error);
  }
}

generateSilence();
