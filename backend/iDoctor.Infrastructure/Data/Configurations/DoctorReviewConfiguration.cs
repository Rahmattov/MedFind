
using iDoctor.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace iDoctor.Infrastructure.Data.Configurations;

public class DoctorReviewConfiguration
    : IEntityTypeConfiguration<DoctorReview>
{
    public void Configure(EntityTypeBuilder<DoctorReview> builder)
    {
        builder.ToTable("doctor_reviews", table =>
        {
            table.HasCheckConstraint(
                "CK_doctor_reviews_rating",
                "\"Rating\" >= 1 AND \"Rating\" <= 5"
            );
        });

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Rating)
            .IsRequired();

        builder.Property(r => r.Comment)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(r => r.CreatedAt)
            .IsRequired();

        builder.HasOne(r => r.Doctor)
            .WithMany()
            .HasForeignKey(r => r.DoctorId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.Patient)
            .WithMany()
            .HasForeignKey(r => r.PatientId)
            .OnDelete(DeleteBehavior.Cascade);

        // One review per patient for each doctor
        builder.HasIndex(r => new { r.PatientId, r.DoctorId })
            .IsUnique();

        builder.HasIndex(r => r.DoctorId);
    }
}
