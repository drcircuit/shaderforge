using System.Text.Json.Serialization;
using ShaderForge.API.Data.Interfaces;
using ShaderForge.API.Data.Services;
internal class Program
{
    private static void Main(string[] args)
    {
        // get repo config
        var config = new ConfigurationBuilder()
            .AddJsonFile("appsettings.json")
            .Build();
        var repoType = config.GetSection("RepositoryConfig:Type").Get<string>();
        
        var builder = WebApplication.CreateBuilder(args);

        
        if (repoType == "InMemory")
        {
            builder.Services.AddSingleton<IShaderRepository, InMemoryShaderRepository>();
        }

        // Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
        builder.Services.AddOpenApi();
        builder.Services.AddControllers();
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();
        var app = builder.Build();

        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
        }

        app.UseHttpsRedirection();
        app.UseSwagger();
        app.UseSwaggerUI();
        app.UseRouting();
        app.UseAuthorization();
        app.MapControllers();
        app.Run();
    }
}

internal class RepositoryConfig
{
    [JsonPropertyName("Type")]
    public string RepoType { get; set; }
}