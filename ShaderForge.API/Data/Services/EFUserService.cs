using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ShaderForge.API.Data.DTO;
using ShaderForge.API.Data.Interfaces;

namespace ShaderForge.API.Data.Services
{
    public class EFUserService : IUserService
    {
        private readonly ShaderForgeDbContext _db;
        private readonly IPasswordHasher<string> _hasher = new PasswordHasher<string>();

        public EFUserService(ShaderForgeDbContext db) => _db = db;

        public async Task<UserServiceResult> Register(UserRegistrationDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
                return Fail("Username and password are required.");

            if (await _db.Users.AnyAsync(u => u.Username == dto.Username))
                return Fail("Username already taken.");

            var appUser = new AppUser
            {
                Id = Guid.NewGuid().ToString(),
                Username = dto.Username,
                Email = dto.Email ?? string.Empty,
                PasswordHash = _hasher.HashPassword(dto.Username, dto.Password),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };
            _db.Users.Add(appUser);
            await _db.SaveChangesAsync();

            return new UserServiceResult { Success = true, User = Map(appUser) };
        }

        public async Task<UserServiceResult> Login(UserLoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
                return Fail("Username and password are required.");

            var appUser = await _db.Users.FirstOrDefaultAsync(u => u.Username == dto.Username);
            if (appUser == null) return Fail("Invalid credentials.");

            var result = _hasher.VerifyHashedPassword(dto.Username, appUser.PasswordHash, dto.Password);
            if (result == PasswordVerificationResult.Failed)
                return Fail("Invalid credentials.");

            return new UserServiceResult { Success = true, User = Map(appUser) };
        }

        public async Task<UserServiceResult> UpdateProfile(UserProfileUpdateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username))
                return Fail("Username is required.");

            var appUser = await _db.Users.FirstOrDefaultAsync(u => u.Username == dto.Username);
            if (appUser == null)
                return Fail("User not found.");

            appUser.Email = dto.Email ?? appUser.Email;
            appUser.Bio = dto.Bio;
            appUser.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return new UserServiceResult { Success = true, User = Map(appUser) };
        }

        private static User Map(AppUser u) => new()
        {
            Id = u.Id,
            Username = u.Username,
            Email = u.Email,
            Bio = u.Bio,
            CreatedAt = u.CreatedAt,
            UpdatedAt = u.UpdatedAt,
        };

        private static UserServiceResult Fail(string error) =>
            new() { Success = false, Errors = new[] { error } };
    }
}

