namespace iDoctor.Domain.Entities;

public class DoctorReview
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;

    public Guid PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public int Rating { get; set; }

    public string Comment { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}