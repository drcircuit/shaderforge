using ShaderForge.API.Data.DTO;

namespace ShaderForge.API.Data.Interfaces
{
    public interface IShaderRepository
    {
        Shader GetShaderById(string id);
        IEnumerable<Shader> GetShadersByCreatedBy(string createdBy);
        IEnumerable<Shader> GetAllShaders();
        void AddShader(Shader shader);
        void UpdateShader(Shader shader);
        void DeleteShader(string id);
    }
    
    
}