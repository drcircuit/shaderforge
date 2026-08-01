using System.ComponentModel.DataAnnotations;

namespace ShaderForge.API.Data.DTO
{
    public enum SceneShaderType
    {
        PixelShader,
        PostFx
    }

    public class SceneShaderEntry
    {
        [Required]
        public string ShaderId { get; set; } = string.Empty;
        public SceneShaderType Type { get; set; } = SceneShaderType.PixelShader;
        public int Order { get; set; }
    }

    public class Scene
    {
        public string? Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
        public List<SceneShaderEntry> Shaders { get; set; } = new();
        public string? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsPublic { get; set; }
    }
}
