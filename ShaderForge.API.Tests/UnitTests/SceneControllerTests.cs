using Xunit;
using FluentAssertions;
using Moq;
using ShaderForge.API.Data.Interfaces;
using ShaderForge.API.Data.DTO;
using ShaderForge.API.Controllers;
using Microsoft.AspNetCore.Mvc;

namespace ShaderForge.API.Tests.UnitTests
{
    public class SceneControllerTests
    {
        [Fact]
        public void GetAllScenes_ShouldReturnEmptyList_WhenNoScenesExist()
        {
            var repoMock = new Mock<ISceneRepository>();
            repoMock.Setup(x => x.GetAllScenes()).Returns(Array.Empty<Scene>());
            var controller = new SceneController(repoMock.Object);

            var res = controller.GetAllScenes().Result as OkObjectResult;
            var result = res!.Value as IEnumerable<Scene>;

            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetAllScenes_ShouldReturnScenes_WhenScenesExist()
        {
            var repoMock = new Mock<ISceneRepository>();
            repoMock.Setup(x => x.GetAllScenes()).Returns(new[]
            {
                new Scene { Id = Guid.NewGuid().ToString(), Name = "Scene 1" },
                new Scene { Id = Guid.NewGuid().ToString(), Name = "Scene 2" },
            });
            var controller = new SceneController(repoMock.Object);

            var res = controller.GetAllScenes().Result as OkObjectResult;
            var result = res!.Value as IEnumerable<Scene>;

            result.Should().HaveCount(2);
        }

        [Fact]
        public void GetSceneById_ShouldReturnScene_WhenSceneExists()
        {
            var id = Guid.NewGuid().ToString();
            var repoMock = new Mock<ISceneRepository>();
            repoMock.Setup(x => x.GetSceneById(id)).Returns(new Scene { Id = id, Name = "Scene A" });
            var controller = new SceneController(repoMock.Object);

            var res = controller.GetSceneById(id).Result as OkObjectResult;
            var result = res!.Value as Scene;

            result.Should().NotBeNull();
            result!.Id.Should().Be(id);
        }

        [Fact]
        public void GetSceneById_ShouldReturnNotFound_WhenSceneDoesNotExist()
        {
            var repoMock = new Mock<ISceneRepository>();
            repoMock.Setup(x => x.GetSceneById(It.IsAny<string>())).Returns((Scene?)null);
            var controller = new SceneController(repoMock.Object);

            var res = controller.GetSceneById("missing");

            res.Result.Should().BeOfType<NotFoundResult>();
        }

        [Fact]
        public void GetScenesByCreatedBy_ShouldReturnScenes_WhenScenesExist()
        {
            var user = "user1";
            var repoMock = new Mock<ISceneRepository>();
            repoMock.Setup(x => x.GetScenesByCreatedBy(user)).Returns(new[]
            {
                new Scene { Id = Guid.NewGuid().ToString(), Name = "Scene 1", CreatedBy = user },
            });
            var controller = new SceneController(repoMock.Object);

            var res = controller.GetScenesByCreatedBy(user).Result as OkObjectResult;
            var result = res!.Value as IEnumerable<Scene>;

            result.Should().HaveCount(1);
        }

        [Fact]
        public void CreateScene_ShouldReturnCreatedScene_WhenSceneIsCreated()
        {
            var scene = new Scene { Id = null, Name = "New Scene" };
            var repoMock = new Mock<ISceneRepository>();
            repoMock.Setup(x => x.AddScene(It.IsAny<Scene>()));
            var controller = new SceneController(repoMock.Object);

            var res = controller.CreateScene(scene).Result as CreatedAtActionResult;
            var result = res!.Value as Scene;

            result.Should().NotBeNull();
            result!.Id.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public void CreateScene_ShouldReturnBadRequest_WhenIdIsSet()
        {
            var scene = new Scene { Id = Guid.NewGuid().ToString(), Name = "Scene" };
            var repoMock = new Mock<ISceneRepository>();
            var controller = new SceneController(repoMock.Object);

            var result = controller.CreateScene(scene).Result;

            result.Should().BeOfType<BadRequestResult>();
        }

        [Fact]
        public void CreateScene_ShouldReturnBadRequest_WhenNameIsEmpty()
        {
            var scene = new Scene { Id = null, Name = "" };
            var repoMock = new Mock<ISceneRepository>();
            var controller = new SceneController(repoMock.Object);

            var result = controller.CreateScene(scene).Result;

            result.Should().BeOfType<BadRequestResult>();
        }

        [Fact]
        public void CreateScene_ShouldSetCreatedAtAndUpdatedAt()
        {
            var scene = new Scene { Id = null, Name = "Scene" };
            var repoMock = new Mock<ISceneRepository>();
            repoMock.Setup(x => x.AddScene(It.IsAny<Scene>()));
            var controller = new SceneController(repoMock.Object);

            var res = controller.CreateScene(scene).Result as CreatedAtActionResult;
            var result = res!.Value as Scene;

            result!.CreatedAt.Should().BeCloseTo(DateTime.Now, TimeSpan.FromMilliseconds(2000));
            result.UpdatedAt.Should().BeCloseTo(DateTime.Now, TimeSpan.FromMilliseconds(2000));
        }

        [Fact]
        public void CreateScene_ShouldPreserveShaderEntries()
        {
            var scene = new Scene
            {
                Id = null,
                Name = "Scene With Shaders",
                Shaders = new List<SceneShaderEntry>
                {
                    new SceneShaderEntry { ShaderId = "shader-1", Type = SceneShaderType.PixelShader, Order = 0 },
                    new SceneShaderEntry { ShaderId = "shader-2", Type = SceneShaderType.PostFx, Order = 1 },
                },
            };
            var repoMock = new Mock<ISceneRepository>();
            repoMock.Setup(x => x.AddScene(It.IsAny<Scene>()));
            var controller = new SceneController(repoMock.Object);

            var res = controller.CreateScene(scene).Result as CreatedAtActionResult;
            var result = res!.Value as Scene;

            result!.Shaders.Should().HaveCount(2);
            result.Shaders[0].Type.Should().Be(SceneShaderType.PixelShader);
            result.Shaders[1].Type.Should().Be(SceneShaderType.PostFx);
        }

        [Fact]
        public void UpdateScene_ShouldReturnNoContent_WhenSceneIsUpdated()
        {
            var id = Guid.NewGuid().ToString();
            var scene = new Scene { Id = id, Name = "Updated Scene" };
            var repoMock = new Mock<ISceneRepository>();
            repoMock.Setup(x => x.GetSceneById(id)).Returns(scene);
            repoMock.Setup(x => x.UpdateScene(It.IsAny<Scene>()));
            var controller = new SceneController(repoMock.Object);

            var result = controller.UpdateScene(id, scene) as NoContentResult;

            result.Should().NotBeNull();
        }

        [Fact]
        public void UpdateScene_ShouldReturnNotFound_WhenSceneDoesNotExist()
        {
            var id = Guid.NewGuid().ToString();
            var scene = new Scene { Id = id, Name = "Scene" };
            var repoMock = new Mock<ISceneRepository>();
            repoMock.Setup(x => x.GetSceneById(id)).Returns((Scene?)null);
            var controller = new SceneController(repoMock.Object);

            var result = controller.UpdateScene(id, scene);

            result.Should().BeOfType<NotFoundResult>();
        }

        [Fact]
        public void UpdateScene_ShouldReturnBadRequest_WhenIdDoesNotMatch()
        {
            var scene = new Scene { Id = Guid.NewGuid().ToString(), Name = "Scene" };
            var repoMock = new Mock<ISceneRepository>();
            var controller = new SceneController(repoMock.Object);

            var result = controller.UpdateScene(Guid.NewGuid().ToString(), scene) as BadRequestResult;

            result.Should().NotBeNull();
        }

        [Fact]
        public void UpdateScene_ShouldUpdateUpdatedAt()
        {
            var id = Guid.NewGuid().ToString();
            var scene = new Scene { Id = id, Name = "Scene", UpdatedAt = DateTime.MinValue };
            var repoMock = new Mock<ISceneRepository>();
            repoMock.Setup(x => x.GetSceneById(id)).Returns(scene);
            repoMock.Setup(x => x.UpdateScene(It.IsAny<Scene>()));
            var controller = new SceneController(repoMock.Object);

            controller.UpdateScene(id, scene);

            scene.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMilliseconds(2000));
        }

        [Fact]
        public void DeleteScene_ShouldReturnNoContent_WhenSceneIsDeleted()
        {
            var id = Guid.NewGuid().ToString();
            var repoMock = new Mock<ISceneRepository>();
            repoMock.Setup(x => x.GetSceneById(id)).Returns(new Scene { Id = id, Name = "Scene" });
            repoMock.Setup(x => x.DeleteScene(id));
            var controller = new SceneController(repoMock.Object);

            var result = controller.DeleteScene(id) as NoContentResult;

            result.Should().NotBeNull();
        }

        [Fact]
        public void DeleteScene_ShouldReturnNotFound_WhenSceneDoesNotExist()
        {
            var repoMock = new Mock<ISceneRepository>();
            repoMock.Setup(x => x.GetSceneById(It.IsAny<string>())).Returns((Scene?)null);
            var controller = new SceneController(repoMock.Object);

            var result = controller.DeleteScene("missing");

            result.Should().BeOfType<NotFoundResult>();
        }
    }
}
