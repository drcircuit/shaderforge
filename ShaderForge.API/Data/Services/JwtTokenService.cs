using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using ShaderForge.API.Data.DTO;
using ShaderForge.API.Data.Interfaces;

namespace ShaderForge.API.Data.Services
{
    public class JwtTokenService : ITokenService
    {
        private readonly string _issuer;
        private readonly string _audience;
        private readonly byte[] _keyBytes;
        private readonly TimeSpan _tokenLifetime;

        public JwtTokenService(IConfiguration configuration)
        {
            var section = configuration.GetSection("Jwt");
            _issuer = section["Issuer"] ?? "ShaderForge";
            _audience = section["Audience"] ?? "ShaderForgeUsers";
            var secret = section["Secret"] ?? throw new InvalidOperationException("Jwt:Secret is not configured.");
            _keyBytes = Encoding.UTF8.GetBytes(secret);
            var expiryStr = section["ExpiryMinutes"] ?? "60";
            if (!double.TryParse(expiryStr, out var expiryMinutes))
                throw new InvalidOperationException("Jwt:ExpiryMinutes must be a valid number.");
            _tokenLifetime = TimeSpan.FromMinutes(expiryMinutes);
        }

        public string IssueToken(User user)
        {
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            };

            if (!string.IsNullOrEmpty(user.Email))
                claims.Add(new Claim(JwtRegisteredClaimNames.Email, user.Email));

            var key = new SymmetricSecurityKey(_keyBytes);
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _issuer,
                audience: _audience,
                claims: claims,
                expires: DateTime.UtcNow.Add(_tokenLifetime),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public bool VerifyToken(string token)
        {
            if (string.IsNullOrEmpty(token)) return false;

            var handler = new JwtSecurityTokenHandler();
            var validationParams = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(_keyBytes),
                ValidateIssuer = true,
                ValidIssuer = _issuer,
                ValidateAudience = true,
                ValidAudience = _audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero,
            };

            try
            {
                handler.ValidateToken(token, validationParams, out _);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public void RevokeToken(string token)
        {
            // Stateless JWT: revocation is a no-op here.
            // A full implementation would use a token denylist (Redis / DB).
        }
    }
}
