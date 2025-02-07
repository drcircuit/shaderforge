import { Article } from "@/models/articles";
import { Shader } from "@/models/shaders";

export function getMockFeaturedShader():Shader {
  return {
    id: "1",
    name: "Mock Featured Shader",
    description: "A stunning featured shader for design mode.",
    imageUrl: "/assets/images/featured-shader.jpg",
    author: "Mock Author",
    likes: Math.floor(Math.random() * 1000),
    views: Math.floor(Math.random() * 5000),
    tags: []
  };
}

export function getMockNewestShaders():Shader[] {
  return Array.from({ length: 5 }, (_, i) => ({
    id: `${i + 2}`,
    name: `Mock Shader ${i + 1}`,
    author: 'Arne To',
    description: "A randomly generated shader for testing.",
    imageUrl: `/assets/images/shader${(i % 7) + 1}.jpg`,
    likes: Math.floor(Math.random() * 500),
    views: Math.floor(Math.random() * 3000),
    tags: []
  }));
}

export function getMockArticles():Article[] {
  return [
    { id: "101", title: "Intro to WebGPU", url: "https://example.com/webgpu", isExternal: true },
    { id: "102", title: "Shader Optimization Tips", url: "https://example.com/shaders", isExternal: false },
    { id: "103", title: "Advanced GLSL Techniques", url: "https://example.com/glsl", isExternal: true },
  ];
}
