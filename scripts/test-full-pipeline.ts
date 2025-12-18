import * as fs from 'fs';
import * as path from 'path';
import {
  renderAllEffects,
  createFrameBuffer,
  FPS,
} from '../lib/effect-renderer';
import { generateEffectPlan } from '../lib/variant-generator';
import { writeFSEQ, generateFSEQFilename } from '../lib/fseq-writer';
import type { ParsedLayout, SongAnalysis, Constraints } from '../lib/types';

console.log('🚀 Testing Full Pipeline: Constraints → FSEQ File\n');

// Load test data
const layoutPath = path.join(__dirname, '../data/layout.json');
const layout: ParsedLayout = JSON.parse(fs.readFileSync(layoutPath, 'utf-8'));

const songPath = path.join(__dirname, '../data/song-jingle-bells.json');
const song: SongAnalysis = JSON.parse(fs.readFileSync(songPath, 'utf-8'));

console.log(`Layout: ${layout.models.length} models, ${layout.totalChannels} channels`);
console.log(`Song: ${song.title} (${song.duration}s @ ${song.bpm} BPM)\n`);

// Test constraints
const testConstraints: Constraints = {
  mood: 'energetic',
  intensity: 'high',
  spatialFocus: [], // Use all models
  colorPalette: ['#FF0000', '#00FF00'], // Red and green (Christmas!)
  speed: 'fast',
};

console.log(`Constraints: ${testConstraints.mood}, ${testConstraints.intensity}`);
console.log(`Colors: ${testConstraints.colorPalette.join(', ')}\n`);

// Test each variant strategy
const strategies: Array<'energy' | 'elegant' | 'balanced'> = [
  'energy',
  'elegant',
  'balanced',
];

for (const strategy of strategies) {
  console.log(`${'='.repeat(60)}`);
  console.log(`Testing ${strategy.toUpperCase()} variant`);
  console.log('='.repeat(60));

  // 1. Generate effect plan
  console.log('Step 1: Generating effect plan...');
  const startPlan = Date.now();
  const effects = generateEffectPlan(testConstraints, layout, song, strategy);
  const endPlan = Date.now();
  console.log(`  ✓ Generated ${effects.length} effects in ${endPlan - startPlan}ms`);

  // 2. Render effects to frames
  console.log('Step 2: Rendering effects to frames...');
  const startRender = Date.now();
  const frames = renderAllEffects(effects, layout, song.duration);
  const endRender = Date.now();
  console.log(`  ✓ Rendered ${frames.length} frames in ${endRender - startRender}ms`);

  // 3. Write FSEQ file
  console.log('Step 3: Writing FSEQ file...');
  const startWrite = Date.now();
  const fseqBuffer = writeFSEQ(frames, {
    channelCount: layout.totalChannels,
    frameCount: frames.length,
    stepTime: 1000 / FPS, // 50ms for 20 FPS
  });
  const endWrite = Date.now();
  console.log(`  ✓ Wrote FSEQ (${fseqBuffer.length} bytes) in ${endWrite - startWrite}ms`);

  // 4. Save to file
  const filename = generateFSEQFilename(song.title, strategy);
  const outputPath = path.join(__dirname, '../specs', filename);
  fs.writeFileSync(outputPath, fseqBuffer);
  console.log(`  ✓ Saved to: ${filename}`);

  // 5. Verify FSEQ format
  console.log('Step 4: Verifying FSEQ format...');
  const magic = fseqBuffer.toString('ascii', 0, 4);
  const headerLength = fseqBuffer.readUInt16LE(4);
  const version = `${fseqBuffer.readUInt8(7)}.${fseqBuffer.readUInt8(6)}`;
  const channelCount = fseqBuffer.readUInt32LE(8);
  const frameCount = fseqBuffer.readUInt32LE(12);
  const stepTime = fseqBuffer.readUInt16LE(16);

  const isValid =
    magic === 'PSEQ' &&
    channelCount === layout.totalChannels &&
    frameCount === frames.length &&
    stepTime === 50;

  console.log(`  Magic: "${magic}" ${magic === 'PSEQ' ? '✓' : '✗'}`);
  console.log(`  Version: ${version} ${version === '2.0' ? '✓' : '✗'}`);
  console.log(
    `  Channels: ${channelCount} ${channelCount === layout.totalChannels ? '✓' : '✗'}`
  );
  console.log(
    `  Frames: ${frameCount} ${frameCount === frames.length ? '✓' : '✗'}`
  );
  console.log(`  Step time: ${stepTime}ms ${stepTime === 50 ? '✓' : '✗'}`);

  // Calculate file size
  const expectedSize = headerLength + channelCount * frameCount;
  const actualSize = fseqBuffer.length;
  console.log(
    `  File size: ${actualSize} bytes ${actualSize === expectedSize ? '✓' : '✗'}`
  );

  // Analyze frame data
  let nonZeroFrames = 0;
  let totalNonZeroValues = 0;

  for (const frame of frames) {
    let hasData = false;
    for (const value of frame) {
      if (value > 0) {
        totalNonZeroValues++;
        hasData = true;
      }
    }
    if (hasData) nonZeroFrames++;
  }

  console.log(
    `\nSequence stats:`
  );
  console.log(`  Active frames: ${nonZeroFrames}/${frames.length} (${((nonZeroFrames / frames.length) * 100).toFixed(1)}%)`);
  console.log(`  Total effects: ${effects.length}`);
  console.log(
    `  File size: ${(fseqBuffer.length / 1024 / 1024).toFixed(2)} MB`
  );

  if (isValid) {
    console.log(`\n✅ ${strategy.toUpperCase()} variant: Pipeline complete!\n`);
  } else {
    console.log(`\n❌ ${strategy.toUpperCase()} variant: Validation failed!\n`);
  }
}

console.log('='.repeat(60));
console.log('✅ Full pipeline test complete!');
console.log('\nGenerated FSEQ files:');
strategies.forEach(strategy => {
  const filename = generateFSEQFilename(song.title, strategy);
  console.log(`  - specs/${filename}`);
});
console.log('\nNext steps:');
console.log('  1. Test FSEQ files in xLights/FPP');
console.log('  2. Build UI for variant generation');
console.log('  3. Deploy to Cloudflare Pages');
