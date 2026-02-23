using ShaderForge.API.Data.DTO;
using ShaderForge.API.Data.Interfaces;

namespace ShaderForge.API.Data.Services
{
    public class EFShaderRepository : IShaderRepository
    {
        private readonly ShaderForgeDbContext _db;

        public EFShaderRepository(ShaderForgeDbContext db) => _db = db;

        public IEnumerable<Shader> GetAllShaders() => _db.Shaders.ToList();

        public Shader GetShaderById(string id) => _db.Shaders.Find(id)!;

        public IEnumerable<Shader> GetShadersByCreatedBy(string createdBy) =>
            _db.Shaders.Where(s => s.CreatedBy == createdBy).ToList();

        public void AddShader(Shader shader)
        {
            _db.Shaders.Add(shader);
            _db.SaveChanges();
        }

        public void UpdateShader(Shader shader)
        {
            _db.Shaders.Update(shader);
            _db.SaveChanges();
        }

        public void DeleteShader(string id)
        {
            var shader = _db.Shaders.Find(id);
            if (shader != null)
            {
                _db.Shaders.Remove(shader);
                _db.SaveChanges();
            }
        }
    }
}
