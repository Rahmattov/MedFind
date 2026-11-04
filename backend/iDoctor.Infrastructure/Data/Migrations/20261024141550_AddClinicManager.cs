using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace iDoctor.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddClinicManager : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ManagedClinicId",
                table: "users",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_ManagedClinicId",
                table: "users",
                column: "ManagedClinicId");

            migrationBuilder.AddForeignKey(
                name: "FK_users_clinics_ManagedClinicId",
                table: "users",
                column: "ManagedClinicId",
                principalTable: "clinics",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_users_clinics_ManagedClinicId",
                table: "users");

            migrationBuilder.DropIndex(
                name: "IX_users_ManagedClinicId",
                table: "users");

            migrationBuilder.DropColumn(
                name: "ManagedClinicId",
                table: "users");
        }
    }
}
