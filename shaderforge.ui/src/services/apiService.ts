import axios from 'axios';
import { Shader, ShaderApiResponse } from '@/models/shaders';
import { BackgroundImage } from '@/models/background';

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;

const mapToShader = (apiShader: ShaderApiResponse): Shader => {
  return {
    ...apiShader,
    createdAt: new Date(apiShader.createdAt).toISOString(),
    updatedAt: new Date(apiShader.updatedAt).toISOString(),
  };
};

/**
 * Fetches the featured shader.
 * @returns A Shader object representing the featured shader.
 */
export const getFeaturedShader = async (): Promise<Shader> => {
  try {
    const response = await axios.get<Shader>(
      `${API_BASE_URL}/Shaders/Featured`
    );
    return response.data;
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
    const response = await axios.get<Shader[]>(
      `${API_BASE_URL}/Shaders`
    );
    // Sort by createdAt date descending and take the first 10
    return response.data
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
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
