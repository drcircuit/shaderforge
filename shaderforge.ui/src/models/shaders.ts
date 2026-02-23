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
  thumbnail: string;
  isPublic: boolean;
  bpm?: number;
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
  thumbnailUrl: string;
  isPublic?: boolean;
  bpm?: number;
}
