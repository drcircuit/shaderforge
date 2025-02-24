using ShaderForge.API.Data.DTO;

namespace ShaderForge.API.Data.Interfaces
{
    public interface IUserService
    {
        UserServiceResult Register(UserRegistrationDto userRegistrationDto);
        UserServiceResult Login(UserLoginDto userLoginDto);
        UserServiceResult UpdateProfile(UserProfileUpdateDto userProfileUpdateDto);
    }
}
