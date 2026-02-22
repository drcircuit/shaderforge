using System.IdentityModel.Tokens.Jwt;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using ShaderForge.API.Data.DTO;
using ShaderForge.API.Data.Services;

namespace ShaderForge.API.Tests.UnitTests
{
    public class JwtTokenServiceTests
    {
        private static JwtTokenService CreateService(string secret = "test-secret-key-at-least-32-bytes!!")
        {
            var config = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Jwt:Issuer"] = "TestIssuer",
                    ["Jwt:Audience"] = "TestAudience",
                    ["Jwt:Secret"] = secret,
                    ["Jwt:ExpiryMinutes"] = "60",
                })
                .Build();
            return new JwtTokenService(config);
        }

        private static User MakeUser() => new User
        {
            Id = Guid.NewGuid().ToString(),
            Username = "testuser",
            Email = "test@example.com",
        };

        [Fact]
        public void IssueToken_ShouldReturnNonEmptyString()
        {
            var svc = CreateService();
            var token = svc.IssueToken(MakeUser());
            token.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public void IssueToken_ShouldReturnValidJwtWithCorrectClaims()
        {
            var svc = CreateService();
            var user = MakeUser();
            var token = svc.IssueToken(user);

            var handler = new JwtSecurityTokenHandler();
            handler.CanReadToken(token).Should().BeTrue();

            var jwt = handler.ReadJwtToken(token);
            jwt.Subject.Should().Be(user.Id);
            jwt.Claims.First(c => c.Type == JwtRegisteredClaimNames.UniqueName).Value.Should().Be(user.Username);
            jwt.Claims.First(c => c.Type == JwtRegisteredClaimNames.Email).Value.Should().Be(user.Email);
            jwt.Issuer.Should().Be("TestIssuer");
        }

        [Fact]
        public void VerifyToken_ShouldReturnTrue_ForValidToken()
        {
            var svc = CreateService();
            var token = svc.IssueToken(MakeUser());
            svc.VerifyToken(token).Should().BeTrue();
        }

        [Fact]
        public void VerifyToken_ShouldReturnFalse_ForTamperedToken()
        {
            var svc = CreateService();
            var token = svc.IssueToken(MakeUser());
            var tampered = token[..^5] + "XXXXX";
            svc.VerifyToken(tampered).Should().BeFalse();
        }

        [Fact]
        public void VerifyToken_ShouldReturnFalse_ForTokenSignedWithDifferentKey()
        {
            var svc1 = CreateService("first-secret-key-at-least-32-bytes!!");
            var svc2 = CreateService("other-secret-key-at-least-32-bytes!!");

            var token = svc1.IssueToken(MakeUser());
            svc2.VerifyToken(token).Should().BeFalse();
        }

        [Fact]
        public void VerifyToken_ShouldReturnFalse_ForEmptyString()
        {
            var svc = CreateService();
            svc.VerifyToken(string.Empty).Should().BeFalse();
        }

        [Fact]
        public void RevokeToken_ShouldNotThrow()
        {
            var svc = CreateService();
            var token = svc.IssueToken(MakeUser());
            var act = () => svc.RevokeToken(token);
            act.Should().NotThrow();
        }

        [Fact]
        public void IssueToken_ShouldReturnDifferentTokensForDifferentUsers()
        {
            var svc = CreateService();
            var token1 = svc.IssueToken(MakeUser());
            var token2 = svc.IssueToken(MakeUser());
            token1.Should().NotBe(token2);
        }
    }
}
