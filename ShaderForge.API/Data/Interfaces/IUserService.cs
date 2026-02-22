using ShaderForge.API.Data.DTO;

namespace ShaderForge.API.Data.Interfaces
{
    public interface IUserService
    {
        Task<UserServiceResult> Register(UserRegistrationDto userRegistrationDto);
        Task<UserServiceResult> Login(UserLoginDto userLoginDto);
        Task<UserServiceResult> UpdateProfile(UserProfileUpdateDto userProfileUpdateDto);
    }
}
