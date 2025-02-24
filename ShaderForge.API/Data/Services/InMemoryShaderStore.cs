using ShaderForge.API.Data.Interfaces;
using ShaderForge.API.Models;
using System.Collections.Concurrent;

namespace ShaderForge.API.Data.Services
{
    public class InMemoryShaderStore : IShaderStore
    {
        private readonly ConcurrentDictionary<string, Shader> _shaders = new();

        public Task<IEnumerable<Shader>> GetShadersAsync()
        {
            return Task.FromResult(_shaders.Values.AsEnumerable());
        }

        public Task<Shader> GetShaderByIdAsync(string id)
        {
            _shaders.TryGetValue(id, out var shader);
            return Task.FromResult(shader);
        }

        public Task CreateShaderAsync(Shader shader)
        {
            shader.Id = Guid.NewGuid().ToString();
            _shaders[shader.Id] = shader;
            return Task.CompletedTask;
        }
    }
}
