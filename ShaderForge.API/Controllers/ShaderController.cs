using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShaderForge.API.Data.Models;
using System.Collections.Generic;
using System.Linq;
using ShaderForge.API.Data.Interfaces;
using ShaderForge.API.Data.DTO;

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

        [HttpGet("default")]
        public ActionResult<IEnumerable<Shader>> GetDefaultShaders()
        {
            var shaders = _shaderRepository.GetAllShaders();
            return Ok(shaders);
        }

        [HttpGet("public")]
        public ActionResult<IEnumerable<Shader>> GetPublicShaders()
        {
            var shaders = _shaderRepository.GetAllShaders().Where(s => s.IsPublic);
            return Ok(shaders);
        }

        [Authorize]
        [HttpPost]
        public ActionResult<Shader> CreateShader([FromBody] Shader shader)
        {
            if (shader.Id != null || string.IsNullOrWhiteSpace(shader.Name))
            {
                return BadRequest();
            }
            shader.Id = System.Guid.NewGuid().ToString();
            shader.CreatedAt = System.DateTime.Now;
            shader.UpdatedAt = System.DateTime.Now;
            shader.IsPublic = shader.Visibility == ShaderVisibility.Public;
            _shaderRepository.AddShader(shader);
            return CreatedAtAction(nameof(GetShaderById), new { id = shader.Id }, shader);
        }

        [Authorize]
        [HttpPut("{id}")]
        public IActionResult UpdateShader(string id, [FromBody] Shader shader)
        {
            if (id != shader.Id)
            {
                return BadRequest();
            }
            shader.UpdatedAt = System.DateTime.Now;
            shader.IsPublic = shader.Visibility == ShaderVisibility.Public;
            _shaderRepository.UpdateShader(shader);
            return NoContent();
        }

        [Authorize]
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