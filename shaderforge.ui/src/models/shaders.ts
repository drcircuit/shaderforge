// API Response Types — mirror the camelCase JSON output of ShaderForge.API
export interface ShaderApiResponse {
  id: string;
  name: string;
  vertexShaderCode?: string | null;
  fragmentShaderCode?: string | null;
  computeShaderCode?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  thumbnail?: string | null;
  isPublic: boolean;
  bpm?: number;
  channel0Url?: string | null;
  channel1Url?: string | null;
  channel2Url?: string | null;
  channel3Url?: string | null;
}

// Frontend-Specific Types (uses UI-friendly aliases)
export interface Shader {
  id: string;
  title: string;
  vertexShaderCode?: string | null;
  fragmentShaderCode?: string | null;
  computeShaderCode?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  thumbnailUrl?: string | null;
  isPublic?: boolean;
  bpm?: number;
  channel0Url?: string | null;
  channel1Url?: string | null;
  channel2Url?: string | null;
  channel3Url?: string | null;
}
