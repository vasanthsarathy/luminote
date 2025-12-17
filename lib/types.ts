// Layout Types
export interface ParsedLayout {
  models: Model[];
  totalChannels: number;
  modelGroups: Map<string, string[]>; // group name -> model names
}

export interface Model {
  name: string;
  displayAs: string;
  startChannel: number;
  channelCount: number;
  controller: string;
  pixelCount: number;
  subModels: SubModel[];
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
  customModel?: string; // Compressed custom model data
}

export interface SubModel {
  name: string;
  type: string;
  ranges: string; // Channel ranges like "24-61"
}

// Song Analysis Types
export interface SongAnalysis {
  title: string;
  artist: string;
  duration: number; // seconds
  bpm: number;
  beats: number[]; // timestamps of beats
  downbeats: number[]; // timestamps of downbeats
  onsets: number[]; // timestamps of onsets
  sections: Section[];
  energyEnvelope: number[]; // energy over time
}

export interface Section {
  name: string; // intro, verse, chorus, bridge, outro
  startTime: number;
  endTime: number;
}

// AI Types
export interface Constraints {
  mood: string; // energetic, calm, festive, elegant
  intensity: 'low' | 'medium' | 'high';
  spatialFocus: string[]; // model names to focus on
  colorPalette: string[]; // hex colors
  speed: 'slow' | 'medium' | 'fast';
}

export interface SequenceVariant {
  id: string;
  strategy: 'energy' | 'elegant' | 'balanced';
  name: string;
  description: string;
  rationale: string; // AI-generated explanation
  fseqData?: Uint8Array;
}

// Effect Types
export interface Effect {
  type: 'pulse' | 'chase' | 'sparkle' | 'fill' | 'fade';
  models: string[]; // model names to apply to
  startTime: number;
  endTime: number;
  color: string; // hex color
  params?: Record<string, any>; // effect-specific parameters
}
