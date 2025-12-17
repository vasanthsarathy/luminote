import type { Effect, Model, ParsedLayout } from './types';

// Frame rate: 20 fps (50ms per frame)
export const FPS = 20;
export const FRAME_TIME = 1 / FPS; // 0.05 seconds

/**
 * Converts hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 255, b: 255 }; // Default to white
}

/**
 * Get channel indices for a specific model
 */
function getModelChannels(model: Model): number[] {
  const channels: number[] = [];
  const startChannel = model.startChannel;
  const channelCount = model.channelCount;

  for (let i = 0; i < channelCount; i++) {
    channels.push(startChannel + i);
  }

  return channels;
}

/**
 * Render a PULSE effect: brightness oscillates with the beat
 */
export function renderPulse(
  frames: Uint8Array[],
  effect: Effect,
  models: Model[]
): void {
  const { startTime, endTime, color } = effect;
  const rgb = hexToRgb(color);
  const duration = endTime - startTime;

  const startFrame = Math.floor(startTime * FPS);
  const endFrame = Math.floor(endTime * FPS);

  for (const model of models) {
    const channels = getModelChannels(model);

    for (let frameIndex = startFrame; frameIndex < endFrame; frameIndex++) {
      if (frameIndex < 0 || frameIndex >= frames.length) continue;

      // Calculate intensity based on time (fade in, hold, fade out)
      const frameTime = frameIndex / FPS;
      const progress = (frameTime - startTime) / duration;

      let intensity: number;
      if (progress < 0.2) {
        // Fade in
        intensity = progress / 0.2;
      } else if (progress > 0.8) {
        // Fade out
        intensity = (1 - progress) / 0.2;
      } else {
        // Hold
        intensity = 1;
      }

      // Apply to all channels (RGB)
      for (let i = 0; i < channels.length; i += 3) {
        const channelIndex = channels[i];
        if (channelIndex >= frames[frameIndex].length) continue;

        frames[frameIndex][channelIndex] = Math.floor(rgb.r * intensity);
        frames[frameIndex][channelIndex + 1] = Math.floor(rgb.g * intensity);
        frames[frameIndex][channelIndex + 2] = Math.floor(rgb.b * intensity);
      }
    }
  }
}

/**
 * Render a CHASE effect: moving light along the model
 */
export function renderChase(
  frames: Uint8Array[],
  effect: Effect,
  models: Model[]
): void {
  const { startTime, endTime, color, params } = effect;
  const rgb = hexToRgb(color);
  const speed = params?.speed === 'fast' ? 2 : params?.speed === 'slow' ? 0.5 : 1;

  const startFrame = Math.floor(startTime * FPS);
  const endFrame = Math.floor(endTime * FPS);

  for (const model of models) {
    const channels = getModelChannels(model);
    const pixelCount = channels.length / 3; // RGB = 3 channels per pixel

    for (let frameIndex = startFrame; frameIndex < endFrame; frameIndex++) {
      if (frameIndex < 0 || frameIndex >= frames.length) continue;

      const frameTime = frameIndex / FPS;
      const progress = ((frameTime - startTime) / (endTime - startTime)) * speed;

      // Which pixel is lit (wraps around)
      const activePixel = Math.floor(progress * pixelCount) % pixelCount;

      // Light up the active pixel and a few neighbors for smooth chase
      for (let p = -1; p <= 1; p++) {
        const pixelIndex = (activePixel + p + pixelCount) % pixelCount;
        const channelOffset = pixelIndex * 3;

        if (channelOffset < channels.length - 2) {
          const intensity = p === 0 ? 1.0 : 0.5; // Center is brighter
          const channelIndex = channels[channelOffset];

          if (channelIndex < frames[frameIndex].length - 2) {
            frames[frameIndex][channelIndex] = Math.floor(rgb.r * intensity);
            frames[frameIndex][channelIndex + 1] = Math.floor(rgb.g * intensity);
            frames[frameIndex][channelIndex + 2] = Math.floor(rgb.b * intensity);
          }
        }
      }
    }
  }
}

/**
 * Render a SPARKLE effect: random twinkles
 */
export function renderSparkle(
  frames: Uint8Array[],
  effect: Effect,
  models: Model[]
): void {
  const { startTime, endTime, color, params } = effect;
  const rgb = hexToRgb(color);
  const density = params?.density === 'high' ? 0.3 : 0.15; // % of pixels that sparkle

  const startFrame = Math.floor(startTime * FPS);
  const endFrame = Math.floor(endTime * FPS);

  for (const model of models) {
    const channels = getModelChannels(model);
    const pixelCount = channels.length / 3;

    // Seed random with model name for determinism
    const seed = model.name.length * 1000;

    for (let frameIndex = startFrame; frameIndex < endFrame; frameIndex++) {
      if (frameIndex < 0 || frameIndex >= frames.length) continue;

      // Randomly select pixels to sparkle
      for (let p = 0; p < pixelCount; p++) {
        // Deterministic "random" based on frame and pixel
        const random = ((seed + frameIndex * 17 + p * 31) % 100) / 100;

        if (random < density) {
          const channelOffset = p * 3;
          if (channelOffset < channels.length - 2) {
            const channelIndex = channels[channelOffset];

            if (channelIndex < frames[frameIndex].length - 2) {
              frames[frameIndex][channelIndex] = rgb.r;
              frames[frameIndex][channelIndex + 1] = rgb.g;
              frames[frameIndex][channelIndex + 2] = rgb.b;
            }
          }
        }
      }
    }
  }
}

/**
 * Render a FILL effect: solid color hold
 */
export function renderFill(
  frames: Uint8Array[],
  effect: Effect,
  models: Model[]
): void {
  const { startTime, endTime, color } = effect;
  const rgb = hexToRgb(color);

  const startFrame = Math.floor(startTime * FPS);
  const endFrame = Math.floor(endTime * FPS);

  for (const model of models) {
    const channels = getModelChannels(model);

    for (let frameIndex = startFrame; frameIndex < endFrame; frameIndex++) {
      if (frameIndex < 0 || frameIndex >= frames.length) continue;

      // Fill all channels with solid color
      for (let i = 0; i < channels.length; i += 3) {
        const channelIndex = channels[i];
        if (channelIndex >= frames[frameIndex].length) continue;

        frames[frameIndex][channelIndex] = rgb.r;
        frames[frameIndex][channelIndex + 1] = rgb.g;
        frames[frameIndex][channelIndex + 2] = rgb.b;
      }
    }
  }
}

/**
 * Render a FADE effect: gradual transition
 */
export function renderFade(
  frames: Uint8Array[],
  effect: Effect,
  models: Model[]
): void {
  const { startTime, endTime, color } = effect;
  const rgb = hexToRgb(color);
  const duration = endTime - startTime;

  const startFrame = Math.floor(startTime * FPS);
  const endFrame = Math.floor(endTime * FPS);

  for (const model of models) {
    const channels = getModelChannels(model);

    for (let frameIndex = startFrame; frameIndex < endFrame; frameIndex++) {
      if (frameIndex < 0 || frameIndex >= frames.length) continue;

      const frameTime = frameIndex / FPS;
      const progress = (frameTime - startTime) / duration;

      // Linear fade
      const intensity = progress;

      for (let i = 0; i < channels.length; i += 3) {
        const channelIndex = channels[i];
        if (channelIndex >= frames[frameIndex].length) continue;

        frames[frameIndex][channelIndex] = Math.floor(rgb.r * intensity);
        frames[frameIndex][channelIndex + 1] = Math.floor(rgb.g * intensity);
        frames[frameIndex][channelIndex + 2] = Math.floor(rgb.b * intensity);
      }
    }
  }
}

/**
 * Main effect renderer: applies an effect to frames
 */
export function renderEffect(
  frames: Uint8Array[],
  effect: Effect,
  layout: ParsedLayout
): void {
  // Find models matching the effect's target models
  const targetModels = layout.models.filter(m =>
    effect.models.includes(m.name)
  );

  if (targetModels.length === 0) {
    console.warn(`No models found for effect on ${effect.models.join(', ')}`);
    return;
  }

  // Dispatch to appropriate renderer
  switch (effect.type) {
    case 'pulse':
      renderPulse(frames, effect, targetModels);
      break;
    case 'chase':
      renderChase(frames, effect, targetModels);
      break;
    case 'sparkle':
      renderSparkle(frames, effect, targetModels);
      break;
    case 'fill':
      renderFill(frames, effect, targetModels);
      break;
    case 'fade':
      renderFade(frames, effect, targetModels);
      break;
    default:
      console.warn(`Unknown effect type: ${effect.type}`);
  }
}

/**
 * Initialize frame buffer for a sequence
 */
export function createFrameBuffer(
  duration: number,
  channelCount: number
): Uint8Array[] {
  const frameCount = Math.ceil(duration * FPS);
  const frames: Uint8Array[] = [];

  for (let i = 0; i < frameCount; i++) {
    frames.push(new Uint8Array(channelCount));
  }

  return frames;
}

/**
 * Render all effects to frames
 */
export function renderAllEffects(
  effects: Effect[],
  layout: ParsedLayout,
  duration: number
): Uint8Array[] {
  const frames = createFrameBuffer(duration, layout.totalChannels);

  console.log(
    `Rendering ${effects.length} effects to ${frames.length} frames (${layout.totalChannels} channels)`
  );

  for (const effect of effects) {
    renderEffect(frames, effect, layout);
  }

  return frames;
}
