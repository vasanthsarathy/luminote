import { XMLParser } from 'fast-xml-parser';
import type { ParsedLayout, Model, SubModel } from './types';

export function parseXLightsLayout(xmlContent: string): ParsedLayout {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  const parsed = parser.parse(xmlContent);
  const models: Model[] = [];
  const modelGroups = new Map<string, string[]>();
  let maxChannel = 0;

  // Extract models from XML
  const xmlModels = Array.isArray(parsed.xrgb?.models?.model)
    ? parsed.xrgb.models.model
    : parsed.xrgb?.models?.model
    ? [parsed.xrgb.models.model]
    : [];

  for (const xmlModel of xmlModels) {
    const name = xmlModel['@_name'] || 'Unnamed';
    const displayAs = xmlModel['@_DisplayAs'] || 'Unknown';
    const controller = xmlModel['@_Controller'] || 'Unknown';

    // Parse start channel
    let startChannelStr = xmlModel['@_StartChannel'] || '1';
    // Remove any prefix like "!Roof Lights 1:" and parse the number
    const channelMatch = startChannelStr.match(/(\d+)$/);
    const startChannel = channelMatch ? parseInt(channelMatch[1], 10) : 1;

    // Estimate channel count (3 channels per RGB pixel)
    const pixelCount = parseInt(xmlModel['@_parm1'] || '0', 10) *
                       parseInt(xmlModel['@_parm2'] || '0', 10);
    const channelCount = pixelCount * 3;

    // Parse 3D position
    const position = {
      x: parseFloat(xmlModel['@_WorldPosX'] || '0'),
      y: parseFloat(xmlModel['@_WorldPosY'] || '0'),
      z: parseFloat(xmlModel['@_WorldPosZ'] || '0'),
    };

    // Parse rotation
    const rotation = {
      x: parseFloat(xmlModel['@_RotateX'] || '0'),
      y: parseFloat(xmlModel['@_RotateY'] || '0'),
      z: parseFloat(xmlModel['@_RotateZ'] || '0'),
    };

    // Parse submodels
    const subModels: SubModel[] = [];
    const xmlSubModels = Array.isArray(xmlModel.subModel)
      ? xmlModel.subModel
      : xmlModel.subModel
      ? [xmlModel.subModel]
      : [];

    for (const xmlSubModel of xmlSubModels) {
      subModels.push({
        name: xmlSubModel['@_name'] || 'Unnamed SubModel',
        type: xmlSubModel['@_type'] || 'ranges',
        ranges: xmlSubModel['@_line0'] || '',
      });
    }

    models.push({
      name,
      displayAs,
      startChannel,
      channelCount,
      controller,
      pixelCount,
      subModels,
      position,
      rotation,
      customModel: xmlModel['@_CustomModelCompressed'],
    });

    // Track max channel for total count
    if (startChannel + channelCount > maxChannel) {
      maxChannel = startChannel + channelCount;
    }
  }

  return {
    models,
    totalChannels: maxChannel,
    modelGroups,
  };
}

export function getModelsByType(layout: ParsedLayout, type: string): Model[] {
  return layout.models.filter(m =>
    m.name.toLowerCase().includes(type.toLowerCase())
  );
}

export function getModelsByName(layout: ParsedLayout, namePattern: string): Model[] {
  const pattern = namePattern.toLowerCase();
  return layout.models.filter(m =>
    m.name.toLowerCase().includes(pattern)
  );
}
