// Scene data model — mirrors the Scene DTO from ShaderForge.API.

export type SceneShaderType = 'PixelShader' | 'PostFx';

export interface SceneShaderEntry {
  shaderId: string;
  type: SceneShaderType;
  order: number;
}

export interface SceneApiResponse {
  id: string;
  name: string;
  shaders: SceneShaderEntry[];
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
}

export interface Scene {
  id: string;
  name: string;
  shaders: SceneShaderEntry[];
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
}
