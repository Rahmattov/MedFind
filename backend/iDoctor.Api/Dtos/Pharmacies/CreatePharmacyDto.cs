using System.ComponentModel.DataAnnotations;

namespace iDoctor.Api.DTOs.Pharmacies;

public class CreatePharmacyDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = null!;

    public int? CityId { get; set; }

    [MaxLength(300)]
    public string? Address { get; set; }

    [MaxLength(30)]
    public string? Phone { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; }

    [MaxLength(1000)]
    public string? PhotoUrl { get; set; }
}