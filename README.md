# ShaderForge

> A web-based community platform for creating, sharing, and discovering real-time WebGPU shader effects — inspired by the demoscene and the creative coding tradition.

---

## Inspirations

| Project | What we borrow |
|---------|---------------|
| **[ShaderToy](https://www.shadertoy.com)** (Inigo Quilez / Pol Jeremias) | Fragment-shader-first editor, community gallery, forking, built-in uniforms (`iTime`, `iResolution`, `iMouse`) |
| **ShaderLab DX12** (drcircuit) | Desktop demo-tool UX, tracker-synced animation timeline, multi-pass pipeline, audio-reactive uniforms |
| **Demoscene** — Revision, Assembly, pouet.net | 64k/4k effect aesthetics, BPM-synced demos, procedural geometry, signed-distance functions |
| **Notable demosceners** | Inigo Quilez (ray marching, SDFs), Evvvvil (Pouet), Blackle (size-coding), Mercury, Fairlight, Farbrausch |

---

## Vision

ShaderForge is a **browser-first creative coding platform** where artists, game developers, and demosceners can:

- Write WebGPU (WGSL) fragment and vertex shaders directly in the browser
- Preview effects in real-time with a zero-friction editor
- Sync shader parameters to music using a built-in demoscene-style **tracker**
- Share, fork, and comment on community shaders
- Embed live previews anywhere via an `<iframe>` or the `@shaderforge/engine` NPM package

The central design principle is **zero GPU boilerplate**. A web developer should be able to render a fully animated shader in fewer than ten lines of JavaScript without knowing anything about swap chains, bind group layouts, buffer padding, or pipeline descriptors.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   shaderforge.ui                     │
│  Vue 3 + Vuetify · editor · gallery · community      │
│  uses @shaderforge/engine for live preview           │
└────────────────────┬────────────────────────────────┘
                     │ REST / WebSocket
┌────────────────────▼────────────────────────────────┐
│                 ShaderForge.API                      │
│  .NET 9 · shaders · users · comments · thumbnails   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              @shaderforge/engine  (NPM)              │
│  ShaderEffect · Tracker · UniformBuffer              │
│  Pure TypeScript · zero runtime dependencies         │
│  Works in any framework (or vanilla JS)              │
└─────────────────────────────────────────────────────┘
```

---

## Rework Plan & Milestones

### M1 — `@shaderforge/engine` NPM Package _(foundation)_

> All WebGPU complexity lives here so that no other layer needs to touch the GPU API directly.

**Goals**
- `ShaderEffect` class — compile WGSL, render to a `<canvas>`, auto-manage the render loop
- Built-in uniforms auto-injected into every shader: `time`, `resolution`, `mouse`, `frame`
- `setUniform(name, value)` — set any `f32 | vec2 | vec3 | vec4` uniform by name; padding is handled automatically
- Fullscreen-quad vertex shader provided by default (users only write fragment shaders)
- `Tracker` class — demoscene-style BPM timeline with keyframe interpolation; bind any track to a uniform
- Asset channels — bind textures, cubemaps, and audio FFT data to numbered slots without manual bind groups

**Non-goals (hidden complexity)**
- No public `GPUDevice`, `GPUAdapter`, or `GPUCommandEncoder` in the public API
- No manual buffer padding or `@align` annotations for users
- No swap-chain configuration

**Deliverable:** published `@shaderforge/engine` on npm; full TypeScript types; zero-dependency

---

### M2 — Backend API _(community data layer)_

> Persist and serve shaders, user profiles, comments, and thumbnails.

**Goals**
- Replace in-memory stores with a real database (PostgreSQL via Entity Framework Core)
- JWT authentication (`/api/auth/register`, `/api/auth/login`)
- Shader CRUD with ownership and visibility (`public` / `private` / `unlisted`)
- Thumbnail generation endpoint (server-side WebGPU or Playwright screenshot)
- Rate-limiting and basic spam protection
- OpenAPI / Swagger documentation

**Stretch**
- WebSocket channel for live collaborative editing

---

### M3 — Shader Editor _(frontend)_

> The core loop: write → compile → preview.

**Goals**
- Monaco editor with WGSL syntax highlighting and inline error annotations
- Live preview panel powered by `@shaderforge/engine`; recompiles on `Ctrl+R`
- Shader metadata (title, description, tags, visibility)
- Asset tray: drag-and-drop textures/audio onto numbered channels
- Save to profile (authenticated) or local storage (anonymous)
- Forking an existing shader pre-loads its code into the editor

---

### M4 — Tracker & Demo Sync _(demoscene DNA)_

> Bridge the gap between static shader art and time-synced demo effects.

**Goals**
- Visual tracker UI (rows × tracks, like Rocket / GNU Rocket)
- BPM input and metronome playback
- Per-track keyframes with selectable interpolation (linear, smooth-step, constant)
- Bind any track to a named uniform in the active shader
- Export/import tracker data as JSON alongside shader source
- Audio upload: WAV/MP3 plays alongside the demo; beat detection assists BPM setting

---

### M5 — Community Platform _(social layer)_

> Discover and share.

**Goals**
- Public gallery with newest / highest-rated / trending feeds
- User profiles with shader collections
- Comments and reactions on shaders
- Featured shaders curated by admins on the front page
- `<iframe>` embed code for every public shader
- "Inspiration" credits linking back to source shaders when forking

---

## Project Structure

```
shaderforge/
├── ShaderForge.API/          # .NET 9 backend
├── ShaderForge.API.Tests/    # xUnit tests for the API
├── shaderforge.ui/           # Vue 3 frontend (Vite + Vuetify)
├── webgpu-shader-engine/     # @shaderforge/engine NPM package
│   ├── src/
│   │   ├── index.ts          # Public API: ShaderEffect, Tracker, createEffect
│   │   ├── defaults.ts       # Built-in WGSL shaders
│   │   ├── uniforms.ts       # Auto-padded UniformBuffer
│   │   └── tracker.ts        # BPM tracker / keyframe timeline
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

---

## Quick Start — `@shaderforge/engine`

```ts
import { createEffect } from '@shaderforge/engine';

// Render a shader on any <canvas> — no GPU setup required
const effect = await createEffect(document.getElementById('canvas'), `
  @fragment
  fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let uv  = pos.xy / uniforms.resolution;
    let col = 0.5 + 0.5 * cos(uniforms.time + uv.xyx + vec3f(0,2,4));
    return vec4f(col, 1.0);
  }
`);

effect.play();
```

### With tracker sync

```ts
import { createEffect, Tracker } from '@shaderforge/engine';

const tracker = new Tracker({ bpm: 140, rows: 512 });
tracker.track('brightness', [
  { row: 0,   value: 0.0, interpolation: 'linear' },
  { row: 64,  value: 1.0, interpolation: 'smooth' },
  { row: 128, value: 0.2, interpolation: 'constant' },
]);

const effect = await createEffect(canvas, fragmentShaderSource, { tracker });
effect.play();
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| GPU rendering | WebGPU (WGSL) |
| Engine package | TypeScript (ESM, zero deps) |
| Frontend | Vue 3, Vite, Vuetify 3, Monaco Editor |
| Backend | .NET 9, ASP.NET Core, Entity Framework Core |
| Auth | JWT Bearer tokens |
| Database _(M2)_ | PostgreSQL |
| Testing | xUnit + Moq (API), Jest + Vue Test Utils (UI) |

---

## Development Setup

```bash
# Backend
cd ShaderForge.API && dotnet run

# Frontend
cd shaderforge.ui && npm install && npm run serve

# Engine package
cd webgpu-shader-engine && npm install && npm run build
```

---

## License

[MIT](LICENSE)

