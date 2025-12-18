'use client';

import { useState } from 'react';

interface Variant {
  id: string;
  strategy: 'energy' | 'elegant' | 'balanced';
  name: string;
  description: string;
  rationale: string;
  fseqUrl?: string;
}

export default function Home() {
  const [song, setSong] = useState('jingle-bells');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for your light show');
      return;
    }

    setLoading(true);
    setError(null);
    setVariants([]);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          song,
          prompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      setVariants(data.variants);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate variants');
      console.error('Generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (variantId: string, strategy: string) => {
    window.location.href = `/api/download?variantId=${variantId}&strategy=${strategy}&song=${song}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-red-500 via-green-500 to-red-500 bg-clip-text text-transparent">
            Luminote
          </h1>
          <p className="text-gray-400 text-lg">
            AI-Powered Christmas Light Sequence Generator
          </p>
        </div>

        {/* Setup Info */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Layout</p>
              <p className="text-white font-medium">
                ✓ Your roof layout (73 models)
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Channels</p>
              <p className="text-white font-medium">119,557 channels</p>
            </div>
          </div>
        </div>

        {/* Song Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Select Song
          </label>
          <select
            value={song}
            onChange={e => setSong(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={loading}
          >
            <option value="jingle-bells">Jingle Bells (120 BPM, Energetic)</option>
            <option value="silent-night">Silent Night (60 BPM, Calm)</option>
          </select>
        </div>

        {/* Prompt Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Describe your vision
          </label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="energetic, focus on snowflakes, red and white colors, fast chases..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 h-32 resize-none"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-2">
            Describe the mood, colors, speed, and which parts of your display to
            focus on
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="w-full bg-gradient-to-r from-red-600 to-green-600 hover:from-red-700 hover:to-green-700 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold py-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Generating AI variants...
            </span>
          ) : (
            'Generate Variants'
          )}
        </button>

        {/* Variants Display */}
        {variants.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Your AI-Generated Variants</h2>
            <div className="space-y-6">
              {variants.map((variant, index) => (
                <div
                  key={variant.id}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1">
                        Variant {String.fromCharCode(65 + index)}: {variant.name}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {variant.description}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-900 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {variant.rationale}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDownload(variant.id, variant.strategy)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    Download .fseq File
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Powered by AI • xLights Compatible • Cloudflare Pages
          </p>
        </div>
      </div>
    </div>
  );
}
