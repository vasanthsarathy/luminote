import * as fs from 'fs';
import * as path from 'path';
import { parseXLightsLayout } from '../lib/layout-parser';

// Read the example XML file
const xmlPath = path.join(__dirname, '../specs/EXAMPLE-xlights-layout.xml');
const xmlContent = fs.readFileSync(xmlPath, 'utf-8');

// Parse it
console.log('Parsing xLights layout XML...');
const layout = parseXLightsLayout(xmlContent);

console.log(`Found ${layout.models.length} models`);
console.log(`Total channels: ${layout.totalChannels}`);

// List some model names
console.log('\nSample models:');
layout.models.slice(0, 10).forEach(model => {
  console.log(`- ${model.name} (${model.channelCount} channels, ${model.subModels.length} submodels)`);
});

// Save to data directory
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const outputPath = path.join(dataDir, 'layout.json');
fs.writeFileSync(outputPath, JSON.stringify(layout, null, 2));

console.log(`\n✓ Layout data saved to ${outputPath}`);
