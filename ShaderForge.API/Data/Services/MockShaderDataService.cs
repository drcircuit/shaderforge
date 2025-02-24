using ShaderForge.API.Data.DTO;
using ShaderForge.API.Data.Interfaces;

namespace ShaderForge.API.Data.Services
{
    public class MockShaderDataService : IShaderDataService
    {
        private readonly string thumbnailsFolder = Path.Combine(Directory.GetCurrentDirectory(), "thumbnails");

        public IEnumerable<Shader> GetDefaultShaders()
        {
            var shaders = new List<Shader>();
            var files = Directory.GetFiles(thumbnailsFolder);

            // Generate 10 new shaders
            for (int i = 0; i < 10; i++)
            {
                shaders.Add(new Shader
                {
                    Id = Guid.NewGuid().ToString(),
                    Name = $"Whimsical Shader {i + 1}",
                    CreatedBy = $"Author {i + 1}",
                    CreatedAt = DateTime.Now.AddDays(-i),
                    Thumbnail = Path.GetFileName(files[i % files.Length])
                });
            }

            // Generate 20 old shaders
            for (int i = 0; i < 20; i++)
            {
                shaders.Add(new Shader
                {
                    Id = Guid.NewGuid().ToString(),
                    Name = $"Vintage Shader {i + 1}",
                    CreatedBy = $"Old Author {i + 1}",
                    CreatedAt = DateTime.Now.AddYears(-1).AddDays(-i),
                    Thumbnail = Path.GetFileName(files[i % files.Length])
                });
            }

            return shaders;
        }

        public Shader GetShaderById(string id)
        {
            var shaders = GetDefaultShaders();
            return shaders.FirstOrDefault(shader => shader.Id == id) ?? new Shader();
        }
    }
}
