using Microsoft.AspNetCore.Mvc;
using ShaderForge.API.Services;

namespace ShaderForge.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SiteBackgroundController : ControllerBase
    {
        private readonly SiteBackgroundService _siteBackgroundService;

        public SiteBackgroundController(SiteBackgroundService siteBackgroundService)
        {
            Console.WriteLine("SiteBackgroundController created");
            // log path
            _siteBackgroundService = siteBackgroundService;
        }

        [HttpGet]
        public IActionResult Get()
        {
            var backgrounds = _siteBackgroundService.GetSiteBackgrounds();
            return Ok(backgrounds);
        }
    }
}
