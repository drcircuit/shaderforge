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
        public string Thumbnail { get; set; }
        public bool IsPublic { get; set; }

        // ShaderLabDX12 project JSON parity fields
        /// <summary>Beats per minute for tracker sync. Matches ShaderLabDX12 BeatClock BPM.</summary>
        public float Bpm { get; set; } = 120f;
        /// <summary>Searchable tags (e.g. "raymarching", "procedural").</summary>
        public List<string> Tags { get; set; } = new();
        /// <summary>Visibility: Public, Private, or Unlisted.</summary>
        public ShaderVisibility Visibility { get; set; } = ShaderVisibility.Private;
        /// <summary>Serialised tracker keyframe data (JSON). Mirrors ShaderLabDX12 tracker rows.</summary>
        public string TrackerDataJson { get; set; }
        /// <summary>Serialised playlist data (JSON). Mirrors ShaderLabDX12 playlist/scene sequence.</summary>
        public string PlaylistDataJson { get; set; }
    }
}