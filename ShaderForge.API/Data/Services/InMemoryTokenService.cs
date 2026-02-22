using System.Collections.Concurrent;
using ShaderForge.API.Data.DTO;
using ShaderForge.API.Data.Interfaces;

namespace ShaderForge.API.Data.Services
{
    public class InMemoryTokenService : ITokenService
    {
        private readonly ConcurrentDictionary<string, User> _activeTokens = new();

        public string IssueToken(User user)
        {
            var token = Guid.NewGuid().ToString("N");
            _activeTokens[token] = user;
            return token;
        }

        public bool VerifyToken(string token)
        {
            return !string.IsNullOrEmpty(token) && _activeTokens.ContainsKey(token);
        }

        public void RevokeToken(string token)
        {
            if (!string.IsNullOrEmpty(token))
            {
                _activeTokens.TryRemove(token, out _);
            }
        }
    }
}
