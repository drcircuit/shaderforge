using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace ShaderForge.API.Data
{
    /// <summary>
    /// Provides a <see cref="ShaderForgeDbContext"/> at design time (EF Core migrations).
    /// Uses an environment variable CONNECTION_STRING, falling back to a local Postgres
    /// instance so developers can generate migrations without a Neon account.
    /// </summary>
    public class ShaderForgeDbContextFactory : IDesignTimeDbContextFactory<ShaderForgeDbContext>
    {
        public ShaderForgeDbContext CreateDbContext(string[] args)
        {
            var connectionString =
                Environment.GetEnvironmentVariable("CONNECTION_STRING")
                ?? "Host=localhost;Database=shaderforge;Username=postgres;Password=postgres";

            var options = new DbContextOptionsBuilder<ShaderForgeDbContext>()
                .UseNpgsql(connectionString)
                .Options;

            return new ShaderForgeDbContext(options);
        }
    }
}
