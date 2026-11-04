using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace iDoctor.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDoctorReviews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "ApprovalStatus",
                table: "clinics",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldDefaultValue: "Approved");

            migrationBuilder.CreateTable(
                name: "doctor_reviews",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DoctorId = table.Column<Guid>(type: "uuid", nullable: false),
                    PatientId = table.Column<Guid>(type: "uuid", nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: false),
                    Comment = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_doctor_reviews", x => x.Id);
                    table.CheckConstraint("CK_doctor_reviews_rating", "\"Rating\" >= 1 AND \"Rating\" <= 5");
                    table.ForeignKey(
                        name: "FK_doctor_reviews_doctors_DoctorId",
                        column: x => x.DoctorId,
                        principalTable: "doctors",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_doctor_reviews_patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "patients",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_doctor_reviews_DoctorId",
                table: "doctor_reviews",
                column: "DoctorId");

            migrationBuilder.CreateIndex(
                name: "IX_doctor_reviews_PatientId_DoctorId",
                table: "doctor_reviews",
                columns: new[] { "PatientId", "DoctorId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "doctor_reviews");

            migrationBuilder.AlterColumn<string>(
                name: "ApprovalStatus",
                table: "clinics",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Approved",
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20);
        }
    }
}
