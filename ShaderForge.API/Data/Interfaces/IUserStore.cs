using ShaderForge.API.Models;

namespace ShaderForge.API.Data.Interfaces
{
    public interface IUserStore
    {
        Task<ShaderAuthor> FindByUsernameAsync(string username);
        Task<bool> ValidateCredentialsAsync(string username, string password);
        Task CreateUserAsync(ShaderAuthor user, string password);
    }
}
