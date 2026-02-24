import axios from 'axios';
import { Shader, ShaderApiResponse } from '@/models/shaders';
import { Scene, SceneApiResponse, SceneShaderEntry } from '@/models/scenes';
import { BackgroundImage } from '@/models/background';
import { useAuth } from '@/composables/useAuth';

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;

const mapToShader = (apiShader: ShaderApiResponse): Shader => ({
  id: apiShader.id,
  title: apiShader.name,
  vertexShaderCode: apiShader.vertexShaderCode,
  fragmentShaderCode: apiShader.fragmentShaderCode,
  computeShaderCode: apiShader.computeShaderCode,
  description: apiShader.description,
  createdAt: new Date(apiShader.createdAt).toISOString(),
  updatedAt: new Date(apiShader.updatedAt).toISOString(),
  createdBy: apiShader.createdBy,
  thumbnailUrl: apiShader.thumbnail,
  isPublic: apiShader.isPublic,
  bpm: apiShader.bpm,
  channel0Url: apiShader.channel0Url,
  channel1Url: apiShader.channel1Url,
  channel2Url: apiShader.channel2Url,
  channel3Url: apiShader.channel3Url,
});

/**
 * Fetches the featured shader.
 * @returns A Shader object representing the featured shader.
 */
export const getFeaturedShader = async (): Promise<Shader> => {
  try {
    const response = await axios.get<ShaderApiResponse>(
      `${API_BASE_URL}/Shaders/Featured`
    );
    return mapToShader(response.data);
  } catch (error) {
    console.error('Error fetching featured shader:', error);
    throw new Error('Failed to fetch the featured shader.');
  }
};

/**
 * Fetches the newest shaders.
 * @returns An array of the 10 most recent Shader objects.
 */
export const getNewestShaders = async (): Promise<Shader[]> => {
  try {
    const response = await axios.get<ShaderApiResponse[]>(
      `${API_BASE_URL}/Shaders`
    );
    // Sort by createdAt date descending and take the first 10
    return response.data
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(mapToShader);
  } catch (error) {
    console.error('Error fetching newest shaders:', error);
    throw new Error('Failed to fetch the newest shaders.');
  }
};

/**
 * Fetches the highest-rated shaders.
 * @returns An array of Shader objects representing the highest-rated shaders.
 */
export const getHighestRatedShaders = async (): Promise<Shader[]> => {
  try {
    const response = await axios.get<ShaderApiResponse[]>(
      `${API_BASE_URL}/highestRatedShaders`
    );
    return response.data.map(mapToShader);
  } catch (error) {
    console.error('Error fetching highest-rated shaders:', error);
    throw new Error('Failed to fetch the highest-rated shaders.');
  }
};

/**
 * Fetches the most-viewed shaders.
 * @returns An array of Shader objects representing the most-viewed shaders.
 */
export const getMostViewedShaders = async (): Promise<Shader[]> => {
  try {
    const response = await axios.get<ShaderApiResponse[]>(
      `${API_BASE_URL}/mostViewedShaders`
    );
    return response.data.map(mapToShader);
  } catch (error) {
    console.error('Error fetching most-viewed shaders:', error);
    throw new Error('Failed to fetch the most-viewed shaders.');
  }
};

/**
 * Fetches the available background images.
 * @returns An array of background image URLs.
 */
export const getSiteBackgrounds = async (): Promise<string[]> => {
  try {
    const response = await axios.get<BackgroundImage[]>(
      `${API_BASE_URL}/SiteBackground`
    );
    return response.data.map(bg => `${bg.url}`);
  } catch (error) {
    console.error('Error fetching background images:', error);
    throw new Error('Failed to fetch background images.');
  }
};

export interface CreateShaderPayload {
  name: string;
  fragmentShaderCode?: string;
  vertexShaderCode?: string;
  description?: string;
  bpm?: number;
  isPublic?: boolean;
  channel0Url?: string;
  channel1Url?: string;
  channel2Url?: string;
  channel3Url?: string;
}

/**
 * Creates a new shader. Requires a valid JWT token.
 * @returns The created Shader object.
 */
export const createShader = async (payload: CreateShaderPayload): Promise<Shader> => {
  const { token } = useAuth();
  const response = await axios.post<ShaderApiResponse>(
    `${API_BASE_URL}/shaders`,
    payload,
    { headers: { Authorization: `Bearer ${token.value}` } }
  );
  return mapToShader(response.data);
};

/**
 * Fetches shaders created by a given user.
 */
export const getShadersByCreatedBy = async (createdBy: string): Promise<Shader[]> => {
  const response = await axios.get<ShaderApiResponse[]>(`${API_BASE_URL}/shaders/createdBy/${createdBy}`);
  return response.data.map(mapToShader);
};

// ---------------------------------------------------------------------------
// Scene API
// ---------------------------------------------------------------------------

const mapToScene = (api: SceneApiResponse): Scene => ({
  id: api.id,
  name: api.name,
  shaders: api.shaders ?? [],
  createdBy: api.createdBy,
  createdAt: new Date(api.createdAt).toISOString(),
  updatedAt: new Date(api.updatedAt).toISOString(),
  isPublic: api.isPublic,
});

/**
 * Fetches a shader by its ID.
 */
export const getShaderById = async (id: string): Promise<Shader> => {
  const response = await axios.get<ShaderApiResponse>(`${API_BASE_URL}/shaders/${id}`);
  return mapToShader(response.data);
};
export const getAllScenes = async (): Promise<Scene[]> => {
  const response = await axios.get<SceneApiResponse[]>(`${API_BASE_URL}/scenes`);
  return response.data.map(mapToScene);
};

/**
 * Fetches a scene by its ID.
 */
export const getSceneById = async (id: string): Promise<Scene> => {
  const response = await axios.get<SceneApiResponse>(`${API_BASE_URL}/scenes/${id}`);
  return mapToScene(response.data);
};

/**
 * Fetches scenes created by a given user.
 */
export const getScenesByCreatedBy = async (createdBy: string): Promise<Scene[]> => {
  const response = await axios.get<SceneApiResponse[]>(`${API_BASE_URL}/scenes/createdBy/${createdBy}`);
  return response.data.map(mapToScene);
};

export interface CreateScenePayload {
  name: string;
  shaders?: SceneShaderEntry[];
  isPublic?: boolean;
}

/**
 * Creates a new scene. Requires a valid JWT token.
 */
export const createScene = async (payload: CreateScenePayload): Promise<Scene> => {
  const { token } = useAuth();
  const response = await axios.post<SceneApiResponse>(
    `${API_BASE_URL}/scenes`,
    payload,
    { headers: { Authorization: `Bearer ${token.value}` } },
  );
  return mapToScene(response.data);
};

/**
 * Updates an existing scene. Requires a valid JWT token.
 */
export const updateScene = async (id: string, scene: Scene): Promise<void> => {
  const { token } = useAuth();
  await axios.put(
    `${API_BASE_URL}/scenes/${id}`,
    scene,
    { headers: { Authorization: `Bearer ${token.value}` } },
  );
};

/**
 * Deletes a scene by ID. Requires a valid JWT token.
 */
export const deleteScene = async (id: string): Promise<void> => {
  const { token } = useAuth();
  await axios.delete(
    `${API_BASE_URL}/scenes/${id}`,
    { headers: { Authorization: `Bearer ${token.value}` } },
  );
};
