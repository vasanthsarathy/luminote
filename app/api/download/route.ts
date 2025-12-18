import { NextRequest, NextResponse } from 'next/server';
import { generateFSEQFilename } from '@/lib/fseq-writer';

// Import the cache from the generate route
// This is a workaround for the MVP - in production, use R2
let fseqCache: Map<string, Buffer>;
try {
  const generateModule = require('../generate/route');
  fseqCache = generateModule.fseqCache;
} catch {
  fseqCache = new Map();
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const variantId = searchParams.get('variantId');
    const strategy = searchParams.get('strategy');
    const song = searchParams.get('song');

    if (!variantId || !strategy || !song) {
      return NextResponse.json(
        { error: 'Missing parameters' },
        { status: 400 }
      );
    }

    // Get FSEQ data from cache
    const fseqBuffer = fseqCache.get(variantId);

    if (!fseqBuffer) {
      return NextResponse.json(
        { error: 'FSEQ file not found. Please regenerate variants.' },
        { status: 404 }
      );
    }

    // Get song title for filename
    const songTitles: Record<string, string> = {
      'jingle-bells': 'Jingle Bells',
      'silent-night': 'Silent Night',
    };

    const songTitle = songTitles[song] || song;
    const filename = generateFSEQFilename(songTitle, strategy);

    // Return file as download
    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(fseqBuffer);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fseqBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading FSEQ:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to download FSEQ',
      },
      { status: 500 }
    );
  }
}
