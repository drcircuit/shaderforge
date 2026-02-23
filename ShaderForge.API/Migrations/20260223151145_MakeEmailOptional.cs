using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShaderForge.API.Migrations
{
    /// <inheritdoc />
    public partial class MakeEmailOptional : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Users",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "TrackerDataJson",
                table: "Shaders",
                type: "character varying(65536)",
                maxLength: 65536,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(65536)",
                oldMaxLength: 65536);

            migrationBuilder.AlterColumn<string>(
                name: "Thumbnail",
                table: "Shaders",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "PlaylistDataJson",
                table: "Shaders",
                type: "character varying(65536)",
                maxLength: 65536,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(65536)",
                oldMaxLength: 65536);

            migrationBuilder.AddColumn<string>(
                name: "Channel0Url",
                table: "Shaders",
                type: "character varying(2048)",
                maxLength: 2048,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Channel1Url",
                table: "Shaders",
                type: "character varying(2048)",
                maxLength: 2048,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Channel2Url",
                table: "Shaders",
                type: "character varying(2048)",
                maxLength: 2048,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Channel3Url",
                table: "Shaders",
                type: "character varying(2048)",
                maxLength: 2048,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Channel0Url",
                table: "Shaders");

            migrationBuilder.DropColumn(
                name: "Channel1Url",
                table: "Shaders");

            migrationBuilder.DropColumn(
                name: "Channel2Url",
                table: "Shaders");

            migrationBuilder.DropColumn(
                name: "Channel3Url",
                table: "Shaders");

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "TrackerDataJson",
                table: "Shaders",
                type: "character varying(65536)",
                maxLength: 65536,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(65536)",
                oldMaxLength: 65536,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Thumbnail",
                table: "Shaders",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "PlaylistDataJson",
                table: "Shaders",
                type: "character varying(65536)",
                maxLength: 65536,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(65536)",
                oldMaxLength: 65536,
                oldNullable: true);
        }
    }
}
