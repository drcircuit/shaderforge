import axios from 'axios';
import { Shader, ShaderApiResponse } from '@/models/shaders';
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
 * Fetches a shader by its ID.
 */
export const getShaderById = async (id: string): Promise<Shader> => {
  const response = await axios.get<ShaderApiResponse>(`${API_BASE_URL}/shaders/${id}`);
  return mapToShader(response.data);
};
