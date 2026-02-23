FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["ShaderForge.API/ShaderForge.API.csproj", "ShaderForge.API/"]
RUN dotnet restore "ShaderForge.API/ShaderForge.API.csproj"
COPY ShaderForge.API/ ShaderForge.API/
WORKDIR "/src/ShaderForge.API"
RUN dotnet build "ShaderForge.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ShaderForge.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ShaderForge.API.dll"]
