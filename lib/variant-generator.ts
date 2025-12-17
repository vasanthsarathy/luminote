import type {
  Constraints,
  ParsedLayout,
  SongAnalysis,
  SequenceVariant,
  Effect,
} from './types';
import { generateVariantRationale } from './ai-client';

export interface VariantGenerationParams {
  constraints: Constraints;
  layout: ParsedLayout;
  song: SongAnalysis;
}

export async function generateAllVariants(
  params: VariantGenerationParams
): Promise<SequenceVariant[]> {
  const { constraints, layout, song } = params;

  // Generate 3 variants with different strategies
  const strategies: Array<'energy' | 'elegant' | 'balanced'> = [
    'energy',
    'elegant',
    'balanced',
  ];

  const variants: SequenceVariant[] = [];

  for (let i = 0; i < strategies.length; i++) {
    const strategy = strategies[i];
    const variant = await generateVariant(params, strategy, i + 1);
    variants.push(variant);
  }

  return variants;
}

async function generateVariant(
  params: VariantGenerationParams,
  strategy: 'energy' | 'elegant' | 'balanced',
  variantNumber: number
): Promise<SequenceVariant> {
  const { constraints, layout, song } = params;

  // Generate AI rationale
  const rationale = await generateVariantRationale(constraints, song, strategy);

  // Generate variant name and description
  const variantInfo = getVariantInfo(strategy);

  return {
    id: `variant-${variantNumber}`,
    strategy,
    name: variantInfo.name,
    description: variantInfo.description,
    rationale,
    // fseqData will be generated later in the effect rendering phase
  };
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

export function generateEffectPlan(
  constraints: Constraints,
  layout: ParsedLayout,
  song: SongAnalysis,
  strategy: 'energy' | 'elegant' | 'balanced'
): Effect[] {
  const effects: Effect[] = [];

  // Determine which models to use based on spatial focus
  const targetModels =
    constraints.spatialFocus.length > 0
      ? constraints.spatialFocus
      : layout.models.map(m => m.name);

  // Get colors from palette
  const colors = constraints.colorPalette;

  switch (strategy) {
    case 'energy':
      effects.push(...generateEnergyEffects(targetModels, song, colors));
      break;
    case 'elegant':
      effects.push(...generateElegantEffects(targetModels, song, colors));
      break;
    case 'balanced':
      effects.push(
        ...generateBalancedEffects(targetModels, layout, song, colors)
      );
      break;
  }

  return effects;
}

function generateEnergyEffects(
  models: string[],
  song: SongAnalysis,
  colors: string[]
): Effect[] {
  const effects: Effect[] = [];

  // Fast chases on every beat
  for (let i = 0; i < song.beats.length - 1; i += 2) {
    const startTime = song.beats[i];
    const endTime = song.beats[i + 1];
    const color = colors[i % colors.length];

    effects.push({
      type: 'chase',
      models,
      startTime,
      endTime,
      color,
      params: { speed: 'fast', direction: 'forward' },
    });
  }

  // Sparkles on high-energy onsets
  song.onsets.forEach(onset => {
    effects.push({
      type: 'sparkle',
      models,
      startTime: onset,
      endTime: onset + 0.2,
      color: colors[0],
      params: { density: 'high' },
    });
  });

  return effects;
}

function generateElegantEffects(
  models: string[],
  song: SongAnalysis,
  colors: string[]
): Effect[] {
  const effects: Effect[] = [];

  // Slow pulses on downbeats only
  for (let i = 0; i < song.downbeats.length - 1; i++) {
    const startTime = song.downbeats[i];
    const endTime = song.downbeats[i + 1];
    const color = colors[i % colors.length];

    // Rotate through models - one at a time
    const modelIndex = i % models.length;
    const model = models[modelIndex];

    effects.push({
      type: 'pulse',
      models: [model],
      startTime,
      endTime,
      color,
      params: { intensity: 'medium' },
    });
  }

  // Smooth fades between sections
  for (let i = 0; i < song.sections.length - 1; i++) {
    const section = song.sections[i];
    const nextSection = song.sections[i + 1];

    effects.push({
      type: 'fade',
      models,
      startTime: section.endTime - 2,
      endTime: nextSection.startTime + 2,
      color: colors[i % colors.length],
      params: { direction: 'out-in' },
    });
  }

  return effects;
}

function generateBalancedEffects(
  models: string[],
  layout: ParsedLayout,
  song: SongAnalysis,
  colors: string[]
): Effect[] {
  const effects: Effect[] = [];

  // Find snowflake models (they have submodels we can use creatively)
  const snowflakeModels = layout.models.filter(m =>
    m.name.toLowerCase().includes('snowflake')
  );

  if (snowflakeModels.length > 0) {
    // Alternate between submodel groups
    song.sections.forEach((section, sectionIndex) => {
      const colorIndex = sectionIndex % colors.length;
      const color = colors[colorIndex];

      // Use different submodel types in each section
      const submodelType = ['Star', 'Hexagon', 'Fletching'][
        sectionIndex % 3
      ];

      // Find models with this submodel type
      const modelsWithSubmodel = snowflakeModels
        .filter(m => m.subModels.some(sm => sm.name.includes(submodelType)))
        .map(m => m.name);

      if (modelsWithSubmodel.length > 0) {
        effects.push({
          type: 'pulse',
          models: modelsWithSubmodel,
          startTime: section.startTime,
          endTime: section.endTime,
          color,
          params: { submodel: submodelType },
        });
      }
    });
  } else {
    // Fallback: use regular beat-based effects
    song.downbeats.forEach((downbeat, i) => {
      const color = colors[i % colors.length];
      const modelIndex = i % models.length;

      effects.push({
        type: 'pulse',
        models: [models[modelIndex]],
        startTime: downbeat,
        endTime: downbeat + 1,
        color,
        params: {},
      });
    });
  }

  return effects;
}
