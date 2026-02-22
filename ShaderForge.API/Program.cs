using System.Text.Json.Serialization;
using ShaderForge.API.Data.Interfaces;
using ShaderForge.API.Data.Services;
using Microsoft.Extensions.FileProviders;
using ShaderForge.API.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.Identity;
using System.IO;
using Microsoft.AspNetCore.Builder;

internal class Program
{
    private static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // Add services to the container.
        builder.Services.AddControllers();
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        builder.Services.AddScoped<IShaderRepository, InMemoryShaderRepository>();
        builder.Services.AddScoped<IUserStore, InMemoryUserStore>();
        builder.Services.AddScoped<IShaderStore, InMemoryShaderStore>();
        builder.Services.AddScoped<IUserService, InMemoryUserService>();
        builder.Services.AddSingleton<ITokenService, InMemoryTokenService>();

        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowLocalhost8080",
                builder => builder.WithOrigins("http://localhost:8080")
                                  .AllowAnyHeader()
                                  .AllowAnyMethod());
        });

        if (builder.Environment.IsDevelopment())
        {
            builder.Services.AddSingleton<IShaderDataService, MockShaderDataService>();
        }
        else
        {
            // Add production implementation of IShaderDataService
        }

        builder.Services.AddSingleton(new SiteBackgroundService(Path.Combine(Directory.GetCurrentDirectory(), "sitebg")));

        var app = builder.Build();

        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "ShaderForge API V1");
                c.RoutePrefix = string.Empty; // Set Swagger UI at the app's root
            });
        }

        app.UseHttpsRedirection();
        app.UseAuthorization();
        app.UseCors("AllowLocalhost8080");
        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(Path.Combine(Directory.GetCurrentDirectory(), "sitebg")),
            RequestPath = "/api/sitebg"
        });
        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(Path.Combine(Directory.GetCurrentDirectory(), "thumbnails")),
            RequestPath = "/api/thumbnails"
        });
        app.MapControllers();
        app.Run();
    }
}

internal class RepositoryConfig
{
    [JsonPropertyName("Type")]
    public string RepoType { get; set; }
}