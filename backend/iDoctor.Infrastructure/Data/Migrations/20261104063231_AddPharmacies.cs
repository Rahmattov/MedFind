using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace iDoctor.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPharmacies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ManagedPharmacyId",
                table: "users",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "pharmacies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CityId = table.Column<int>(type: "integer", nullable: true),
                    Address = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    Phone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    PhotoUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ApprovalStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    RejectionReason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pharmacies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_pharmacies_cities_CityId",
                        column: x => x.CityId,
                        principalTable: "cities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_users_ManagedPharmacyId",
                table: "users",
                column: "ManagedPharmacyId");

            migrationBuilder.CreateIndex(
                name: "IX_pharmacies_ApprovalStatus",
                table: "pharmacies",
                column: "ApprovalStatus");

            migrationBuilder.CreateIndex(
                name: "IX_pharmacies_CityId",
                table: "pharmacies",
                column: "CityId");

            migrationBuilder.AddForeignKey(
                name: "FK_users_pharmacies_ManagedPharmacyId",
                table: "users",
                column: "ManagedPharmacyId",
                principalTable: "pharmacies",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_users_pharmacies_ManagedPharmacyId",
                table: "users");

            migrationBuilder.DropTable(
                name: "pharmacies");

            migrationBuilder.DropIndex(
                name: "IX_users_ManagedPharmacyId",
                table: "users");

            migrationBuilder.DropColumn(
                name: "ManagedPharmacyId",
                table: "users");
        }
    }
}
