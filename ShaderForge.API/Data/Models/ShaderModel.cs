namespace ShaderForge.API.Data.Models
{
    public class ShaderModel
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string VertexShaderCode { get; set; }
        public string FragmentShaderCode { get; set; }
        public string ComputeShaderCode { get; set; }
        public string Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string CreatedBy { get; set; }
        public string ThumbnailUrl { get; set; }
    }
}
