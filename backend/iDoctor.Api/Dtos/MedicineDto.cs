namespace iDoctor.Api.DTOs.Medicines;

public class MedicineDto
{
    public int Id { get; set; }
    public int PharmacyId { get; set; }

    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string? Category { get; set; }

    public string? Manufacturer { get; set; }
    public string? Dosage { get; set; }
    public string? Form { get; set; }

    public decimal Price { get; set; }
    public int StockQuantity { get; set; }

    public string? PhotoUrl { get; set; }
}