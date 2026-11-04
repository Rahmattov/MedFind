using iDoctor.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace iDoctor.Infrastructure.Data.Configurations;

public class MedicineConfiguration : IEntityTypeConfiguration<Medicine>
{
    public void Configure(EntityTypeBuilder<Medicine> builder)
    {
        builder.ToTable("medicines");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(m => m.Description)
            .HasMaxLength(2000);

        builder.Property(m => m.Category)
            .HasMaxLength(100);

        builder.Property(m => m.Manufacturer)
            .HasMaxLength(200);

        builder.Property(m => m.Dosage)
            .HasMaxLength(100);

        builder.Property(m => m.Form)
            .HasMaxLength(100);

        builder.Property(m => m.Price)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(m => m.StockQuantity)
            .IsRequired();

        builder.Property(m => m.PhotoUrl)
            .HasMaxLength(1000);

        builder.Property(m => m.IsActive)
            .IsRequired();

        builder.Property(m => m.CreatedAt)
            .IsRequired();

        // Связь: одна аптека — много лекарств
        builder.HasOne(m => m.Pharmacy)
            .WithMany(p => p.Medicines)
            .HasForeignKey(m => m.PharmacyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(m => m.PharmacyId);
        builder.HasIndex(m => m.Category);
        builder.HasIndex(m => m.Name);
    }
}