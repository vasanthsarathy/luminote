import * as fs from 'fs';
import * as path from 'path';
import {
  renderAllEffects,
  createFrameBuffer,
  FPS,
} from '../lib/effect-renderer';
import { generateEffectPlan } from '../lib/variant-generator';
import type { ParsedLayout, SongAnalysis, Constraints } from '../lib/types';

// Load test data
const layoutPath = path.join(__dirname, '../data/layout.json');
const layout: ParsedLayout = JSON.parse(fs.readFileSync(layoutPath, 'utf-8'));

const songPath = path.join(__dirname, '../data/song-jingle-bells.json');
const song: SongAnalysis = JSON.parse(fs.readFileSync(songPath, 'utf-8'));

// Test constraints
const testConstraints: Constraints = {
  mood: 'energetic',
  intensity: 'high',
  spatialFocus: [], // Use all models
  colorPalette: ['#FF0000', '#FFFFFF'], // Red and white
  speed: 'fast',
};

console.log('🧪 Testing Effect Renderer\n');
console.log(`Layout: ${layout.models.length} models, ${layout.totalChannels} channels`);
console.log(`Song: ${song.title} (${song.duration}s @ ${song.bpm} BPM)`);
console.log(`Constraints: ${testConstraints.mood}, ${testConstraints.intensity}, ${testConstraints.speed}`);
console.log(`Colors: ${testConstraints.colorPalette.join(', ')}\n`);

// Test each variant strategy
const strategies: Array<'energy' | 'elegant' | 'balanced'> = [
  'energy',
  'elegant',
  'balanced',
];

for (const strategy of strategies) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing ${strategy.toUpperCase()} variant`);
  console.log('='.repeat(60));

  // Generate effect plan
  const effects = generateEffectPlan(testConstraints, layout, song, strategy);
  console.log(`✓ Generated ${effects.length} effects`);

  // Show sample effects
  console.log('\nSample effects:');
  effects.slice(0, 5).forEach((effect, i) => {
    console.log(
      `  ${i + 1}. ${effect.type.toUpperCase()}: ${effect.models.length} models, ` +
        `${effect.startTime.toFixed(2)}s-${effect.endTime.toFixed(2)}s, ` +
        `color: ${effect.color}`
    );
  });
  if (effects.length > 5) {
    console.log(`  ... and ${effects.length - 5} more effects`);
  }

  // Render to frames
  console.log('\nRendering effects to frames...');
  const startTime = Date.now();
  const frames = renderAllEffects(effects, layout, song.duration);
  const endTime = Date.now();

  console.log(`✓ Rendered ${frames.length} frames in ${endTime - startTime}ms`);
  console.log(`  Frame count: ${frames.length} (${FPS} fps × ${song.duration}s)`);
  console.log(`  Frame size: ${frames[0].length} bytes (${layout.totalChannels} channels)`);
  console.log(
    `  Total data: ${((frames.length * frames[0].length) / 1024 / 1024).toFixed(2)} MB`
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
    `\n  Active frames: ${nonZeroFrames}/${frames.length} (${((nonZeroFrames / frames.length) * 100).toFixed(1)}%)`
  );
  console.log(
    `  Active channels: ${totalNonZeroValues} (${((totalNonZeroValues / (frames.length * layout.totalChannels)) * 100).toFixed(3)}%)`
  );
}

console.log('\n\n✅ Effect rendering tests complete!');
console.log('\nNext steps:');
console.log('  1. Implement FSEQ writer to save frames as .fseq file');
console.log('  2. Build UI to generate and download sequences');
console.log('  3. Deploy to Cloudflare Pages');
