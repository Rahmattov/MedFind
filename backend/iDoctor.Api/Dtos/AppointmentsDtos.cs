using System.ComponentModel.DataAnnotations;

namespace iDoctor.Api.Dtos;

/// <summary>Request to create a patient appointment.</summary>
public sealed record CreateAppointmentRequest
{
    [Required]
    public required Guid DoctorId { get; init; }

    [Range(1, int.MaxValue)]
    public required int ClinicId { get; init; }

    [Required]
    public required DateOnly Date { get; init; }

    [Required]
    public required TimeOnly StartTime { get; init; }

    [MaxLength(500)]
    public string? Reason { get; init; }
}

/// <summary>A bookable appointment time at a clinic.</summary>
public sealed record AppointmentAvailabilityResponse(
    int ClinicId,
    string ClinicName,
    string? ClinicAddress,
    TimeOnly StartTime,
    TimeOnly EndTime);

/// <summary>Appointment details returned to a patient.</summary>
public sealed record AppointmentResponse(
    long Id,
    Guid DoctorId,
    string DoctorName,
    string Specialty,
    string ClinicName,
    string? ClinicAddress,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string Status,
    string? Reason,
    DateTimeOffset CreatedAt);
