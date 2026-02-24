using ShaderForge.API.Data.DTO;

namespace ShaderForge.API.Data.Interfaces
{
    public interface ISceneRepository
    {
        Scene? GetSceneById(string id);
        IEnumerable<Scene> GetScenesByCreatedBy(string createdBy);
        IEnumerable<Scene> GetAllScenes();
        void AddScene(Scene scene);
        void UpdateScene(Scene scene);
        void DeleteScene(string id);
    }
}
