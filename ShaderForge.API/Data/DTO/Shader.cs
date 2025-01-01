using System.ComponentModel.DataAnnotations;

namespace ShaderForge.API.Data.DTO
{
    public class Shader
    {
        public string Id { get; set; }
        [Required]
        public string Name { get; set; }
        [Required]
        public string VertexShaderCode { get; set; }
        
        public string FragmentShaderCode { get; set; }
        public string ComputeShaderCode { get; set; }
        public string Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string CreatedBy { get; set; }
    }
}