import * as fs from 'fs';
import * as path from 'path';

const fseqPath = path.join(__dirname, '../specs/test-simple.fseq');
const buffer = fs.readFileSync(fseqPath);

console.log('🔍 Debugging test-simple.fseq\n');

// Read header
const magic = buffer.toString('ascii', 0, 4);
const headerLength = buffer.readUInt16LE(4);
const channelCount = buffer.readUInt32LE(8);
const frameCount = buffer.readUInt32LE(12);

console.log(`Magic: "${magic}"`);
console.log(`Header length: ${headerLength}`);
console.log(`Channel count: ${channelCount}`);
console.log(`Frame count: ${frameCount}`);

// Read first frame, first 10 channels
console.log('\nFirst frame, first 30 channels (10 RGB pixels):');
const frameDataOffset = headerLength;
for (let i = 0; i < 30; i += 3) {
  const r = buffer.readUInt8(frameDataOffset + i);
  const g = buffer.readUInt8(frameDataOffset + i + 1);
  const b = buffer.readUInt8(frameDataOffset + i + 2);
  console.log(`  Pixel ${i / 3}: RGB(${r}, ${g}, ${b})`);
}

console.log('\nExpected: All pixels should be RGB(255, 0, 0) - RED');
