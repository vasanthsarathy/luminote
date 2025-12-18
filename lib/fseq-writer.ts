/**
 * FSEQ File Writer
 *
 * Generates FSEQ v2 files for xLights/FPP from frame data.
 * This implementation creates uncompressed FSEQ files for simplicity.
 *
 * FSEQ v2 Format:
 * - Magic: "PSEQ" (4 bytes)
 * - Header length: uint16 (2 bytes)
 * - Version: minor, major (2 bytes)
 * - Channel count: uint32 (4 bytes)
 * - Frame count: uint32 (4 bytes)
 * - Step time: uint16 milliseconds (2 bytes)
 * - Flags: uint8 (1 byte)
 * - Compression type: uint8 (1 byte)
 * - Compression blocks: uint8 (1 byte)
 * - Sparse ranges: uint8 (1 byte)
 * - Reserved: uint8 (1 byte)
 * - Unique ID: uint64 (8 bytes) - optional
 * - Frame data: channelCount × frameCount bytes
 */

export interface FSEQMetadata {
  channelCount: number;
  frameCount: number;
  stepTime: number; // milliseconds per frame (e.g., 50ms for 20 FPS)
}

/**
 * Write FSEQ v2 file from frame data
 */
export function writeFSEQ(
  frames: Uint8Array[],
  metadata: FSEQMetadata
): Buffer {
  const { channelCount, frameCount, stepTime } = metadata;

  // Validate input
  if (frames.length !== frameCount) {
    throw new Error(
      `Frame count mismatch: expected ${frameCount}, got ${frames.length}`
    );
  }

  for (let i = 0; i < frames.length; i++) {
    if (frames[i].length !== channelCount) {
      throw new Error(
        `Frame ${i} channel count mismatch: expected ${channelCount}, got ${frames[i].length}`
      );
    }
  }

  // Use minimal 28-byte header (24 base + 4 padding to align to 4 bytes)
  const headerLength = 28;

  // Calculate total file size
  const frameDataSize = channelCount * frameCount;
  const totalSize = headerLength + frameDataSize;

  // Create buffer
  const buffer = Buffer.alloc(totalSize);

  // Write header
  let offset = 0;

  // Magic: "PSEQ" (4 bytes)
  buffer.write('PSEQ', offset, 'ascii');
  offset += 4;

  // Header length: uint16 (2 bytes)
  buffer.writeUInt16LE(headerLength, offset);
  offset += 2;

  // Version: minor=0, major=2 (2 bytes)
  buffer.writeUInt8(0, offset); // minor
  offset += 1;
  buffer.writeUInt8(2, offset); // major
  offset += 1;

  // Channel count: uint32 (4 bytes)
  buffer.writeUInt32LE(channelCount, offset);
  offset += 4;

  // Frame count: uint32 (4 bytes)
  buffer.writeUInt32LE(frameCount, offset);
  offset += 4;

  // Step time: uint16 (2 bytes)
  buffer.writeUInt16LE(stepTime, offset);
  offset += 2;

  // Flags: uint8 (1 byte)
  // 0 = no special flags
  buffer.writeUInt8(0, offset);
  offset += 1;

  // Compression type: uint8 (1 byte)
  // 0 = none, 1 = zstd, 2 = zlib
  buffer.writeUInt8(0, offset);
  offset += 1;

  // Compression blocks: uint8 (1 byte)
  buffer.writeUInt8(0, offset);
  offset += 1;

  // Sparse ranges: uint8 (1 byte)
  buffer.writeUInt8(0, offset);
  offset += 1;

  // Reserved: uint8 (1 byte)
  buffer.writeUInt8(0, offset);
  offset += 1;

  // Padding to reach 28 bytes (offset is currently at 23)
  // Write 5 bytes of padding to get to 28
  buffer.writeUInt32LE(0, offset); // 4 bytes padding
  offset += 4;
  buffer.writeUInt8(0, offset); // 1 byte padding
  offset += 1;

  // Write frame data
  // Frame data is organized as: frame0[channel0, channel1, ...], frame1[...], ...
  for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
    const frame = frames[frameIndex];
    for (let channelIndex = 0; channelIndex < channelCount; channelIndex++) {
      buffer.writeUInt8(frame[channelIndex], offset);
      offset += 1;
    }
  }

  return buffer;
}

/**
 * Generate FSEQ filename with metadata
 */
export function generateFSEQFilename(
  songName: string,
  variantStrategy: string
): string {
  const timestamp = new Date().toISOString().slice(0, 10);
  const safeSongName = songName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  return `${safeSongName}-${variantStrategy}-${timestamp}.fseq`;
}
