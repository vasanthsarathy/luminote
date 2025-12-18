import * as fs from 'fs';
import * as path from 'path';

const fseqPath = path.join(__dirname, '../specs/EXAMPLE-base-fseq.fseq');
const buffer = fs.readFileSync(fseqPath);

console.log('🔍 Analyzing FSEQ File Structure\n');
console.log(`File size: ${buffer.length} bytes\n`);

// Read header
const magic = buffer.toString('ascii', 0, 4);
console.log(`Magic: "${magic}"`);

// FSEQ v2 header structure (based on xLights format)
const headerLength = buffer.readUInt16LE(4);
const minorVersion = buffer.readUInt8(6);
const majorVersion = buffer.readUInt8(7);

console.log(`Header length: ${headerLength} bytes`);
console.log(`Version: ${majorVersion}.${minorVersion}`);

const channelCount = buffer.readUInt32LE(8);
const frameCount = buffer.readUInt32LE(12);
const stepTime = buffer.readUInt16LE(16); // milliseconds
const flags = buffer.readUInt8(18);
const compressionType = buffer.readUInt8(19);
const numCompressionBlocks = buffer.readUInt8(20);
const numSparseRanges = buffer.readUInt8(21);
const reserved = buffer.readUInt8(22);

console.log(`\nChannel count: ${channelCount}`);
console.log(`Frame count: ${frameCount}`);
console.log(`Step time: ${stepTime}ms (${1000 / stepTime} FPS)`);
console.log(`Flags: 0x${flags.toString(16)}`);
console.log(`Compression: ${compressionType} (0=none, 1=zstd, 2=zlib)`);
console.log(`Compression blocks: ${numCompressionBlocks}`);
console.log(`Sparse ranges: ${numSparseRanges}`);

// Variable length data starts at byte 24
let offset = 24;

// Read variable length data if present
if (headerLength > 28) {
  console.log(`\nVariable length data (${headerLength - 28} bytes):`);

  // Variable section contains compression block info, sparse ranges, etc.
  // For now, skip to frame data
  offset = headerLength;
}

console.log(`\nFrame data starts at offset: ${offset}`);
console.log(`Expected frame data size: ${channelCount * frameCount} bytes`);
console.log(`Actual remaining data: ${buffer.length - offset} bytes`);

// Check if it matches
const expectedSize = channelCount * frameCount;
const actualSize = buffer.length - offset;

if (expectedSize === actualSize) {
  console.log('✓ Uncompressed frame data (matches expected size)');
} else if (actualSize < expectedSize) {
  console.log('✓ Compressed frame data');
} else {
  console.log('⚠ Size mismatch - may have additional data');
}

// Sample first few frames
console.log('\nFirst frame sample (first 20 channels):');
const firstFrame = buffer.slice(offset, offset + Math.min(20, channelCount));
console.log(Array.from(firstFrame).map(b => b.toString().padStart(3)).join(' '));

console.log('\n📋 FSEQ Format Summary:');
console.log('=====================================');
console.log('Header: 24+ bytes (variable length)');
console.log('  - Magic: "PSEQ" (4 bytes)');
console.log('  - Header length: uint16 (2 bytes)');
console.log('  - Version: 2 bytes (minor, major)');
console.log('  - Channel count: uint32 (4 bytes)');
console.log('  - Frame count: uint32 (4 bytes)');
console.log('  - Step time: uint16 milliseconds');
console.log('  - Flags, compression, etc: 4 bytes');
console.log('  - Variable data: compression blocks, sparse ranges');
console.log('Frame data: channelCount × frameCount bytes');
console.log('  - Can be compressed or uncompressed');
console.log('  - Values 0-255 per channel');
