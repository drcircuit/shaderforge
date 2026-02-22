using ShaderForge.API.Data.DTO;
using ShaderForge.API.Data.Interfaces;
using ShaderForge.API.Models;

namespace ShaderForge.API.Data.Services
{
    public class InMemoryUserService : IUserService
    {
        private readonly IUserStore _userStore;
        private readonly Dictionary<string, User> _userProfiles = new();

        public InMemoryUserService(IUserStore userStore)
        {
            _userStore = userStore;
        }

        public UserServiceResult Register(UserRegistrationDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return new UserServiceResult { Success = false, Errors = new[] { "Username and password are required." } };
            }

            var existing = _userStore.FindByUsernameAsync(dto.Username).Result;
            if (existing != null)
            {
                return new UserServiceResult { Success = false, Errors = new[] { "Username already taken." } };
            }

            var author = new ShaderAuthor { Username = dto.Username, Email = dto.Email };
            _userStore.CreateUserAsync(author, dto.Password).Wait();

            var user = new User
            {
                Id = Guid.NewGuid().ToString(),
                Username = dto.Username,
                Email = dto.Email,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };
            _userProfiles[dto.Username] = user;

            return new UserServiceResult { Success = true, User = user };
        }

        public UserServiceResult Login(UserLoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return new UserServiceResult { Success = false, Errors = new[] { "Username and password are required." } };
            }

            var valid = _userStore.ValidateCredentialsAsync(dto.Username, dto.Password).Result;
            if (!valid)
            {
                return new UserServiceResult { Success = false, Errors = new[] { "Invalid credentials." } };
            }

            _userProfiles.TryGetValue(dto.Username, out var user);
            if (user == null)
            {
                var author = _userStore.FindByUsernameAsync(dto.Username).Result;
                user = new User
                {
                    Id = Guid.NewGuid().ToString(),
                    Username = author?.Username ?? dto.Username,
                    Email = author?.Email ?? string.Empty,
                };
            }

            return new UserServiceResult { Success = true, User = user };
        }

        public UserServiceResult UpdateProfile(UserProfileUpdateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username))
            {
                return new UserServiceResult { Success = false, Errors = new[] { "Username is required." } };
            }

            var author = _userStore.FindByUsernameAsync(dto.Username).Result;
            if (author == null)
            {
                return new UserServiceResult { Success = false, Errors = new[] { "User not found." } };
            }

            author.Email = dto.Email;

            _userProfiles.TryGetValue(dto.Username, out var existing);
            var user = new User
            {
                Id = existing?.Id ?? Guid.NewGuid().ToString(),
                Username = dto.Username,
                Email = dto.Email ?? string.Empty,
                Bio = dto.Bio,
                CreatedAt = existing?.CreatedAt ?? DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };
            _userProfiles[dto.Username] = user;

            return new UserServiceResult { Success = true, User = user };
        }
    }
}
