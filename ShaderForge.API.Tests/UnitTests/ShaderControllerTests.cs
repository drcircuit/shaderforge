using Xunit;
using FluentAssertions;
using Moq;
using ShaderForge.API.Data.Interfaces;
using ShaderForge.API.Data.DTO;
using ShaderForge.API.Controllers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;

namespace ShaderForge.API.Tests.UnitTests
{
    public class ShaderControllerTests
    {
        [Fact]
        public void GetShader_ShouldReturnEmptyList_WhenNoShadersExists()
        {
            // Arrange
            var shaderRepositoryMock = new Mock<IShaderRepository>();
            shaderRepositoryMock.Setup(x => x.GetAllShaders()).Returns(new Shader[0]);
            var shaderController = new ShaderController(shaderRepositoryMock.Object);

            // Act
            var res = shaderController.GetAllShaders().Result as OkObjectResult;
            var result = res.Value as IEnumerable<Shader>;


            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        // let's test if we can get a list of shaders when the repository has shaders in it
        [Fact]
        public void GetShader_ShouldReturnListOfShaders_WhenShadersExists()
        {
            // Arrange
            var shaderRepositoryMock = new Mock<IShaderRepository>();
            shaderRepositoryMock.Setup(x => x.GetAllShaders()).Returns(new Shader[]{
            new Shader{Id = Guid.NewGuid().ToString(), Name = "Shader 1"},
            new Shader{Id = Guid.NewGuid().ToString(), Name = "Shader 2"},
            new Shader{Id = Guid.NewGuid().ToString(), Name = "Shader 3"}
        });

            var shaderController = new ShaderController(shaderRepositoryMock.Object);

            // Act
            var res = shaderController.GetAllShaders().Result as OkObjectResult;
            var result = res.Value as IEnumerable<Shader>;

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(3);
        }

        // Let's test if we can get a shader by id
        [Fact]
        public void GetShaderById_ShouldReturnShader_WhenShaderExists()
        {
            // Arrange
            var shaderId = Guid.NewGuid().ToString();
            var shaderRepositoryMock = new Mock<IShaderRepository>();
            shaderRepositoryMock.Setup(x => x.GetShaderById(It.IsAny<string>())).Returns(new Shader { Id = shaderId, Name = "Shader 1" });
            var shaderController = new ShaderController(shaderRepositoryMock.Object);

            // Act
            var res = shaderController.GetShaderById(shaderId).Result as OkObjectResult;
            var result = res.Value as Shader;

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(shaderId);
        }

        // let's see if we can get one users Shaders by CreatedBy
        [Fact]
        public void GetShadersByCreatedBy_ShouldReturnShaders_WhenShadersExists()
        {
            // Arrange
            var createdBy = "user1";
            var shaderRepositoryMock = new Mock<IShaderRepository>();
            shaderRepositoryMock.Setup(x => x.GetShadersByCreatedBy(It.IsAny<string>())).Returns(new Shader[]{
            new Shader{Id = Guid.NewGuid().ToString(), Name = "Shader 1", CreatedBy = createdBy},
            new Shader{Id = Guid.NewGuid().ToString(), Name = "Shader 2", CreatedBy = createdBy},
            new Shader{Id = Guid.NewGuid().ToString(), Name = "Shader 3", CreatedBy = createdBy}
        });

            var shaderController = new ShaderController(shaderRepositoryMock.Object);

            // Act
            var res = shaderController.GetShadersByCreatedBy(createdBy).Result as OkObjectResult;
            var result = res.Value as IEnumerable<Shader>;

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(3);
        }
        // Let's see if we can create a shader
        [Fact]
        public void CreateShader_ShouldReturnCreatedShader_WhenShaderIsCreated()
        {
            // Arrange
            var shader = new Shader { Id = null, Name = "Shader 1" };
            var shaderRepositoryMock = new Mock<IShaderRepository>();
            shaderRepositoryMock.Setup(x => x.AddShader(It.IsAny<Shader>()));
            var shaderController = new ShaderController(shaderRepositoryMock.Object);

            // Act
            var res = shaderController.CreateShader(shader).Result as CreatedAtActionResult;
            var result = res.Value as Shader;

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().NotBeNullOrEmpty();
        }

        // Let's see if we can update a shader
        [Fact]
        public void UpdateShader_ShouldReturnNoContent_WhenShaderIsUpdated()
        {
            // Arrange
            var shader = new Shader { Id = Guid.NewGuid().ToString(), Name = "Shader 1" };
            var shaderRepositoryMock = new Mock<IShaderRepository>();
            shaderRepositoryMock.Setup(x => x.UpdateShader(It.IsAny<Shader>()));
            var shaderController = new ShaderController(shaderRepositoryMock.Object);

            // Act
            var res = shaderController.UpdateShader(shader.Id, shader) as NoContentResult;

            // Assert
            res.Should().NotBeNull();
        }
        // Let's see if we can delete a shader
        [Fact]
        public void DeleteShader_ShouldReturnNoContent_WhenShaderIsDeleted()
        {
            // Arrange
            var shaderId = Guid.NewGuid().ToString();
            var shaderRepositoryMock = new Mock<IShaderRepository>();
            shaderRepositoryMock.Setup(x => x.DeleteShader(It.IsAny<string>()));
            // insert shaderId in the setup
            shaderRepositoryMock.Setup(x => x.GetShaderById(shaderId)).Returns(new Shader { Id = shaderId, Name = "Shader 1" });
            var shaderController = new ShaderController(shaderRepositoryMock.Object);

            // Act
            var res = shaderController.DeleteShader(shaderId) as NoContentResult;

            // Assert
            res.Should().NotBeNull();
        }

        // negative tests
        [Fact]
        public void GetShaderById_ShouldReturnNotFound_WhenShaderDoesNotExist()
        {
            // Arrange
            var shaderId = Guid.NewGuid().ToString();
            var shaderRepositoryMock = new Mock<IShaderRepository>();
            shaderRepositoryMock.Setup(x => x.GetShaderById(It.IsAny<string>())).Returns((Shader)null);
            var shaderController = new ShaderController(shaderRepositoryMock.Object);

            // Act
            var res = shaderController.GetShaderById(shaderId).Result;
            var notFoundResult = res as NotFoundResult;

            // Assert
            res.Should().NotBeNull();
        }

        [Fact]
        public void DeleteShader_ShouldReturnNotFound_WhenShaderDoesNotExist()
        {
            // Arrange
            var shaderId = Guid.NewGuid().ToString();
            var shaderRepositoryMock = new Mock<IShaderRepository>();
            shaderRepositoryMock.Setup(x => x.GetShaderById(It.IsAny<string>())).Returns((Shader)null);
            var shaderController = new ShaderController(shaderRepositoryMock.Object);

            // Act
            var res = shaderController.DeleteShader(shaderId);
            var notFoundResult = res as NotFoundResult;

            // Assert
            res.Should().NotBeNull();
        }

        [Fact]
        public void UpdateShader_ShouldReturnBadRequest_WhenIdDoesNotMatch()
        {
            // Arrange
            var shader = new Shader { Id = Guid.NewGuid().ToString(), Name = "Shader 1" };
            var shaderRepositoryMock = new Mock<IShaderRepository>();
            var shaderController = new ShaderController(shaderRepositoryMock.Object);

            // Act
            var res = shaderController.UpdateShader(Guid.NewGuid().ToString(), shader) as BadRequestResult;

            // Assert
            res.Should().NotBeNull();
        }

        [Fact]
        public void CreateShader_ShouldReturnBadRequest_WhenIdIsSet()
        {
            // Arrange
            var shader = new Shader { Id = Guid.NewGuid().ToString(), Name = "Shader 1" };
            var shaderRepositoryMock = new Mock<IShaderRepository>();
            var shaderController = new ShaderController(shaderRepositoryMock.Object);

            // Act
            var result = shaderController.CreateShader(shader).Result;
            var badRequestResult = result as BadRequestResult;

            // Assert
            result.Should().NotBeNull();
        }

        // let's test to see if dates get updated when a shader is updated
        [Fact]
        public void UpdateShader_ShouldUpdateUpdatedAt_WhenShaderIsUpdated()
        {
            // Arrange
            var shader = new Shader { Id = Guid.NewGuid().ToString(), Name = "Shader 1", UpdatedAt = DateTime.MinValue };
            var shaderRepositoryMock = new Mock<IShaderRepository>();
            shaderRepositoryMock.Setup(x => x.UpdateShader(It.IsAny<Shader>()));
            var shaderController = new ShaderController(shaderRepositoryMock.Object);

            // Act
            var res = shaderController.UpdateShader(shader.Id, shader) as NoContentResult;

            // Assert
            shader.UpdatedAt.Should().BeCloseTo(DateTime.Now, TimeSpan.FromMilliseconds(2000));
        }

        // let's test to see if dates get set when a shader is created
        [Fact]
        public void CreateShader_ShouldSetCreatedAtAndUpdatedAt_WhenShaderIsCreated()
        {
            // Arrange
            var shader = new Shader { Id = null, Name = "Shader 1" };
            var shaderRepositoryMock = new Mock<IShaderRepository>();
            shaderRepositoryMock.Setup(x => x.AddShader(It.IsAny<Shader>()));
            var shaderController = new ShaderController(shaderRepositoryMock.Object);

            // Act
            var res = shaderController.CreateShader(shader).Result as CreatedAtActionResult;
            var result = res.Value as Shader;

            // Assert
            result.CreatedAt.Should().BeCloseTo(DateTime.Now, TimeSpan.FromMilliseconds(2000));
            result.UpdatedAt.Should().BeCloseTo(DateTime.Now, TimeSpan.FromMilliseconds(2000));
        }

        // let's make sure creation fails if name is not set on shader
        [Fact]
        public void CreateShader_ShouldReturnBadRequest_WhenNameIsNotSet()
        {
            // Arrange
            var shader = new Shader { Id = null, Name = null };
            var shaderRepositoryMock = new Mock<IShaderRepository>();
            var shaderController = new ShaderController(shaderRepositoryMock.Object);

            // Act
            var result = shaderController.CreateShader(shader).Result;
            var badRequestResult = result as BadRequestResult;

            // Assert
            result.Should().NotBeNull();
        }
    }
}