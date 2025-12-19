console.log('🔍 Debugging frame creation\n');

const channelCount = 300;
const frame = new Uint8Array(channelCount);

console.log('Initial frame (first 12 channels):');
console.log(Array.from(frame.slice(0, 12)));

console.log('\nSetting pixels to red (R=255, G=0, B=0):');
for (let j = 0; j < channelCount; j += 3) {
  frame[j] = 255; // R
  frame[j + 1] = 0; // G
  frame[j + 2] = 0; // B
}

console.log('\nAfter setting (first 12 channels):');
console.log(Array.from(frame.slice(0, 12)));

console.log('\nFirst 4 pixels:');
for (let i = 0; i < 12; i += 3) {
  console.log(
    `  Pixel ${i / 3}: RGB(${frame[i]}, ${frame[i + 1]}, ${frame[i + 2]})`
  );
}
