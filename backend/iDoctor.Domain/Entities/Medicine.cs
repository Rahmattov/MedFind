namespace iDoctor.Domain.Entities;

public class Medicine
{
    public int Id { get; set; }

    // Связь с аптекой
    public int PharmacyId { get; set; }
    public Pharmacy Pharmacy { get; set; } = null!;

    // Основная информация
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string? Category { get; set; }

    // Характеристики лекарства
    public string? Manufacturer { get; set; }
    public string? Dosage { get; set; }
    public string? Form { get; set; }

    // Цена и наличие
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }

    // Фотография
    public string? PhotoUrl { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}