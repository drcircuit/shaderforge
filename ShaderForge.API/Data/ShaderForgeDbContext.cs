using Microsoft.EntityFrameworkCore;
using ShaderForge.API.Data.DTO;

namespace ShaderForge.API.Data
{
    public class ShaderForgeDbContext : DbContext
    {
        public ShaderForgeDbContext(DbContextOptions<ShaderForgeDbContext> options) : base(options) { }

        public DbSet<Shader> Shaders => Set<Shader>();
        public DbSet<AppUser> Users => Set<AppUser>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Shader>(b =>
            {
                b.HasKey(s => s.Id);
                b.Property(s => s.Tags)
                    .HasConversion(
                        v => string.Join(',', v),
                        v => string.IsNullOrEmpty(v)
                            ? new List<string>()
                            : v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList()
                    );
            });

            modelBuilder.Entity<AppUser>(b =>
            {
                b.HasKey(u => u.Id);
                b.HasIndex(u => u.Username).IsUnique();
            });
        }
    }
}
