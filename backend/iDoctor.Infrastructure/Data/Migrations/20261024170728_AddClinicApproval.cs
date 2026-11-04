using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace iDoctor.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddClinicApproval : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ApprovalStatus",
                table: "clinics",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Approved");

            migrationBuilder.AddColumn<Guid>(
                name: "ManagerUserId",
                table: "clinics",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "clinics",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_clinics_ManagerUserId",
                table: "clinics",
                column: "ManagerUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_clinics_users_ManagerUserId",
                table: "clinics",
                column: "ManagerUserId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_clinics_users_ManagerUserId",
                table: "clinics");

            migrationBuilder.DropIndex(
                name: "IX_clinics_ManagerUserId",
                table: "clinics");

            migrationBuilder.DropColumn(
                name: "ApprovalStatus",
                table: "clinics");

            migrationBuilder.DropColumn(
                name: "ManagerUserId",
                table: "clinics");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "clinics");
        }
    }
}
