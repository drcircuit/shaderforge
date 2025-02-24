using ShaderForge.API.Data.DTO;

namespace ShaderForge.API.Data.Interfaces
{
    public interface IShaderDataService
    {
        IEnumerable<Shader> GetDefaultShaders();
        Shader GetShaderById(string id); // Added method
    }
}
