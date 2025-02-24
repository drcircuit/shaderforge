namespace ShaderForge.API.Models
{
    public class Shader
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Code { get; set; }
        public ShaderAuthor Author { get; set; }
    }
}
