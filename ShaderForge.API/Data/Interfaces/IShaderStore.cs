using ShaderForge.API.Models;

namespace ShaderForge.API.Data.Interfaces
{
    public interface IShaderStore
    {
        Task<IEnumerable<Shader>> GetShadersAsync();
        Task<Shader> GetShaderByIdAsync(string id);
        Task CreateShaderAsync(Shader shader);
    }
}
