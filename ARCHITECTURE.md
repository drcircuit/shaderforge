# ShaderForge — Architecture & Roadmap

> This document defines the long-term architecture, component breakdown, and open work items for ShaderForge — the browser-native counterpart to [ShaderLabDX12](https://github.com/drcircuit/ShaderLabDX12).

---

## 1. Component Model

ShaderForge is split into five clearly-separated layers:

```
┌────────────────────────────────────────────────────────────┐
│                     ShaderForgePortal                      │
│   Vue 3 + Vuetify · Effect View / Demo View / Community   │
└─────────────────────────┬──────────────────────────────────┘
                          │ REST / WebSocket
┌─────────────────────────▼──────────────────────────────────┐
│                     ShaderForgeAPI                         │
│   .NET 9 · Auth · Shader CRUD · Storage · Moderation      │
└────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│   @shaderforge/engine  (NPM — ShaderForgeEngine)            │
│   WebGPU boilerplate · UniformBuffer · LayerStack           │
│   ResizeObserver · pointer tracking · compile pipeline      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│   @shaderforge/player  (NPM — ShaderForgePlayer)            │
│   BeatClock · Tracker · Playlist · music sync              │
│   beat-anchored shader swapping · transition effects        │
└─────────────────────────────────────────────────────────────┘
```

### 1.1 ShaderForgeEngine (`@shaderforge/engine`)

Pure WebGPU abstraction. **Zero runtime dependencies.** Users should be able to run a fully animated shader with no knowledge of swap-chains, bind-group layouts, or pipeline descriptors.

| ShaderLabDX12 concept | Engine equivalent |
|----------------------|-------------------|
| `DXContext` / swap-chain | Hidden inside `ShaderEffect.create()` |
| Root signature bindings | `BUILTIN_UNIFORMS_WGSL` + `CHANNEL_BINDINGS_WGSL` auto-prepended |
| `BuiltinUniforms` struct | `UniformBuffer` auto-pads and uploads each frame |
| `TextureBinding` / `t0..t3` | `iChannel0..3` via `LayerStack` ping-pong |
| `Scene` + `postFxChain` | `LayerStack.scene()` + `.postFx()` |

**Current status:** M1 complete (see `shaderforge-engine/`). Exports `ShaderEffect`, `LayerStack`, `createEffect`, `UniformBuffer`, `DEFAULT_FRAGMENT_WGSL`, `DEFAULT_VERTEX_WGSL`, `BUILTIN_UNIFORMS_WGSL`, `CHANNEL_BINDINGS_WGSL`.

### 1.2 ShaderForgePlayer (`@shaderforge/player`)

Beat-sync and playback orchestration. Currently lives inside `@shaderforge/engine`; should be extracted into its own package.

| ShaderLabDX12 concept | Player equivalent |
|----------------------|-------------------|
| `AudioSystem` | `<audio>` + Web Audio API; BPM input |
| `BeatClock` | `BeatClock` class (ported from `src/audio/BeatClock.cpp`) |
| Tracker timeline | `Tracker` class (GNU-Rocket style, keyframe interpolation) |
| Playlist / scene sequencing | `Playlist` class (beat-anchored transitions) |

**Current status:** Implemented inside `shaderforge-engine/src/tracker.ts` and re-exported from `@shaderforge/engine`. **Needs extraction** into `@shaderforge/player`.

### 1.3 ShaderForgePortal

Vue 3 + Vite + Vuetify frontend. Three main views:

| View | ShaderLabDX12 equivalent | Status |
|------|--------------------------|--------|
| **Effect View** (`/forge/new`) | Effect View (ImGui shader editor) | Partial (M3) — Monaco + canvas preview wired to `@shaderforge/engine` |
| **Demo View** (`/demo`) | Demo View (tracker timeline + transport) | Partial (M4) — transport bar, row-grid, value inspector |
| **Community Gallery** (`/`) | — (web-only) | Partial — static layout |
| **Profile** (`/profile`) | — (web-only) | Stub |

### 1.4 ShaderForgeAPI

.NET 9 ASP.NET Core — the contract layer between Portal and Backend.

- JWT authentication endpoints (`/api/auth/register`, `/api/auth/login`)
- Shader CRUD with `ShaderVisibility` (`Public` / `Private` / `Unlisted`)
- Project JSON schema (`Bpm`, `TrackerDataJson`, `PlaylistDataJson`, `Tags`)
- Thumbnail endpoints
- Currently uses **in-memory stores** (no database yet)

### 1.5 ShaderForgeBackend

Persistent storage and services behind the API. **Not yet implemented.**

- PostgreSQL via Entity Framework Core
- Asset storage (textures, audio)
- User management and onboarding
- Moderation queue

---

## 2. WebGPU / WGSL vs DirectX12 / HLSL Differences

ShaderForge targets WebGPU + WGSL, not DX12 + HLSL. The shader authoring experience should be _identical_ to ShaderLabDX12, but these fundamental differences are embraced:

| Concept | ShaderLabDX12 (HLSL/DX12) | ShaderForge (WGSL/WebGPU) |
|---------|--------------------------|--------------------------|
| Shader language | HLSL | WGSL |
| Texture registers | `Texture2D t0 : register(t0)` | `@group(0) @binding(1) var iChannel0 : texture_2d<f32>` |
| Sampler state | Separate `SamplerState` | Combined in `var iChannel0Sampler : sampler` |
| Root signature / bind groups | Root signature + descriptor tables | Bind group layouts (auto-managed by engine) |
| Compute shaders | Full DX12 compute pipeline | WebGPU compute pipelines (future) |
| Vertex buffers | Explicit VB/IB | Index-driven fullscreen quad (no VB needed for 2D effects) |
| `SV_DispatchThreadID` | Yes | `@builtin(global_invocation_id)` |
| Push constants | Root constants | Not directly supported; use uniform buffer |
| Tessellation | Supported | Not supported in WebGPU (by design) |
| Wave/quad intrinsics | HLSL intrinsics | Limited WebGPU subgroup support (future) |

**Key built-in uniforms (auto-injected into every shader):**

```wgsl
struct BuiltinUniforms {
  time           : f32,   // seconds since effect start
  frame          : u32,   // frame counter
  resolution     : vec2f, // viewport size in pixels
  mouse          : vec2f, // pointer position in pixels
  bpm            : f32,
  beat           : f32,   // absolute beat (fractional)
  barProgress    : f32,   // 0→1 progress within the current bar
  quarterPhase   : f32,   // 0→1 phase within a quarter note
  eighthPhase    : f32,   // 0→1 phase within an eighth note
  sixteenthPhase : f32,   // 0→1 phase within a sixteenth note
}
@group(0) @binding(0) var<uniform> uniforms : BuiltinUniforms;
```

---

## 3. Community Platform Design

### 3.1 Asset Storage Strategy

The preferred model is **link-in, not host**: users provide their own storage (similar to ShaderToy's texture channel system). ShaderForge stores only the URL.

- **Textures / images**: Users provide a URL to a publicly accessible image. ShaderForge fetches it at render time via CORS. This transfers copyright responsibility to the user.
- **Audio**: Same pattern — URL to audio file or embed from SoundCloud / Bandcamp. The user asserts they have the rights.

If direct uploads are supported in the future:
- Max file size per upload: **10 MB**
- Total storage per free account: **50 MB**
- Accepted formats: PNG, JPEG, WebP (textures); MP3, OGG, WAV (audio)
- All uploads are scanned for MIME-type spoofing; compressed on ingest (WebP for images)

### 3.2 Copyright & Content Policy

- Users must agree to Terms of Use asserting they own or have licensed all uploaded/linked assets.
- DMCA takedown workflow: dedicated `/api/moderation/dmca` endpoint.
- Audio URL linking (e.g., pointing to a Spotify CDN URL) is blocked by a denylist; only publicly shareable/embeddable URLs are permitted.

### 3.3 Comments & Moderation

Comments are a high-risk feature. The plan:

1. **Pre-moderation queue** for all new comments (held for human or automated review before publishing).
2. **Automated filtering** via a profanity / spam classifier (e.g., OpenAI Moderation API or a local model).
3. **Community flagging**: any user can flag a comment; flagged comments are held pending review.
4. **Trusted-user fast-path**: comments from users above a reputation threshold skip the queue.
5. **Rate limiting**: max 5 comments per user per hour; IP-based throttling.

### 3.4 Engagement Features

| Feature | Notes |
|---------|-------|
| ❤️ Likes | Per-shader, per-user. No negative votes. |
| 👏 Claps / Creds | Inspired by Medium Claps — stackable applause (up to 50 per user per shader) |
| 💬 Comments | Pre-moderated thread per shader |
| 🔀 Fork | Clone a shader into own profile; back-link to original preserved |
| 📌 Featured | Admin-curated front-page features |
| `<iframe>` Embed | Shareable embed code for every public shader |

---

## 4. Milestone Status

| Milestone | Status | Notes |
|-----------|--------|-------|
| M1 — `@shaderforge/engine` | ✅ Done | `shaderforge-engine/` — `ShaderEffect`, `LayerStack`, `UniformBuffer`, built-in uniforms |
| M2 — Backend API (DTO/schema) | ✅ Done | Shader CRUD, User auth endpoints; `IUserService` + `ITokenService` implemented; in-memory stores |
| M3 — Effect View | ✅ Done | Monaco editor + canvas preview; save to API (authenticated) or localStorage (anonymous) |
| M4 — Demo View (Tracker UI) | 🟡 Partial | Transport bar + row grid + inspector; audio upload not yet implemented |
| M5 — Scene View (LayerStack) | ✅ Done | `LayerStack` API complete; full Scene/PostFX/Transition layer editor in portal (`ScenePage.vue`) |
| M6 — Community Platform | 🟡 Partial | FrontPage fetches real shader feed from API; gallery stubs exist; no real data layer |
| Player Package Split | ❌ Not started | BeatClock/Tracker/Playlist to be extracted to `@shaderforge/player` |
| Database (PostgreSQL + EF Core) | ❌ Not started | |
| JWT Authentication | ✅ Done | `JwtTokenService` issues signed JWT tokens; Bearer auth middleware wired in `Program.cs`; write endpoints protected with `[Authorize]`; `useAuth` composable persists token in localStorage |
| Asset Management | ❌ Not started | Link-in model planned |
| Comment Moderation | ❌ Not started | |

---

## 5. Development Setup

```bash
# 1. Build the engine package first (required for UI)
cd shaderforge-engine
npm install
npm run build

# 2. Start the backend
cd ../ShaderForge.API
dotnet run

# 3. Start the frontend (in a separate terminal)
cd ../shaderforge.ui
npm install   # installs @shaderforge/engine from ../shaderforge-engine
npm run serve
```

> **Note:** `@shaderforge/engine` is referenced as a local `file:` dependency in `shaderforge.ui/package.json`. You must run `npm run build` in `shaderforge-engine/` before `npm install` in `shaderforge.ui/` to ensure the compiled `dist/` output is available. A `postinstall` hook or monorepo tooling (e.g., `npm workspaces`) is on the roadmap for a smoother DX.

---

## 6. Open Issues / Next Steps

See the repository issues for tracked work items. Key upcoming tasks:

- **Extract `@shaderforge/player`** — split BeatClock / Tracker / Playlist out of `@shaderforge/engine` into its own NPM package
- **PostgreSQL backend** — replace in-memory stores with EF Core + PostgreSQL
- **JWT auth** — implement `/api/auth/register` and `/api/auth/login`
- **Monaco WGSL syntax highlighting** — add a WGSL TextMate grammar or language service
- **Inline error squiggles** — map GPU compile error line/column back to Monaco markers
- **Audio upload + BPM detection** — WAV/MP3 upload, Web Audio API playback synced to tracker
- **LayerStack portal UI** — Scene View panel in the Portal (multi-pass layer editor)
- **Asset channel tray** — drag-and-drop textures/audio onto `iChannel0..3`
- **Community gallery** — real paginated feed from API with sorting (newest / top / trending)
- **Comment system** — threaded comments with pre-moderation queue
- **Claps / Likes / Fork** — engagement features
- **Thumbnail generation** — Playwright screenshot on shader save
