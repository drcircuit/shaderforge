import { Article } from "@/models/articles";
import { Shader } from "@/models/shaders";

export function getMockFeaturedShader(): Shader {
  return {
    id: "f630ad24-d0f4-4d3e-8f43-0b0c14e4abb2",
    title: "Featured Test Shader",
    vertexShaderCode: null,
    fragmentShaderCode: null,
    computeShaderCode: null,
    description: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "Mock Author",
    thumbnailUrl: "/thumbnails/shader1.jpg"
  };
}

export function getMockNewestShaders(): Shader[] {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `${crypto.randomUUID()}`,
    title: `Whimsical Shader ${i + 1}`,
    vertexShaderCode: null,
    fragmentShaderCode: null,
    computeShaderCode: null,
    description: null,
    createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(), // Each day earlier
    updatedAt: new Date().toISOString(),
    createdBy: `Author ${i + 1}`,
    thumbnailUrl: `/thumbnails/shader${(i % 7) + 1}.jpg`
  }));
}

export function getMockArticles(): Article[] {
  return [
    { id: "101", title: "Intro to WebGPU", url: "https://example.com/webgpu", isExternal: true },
    { id: "102", title: "Shader Optimization Tips", url: "https://example.com/shaders", isExternal: false },
    { id: "103", title: "Advanced GLSL Techniques", url: "https://example.com/glsl", isExternal: true },
  ];
}
