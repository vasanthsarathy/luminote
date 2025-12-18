import * as fs from 'fs';
import * as path from 'path';
import { writeFSEQ, generateFSEQFilename } from '../lib/fseq-writer';
import { FPS } from '../lib/effect-renderer';

console.log('🧪 Testing FSEQ Writer\n');

// Test 1: Simple pattern - all channels red for 1 second
console.log('Test 1: Simple red pattern (1 second)');
const channelCount = 300; // 100 RGB pixels
const duration = 1; // 1 second
const frameCount = duration * FPS; // 20 frames
const stepTime = 1000 / FPS; // 50ms

const frames: Uint8Array[] = [];

for (let i = 0; i < frameCount; i++) {
  const frame = new Uint8Array(channelCount);

  // Set all pixels to red (R=255, G=0, B=0)
  for (let j = 0; j < channelCount; j += 3) {
    frame[j] = 255; // R
    frame[j + 1] = 0; // G
    frame[j + 2] = 0; // B
  }

  frames.push(frame);
}

console.log(`  Frames: ${frames.length}`);
console.log(`  Channels: ${channelCount}`);
console.log(`  Step time: ${stepTime}ms`);

const fseqBuffer = writeFSEQ(frames, {
  channelCount,
  frameCount,
  stepTime,
});

console.log(`  Generated FSEQ: ${fseqBuffer.length} bytes`);
console.log(`  Expected size: ${28 + channelCount * frameCount} bytes`);

// Save to file
const testOutputPath = path.join(__dirname, '../specs/test-simple.fseq');
fs.writeFileSync(testOutputPath, fseqBuffer);
console.log(`  ✓ Saved to: ${testOutputPath}\n`);

// Test 2: Analyze the generated file to verify format
console.log('Test 2: Verify generated FSEQ format');
const magic = fseqBuffer.toString('ascii', 0, 4);
const headerLength = fseqBuffer.readUInt16LE(4);
const minorVersion = fseqBuffer.readUInt8(6);
const majorVersion = fseqBuffer.readUInt8(7);
const readChannelCount = fseqBuffer.readUInt32LE(8);
const readFrameCount = fseqBuffer.readUInt32LE(12);
const readStepTime = fseqBuffer.readUInt16LE(16);
const compressionType = fseqBuffer.readUInt8(19);

console.log(`  Magic: "${magic}" ${magic === 'PSEQ' ? '✓' : '✗'}`);
console.log(
  `  Version: ${majorVersion}.${minorVersion} ${majorVersion === 2 ? '✓' : '✗'}`
);
console.log(`  Header length: ${headerLength} bytes`);
console.log(
  `  Channel count: ${readChannelCount} ${readChannelCount === channelCount ? '✓' : '✗'}`
);
console.log(
  `  Frame count: ${readFrameCount} ${readFrameCount === frameCount ? '✓' : '✗'}`
);
console.log(
  `  Step time: ${readStepTime}ms ${readStepTime === stepTime ? '✓' : '✗'}`
);
console.log(
  `  Compression: ${compressionType} (0=none) ${compressionType === 0 ? '✓' : '✗'}`
);

// Verify frame data
console.log('\nTest 3: Verify frame data');
const frameDataOffset = headerLength;
const firstPixelR = fseqBuffer.readUInt8(frameDataOffset);
const firstPixelG = fseqBuffer.readUInt8(frameDataOffset + 1);
const firstPixelB = fseqBuffer.readUInt8(frameDataOffset + 2);

console.log(
  `  First pixel: RGB(${firstPixelR}, ${firstPixelG}, ${firstPixelB})`
);
console.log(
  `  Expected: RGB(255, 0, 0) ${firstPixelR === 255 && firstPixelG === 0 && firstPixelB === 0 ? '✓' : '✗'}`
);

// Test 4: Chase pattern
console.log('\nTest 4: Chase pattern (3 seconds)');
const chaseDuration = 3;
const chaseFrameCount = chaseDuration * FPS;
const chaseFrames: Uint8Array[] = [];

for (let i = 0; i < chaseFrameCount; i++) {
  const frame = new Uint8Array(channelCount);

  // Light up one pixel at a time (chase effect)
  const activePixel = Math.floor((i / chaseFrameCount) * (channelCount / 3));
  const channelOffset = activePixel * 3;

  if (channelOffset < channelCount - 2) {
    frame[channelOffset] = 0; // R
    frame[channelOffset + 1] = 0; // G
    frame[channelOffset + 2] = 255; // B (blue)
  }

  chaseFrames.push(frame);
}

const chaseFseqBuffer = writeFSEQ(chaseFrames, {
  channelCount,
  frameCount: chaseFrameCount,
  stepTime,
});

const chaseOutputPath = path.join(__dirname, '../specs/test-chase.fseq');
fs.writeFileSync(chaseOutputPath, chaseFseqBuffer);
console.log(`  Generated FSEQ: ${chaseFseqBuffer.length} bytes`);
console.log(`  ✓ Saved to: ${chaseOutputPath}\n`);

// Test 5: Generate filename
console.log('Test 5: Filename generation');
const filename1 = generateFSEQFilename('Jingle Bells', 'energy');
const filename2 = generateFSEQFilename('Silent Night', 'elegant');

console.log(`  Jingle Bells (energy): ${filename1}`);
console.log(`  Silent Night (elegant): ${filename2}`);

console.log('\n✅ FSEQ writer tests complete!');
console.log('\nGenerated files:');
console.log(`  - ${testOutputPath}`);
console.log(`  - ${chaseOutputPath}`);
console.log('\nNext steps:');
console.log('  1. Test FSEQ files in xLights/FPP (if available)');
console.log('  2. Integrate with effect renderer');
console.log('  3. Build UI for variant generation and download');
