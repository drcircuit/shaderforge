// API Response Types
export interface ShaderApiResponse {
  id: number;
  name: string;
  description: string;
  tags: string[];
  author: string;
  image: string;
  likes: number;
  views: number;
}

// Frontend-Specific Types
export interface Shader {
  id: number;
  name: string;
  description: string;
  tags: string[];
  author: string;
  imageUrl: string;
  likes: number;
  views: number;
}
