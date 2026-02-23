# ShaderForge

> A web-based community platform for creating, sharing, and discovering real-time WebGPU shader effects — the browser counterpart to ShaderLabDX12, with demoscene DNA.

---

## Inspirations

| Project | What we borrow |
|---------|----------------|
| **[ShaderToy](https://www.shadertoy.com)** (Inigo Quilez / Pol Jeremias) | Fragment-shader-first editor, community gallery, forking, built-in uniforms (`iTime`, `iResolution`, `iMouse`), multi-pass buffer channels |
| **[ShaderLabDX12](https://github.com/drcircuit/ShaderLabDX12)** (drcircuit) | BPM-synced BeatClock, tracker timeline, playlist/scene sequencing, multi-pass pixel buffers, three-panel editor layout (Demo View / Scene View / Effect View), project JSON serialisation, dark cyberpunk aesthetic |
| **Demoscene** — Revision, Assembly, Evoke, pouet.net | 64k/4k size-coding philosophy, BPM-synced intros, procedural geometry, signed-distance functions |
| **Notable demosceners** | Inigo Quilez (ray marching, SDFs), Evvvvil (Pouet compo veteran), Blackle (extreme size-coding), groups Mercury, Fairlight, Farbrausch |
| **Tracker tools** | GNU Rocket, Renoise, Buzz — row-based keyframe animation synced to music |

---

## Vision

ShaderForge is the **browser-native version of ShaderLabDX12**. It targets the same creative use-case — building beat-synced demo effects — but adds a community layer so anyone can register, share, and fork shaders.

The central design principle is **zero GPU boilerplate**. A web developer should be able to render a fully animated, beat-synced WebGPU shader in ten lines of TypeScript, with no knowledge of swap-chains, bind-group layouts, buffer padding, or pipeline descriptors.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   shaderforge.ui                     │
│  Vue 3 + Vuetify · Three-panel editor                │
│  Demo View | Scene View | Effect View                │
│  Community gallery · user profiles · comments        │
│  Powered by @shaderforge/engine for live preview     │
└────────────────────┬────────────────────────────────┘
                     │ REST / WebSocket
┌────────────────────▼────────────────────────────────┐
│                 ShaderForge.API                      │
│  .NET 9 · shaders · users · comments · thumbnails   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              @shaderforge/engine  (NPM)              │
│  ShaderEffect · BeatClock · Tracker · Playlist       │
│  UniformBuffer (auto-padded) · multi-pass buffers    │
│  Pure TypeScript ESM · zero runtime dependencies     │
│  Works in any framework (or vanilla JS)              │
└─────────────────────────────────────────────────────┘
```

---

## Feature Parity with ShaderLabDX12

| ShaderLabDX12 (C++ / DX12) | ShaderForge web equivalent |
|---------------------------|---------------------------|
| `AudioSystem` — load WAV/MP3/OGG, playback | Browser `<audio>` / Web Audio API, BPM input |
| `BeatClock` — quarter/eighth/sixteenth/bar counts + phase values | `BeatClock` class in `@shaderforge/engine` (TypeScript port) |
| Tracker timeline — row-based keyframe animation | `Tracker` class with `linear` / `smooth` / `constant` interpolation |
| Playlist — beat-anchored scene transitions | `Playlist` class; `ShaderEffect` swaps pipeline per bar boundary |
| Multi-pass rendering — pixel buffer passes | `ShaderEffect` buffer pass support (M3) |
| HLSL live compilation via DXC | WGSL live compilation via WebGPU `createShaderModule` + error overlays |
| Effect View — shader editor (ImGui) | Monaco editor with WGSL syntax highlighting and inline error annotations |
| Demo View — timeline + transport | Tracker UI with row grid, BPM input, play/pause/stop transport |
| Scene View — realtime preview | `<canvas>` preview panel driven by `@shaderforge/engine` |
| Project serialisation (`project.json`) | JSON project format saved to API or `localStorage` |
| Dark cyberpunk aesthetic (Hacked / Orbitron / Erbos Draco) | Audiowide + Oxanium fonts; cyan `#40c0ff` accent on `#020304` dark |

---

## Rework Plan & Milestones

### M1 — `@shaderforge/engine` NPM Package _(foundation)_

> All WebGPU complexity lives here so no other layer needs to touch the GPU API directly.

**Implemented in `shaderforge-engine/`**

- `ShaderEffect` — compile WGSL, render to `<canvas>`, auto-manage the render loop
  - Auto-injects `BuiltinUniforms` struct into every shader
  - Built-in uniforms: `time`, `frame`, `resolution`, `mouse`
  - `compile(fragmentWGSL, vertexWGSL?)` — hot-swap pipeline, `CompileResult` error type
  - `play()` / `pause()` / `stop()`
  - `ResizeObserver` keeps `resolution` in sync
  - Pointer tracking keeps `mouse` in sync
- `BeatClock` — TypeScript port of `src/audio/BeatClock.cpp`
  - `setBPM(bpm)` / `setTimeSignature(beatsPerBar)`
  - `update(audioTimeSeconds)` → `BeatClockState`
  - Quarter, eighth, sixteenth counters and 0→1 phase values
  - Per-frame hit flags: `hitQuarterNote`, `hitEighthNote`, `hitBar`
- `Tracker` — keyframe timeline on a beat-row grid (inspired by GNU Rocket)
  - `track(name, keyframes)` — add named track with typed keyframes
  - Interpolation modes: `linear`, `smooth` (cubic ease), `constant`
  - `play()` / `pause()` / `stop()` / `seekRow(row)`
  - `getValue(name)` — current interpolated value
  - `tick()` — advance one frame and return `BeatClockState`
- Beat uniforms auto-pushed every frame: `bpm`, `beat`, `barProgress`, `quarterPhase`, `eighthPhase`, `sixteenthPhase`
- `Playlist` — beat-anchored sequence of shaders (future M4 integration in `ShaderEffect`)
- `UniformBuffer` — auto-padded GPU buffer, hides `@align` / struct padding rules
- `createEffect(canvas, fragmentWGSL?, options?)` — convenience factory

**Non-goals (hidden from callers)**
- No public `GPUDevice`, `GPUAdapter`, or `GPUCommandEncoder`
- No manual buffer padding or bind-group layout entries for users
- No swap-chain configuration

---

### M2 — Backend API _(community data layer)_

> Persist and serve shaders, user profiles, comments, and thumbnails.

- Replace in-memory stores with PostgreSQL via Entity Framework Core
- JWT authentication (`/api/auth/register`, `/api/auth/login`)
- Shader CRUD: ownership, visibility (`public` / `private` / `unlisted`)
- Project JSON format matching ShaderLabDX12's `project.json` schema (shaders, tracker data, playlist, BPM)
- Thumbnail generation endpoint (Playwright screenshot or server-side WebGPU)
- Rate-limiting and spam protection
- OpenAPI / Swagger documentation

---

### M3 — Shader Editor — Effect View _(frontend)_

> Mirrors ShaderLabDX12's **Effect View**: write → compile → preview.

- Monaco editor with WGSL syntax highlighting and inline error annotations (squiggles on GPU compile error line/column)
- Live preview panel powered by `@shaderforge/engine`; recompiles on `Ctrl+R`
- Split layout: **Fragment** editor (always visible) + **Vertex** editor (advanced mode, like DX12)
- Shader metadata (title, description, tags, visibility, BPM)
- Asset tray: drag-and-drop textures/audio onto numbered channels
- Save to profile (authenticated) or `localStorage` (anonymous)
- Fork from existing shader → pre-loads code into editor

---

### M4 — Demo View + Tracker UI _(demoscene DNA)_

> Mirrors ShaderLabDX12's **Demo View**: the tracker timeline + transport controls.

- Transport bar: `▶ Play` / `⏸ Pause` / `⏹ Stop` + BPM input + position display
- Row-grid timeline showing all tracks as columns (rows = beat subdivisions)
- Click/drag cells to set keyframe values; right-click to set interpolation type
- Beat markers: bar lines, beat lines, sub-beat lines at configurable zoom
- Bind any track to a named WGSL uniform (auto-listed from the active shader)
- Audio upload: WAV/MP3; playback synced to tracker position
- Beat detection to auto-suggest BPM from loaded audio
- Export/import tracker data as JSON (stored in project JSON alongside shader source)

---

### M5 — Scene View + Multi-Pass Layer Stack _(ShaderLabDX12 scene + postFxChain)_

> Mirrors ShaderLabDX12's **Scene** + **postFxChain** model exactly, implemented in `@shaderforge/engine`.

#### How the stack works

Each **scene** (named `RenderPass`) renders to its own off-screen `GPUTexture`.
A later pass can bind earlier scenes' textures as `iChannel0..3` — the WGSL equivalent of ShaderLabDX12's `TextureBinding` with `bindingType = Scene`.

**Post-FX passes** sit at the end and use a ping-pong pair of textures:
the output of pass N becomes `iChannel0` of pass N+1.
The final pass renders directly to the canvas swap-chain view.

```
ShaderLabDX12                    @shaderforge/engine (WGSL)
─────────────────────────────    ──────────────────────────────────────────
Scene                        →   LayerStack.scene({ name, fragmentShader })
Scene.bindings (sourceScene) →   channels: [{ channel: 0, source: 'name' }]
iChannel0..7 (HLSL t0..t7)   →   iChannel0..3  (@group(0) @binding(1..8))
Scene.postFxChain[]          →   LayerStack.postFx(fragmentShader) (chained)
postFxTextureA / B           →   pingTex / pongTex  (internal ping-pong)
PreviewRenderer.Render()     →   LayerStack.render(encoder, canvasView, ub)
```

The entire chain: `scene₀→tex₀` → `scene₁ reads tex₀ via iChannel0 → tex₁` →
`postFx₀ reads tex₁ → ping` → `postFx₁ reads ping → canvas`.

#### `LayerStack` example

```ts
import { LayerStack, createEffect } from '@shaderforge/engine';

// Scene 1 — plasma base layer
const baseWGSL = `
@fragment fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let uv = pos.xy / uniforms.resolution;
  return vec4f(0.5 + 0.5*sin(uniforms.time + uv.xyx*6.0 + vec3f(0,2,4)), 1.0);
}`;

// Scene 2 — reads the base layer via iChannel0 and adds a feedback trail
const trailWGSL = `
@fragment fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let uv  = pos.xy / uniforms.resolution;
  let cur = textureSample(iChannel0, iChannel0Sampler, uv);
  return mix(cur, vec4f(uv, 0.5, 1.0), 0.05);
}`;

// Post-FX 1 — radial vignette applied on top of the final scene output
const vignetteWGSL = `
@fragment fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let uv   = pos.xy / uniforms.resolution;
  let col  = textureSample(iChannel0, iChannel0Sampler, uv);
  let d    = length(uv - 0.5) * 1.6;
  return vec4f(col.rgb * (1.0 - d*d), 1.0);
}`;

const stack = new LayerStack()
  .scene({ name: 'base',   fragmentShader: baseWGSL })
  .scene({ name: 'trails', fragmentShader: trailWGSL,
           channels: [{ channel: 0, source: 'base' }] })
  .postFx(vignetteWGSL);   // iChannel0 = output of 'trails'

const effect = await createEffect(canvas, undefined, { layerStack: stack });
effect.play();
```


---

### M6 — Community Platform _(social layer)_

- Public gallery: newest / highest-rated / trending feeds
- User profiles with shader collections and demo reels
- Comments and reactions on shaders
- Featured shaders curated by admins on the front page
- `<iframe>` embed code for every public shader
- "Inspiration" credits when forking (links back to source)

---

## `@shaderforge/engine` Quick Start

### Minimal example (fragment shader only)

```ts
import { createEffect } from '@shaderforge/engine';

const effect = await createEffect(document.getElementById('canvas') as HTMLCanvasElement, `
  @fragment
  fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let uv  = pos.xy / uniforms.resolution;
    let col = 0.5 + 0.5 * cos(uniforms.time + uv.xyx + vec3f(0,2,4));
    return vec4f(col, 1.0);
  }
`);

effect.play();
```

### Beat-synced effect with Tracker (mirrors ShaderLabDX12 demo flow)

```ts
import { createEffect, Tracker } from '@shaderforge/engine';

// BPM-synced tracker with keyframe animation
const tracker = new Tracker({ bpm: 140, rowsPerBeat: 4, beatsPerBar: 4 });
tracker
  .track('brightness', [
    { row: 0,   value: 0.0, interpolation: 'linear'   },
    { row: 16,  value: 1.0, interpolation: 'smooth'   },
    { row: 32,  value: 0.2, interpolation: 'constant' },
  ])
  .track('hueShift', [
    { row: 0,  value: 0.0 },
    { row: 64, value: 6.28 },
  ]);

const effect = await createEffect(canvas, `
  @fragment
  fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let uv     = pos.xy / uniforms.resolution;
    // quarterPhase gives a snappy 0→1 pulse each beat
    let flash  = pow(1.0 - uniforms.quarterPhase, 4.0);
    let col    = 0.5 + 0.5 * cos(uniforms.time + uv.xyx + vec3f(0,2,4));
    return vec4f(col * flash, 1.0);
  }
`, { tracker });

tracker.play();
effect.play();
```

### Playlist (beat-anchored scene sequencing)

```ts
import { Playlist, Tracker, ShaderEffect } from '@shaderforge/engine';

const playlist = new Playlist();
playlist
  .add({ fragmentShader: introShaderWGSL,  durationBars: 8  })
  .add({ fragmentShader: mainShaderWGSL,   durationBars: 16 })
  .add({ fragmentShader: outroShaderWGSL,  durationBars: 4  });

// M4: ShaderEffect will accept a playlist and auto-switch shaders at bar boundaries
```

---

## Project Structure

```
shaderforge/
├── ShaderForge.API/              # .NET 9 backend
│   ├── Controllers/              # Shader, User, SiteBackground
│   ├── Data/                     # Interfaces, Models, Services, DTOs
│   └── Program.cs
├── ShaderForge.API.Tests/        # xUnit + Moq tests
├── shaderforge.ui/               # Vue 3 + Vite + Vuetify frontend
│   └── src/
│       ├── features/
│       │   ├── forge/            # Shader editor (Effect View)
│       │   ├── demo/             # Demo / Tracker View  ← M4
│       │   ├── frontpage/        # Community gallery
│       │   ├── auth/             # Login / Register
│       │   └── profile/          # User profile
│       ├── components/           # NavBar, MonacoEditor, …
│       └── services/             # API client
└── shaderforge-engine/         # @shaderforge/engine NPM package
    ├── src/
    │   ├── index.ts              # ShaderEffect, createEffect — public API
    │   ├── passes.ts             # LayerStack, RenderPass, PostFx ping-pong
    │   ├── tracker.ts            # BeatClock, Tracker, Playlist
    │   ├── uniforms.ts           # UniformBuffer (auto-padded, beat uniforms)
    │   └── defaults.ts           # Built-in WGSL shaders + uniform/channel structs
    ├── package.json
    └── tsconfig.json
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| GPU rendering | WebGPU (WGSL) |
| Engine package | TypeScript ESM, zero runtime dependencies |
| Frontend | Vue 3, Vite, Vuetify 3, Monaco Editor |
| Backend | .NET 9, ASP.NET Core, Entity Framework Core |
| Auth | JWT Bearer tokens |
| Database _(M2)_ | PostgreSQL |
| Testing | xUnit + Moq (API), Jest + Vue Test Utils (UI) |

---

## Development Setup

```bash
# Engine package
cd shaderforge-engine && npm install && npm run build

# Backend (uses in-memory stores by default — no database needed)
cd ShaderForge.API && dotnet run

# Frontend
cd shaderforge.ui && npm install && npm run serve
```

### Using a real Neon database locally

By default the API runs with in-memory stores (`RepositoryConfig.Type = "InMemory"`).
To point your local API at a [Neon](https://neon.tech) PostgreSQL database instead:

**Option 1 — .NET User Secrets (recommended, never committed)**

```bash
cd ShaderForge.API
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "<neon-connection-string>"
dotnet user-secrets set "RepositoryConfig:Type" "Database"
```

**Option 2 — `appsettings.Development.json`**

Edit `ShaderForge.API/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require"
  },
  "RepositoryConfig": {
    "Type": "Database"
  }
}
```

> **Warning:** `appsettings.Development.json` is tracked by git.
> Do **not** commit a real connection string — use User Secrets (Option 1) instead.

For **production** deployments see [DEPLOYMENT.md](DEPLOYMENT.md).

---

## License

[MIT](LICENSE)


