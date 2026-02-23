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
        public string? Thumbnail { get; set; }
        public bool IsPublic { get; set; }

        // ShaderLabDX12 project JSON parity fields
        /// <summary>Beats per minute for tracker sync. Matches ShaderLabDX12 BeatClock BPM.</summary>
        [Range(20, 300)]
        public float Bpm { get; set; } = 120f;

        private List<string> _tags = new();
        /// <summary>Searchable tags (e.g. "raymarching", "procedural").</summary>
        public List<string> Tags
        {
            get => _tags;
            set => _tags = value ?? new();
        }

        /// <summary>Visibility: Public, Private, or Unlisted.</summary>
        public ShaderVisibility Visibility { get; set; } = ShaderVisibility.Private;

        /// <summary>Serialised tracker keyframe data (JSON). Mirrors ShaderLabDX12 tracker rows. Max 64 KB.</summary>
        [MaxLength(65536)]
        public string? TrackerDataJson { get; set; }

        /// <summary>Serialised playlist data (JSON). Mirrors ShaderLabDX12 playlist/scene sequence. Max 64 KB.</summary>
        [MaxLength(65536)]
        public string? PlaylistDataJson { get; set; }

        // iChannel hotlinks — users supply external URLs; no media is stored on the platform.
        /// <summary>Hotlink URL for iChannel0 (image texture or audio). Must be an absolute URL.</summary>
        [Url][StringLength(2048)]
        public string? Channel0Url { get; set; }

        /// <summary>Hotlink URL for iChannel1.</summary>
        [Url][StringLength(2048)]
        public string? Channel1Url { get; set; }

        /// <summary>Hotlink URL for iChannel2.</summary>
        [Url][StringLength(2048)]
        public string? Channel2Url { get; set; }

        /// <summary>Hotlink URL for iChannel3.</summary>
        [Url][StringLength(2048)]
        public string? Channel3Url { get; set; }
    }
}