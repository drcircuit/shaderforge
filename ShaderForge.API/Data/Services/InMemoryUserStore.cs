using ShaderForge.API.Data.Interfaces;
using ShaderForge.API.Models;
using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;

namespace ShaderForge.API.Data.Services
{
    public class InMemoryUserStore : IUserStore
    {
        private readonly ConcurrentDictionary<string, (ShaderAuthor user, string passwordHash)> _users = new();

        public Task<ShaderAuthor> FindByUsernameAsync(string username)
        {
            _users.TryGetValue(username, out var user);
            return Task.FromResult(user.user);
        }

        public Task<bool> ValidateCredentialsAsync(string username, string password)
        {
            if (_users.TryGetValue(username, out var user))
            {
                var passwordHash = ComputeHash(password);
                return Task.FromResult(user.passwordHash == passwordHash);
            }
            return Task.FromResult(false);
        }

        public Task CreateUserAsync(ShaderAuthor user, string password)
        {
            var passwordHash = ComputeHash(password);
            _users[user.Username] = (user, passwordHash);
            return Task.CompletedTask;
        }

        private static string ComputeHash(string input)
        {
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(input));
            return Convert.ToBase64String(bytes);
        }
    }
}
