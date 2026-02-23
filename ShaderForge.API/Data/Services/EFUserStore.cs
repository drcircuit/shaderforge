using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ShaderForge.API.Data.Interfaces;
using ShaderForge.API.Models;

namespace ShaderForge.API.Data.Services
{
    public class EFUserStore : IUserStore
    {
        private readonly ShaderForgeDbContext _db;
        private readonly IPasswordHasher<string> _hasher = new PasswordHasher<string>();

        public EFUserStore(ShaderForgeDbContext db) => _db = db;

        public async Task<ShaderAuthor> FindByUsernameAsync(string username)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == username);
            return user == null ? null! : new ShaderAuthor { Username = user.Username, Email = user.Email ?? string.Empty };
        }

        public async Task<bool> ValidateCredentialsAsync(string username, string password)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null) return false;
            var result = _hasher.VerifyHashedPassword(username, user.PasswordHash, password);
            return result != PasswordVerificationResult.Failed;
        }

        public async Task CreateUserAsync(ShaderAuthor author, string password)
        {
            var user = new AppUser
            {
                Id = Guid.NewGuid().ToString(),
                Username = author.Username,
                Email = author.Email,
                PasswordHash = _hasher.HashPassword(author.Username, password),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
        }
    }
}

