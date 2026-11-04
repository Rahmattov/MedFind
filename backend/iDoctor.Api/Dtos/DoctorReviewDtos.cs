
using System.ComponentModel.DataAnnotations;

namespace iDoctor.Api.Dtos;

public class CreateDoctorReviewRequest
{
    [Range(1, 5)]
    public int Rating { get; set; }

    [Required]
    [MinLength(1)]
    [MaxLength(2000)]
    public string Comment { get; set; } = string.Empty;
}

public class DoctorReviewDto
{
    public Guid Id { get; set; }
    public Guid DoctorId { get; set; }
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class DoctorReviewsResponse
{
    public decimal AverageRating { get; set; }
    public int ReviewCount { get; set; }
    public List<DoctorReviewDto> Reviews { get; set; } = new();
}
