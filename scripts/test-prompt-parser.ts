import * as fs from 'fs';
import * as path from 'path';
import { parsePrompt, generateVariantRationale } from '../lib/ai-client';
import type { ParsedLayout, SongAnalysis } from '../lib/types';

// Load layout and song data
const layoutPath = path.join(__dirname, '../data/layout.json');
const layout: ParsedLayout = JSON.parse(fs.readFileSync(layoutPath, 'utf-8'));

const songPath = path.join(__dirname, '../data/song-jingle-bells.json');
const song: SongAnalysis = JSON.parse(fs.readFileSync(songPath, 'utf-8'));

// Test prompts
const testPrompts = [
  'energetic, focus on snowflakes, red and white',
  'calm and elegant, warm white only',
  'festive party mode, rainbow colors, use everything',
  'subtle, just the roof snowflakes, blue and white',
];

async function testPromptParsing() {
  console.log('🧪 Testing Prompt Parser with Claude API\n');
  console.log(`Layout: ${layout.models.length} models`);
  console.log(`Song: ${song.title} (${song.bpm} BPM)\n`);

  for (const prompt of testPrompts) {
    console.log(`\n📝 Prompt: "${prompt}"`);
    console.log('─'.repeat(50));

    try {
      const constraints = await parsePrompt(prompt, layout, song);

      console.log('✓ Parsed Constraints:');
      console.log(`  Mood: ${constraints.mood}`);
      console.log(`  Intensity: ${constraints.intensity}`);
      console.log(`  Speed: ${constraints.speed}`);
      console.log(`  Colors: ${constraints.colorPalette.join(', ')}`);
      console.log(`  Focus: ${constraints.spatialFocus.length > 0 ? constraints.spatialFocus.join(', ') : 'All models'}`);

      // Test rationale generation for each strategy
      console.log('\n  Variant Rationales:');
      for (const strategy of ['energy', 'elegant', 'balanced'] as const) {
        const rationale = await generateVariantRationale(constraints, song, strategy);
        console.log(`  ${strategy.toUpperCase()}: ${rationale}`);
      }
    } catch (error) {
      console.error('✗ Error:', error);
    }
  }

  console.log('\n\n✅ Prompt parsing tests complete!');
}

// Only run if CLAUDE_API_KEY is set
if (!process.env.CLAUDE_API_KEY) {
  console.error('❌ CLAUDE_API_KEY not set in environment');
  console.log('Create a .env.local file with your Claude API key:');
  console.log('CLAUDE_API_KEY=your_key_here');
  process.exit(1);
}

testPromptParsing();
