using Xunit;
using FluentAssertions;
using Moq;
using ShaderForge.API.Data.Interfaces;
using ShaderForge.API.Data.Models;
using ShaderForge.API.Controllers;
using Microsoft.AspNetCore.Mvc;

namespace ShaderForge.API.Tests.UnitTests
{
    public class ShaderControllerTests
    {
        [Fact]
        public void GetShader_ShouldReturnEmptyList_WhenNoShadersExists()
        {
            var shaderRepositoryMock = new Mock<IShaderRepository>();
            shaderRepositoryMock.Setup(x => x.GetAllShaders()).Returns(new Shader[0]);
            var shaderController = new ShaderController(shaderRepositoryMock.Object);

            var res = shaderController.GetAllShaders().Result as OkObjectResult;
            var result = res.Value as IEnumerable<Shader>;

            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetShader_ShouldReturnListOfShaders_WhenShadersExists()
        {
            var shaderRepositoryMock = new Mock<IShaderRepository>();
            shaderRepositoryMock.Setup(x => x.GetAllShaders()).Returns(new Shader[]{
                new Shader{Id = Guid.NewGuid().ToString(), Name = "Shader 1"},
                new Shader{Id = Guid.NewGuid().ToString(), Name = "Shader 2"},
                new Shader{Id = Guid.NewGuid().ToString(), Name = "Shader 3"}
            });

            var shaderController = new ShaderController(shaderRepositoryMock.Object);

            var res = shaderController.GetAllShaders().Result as OkObjectResult;
            var result = res.Value as IEnumerable<Shader>;

            result.Should().NotBeNull();
            result.Should().HaveCount(3);
        }

        [Fact]
        public void GetShaderById_ShouldReturnShader_WhenShaderExists()
        {
            var shaderId = Guid.NewGuid().ToString();
            var shaderRepositoryMock = new Mock<IShaderRepository>();
            shaderRepositoryMock.Setup(x => x.GetShaderById(It.IsAny<string>())).Returns(new Shader { Id = shaderId, Name = "Shader 1" });
            var shaderController = new ShaderController(shaderRepositoryMock.Object);

            var res = shaderController.GetShaderById(shaderId).Result as OkObjectResult;
            var result = res.Value as Shader;

            result.Should().NotBeNull();
            result.Id.Should().Be(shaderId);
        }

        [Fact]
        public void GetShadersByCreatedBy_ShouldReturnShaders_WhenShadersExists()
        {
            var createdBy = "user1";
            var shaderRepositoryMock = new Mock<IShaderRepository>();
            shaderRepositoryMock.Setup(x => x.GetShadersByCreatedBy(It.IsAny<string>())).Returns(new Shader[]{
                new Shader{Id = Guid.NewGuid().ToString(), Name = "Shader 1", CreatedBy = createdBy},
                new Shader{Id = Guid.NewGuid().ToString(), Name = "Shader 2", CreatedBy = createdBy},
                new Shader{Id = Guid.NewGuid().ToString(), Name = "Shader 3", CreatedBy = createdBy}
            });

            var shaderController = new ShaderController(shaderRepositoryMock.Object);

            var res = shaderController.GetShadersByCreatedBy(createdBy).Result as OkObjectResult;
            var result = res.Value as IEnumerable<Shader>;

            result.Should().NotBeNull();
            result.Should().HaveCount(3);
        }

        [Fact]
        public void CreateShader_ShouldReturnCreatedShader_WhenShaderIsCreated()
        {
            var shader = new Shader { Id = null, Name = "Shader 1" };
            var shaderRepositoryMock = new Mock<IShaderRepository>();
            shaderRepositoryMock.Setup(x => x.AddShader(It.IsAny<Shader>()));
            var shaderController = new ShaderController(shaderRepositoryMock.Object);

            var res = shaderController.CreateShader(shader).Result as CreatedAtActionResult;
            var result = res.Value as Shader;

            result.Should().NotBeNull();
            result.Id.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public void UpdateShader_ShouldReturnNoContent_WhenShaderIsUpdated()
        {
            var shader = new Shader { Id = Guid.NewGuid().ToString(), Name = "Shader 1" };
            var shaderRepositoryMock = new Mock<IShaderRepository>();
            shaderRepositoryMock.Setup(x => x.UpdateShader(It.IsAny<Shader>()));
            var shaderController = new ShaderController(shaderRepositoryMock.Object);

            var res = shaderController.UpdateShader(shader.Id, shader) as NoContentResult;

            res.Should().NotBeNull();
        }

        [Fact]
        public void DeleteShader_ShouldReturnNoContent_WhenShaderIsDeleted()
        {
            var shaderId = Guid.NewGuid().ToString();
            var shaderRepositoryMock = new Mock<IShaderRepository>();
            shaderRepositoryMock.Setup(x => x.DeleteShader(It.IsAny<string>()));
            shaderRepositoryMock.Setup(x => x.GetShaderById(shaderId)).Returns(new Shader { Id = shaderId, Name = "Shader 1" });
            var shaderController = new ShaderController(shaderRepositoryMock.Object);

            var res = shaderController.DeleteShader(shaderId) as NoContentResult;

            res.Should().NotBeNull();
        }

        [Fact]
        public void GetShaderById_ShouldReturnNotFound_WhenShaderDoesNotExist()
        {
            var shaderId = Guid.NewGuid().ToString();
            var shaderRepositoryMock = new Mock<IShaderRepository>();
            shaderRepositoryMock.Setup(x => x.GetShaderById(It.IsAny<string>())).Returns((Shader)null);
            var shaderController = new ShaderController(shaderRepositoryMock.Object);

            var res = shaderController.GetShaderById(shaderId).Result;
            var notFoundResult = res as NotFoundResult;

            res.Should().NotBeNull();
        }

        [Fact]
        public void DeleteShader_ShouldReturnNotFound_WhenShaderDoesNotExist()
        {
            var shaderId = Guid.NewGuid().ToString();
            var shaderRepositoryMock = new Mock<IShaderRepository>();
            shaderRepositoryMock.Setup(x => x.GetShaderById(It.IsAny<string>())).Returns((Shader)null);
            var shaderController = new ShaderController(shaderRepositoryMock.Object);

            var res = shaderController.DeleteShader(shaderId);
            var notFoundResult = res as NotFoundResult;

            res.Should().NotBeNull();
        }

        [Fact]
        public void UpdateShader_ShouldReturnBadRequest_WhenIdDoesNotMatch()
        {
            var shader = new Shader { Id = Guid.NewGuid().ToString(), Name = "Shader 1" };
            var shaderRepositoryMock = new Mock<IShaderRepository>();
            var shaderController = new ShaderController(shaderRepositoryMock.Object);

            var res = shaderController.UpdateShader(Guid.NewGuid().ToString(), shader) as BadRequestResult;

            res.Should().NotBeNull();
        }

        [Fact]
        public void CreateShader_ShouldReturnBadRequest_WhenIdIsSet()
        {
            var shader = new Shader { Id = Guid.NewGuid().ToString(), Name = "Shader 1" };
            var shaderRepositoryMock = new Mock<IShaderRepository>();
            var shaderController = new ShaderController(shaderRepositoryMock.Object);

            var result = shaderController.CreateShader(shader).Result;
            var badRequestResult = result as BadRequestResult;

            result.Should().NotBeNull();
        }

        [Fact]
        public void UpdateShader_ShouldUpdateUpdatedAt_WhenShaderIsUpdated()
        {
            var shader = new Shader { Id = Guid.NewGuid().ToString(), Name = "Shader 1", UpdatedAt = DateTime.MinValue };
            var shaderRepositoryMock = new Mock<IShaderRepository>();
            shaderRepositoryMock.Setup(x => x.UpdateShader(It.IsAny<Shader>()));
            var shaderController = new ShaderController(shaderRepositoryMock.Object);

            var res = shaderController.UpdateShader(shader.Id, shader) as NoContentResult;

            shader.UpdatedAt.Should().BeCloseTo(DateTime.Now, TimeSpan.FromMilliseconds(2000));
        }

        [Fact]
        public void CreateShader_ShouldSetCreatedAtAndUpdatedAt_WhenShaderIsCreated()
        {
            var shader = new Shader { Id = null, Name = "Shader 1" };
            var shaderRepositoryMock = new Mock<IShaderRepository>();
            shaderRepositoryMock.Setup(x => x.AddShader(It.IsAny<Shader>()));
            var shaderController = new ShaderController(shaderRepositoryMock.Object);

            var res = shaderController.CreateShader(shader).Result as CreatedAtActionResult;
            var result = res.Value as Shader;

            result.CreatedAt.Should().BeCloseTo(DateTime.Now, TimeSpan.FromMilliseconds(2000));
            result.UpdatedAt.Should().BeCloseTo(DateTime.Now, TimeSpan.FromMilliseconds(2000));
        }

        [Fact]
        public void CreateShader_ShouldReturnBadRequest_WhenNameIsNotSet()
        {
            var shader = new Shader { Id = null, Name = null };
            var shaderRepositoryMock = new Mock<IShaderRepository>();
            var shaderController = new ShaderController(shaderRepositoryMock.Object);

            var result = shaderController.CreateShader(shader).Result;
            var badRequestResult = result as BadRequestResult;

            result.Should().NotBeNull();
        }
    }
}