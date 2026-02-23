using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using ShaderForge.API.Data.Interfaces;
using ShaderForge.API.Data.Services;
using Microsoft.Extensions.FileProviders;
using ShaderForge.API.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.IO;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.HttpOverrides;

internal class Program
{
    private static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // Add services to the container.
        builder.Services.AddControllers();
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen(c =>
        {
            c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                In = Microsoft.OpenApi.Models.ParameterLocation.Header,
                Description = "JWT Bearer token",
            });
            c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
            {
                {
                    new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                    {
                        Reference = new Microsoft.OpenApi.Models.OpenApiReference
                        {
                            Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });

        var jwtSection = builder.Configuration.GetSection("Jwt");
        var jwtSecret = jwtSection["Secret"] ?? throw new InvalidOperationException("Jwt:Secret is not configured.");
        var keyBytes = Encoding.UTF8.GetBytes(jwtSecret);

        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
                    ValidateIssuer = true,
                    ValidIssuer = jwtSection["Issuer"] ?? "ShaderForge",
                    ValidateAudience = true,
                    ValidAudience = jwtSection["Audience"] ?? "ShaderForgeUsers",
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero,
                };
            });

        builder.Services.AddScoped<IShaderRepository, InMemoryShaderRepository>();
        builder.Services.AddSingleton<IUserStore, InMemoryUserStore>();
        builder.Services.AddScoped<IShaderStore, InMemoryShaderStore>();
        builder.Services.AddSingleton<IUserService, InMemoryUserService>();
        builder.Services.AddSingleton<ITokenService, JwtTokenService>();

        var allowedOrigins = builder.Configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>() ?? new[] { "http://localhost:8080" };

        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowConfiguredOrigins",
                policy => policy.WithOrigins(allowedOrigins)
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

        app.UseForwardedHeaders(new ForwardedHeadersOptions
        {
            ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
        });
        app.UseHttpsRedirection();
        app.UseAuthentication();
        app.UseAuthorization();
        app.UseCors("AllowConfiguredOrigins");
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