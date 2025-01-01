import axios from 'axios';
import { ShaderApiResponse, Shader } from '@/models/shaders';

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;

/**
 * Maps the raw API response to the frontend-specific Shader type.
 * @param apiResponse - The raw API response.
 * @returns A Shader object for the frontend.
 */
const mapToShader = (apiResponse: ShaderApiResponse): Shader => {
  return {
    id: apiResponse.id,
    name: apiResponse.name,
    description: apiResponse.description,
    tags: apiResponse.tags,
    author: apiResponse.author,
    imageUrl: apiResponse.image, // Rename for clarity
    likes: apiResponse.likes,
    views: apiResponse.views,
  };
};

/**
 * Fetches the featured shader.
 * @returns A Shader object representing the featured shader.
 */
export const getFeaturedShader = async (): Promise<Shader> => {
  try {
    const response = await axios.get<ShaderApiResponse>(
      `${API_BASE_URL}/featuredShader`
    );
    return mapToShader(response.data);
  } catch (error) {
    console.error('Error fetching featured shader:', error);
    throw new Error('Failed to fetch the featured shader.');
  }
};

/**
 * Fetches the newest shaders.
 * @returns An array of Shader objects representing the newest shaders.
 */
export const getNewestShaders = async (): Promise<Shader[]> => {
  try {
    const response = await axios.get<ShaderApiResponse[]>(
      `${API_BASE_URL}/newestShaders`
    );
    return response.data.map(mapToShader);
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
