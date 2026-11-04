using System.ComponentModel.DataAnnotations;

namespace iDoctor.Api.DTOs.Pharmacies;

public class PharmacyRegistrationRequest
{
    // Данные аптеки
    [Required]
    [MaxLength(200)]
    public string PharmacyName { get; set; } = null!;

    public int? CityId { get; set; }

    [MaxLength(300)]
    public string? Address { get; set; }

    [MaxLength(30)]
    public string? PharmacyPhone { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; }

    // Данные управляющего
    [Required]
    [MaxLength(200)]
    public string ManagerFullName { get; set; } = null!;

    [Required]
    [EmailAddress]
    public string ManagerEmail { get; set; } = null!;

    [Required]
    [Phone]
    public string ManagerPhone { get; set; } = null!;

    [Required]
    [MinLength(8)]
    public string Password { get; set; } = null!;
}