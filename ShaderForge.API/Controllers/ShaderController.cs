using Microsoft.AspNetCore.Mvc;
using ShaderForge.API.Data.DTO;
using ShaderForge.API.Data.Interfaces;
using System.Collections.Generic;

namespace ShaderForge.API.Controllers
{
    [ApiController]
    [Route("api/shaders")]
    public class ShaderController : ControllerBase
    {
        private readonly IShaderRepository _shaderRepository;

        public ShaderController(IShaderRepository shaderRepository)
        {
            _shaderRepository = shaderRepository;
        }

        [HttpGet]
        public ActionResult<IEnumerable<Shader>> GetAllShaders()
        {
            var shaders = _shaderRepository.GetAllShaders();
            return Ok(shaders);
        }

        [HttpGet("{id}")]
        public ActionResult<Shader> GetShaderById(string id)
        {
            var shader = _shaderRepository.GetShaderById(id);
            if (shader == null)
            {
                return NotFound();
            }
            return Ok(shader);
        }

        [HttpGet("createdBy/{createdBy}")]
        public ActionResult<IEnumerable<Shader>> GetShadersByCreatedBy(string createdBy)
        {
            var shaders = _shaderRepository.GetShadersByCreatedBy(createdBy);
            return Ok(shaders);
        }
        // requires logged in user to work

        [HttpPost]
        public ActionResult<Shader> CreateShader([FromBody] Shader shader)
        {
            // check if id is set, if set return bad request
            if (shader.Id != null)
            {
                return BadRequest();
            }
            // give shader a new id
            shader.Id = System.Guid.NewGuid().ToString();
            // set dates
            shader.CreatedAt = System.DateTime.Now;
            shader.UpdatedAt = System.DateTime.Now;
            _shaderRepository.AddShader(shader);
            return CreatedAtAction(nameof(GetShaderById), new { id = shader.Id }, shader);
        }

        [HttpPut("{id}")]
        public IActionResult UpdateShader(string id, [FromBody] Shader shader)
        {
            if (id != shader.Id)
            {
                return BadRequest();
            }
            // update date
            shader.UpdatedAt = System.DateTime.Now;
            _shaderRepository.UpdateShader(shader);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteShader(string id)
        {
            var shader = _shaderRepository.GetShaderById(id);
            if (shader == null)
            {
                return NotFound();
            }

            _shaderRepository.DeleteShader(id);
            return NoContent();
        }
    }
}