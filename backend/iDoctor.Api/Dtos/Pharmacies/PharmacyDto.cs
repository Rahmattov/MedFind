namespace iDoctor.Api.DTOs.Pharmacies;

public class PharmacyDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? CityName { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? Description { get; set; }
    public string? PhotoUrl { get; set; }
}