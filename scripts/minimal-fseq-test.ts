import { writeFSEQ } from '../lib/fseq-writer';

console.log('🔬 Minimal FSEQ test\n');

// Create just 1 frame with 3 channels (1 pixel)
const frame = new Uint8Array(3);
frame[0] = 255; // R
frame[1] = 0; // G
frame[2] = 0; // B

console.log('Input frame:', Array.from(frame));

const fseqBuffer = writeFSEQ([frame], {
  channelCount: 3,
  frameCount: 1,
  stepTime: 50,
});

console.log(`\nGenerated FSEQ: ${fseqBuffer.length} bytes`);

// Read header
const headerLength = fseqBuffer.readUInt16LE(4);
console.log(`Header length: ${headerLength} bytes`);

// Read frame data
const r = fseqBuffer.readUInt8(headerLength);
const g = fseqBuffer.readUInt8(headerLength + 1);
const b = fseqBuffer.readUInt8(headerLength + 2);

console.log(`\nOutput pixel: RGB(${r}, ${g}, ${b})`);
console.log(`Expected: RGB(255, 0, 0)`);
console.log(`Match: ${r === 255 && g === 0 && b === 0 ? '✓' : '✗'}`);
