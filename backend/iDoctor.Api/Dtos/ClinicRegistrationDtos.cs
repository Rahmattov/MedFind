
using System.ComponentModel.DataAnnotations;

namespace iDoctor.Api.Dtos;

public class ClinicRegistrationRequest
{
    [Required, MaxLength(200)]
    public string ClinicName { get; set; } = null!;

    public int? CityId { get; set; }

    [Required, MaxLength(300)]
    public string Address { get; set; } = null!;

    [MaxLength(20)]
    public string? ClinicPhone { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Required, MaxLength(200)]
    public string ManagerFullName { get; set; } = null!;

    [Required, EmailAddress, MaxLength(256)]
    public string ManagerEmail { get; set; } = null!;

    [Required, Phone, MaxLength(20)]
    public string ManagerPhone { get; set; } = null!;

    [Required, MinLength(8), MaxLength(100)]
    public string Password { get; set; } = null!;
}

public class RejectClinicRequest
{
    [Required, MinLength(3), MaxLength(1000)]
    public string Reason { get; set; } = null!;
}
