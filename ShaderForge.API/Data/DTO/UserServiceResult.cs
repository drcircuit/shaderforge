namespace ShaderForge.API.Data.DTO
{
    public class UserServiceResult
    {
        public bool Success { get; set; }
        public string[] Errors { get; set; }
        public User User { get; set; }
        public string Token { get; set; }
    }
}
