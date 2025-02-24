// API Response Types
export interface ShaderApiResponse {
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
}

// Frontend-Specific Types
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
}
