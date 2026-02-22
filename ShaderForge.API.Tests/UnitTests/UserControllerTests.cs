using Xunit;
using FluentAssertions;
using Moq;
using ShaderForge.API.Data.Interfaces;
using ShaderForge.API.Data.DTO;
using ShaderForge.API.Controllers;
using Microsoft.AspNetCore.Mvc;

namespace ShaderForge.API.Tests.UnitTests
{
    public class UserControllerTests
    {
        private static Mock<IUserService> MakeUserServiceMock() => new Mock<IUserService>();
        private static Mock<ITokenService> MakeTokenServiceMock() => new Mock<ITokenService>();

        [Fact]
        public void Register_ShouldReturnOk_WhenRegistrationSucceeds()
        {
            var dto = new UserRegistrationDto { Username = "alice", Password = "pass", Email = "alice@example.com" };
            var user = new User { Id = Guid.NewGuid().ToString(), Username = "alice" };

            var userServiceMock = MakeUserServiceMock();
            userServiceMock.Setup(x => x.Register(dto)).Returns(new UserServiceResult { Success = true, User = user });

            var tokenServiceMock = MakeTokenServiceMock();
            tokenServiceMock.Setup(x => x.IssueToken(user)).Returns("tok123");

            var controller = new UserController(userServiceMock.Object, tokenServiceMock.Object);
            var result = controller.Register(dto) as OkObjectResult;

            result.Should().NotBeNull();
        }

        [Fact]
        public void Register_ShouldReturnBadRequest_WhenRegistrationFails()
        {
            var dto = new UserRegistrationDto { Username = "alice", Password = "pass" };

            var userServiceMock = MakeUserServiceMock();
            userServiceMock.Setup(x => x.Register(dto))
                .Returns(new UserServiceResult { Success = false, Errors = new[] { "Username already taken." } });

            var tokenServiceMock = MakeTokenServiceMock();
            var controller = new UserController(userServiceMock.Object, tokenServiceMock.Object);

            var result = controller.Register(dto) as BadRequestObjectResult;

            result.Should().NotBeNull();
        }

        [Fact]
        public void Login_ShouldReturnOk_WhenCredentialsAreValid()
        {
            var dto = new UserLoginDto { Username = "alice", Password = "pass" };
            var user = new User { Id = Guid.NewGuid().ToString(), Username = "alice" };

            var userServiceMock = MakeUserServiceMock();
            userServiceMock.Setup(x => x.Login(dto)).Returns(new UserServiceResult { Success = true, User = user });

            var tokenServiceMock = MakeTokenServiceMock();
            tokenServiceMock.Setup(x => x.IssueToken(user)).Returns("tok456");

            var controller = new UserController(userServiceMock.Object, tokenServiceMock.Object);
            var result = controller.Login(dto) as OkObjectResult;

            result.Should().NotBeNull();
        }

        [Fact]
        public void Login_ShouldReturnUnauthorized_WhenCredentialsAreInvalid()
        {
            var dto = new UserLoginDto { Username = "alice", Password = "wrong" };

            var userServiceMock = MakeUserServiceMock();
            userServiceMock.Setup(x => x.Login(dto))
                .Returns(new UserServiceResult { Success = false, Errors = new[] { "Invalid credentials." } });

            var tokenServiceMock = MakeTokenServiceMock();
            var controller = new UserController(userServiceMock.Object, tokenServiceMock.Object);

            var result = controller.Login(dto) as UnauthorizedObjectResult;

            result.Should().NotBeNull();
        }

        [Fact]
        public void Logout_ShouldReturnNoContent()
        {
            var tokenServiceMock = MakeTokenServiceMock();
            tokenServiceMock.Setup(x => x.RevokeToken(It.IsAny<string>()));

            var controller = new UserController(MakeUserServiceMock().Object, tokenServiceMock.Object);
            var result = controller.Logout("tok123") as NoContentResult;

            result.Should().NotBeNull();
            tokenServiceMock.Verify(x => x.RevokeToken("tok123"), Times.Once);
        }

        [Fact]
        public void UpdateProfile_ShouldReturnOk_WhenUpdateSucceeds()
        {
            var dto = new UserProfileUpdateDto { Username = "alice", Email = "new@example.com", Bio = "Hello" };
            var user = new User { Id = Guid.NewGuid().ToString(), Username = "alice", Email = "new@example.com", Bio = "Hello" };

            var userServiceMock = MakeUserServiceMock();
            userServiceMock.Setup(x => x.UpdateProfile(dto)).Returns(new UserServiceResult { Success = true, User = user });

            var controller = new UserController(userServiceMock.Object, MakeTokenServiceMock().Object);
            var result = controller.UpdateProfile(dto) as OkObjectResult;

            result.Should().NotBeNull();
            (result!.Value as User)!.Username.Should().Be("alice");
        }

        [Fact]
        public void UpdateProfile_ShouldReturnBadRequest_WhenUpdateFails()
        {
            var dto = new UserProfileUpdateDto { Username = "unknown" };

            var userServiceMock = MakeUserServiceMock();
            userServiceMock.Setup(x => x.UpdateProfile(dto))
                .Returns(new UserServiceResult { Success = false, Errors = new[] { "User not found." } });

            var controller = new UserController(userServiceMock.Object, MakeTokenServiceMock().Object);
            var result = controller.UpdateProfile(dto) as BadRequestObjectResult;

            result.Should().NotBeNull();
        }
    }
}
