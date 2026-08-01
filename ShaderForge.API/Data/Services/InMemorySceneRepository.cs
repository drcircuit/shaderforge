using ShaderForge.API.Data.DTO;
using ShaderForge.API.Data.Interfaces;

namespace ShaderForge.API.Data.Services
{
    public class InMemorySceneRepository : ISceneRepository
    {
        private readonly List<Scene> _scenes = new();

        public IEnumerable<Scene> GetAllScenes() => _scenes;

        public Scene? GetSceneById(string id) =>
            _scenes.Find(s => s.Id == id);

        public IEnumerable<Scene> GetScenesByCreatedBy(string createdBy) =>
            _scenes.FindAll(s => s.CreatedBy == createdBy);

        public void AddScene(Scene scene) => _scenes.Add(scene);

        public void UpdateScene(Scene scene)
        {
            var existing = GetSceneById(scene.Id!);
            if (existing != null)
            {
                _scenes.Remove(existing);
                _scenes.Add(scene);
            }
        }

        public void DeleteScene(string id)
        {
            var scene = GetSceneById(id);
            if (scene != null) _scenes.Remove(scene);
        }
    }
}
