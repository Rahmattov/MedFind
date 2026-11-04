namespace iDoctor.Domain.Entities;
public class Pharmacy {
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public int? CityId { get; set; }
    public City? City { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? Description { get; set; }
    public string? PhotoUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public PharmacyApprovalStatus ApprovalStatus { get; set; } = PharmacyApprovalStatus.Pending;
    public string? RejectionReason { get; set; }
    public ICollection<Medicine> Medicines { get; set; } = new List<Medicine>(); }