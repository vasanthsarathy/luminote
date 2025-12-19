import Anthropic from '@anthropic-ai/sdk';
import type { Constraints, ParsedLayout, SongAnalysis } from './types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function parsePrompt(
  userPrompt: string,
  layout: ParsedLayout,
  song: SongAnalysis
): Promise<Constraints> {
  // Get model names for context
  const modelNames = layout.models
    .slice(0, 20)
    .map(m => m.name)
    .join(', ');

  const systemPrompt = `You are an expert at designing Christmas light shows. Parse user requests into structured parameters for light sequence generation.

Available models: ${modelNames}${layout.models.length > 20 ? ` ...and ${layout.models.length - 20} more` : ''}
Song: ${song.title} (${song.bpm} BPM, ${song.duration}s duration)

Your task: Convert the user's natural language description into structured JSON.`;

  const userMessage = `Parse this light show request into structured constraints:

"${userPrompt}"

Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "mood": "<energetic|calm|festive|elegant|playful>",
  "intensity": "<low|medium|high>",
  "spatialFocus": ["<model names to emphasize, or empty array for all>"],
  "colorPalette": ["<hex color codes>"],
  "speed": "<slow|medium|fast>"
}

Guidelines:
- mood: overall feeling (energetic, calm, festive, elegant, playful)
- intensity: how active the lights should be (low=subtle, medium=balanced, high=very active)
- spatialFocus: specific models to emphasize (e.g. ["Roof Snowflake 1", "Roof Snowflake 2"]) or [] for all
- colorPalette: 2-4 hex colors based on request (e.g. ["#FF0000", "#FFFFFF"] for red and white)
- speed: pace of effects (slow=calm, medium=normal, fast=energetic)

If the user mentions specific colors, use them. If not, choose festive Christmas colors.
If the user mentions specific models/areas, include them in spatialFocus.`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: userMessage,
      }],
      system: systemPrompt,
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse the JSON response
    // Strip markdown code blocks if present
    let jsonText = content.text.trim();
    if (jsonText.startsWith('```')) {
      // Remove markdown code blocks
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const constraints = JSON.parse(jsonText) as Constraints;

    return constraints;
  } catch (error) {
    console.error('Error parsing prompt:', error);

    // Fallback to default constraints
    return {
      mood: 'festive',
      intensity: 'medium',
      spatialFocus: [],
      colorPalette: ['#FF0000', '#00FF00', '#FFFFFF'], // Red, green, white
      speed: 'medium',
    };
  }
}

export async function generateVariantRationale(
  constraints: Constraints,
  song: SongAnalysis,
  strategy: 'energy' | 'elegant' | 'balanced'
): Promise<string> {
  const strategyDescriptions = {
    energy: 'maximum energy and excitement with fast chases and high contrast',
    elegant: 'elegant subtlety with slow pulses and smooth transitions',
    balanced: 'creative balance using submodels and spatial relationships',
  };

  const systemPrompt = `You are an expert at explaining creative decisions for Christmas light shows. Generate a brief, enthusiastic rationale for why this sequence variant will look great.`;

  const userMessage = `Generate a 2-3 sentence rationale for this light sequence variant:

Strategy: ${strategyDescriptions[strategy]}
User's request: mood=${constraints.mood}, intensity=${constraints.intensity}, colors=${constraints.colorPalette.join(', ')}
Song: ${song.title} (${song.bpm} BPM)

Explain:
1. How this variant interprets the user's vision
2. What makes it unique compared to other approaches
3. One specific effect or technique it uses

Keep it concise and exciting! Write in second person ("I created..." or "This variant...").`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: userMessage,
      }],
      system: systemPrompt,
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return content.text.trim();
  } catch (error) {
    console.error('Error generating rationale:', error);

    // Fallback rationale
    return `This ${strategy} variant brings your vision to life with ${constraints.mood} patterns synced to ${song.title}'s ${song.bpm} BPM rhythm.`;
  }
}
