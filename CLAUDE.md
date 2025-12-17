# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Luminote** is an AI-powered creative collaboration tool that helps users design synchronized Christmas light shows. Users describe their vision in natural language, and the system generates multiple sequence variants to choose from, producing fully compatible `.fseq` files for xLights.

Primary goal: Enable **music → light choreography** in minutes, not weeks, through AI creative partnership.

## Deployment

This project is hosted on **Cloudflare** and uses **Wrangler** for deployment commands.

Common commands:
- `npm run dev` - Run local Next.js development server (http://localhost:3000)
- `npm run build` - Build Next.js for production (static export to ./out)
- `npm run deploy` - Build and deploy to Cloudflare Pages
- `wrangler tail` - View live logs from production
- `wrangler pages deployment list` - List all deployments

## Development Workflow

### Regular Git Commits

**IMPORTANT**: Make regular git commits and pushes throughout development. After completing any significant piece of work (feature, fix, or milestone), always:

1. **Stage changes**: `git add -A`
2. **Commit with descriptive message**: Use the format below
3. **Push to remote**: `git push origin main`
4. **Deploy** (when appropriate): `npm run pages:deploy`

### Commit Message Format

Use conventional commits with Claude Code attribution:

```bash
git commit -m "$(cat <<'EOF'
type: Brief description of changes

Detailed explanation of what was changed and why.
Include context about the feature or fix.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

**Commit types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks
- `test:` - Test additions or changes

### When to Commit

Commit after:
- Completing a feature or component
- Fixing a bug
- Completing a phase of the MVP plan (e.g., "Phase 1: Foundation complete")
- Before switching to a different task
- At the end of each work session

### When to Deploy

Deploy to Cloudflare Pages after:
- Completing a major milestone
- Finishing a user-facing feature
- When code is stable and tested
- Before asking the user to test

**Deployment command:**
```bash
npm run deploy
```

This will:
1. Build the Next.js app (static export to `./out`)
2. Deploy the output directory to Cloudflare Pages using Wrangler
3. Output the deployment URL

## Architecture

### Frontend (Planned)
- Next.js (React) + TypeScript
- WebAudio for playback + waveform visualization
- Canvas/WebGL (Three.js optional) for 2D/3D preview rendering
- 4-step wizard flow: Layout → Song → Style → Export

### Backend (Planned)
- Cloudflare Workers for serverless compute
- Cloudflare Durable Objects or R2 for storage
- Queue processing using Cloudflare Queues
- Heavy compute operations:
  - Audio analysis (beat tracking, onset detection, spectral features)
  - Sequence generation (effect rendering to channels)
  - FSEQ file writing

### Storage
- Cloudflare R2 for uploaded XML, audio, and generated files
- Cloudflare D1 (SQLite) or external PostgreSQL for users, house profiles, songs, and job metadata

### AI Integration (Core Feature)
**Dual AI API Architecture:**
- **Claude API (Anthropic)**: Creative decisions, aesthetic reasoning, understanding user intent and mood, generating design rationales, visual layout analysis
- **OpenAI API**: Structured output parsing, converting natural language constraints to parameters, effect selection
- **Adaptive routing**: Creative tasks → Claude, structured parsing → OpenAI

**AI Responsibilities:**
- Parse natural language input (keywords, emotions, constraints) into structured parameters
- Analyze layout visually (via 2D/3D preview renders) to understand spatial relationships and aesthetics
- Generate 3-5 meaningfully different sequence variants from same inputs
- Provide rationale explaining creative choices for each variant
- Incorporate user feedback to refine selected variants

## Natural Language Input System

Users can describe their desired light show in multiple ways:

**Input Methods:**
1. **Free-form text prompt**: "energetic but classy", "focus on the roof", "warm colors only", "make it feel like a winter wonderland"
2. **Structured fields with AI assist**: Separate fields for mood, speed, focus areas, color preferences - each accepts natural language
3. **Chat interface**: Conversational back-and-forth where AI asks clarifying questions about vision

**AI Processing:**
- Parse all input types into structured constraints
- Extract: mood, tempo preference, spatial focus, color constraints, intensity level, effect preferences
- Handle ambiguity by generating multiple interpretations (reflected in variants)
- Learn from user selections to improve future suggestions

## Core Data Flow (AI Creative Collaboration)

1. User uploads **xLights layout XML** → Parse into Render Graph (models → points → channels)
2. User uploads/selects **song** → Audio analysis produces beats, onsets, sections, energy features
3. **User describes vision** via natural language (free-form, structured fields, or chat)
4. **AI analyzes layout visually:**
   - Generate 2D/3D preview render
   - Feed to Claude API with vision capabilities
   - Extract spatial relationships, aesthetic potential, focal points
5. **AI processes constraints:**
   - Parse natural language input into structured parameters
   - Combine with musical features and layout understanding
   - Generate Control Track from audio features
6. **System generates 3-5 sequence variants:**
   - Each variant applies constraints differently with unique creative interpretation
   - Effect primitives (pulse, chase, wipe, sparkle, strobe) mapped to model groups
   - AI provides rationale for each variant's design choices
   - Per-frame channel intensities rendered into `.fseq` format
7. **User previews and selects:**
   - Side-by-side variant comparison
   - Read AI rationales
   - Select favorite variant
8. **Optional refinement:**
   - User provides feedback on selected variant
   - AI regenerates with adjustments
9. User downloads final `.fseq` file compatible with xLights/FPP

## Key Technical Components

### xLights Layout Parsing
- Parse XML (schema-less, version-agnostic)
- Extract models with coordinates, channel mappings, groups
- Produce internal JSON: `{models, groups, channel_count, points[]}`
- Handle edge cases: missing coordinates, non-RGB channels, unsupported model types

### FSEQ File Format
- Support common FSEQ variants (xLights/FPP compatible)
- Preserve from base file: version, step time (fps), compression
- Internal frame representation: `[T frames × C channels]` with values 0-255
- Stream-encode frames for performance with large channel counts

### Audio Analysis Pipeline
- Beat tracking: tempo (BPM) + beat positions + downbeats
- Onset detection per frequency band
- RMS energy envelope
- Spectral features: centroid, flux
- Section detection: intro/verse/chorus/bridge/outro
- Optional: vocal activity detection

### Visual Layout Understanding (AI Vision)

**Purpose**: Enable AI to understand spatial relationships and aesthetics, not just coordinate data.

**Process:**
1. Generate 2D/3D preview render from parsed layout
2. Feed visual representation to Claude API (vision-enabled model)
3. AI analyzes:
   - Spatial relationships between models (which are neighbors, which are isolated)
   - Overall aesthetic of the setup (symmetrical, organic, architectural)
   - Which models would create focal points or visual anchors
   - How colors and movements would appear to viewers
   - Potential for layered effects (foreground/background)

**Benefits:**
- Better creative decisions than coordinate data alone
- Understanding of "what looks good" based on layout geometry
- Ability to reason about viewer perspective
- Inform effect assignments based on visual hierarchy

**Implementation:**
- Render layout to PNG/Canvas using parsed coordinates
- Include in Claude API request alongside structured layout data
- Combine visual insights with musical analysis for variant generation

### Effect Rendering Engine

**Effect Primitives:**
- **Pulse**: brightness = f(energy)
- **Chase**: moving highlight along ordered points
- **Wipe**: directional fill (left→right, bottom→top)
- **Sparkle**: random twinkles gated by onsets
- **Strobe**: high-energy hits only
- **Color shift**: palette interpolation tied to sections

**Model Classification Heuristics:**
- Keyword matching: roof, window, tree, arch, bush, matrix, star
- Topology inference: line-like, ring-like, grid-like, blob
- AI visual analysis: focal point potential, symmetry, layering

**Enhanced Mapping Strategy (AI-Driven):**
- **Musical mapping**: Beats → chases/pulses, sections → palette/theme changes, onsets → sparkle/strobe
- **Aesthetic considerations**:
  - Speed feels: fast chases = energetic, slow pulses = elegant
  - Color psychology: warm (cozy), cool (crisp), vibrant (playful)
  - Spatial focus: honor user constraints like "focus on roof" or "highlight the tree"
  - Mood matching: align effect intensity with emotional tone
  - Layout awareness: use visual understanding for effect placement
- **Creative variation**: generate 3-5 different interpretations of same constraints
- **Explainability**: AI provides reasoning for creative choices in each variant

**Multi-Variant Generation:**
- Same inputs (song + layout + constraints) → 3-5 unique sequences
- Each variant emphasizes different aspects:
  - Variant A: maximizes energy/excitement
  - Variant B: emphasizes elegance/subtlety
  - Variant C: balances both, focuses on spatial symmetry
  - Variant D: experimental/creative interpretation
  - Variant E: user constraint-optimized
- Deterministic per variant: seeded by `(song_id, house_profile_id, constraints_hash, variant_number)`

### Job Processing States
`queued → parsing_input → analyzing_audio → analyzing_layout_visual → generating_variants (1/5, 2/5...) → done` (or `failed`)

Additional states for refinement:
`refining → regenerating_variant → done`

## Data Model

### Core Entities
- **User**: id, email, plan, created_at
- **HouseProfile**:
  - id, user_id, name
  - xlights_xml_original (blob)
  - parsed_layout_json (structured data)
  - layout_preview_image_url (for AI visual analysis)
  - channel_count, default_fps, created_at
- **Song**:
  - id, canonical, title, artist, duration, bpm
  - audio_storage_url
  - analysis_json (beats, onsets, sections, spectral features)
- **SequenceJob**:
  - id, user_id, house_profile_id, song_id
  - user_prompt_text (natural language input)
  - parsed_constraints_json (extracted from prompt)
  - ai_provider_used (claude/openai/both)
  - total_variants (typically 3-5)
  - selected_variant_id
  - status, logs, created_at
- **SequenceVariant**:
  - id, job_id, variant_number (1-5)
  - params_json (style, palette, intensity, fps, effect assignments)
  - ai_rationale (explanation of creative choices)
  - preview_url (quick preview render)
  - fseq_url (final .fseq file)
  - user_selected (boolean)
- **FeedbackIteration**:
  - id, variant_id, user_feedback_text
  - refined_params_json
  - refined_fseq_url
  - created_at

## Design Principles

### UX - AI Creative Collaboration Workflow
- **Dark-mode first**: Holiday lights pop against dark background
- **Clean, generous whitespace**: Not cluttered, focus on creativity
- **Single bright accent color**: Icy cyan or holly red
- **Minimal but fun**: Sparkle micro-interactions, beat-synced animations
- **Accessibility**: High contrast, reduce motion toggle, keyboard navigable

**Updated Flow:**
1. **Upload**: Layout + song
2. **Describe**: Natural language input (free-form, structured, or chat)
3. **Generate**: AI creates 3-5 variants (show progress: "Generating variant 1/5...")
4. **Compare**: Side-by-side variant previews with AI rationales
5. **Select & Refine**: Choose favorite, optionally provide feedback for regeneration
6. **Export**: Download final .fseq

**Key UX Elements:**
- Real-time AI thinking indicators ("Analyzing your layout visually...", "Generating energetic variant...")
- Variant cards showing: preview thumbnail, AI rationale snippet, key parameters
- Comparison mode: play multiple variants simultaneously to see differences
- Feedback textarea: "What would you change about this variant?"

### Code
- **Deterministic per variant**: Jobs reproducible via seeded randomness `(song_id, house_profile_id, constraints_hash, variant_number)`
- **Performance**: Stream processing for large channel counts (50k-500k channels)
- **Robustness**: Handle varied xLights XML versions and missing data gracefully
- **AI integration**: Retry logic for API failures, fallback strategies, cost monitoring

## API Design

### REST Endpoints
**Layouts:**
- `POST /api/layouts/upload` - Upload xLights XML
- `GET  /api/layouts/{id}` - Get layout details
- `GET  /api/layouts/{id}/preview` - Get visual preview image

**Songs:**
- `POST /api/songs/upload` - Upload new audio file
- `GET  /api/songs/catalog` - Browse catalog songs (query, tags, bpm range)
- `GET  /api/songs/{id}` - Get song details + analysis

**Jobs & Variants:**
- `POST /api/jobs/create` - Create job with natural language prompt
  ```json
  {
    "layout_id": "uuid",
    "song_id": "uuid",
    "user_prompt": "energetic but classy, focus on the roof, warm colors only"
  }
  ```
- `GET  /api/jobs/{id}` - Get job status and metadata
- `GET  /api/jobs/{id}/variants` - Get all generated variants (3-5)
- `GET  /api/jobs/{id}/variants/{variant_num}` - Get specific variant details
- `POST /api/jobs/{id}/refine` - Refine selected variant with feedback
  ```json
  {
    "variant_id": "uuid",
    "feedback": "Make it slower and more elegant"
  }
  ```
- `GET  /api/jobs/{id}/download/{variant_id}` - Download .fseq file

### WebSocket / Server-Sent Events
Real-time job progress updates:
- `/api/jobs/{id}/stream` - SSE endpoint for live updates

Event types:
- `status_change`: Job state transitions
- `ai_thinking`: Show what AI is currently analyzing
- `variant_progress`: "Generating variant 2/5..."
- `variant_ready`: Variant completed with preview URL
- `error`: Error details with retry options

## Cost & Performance Considerations

### AI API Costs
- **Estimation**: ~$0.10-0.50 per job (5 variants × 2 AI calls each)
- **Strategies**:
  - Cache common layout analyses (visual understanding reusable across songs)
  - Cache song analyses (reusable across different layouts)
  - Rate limiting: free tier = 5 jobs/day, paid = unlimited
  - Batch variant generation to minimize API calls
  - Pre-compute catalog song features to avoid repeated analysis

### Performance
- **Variant generation time**: 30 seconds to 2 minutes total for 5 variants
  - Audio analysis: ~5-10s (cached for catalog songs)
  - Layout visual analysis: ~5-10s (cached per layout)
  - AI constraint parsing: ~3-5s
  - Variant generation: ~5-10s each (can parallelize)
  - FSEQ writing: ~2-5s per variant
- **Optimization**: Generate variants in parallel where possible
- **Preview generation**: Low-res preview renders (<500KB) for fast comparison
- **Progressive enhancement**: Show first variant immediately while others generate

### Storage
- R2 costs: ~$0.015/GB/month
- Typical job:
  - Layout XML: ~100KB-1MB
  - Song audio: ~3-10MB
  - Generated .fseq: ~500KB-50MB (depends on channels × duration)
  - Preview images: ~50-200KB each
- Cleanup policy: Delete job artifacts after 30 days (configurable)

## Testing Strategy

- **Unit tests**:
  - XML parsing fixtures (various xLights versions)
  - FSEQ read/write roundtrip
  - Effect rendering primitives
  - Natural language constraint parsing
- **Integration tests**:
  - End-to-end: layout + song + prompt → 5 variants
  - AI API mocking for deterministic tests
  - Variant refinement workflow
- **Golden tests**:
  - Deterministic outputs for fixed seeds per variant
  - Verify AI rationales are generated
- **AI tests**:
  - Prompt parsing accuracy (validate extracted constraints)
  - Visual layout analysis quality
  - Variant diversity (ensure meaningfully different outputs)

## MVP Scope

**Phase 1: Core AI Collaboration (MVP)**
1. Upload layout XML → parse → generate visual preview for AI
2. Pick from 3-5 catalog songs (precomputed analysis)
3. Natural language input (free-form text prompt)
4. AI generates 3 variants (start with 3, expand to 5 later)
5. Side-by-side variant comparison with AI rationales
6. Select variant and download .fseq
7. Basic 2D preview with scrubber

**Phase 2: Enhanced Interaction**
- Chat interface for iterative constraint refinement
- Structured fields with AI assist
- Variant refinement with feedback
- Expand to 5 variants
- User-uploaded audio analysis

**Deferred for later:**
- 3D preview (stick with 2D for MVP)
- Per-model manual mapping overrides
- Public sharing/community library
- Advanced effect customization UI

## Known Risks

### Technical
- **FSEQ format variability** across xLights versions
- **Layout XML diversity**: missing coordinates, various model types
- **Performance**: very large channel counts (50k-500k)
- **Audio analysis quality** on compressed/noisy audio files
- **Music licensing** for catalog songs

### AI-Related
- **API costs**: Could scale quickly with heavy usage (mitigation: caching, rate limits)
- **AI API reliability**: Outages or rate limits (mitigation: retry logic, fallbacks)
- **Prompt parsing accuracy**: Natural language ambiguity (mitigation: clarifying questions, multiple variants)
- **Visual analysis quality**: AI may misinterpret layout aesthetics (mitigation: combine with structured data)
- **Variant quality**: Not all AI-generated variants may be aesthetically pleasing (mitigation: generate 3-5 options for user choice)
- **Determinism**: AI outputs may vary slightly even with same inputs (mitigation: seed-based generation, caching)
- **User expectations**: AI may not perfectly match user vision (mitigation: iterative refinement, clear rationales)
