import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { parsePrompt, generateVariantRationale } from '@/lib/ai-client';
import { generateEffectPlan, generateAllVariants } from '@/lib/variant-generator';
import { renderAllEffects, FPS } from '@/lib/effect-renderer';
import { writeFSEQ } from '@/lib/fseq-writer';
import type {
  ParsedLayout,
  SongAnalysis,
  Constraints,
  SequenceVariant,
} from '@/lib/types';

// In-memory cache for generated FSEQ files
// In production, you'd use R2 or similar
const fseqCache = new Map<string, Buffer>();

export async function POST(request: NextRequest) {
  try {
    const { song, prompt } = await request.json();

    if (!prompt || !song) {
      return NextResponse.json(
        { error: 'Missing prompt or song' },
        { status: 400 }
      );
    }

    console.log(`Generating variants for song: ${song}, prompt: ${prompt}`);

    // Load layout and song data
    const layoutPath = path.join(process.cwd(), 'data/layout.json');
    const layout: ParsedLayout = JSON.parse(
      fs.readFileSync(layoutPath, 'utf-8')
    );

    const songPath = path.join(
      process.cwd(),
      `data/song-${song}.json`
    );
    const songAnalysis: SongAnalysis = JSON.parse(
      fs.readFileSync(songPath, 'utf-8')
    );

    console.log(`Loaded layout: ${layout.models.length} models`);
    console.log(`Loaded song: ${songAnalysis.title}`);

    // Parse prompt into constraints using Claude API
    const constraints: Constraints = await parsePrompt(
      prompt,
      layout,
      songAnalysis
    );

    console.log('Parsed constraints:', JSON.stringify(constraints, null, 2));

    // Generate 3 variants
    const strategies: Array<'energy' | 'elegant' | 'balanced'> = [
      'energy',
      'elegant',
      'balanced',
    ];

    const variants: SequenceVariant[] = [];

    for (let i = 0; i < strategies.length; i++) {
      const strategy = strategies[i];
      console.log(`Generating ${strategy} variant...`);

      // Generate AI rationale
      const rationale = await generateVariantRationale(
        constraints,
        songAnalysis,
        strategy
      );

      // Generate effect plan
      const effects = generateEffectPlan(
        constraints,
        layout,
        songAnalysis,
        strategy
      );

      console.log(`  Generated ${effects.length} effects`);

      // Render effects to frames
      const frames = renderAllEffects(effects, layout, songAnalysis.duration);

      console.log(`  Rendered ${frames.length} frames`);

      // Write FSEQ file
      const fseqBuffer = writeFSEQ(frames, {
        channelCount: layout.totalChannels,
        frameCount: frames.length,
        stepTime: 1000 / FPS,
      });

      console.log(`  Generated FSEQ: ${fseqBuffer.length} bytes`);

      // Store in cache
      const variantId = `${song}-${strategy}-${Date.now()}`;
      fseqCache.set(variantId, fseqBuffer);

      // Get variant info
      const variantInfo = getVariantInfo(strategy);

      variants.push({
        id: variantId,
        strategy,
        name: variantInfo.name,
        description: variantInfo.description,
        rationale,
      });
    }

    console.log('All variants generated successfully');

    return NextResponse.json({
      variants,
    });
  } catch (error) {
    console.error('Error generating variants:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate variants',
      },
      { status: 500 }
    );
  }
}

function getVariantInfo(strategy: 'energy' | 'elegant' | 'balanced'): {
  name: string;
  description: string;
} {
  switch (strategy) {
    case 'energy':
      return {
        name: 'Maximum Energy',
        description:
          'Fast chases and sparkles on every beat, high contrast colors, all models active simultaneously',
      };
    case 'elegant':
      return {
        name: 'Elegant Subtlety',
        description:
          'Slow pulses and smooth fades, one model group at a time, gentle transitions between sections',
      };
    case 'balanced':
      return {
        name: 'Creative Balance',
        description:
          'Strategic use of submodels (Stars, Hexagons, Fletching), alternating patterns, spatial choreography',
      };
  }
}

// Export the cache so the download route can access it
export { fseqCache };
