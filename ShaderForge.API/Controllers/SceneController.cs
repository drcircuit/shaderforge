using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShaderForge.API.Data.DTO;
using ShaderForge.API.Data.Interfaces;

namespace ShaderForge.API.Controllers
{
    [ApiController]
    [Route("api/scenes")]
    public class SceneController : ControllerBase
    {
        private readonly ISceneRepository _sceneRepository;

        public SceneController(ISceneRepository sceneRepository)
        {
            _sceneRepository = sceneRepository;
        }

        [HttpGet]
        public ActionResult<IEnumerable<Scene>> GetAllScenes() =>
            Ok(_sceneRepository.GetAllScenes());

        [HttpGet("{id}")]
        public ActionResult<Scene> GetSceneById(string id)
        {
            var scene = _sceneRepository.GetSceneById(id);
            return scene is null ? NotFound() : Ok(scene);
        }

        [HttpGet("createdBy/{createdBy}")]
        public ActionResult<IEnumerable<Scene>> GetScenesByCreatedBy(string createdBy) =>
            Ok(_sceneRepository.GetScenesByCreatedBy(createdBy));

        [Authorize]
        [HttpPost]
        public ActionResult<Scene> CreateScene([FromBody] Scene scene)
        {
            if (scene.Id != null || string.IsNullOrWhiteSpace(scene.Name))
                return BadRequest();

            scene.Id = Guid.NewGuid().ToString();
            scene.CreatedAt = DateTime.UtcNow;
            scene.UpdatedAt = DateTime.UtcNow;
            _sceneRepository.AddScene(scene);
            return CreatedAtAction(nameof(GetSceneById), new { id = scene.Id }, scene);
        }

        [Authorize]
        [HttpPut("{id}")]
        public IActionResult UpdateScene(string id, [FromBody] Scene scene)
        {
            if (id != scene.Id) return BadRequest();
            if (_sceneRepository.GetSceneById(id) is null) return NotFound();
            scene.UpdatedAt = DateTime.UtcNow;
            _sceneRepository.UpdateScene(scene);
            return NoContent();
        }

        [Authorize]
        [HttpDelete("{id}")]
        public IActionResult DeleteScene(string id)
        {
            var scene = _sceneRepository.GetSceneById(id);
            if (scene is null) return NotFound();
            _sceneRepository.DeleteScene(id);
            return NoContent();
        }
    }
}
