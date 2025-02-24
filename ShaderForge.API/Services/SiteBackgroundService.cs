using ShaderForge.API.Models;
using System.IO;

namespace ShaderForge.API.Services
{
    public class SiteBackgroundService
    {   
        private readonly string _siteBgFolder;

        public SiteBackgroundService(string siteBgFolder)
        {
            // log folder
            Console.WriteLine($"SiteBackgroundService created with folder {siteBgFolder}");
            _siteBgFolder = siteBgFolder;
        }

        public IEnumerable<SiteBackground> GetSiteBackgrounds()
        {
            // get all picture files, jpg, png, webp

            var files = Directory.GetFiles(_siteBgFolder, "*.*", SearchOption.TopDirectoryOnly)
                .Where(file => file.EndsWith(".jpg") || file.EndsWith(".png") || file.EndsWith(".webp"));
            // log number of files
            Console.WriteLine($"Found {files.Count()} files in {_siteBgFolder}");
            return files.Select(file => new SiteBackground { Url = $"/sitebg/{Path.GetFileName(file)}" });
        }
    }
}
