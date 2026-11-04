using System.ComponentModel.DataAnnotations;

namespace iDoctor.Api.DTOs.Medicines;

public class CreateMedicineDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = null!;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [MaxLength(100)]
    public string? Category { get; set; }

    [MaxLength(200)]
    public string? Manufacturer { get; set; }

    [MaxLength(100)]
    public string? Dosage { get; set; }

    [MaxLength(100)]
    public string? Form { get; set; }

    [Range(typeof(decimal), "0.01", "10000000")]
    public decimal Price { get; set; }

    [Range(0, 1000000)]
    public int StockQuantity { get; set; }

    [MaxLength(1000)]
    public string? PhotoUrl { get; set; }
}