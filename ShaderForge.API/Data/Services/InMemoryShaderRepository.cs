using ShaderForge.API.Data.Interfaces;
using ShaderForge.API.Data.DTO;

namespace ShaderForge.API.Data.Services
{
    public class InMemoryShaderRepository : IShaderRepository
    {
        private readonly List<Shader> _shaders;

        public InMemoryShaderRepository(IShaderDataService shaderDataService)
        {
            _shaders = shaderDataService.GetDefaultShaders().ToList();
        }

        public IEnumerable<Shader> GetAllShaders()
        {
            return _shaders;
        }

        public Shader GetShaderById(string id)
        {
            return _shaders.Find(shader => shader.Id == id)!;
        }

        public IEnumerable<Shader> GetShadersByCreatedBy(string createdBy)
        {
            return _shaders.FindAll(shader => shader.CreatedBy == createdBy);
        }   
        public void AddShader(Shader shader)
        {
            _shaders.Add(shader);
        }

        public void UpdateShader(Shader shader)
        {
            var existingShader = GetShaderById(shader.Id);
            if (existingShader != null)
            {
                _shaders.Remove(existingShader);
                _shaders.Add(shader);
            }
        }

        public void DeleteShader(string id)
        {
            var shader = GetShaderById(id);
            if (shader != null)
            {
                _shaders.Remove(shader);
            }
        }
    }
}