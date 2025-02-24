using Microsoft.AspNetCore.Mvc;
using ShaderForge.API.Data.DTO;
using ShaderForge.API.Data.Interfaces;

namespace ShaderForge.API.Controllers
{
    [ApiController]
    [Route("api/users")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ITokenService _tokenService;

        public UserController(IUserService userService, ITokenService tokenService)
        {
            _userService = userService;
            _tokenService = tokenService;
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] UserRegistrationDto userRegistrationDto)
        {
            var result = _userService.Register(userRegistrationDto);
            if (!result.Success)
            {
                return BadRequest(result.Errors);
            }
            var token = _tokenService.IssueToken(result.User);
            return Ok(new { User = result.User, Token = token });
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] UserLoginDto userLoginDto)
        {
            var result = _userService.Login(userLoginDto);
            if (!result.Success)
            {
                return Unauthorized(result.Errors);
            }
            var token = _tokenService.IssueToken(result.User);
            return Ok(new { Token = token });
        }

        [HttpPost("logout")]
        public IActionResult Logout([FromBody] string token)
        {
            _tokenService.RevokeToken(token);
            return NoContent();
        }

        [HttpPut("profile")]
        public IActionResult UpdateProfile([FromBody] UserProfileUpdateDto userProfileUpdateDto)
        {
            var result = _userService.UpdateProfile(userProfileUpdateDto);
            if (!result.Success)
            {
                return BadRequest(result.Errors);
            }
            return Ok(result.User);
        }
    }
}
