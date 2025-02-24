using ShaderForge.API.Data.DTO;
namespace ShaderForge.API.Data.Interfaces
{
    public interface ITokenService
    {
        string IssueToken(User user);
        bool VerifyToken(string token);
        void RevokeToken(string token);
    }
}
