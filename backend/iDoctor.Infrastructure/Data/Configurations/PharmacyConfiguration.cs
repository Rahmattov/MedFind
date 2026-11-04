using iDoctor.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace iDoctor.Infrastructure.Data.Configurations;

public class PharmacyConfiguration : IEntityTypeConfiguration<Pharmacy>
{
    public void Configure(EntityTypeBuilder<Pharmacy> builder)
    {
        builder.ToTable("pharmacies");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(p => p.Address)
            .HasMaxLength(300);

        builder.Property(p => p.Phone)
            .HasMaxLength(30);

        builder.Property(p => p.Description)
            .HasMaxLength(2000);

        builder.Property(p => p.PhotoUrl)
            .HasMaxLength(1000);

        builder.Property(p => p.RejectionReason)
            .HasMaxLength(1000);

        builder.Property(p => p.ApprovalStatus)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        // Связь аптеки с городом
        builder.HasOne(p => p.City)
            .WithMany()
            .HasForeignKey(p => p.CityId)
            .OnDelete(DeleteBehavior.SetNull);

        // Связь пользователя с аптекой, которой он управляет
        builder.HasMany<User>()
            .WithOne(u => u.ManagedPharmacy)
            .HasForeignKey(u => u.ManagedPharmacyId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(p => p.CityId);
        builder.HasIndex(p => p.ApprovalStatus);
    }
}