using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace iDoctor.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AllowAppointmentSlotReuse : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_appointments_SlotId",
                table: "appointments");

            migrationBuilder.CreateIndex(
                name: "IX_appointments_SlotId",
                table: "appointments",
                column: "SlotId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_appointments_SlotId",
                table: "appointments");

            migrationBuilder.CreateIndex(
                name: "IX_appointments_SlotId",
                table: "appointments",
                column: "SlotId",
                unique: true);
        }
    }
}
