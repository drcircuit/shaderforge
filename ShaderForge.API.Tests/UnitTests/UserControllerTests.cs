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
        public async Task Register_ShouldReturnOkWithUserAndToken_WhenRegistrationSucceeds()
        {
            var dto = new UserRegistrationDto { Username = "alice", Password = "pass", Email = "alice@example.com" };
            var user = new User { Id = Guid.NewGuid().ToString(), Username = "alice" };

            var userServiceMock = MakeUserServiceMock();
            userServiceMock.Setup(x => x.Register(dto)).ReturnsAsync(new UserServiceResult { Success = true, User = user });

            var tokenServiceMock = MakeTokenServiceMock();
            tokenServiceMock.Setup(x => x.IssueToken(It.IsAny<User>())).Returns("tok123");

            var controller = new UserController(userServiceMock.Object, tokenServiceMock.Object);
            var result = await controller.Register(dto) as OkObjectResult;

            result.Should().NotBeNull();
            var json = System.Text.Json.JsonSerializer.Serialize(result!.Value);
            var doc = System.Text.Json.JsonDocument.Parse(json);
            doc.RootElement.GetProperty("Token").GetString().Should().Be("tok123");
            doc.RootElement.GetProperty("User").GetProperty("Username").GetString().Should().Be("alice");
            tokenServiceMock.Verify(x => x.IssueToken(user), Times.Once);
        }

        [Fact]
        public async Task Register_ShouldReturnBadRequest_WhenRegistrationFails()
        {
            var dto = new UserRegistrationDto { Username = "alice", Password = "pass" };

            var userServiceMock = MakeUserServiceMock();
            userServiceMock.Setup(x => x.Register(dto))
                .ReturnsAsync(new UserServiceResult { Success = false, Errors = new[] { "Username already taken." } });

            var tokenServiceMock = MakeTokenServiceMock();
            var controller = new UserController(userServiceMock.Object, tokenServiceMock.Object);

            var result = await controller.Register(dto) as BadRequestObjectResult;

            result.Should().NotBeNull();
            (result!.Value as string[]).Should().Contain("Username already taken.");
        }

        [Fact]
        public async Task Login_ShouldReturnOkWithToken_WhenCredentialsAreValid()
        {
            var dto = new UserLoginDto { Username = "alice", Password = "pass" };
            var user = new User { Id = Guid.NewGuid().ToString(), Username = "alice" };

            var userServiceMock = MakeUserServiceMock();
            userServiceMock.Setup(x => x.Login(dto)).ReturnsAsync(new UserServiceResult { Success = true, User = user });

            var tokenServiceMock = MakeTokenServiceMock();
            tokenServiceMock.Setup(x => x.IssueToken(It.IsAny<User>())).Returns("tok456");

            var controller = new UserController(userServiceMock.Object, tokenServiceMock.Object);
            var result = await controller.Login(dto) as OkObjectResult;

            result.Should().NotBeNull();
            var json = System.Text.Json.JsonSerializer.Serialize(result!.Value);
            var doc = System.Text.Json.JsonDocument.Parse(json);
            doc.RootElement.GetProperty("Token").GetString().Should().Be("tok456");
            tokenServiceMock.Verify(x => x.IssueToken(user), Times.Once);
        }

        [Fact]
        public async Task Login_ShouldReturnUnauthorized_WhenCredentialsAreInvalid()
        {
            var dto = new UserLoginDto { Username = "alice", Password = "wrong" };

            var userServiceMock = MakeUserServiceMock();
            userServiceMock.Setup(x => x.Login(dto))
                .ReturnsAsync(new UserServiceResult { Success = false, Errors = new[] { "Invalid credentials." } });

            var tokenServiceMock = MakeTokenServiceMock();
            var controller = new UserController(userServiceMock.Object, tokenServiceMock.Object);

            var result = await controller.Login(dto) as UnauthorizedObjectResult;

            result.Should().NotBeNull();
            (result!.Value as string[]).Should().Contain("Invalid credentials.");
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
        public async Task UpdateProfile_ShouldReturnOkWithUpdatedUser_WhenUpdateSucceeds()
        {
            var dto = new UserProfileUpdateDto { Username = "alice", Email = "new@example.com", Bio = "Hello" };
            var user = new User { Id = Guid.NewGuid().ToString(), Username = "alice", Email = "new@example.com", Bio = "Hello" };

            var userServiceMock = MakeUserServiceMock();
            userServiceMock.Setup(x => x.UpdateProfile(dto)).ReturnsAsync(new UserServiceResult { Success = true, User = user });

            var controller = new UserController(userServiceMock.Object, MakeTokenServiceMock().Object);
            var result = await controller.UpdateProfile(dto) as OkObjectResult;

            result.Should().NotBeNull();
            var returnedUser = result!.Value as User;
            returnedUser!.Username.Should().Be("alice");
            returnedUser.Email.Should().Be("new@example.com");
            returnedUser.Bio.Should().Be("Hello");
        }

        [Fact]
        public async Task UpdateProfile_ShouldReturnBadRequest_WhenUpdateFails()
        {
            var dto = new UserProfileUpdateDto { Username = "unknown" };

            var userServiceMock = MakeUserServiceMock();
            userServiceMock.Setup(x => x.UpdateProfile(dto))
                .ReturnsAsync(new UserServiceResult { Success = false, Errors = new[] { "User not found." } });

            var controller = new UserController(userServiceMock.Object, MakeTokenServiceMock().Object);
            var result = await controller.UpdateProfile(dto) as BadRequestObjectResult;

            result.Should().NotBeNull();
            (result!.Value as string[]).Should().Contain("User not found.");
        }
    }
}
