using System.Data;
using iDoctor.Api.Dtos;
using iDoctor.Api.Extensions;
using iDoctor.Domain.Constants;
using iDoctor.Domain.Entities;
using iDoctor.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace iDoctor.Api.Controllers;

[ApiController]
[Route("api/appointments")]
public sealed class AppointmentsController(
    ApplicationDbContext db,
    ILogger<AppointmentsController> logger) : ControllerBase
{
    private sealed record WorkingHoursData(
        int ClinicId,
        string ClinicName,
        string? Address,
        TimeOnly StartTime,
        TimeOnly EndTime,
        short SlotDurationMinutes);

    /// <summary>Lists the open times for a verified doctor on the requested date.</summary>
    [AllowAnonymous]
    [HttpGet("availability")]
    [ProducesResponseType(typeof(IReadOnlyList<AppointmentAvailabilityResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IReadOnlyList<AppointmentAvailabilityResponse>>> GetAvailability(
        [FromQuery] Guid doctorId,
        [FromQuery] DateOnly date,
        CancellationToken cancellationToken)
    {
        if (doctorId == Guid.Empty || date < DateOnly.FromDateTime(DateTime.Now))
            return BadRequest(new { error = "Choose a valid doctor and a date that is not in the past." });

        var workingHours = await db.DoctorWorkingHours
            .AsNoTracking()
            .Where(hours =>
                hours.DoctorId == doctorId &&
                hours.Doctor.IsVerified &&
                hours.Doctor.User.IsActive &&
                hours.Clinic.IsActive &&
                hours.DayOfWeek == (short)date.DayOfWeek &&
                hours.IsActive)
            .Select(hours => new WorkingHoursData(
                hours.ClinicId,
                hours.Clinic.Name,
                hours.Clinic.Address,
                hours.StartTime,
                hours.EndTime,
                hours.SlotDurationMinutes))
            .ToListAsync(cancellationToken);

        var existingSlots = await db.AppointmentSlots
            .AsNoTracking()
            .Where(slot => slot.DoctorId == doctorId && slot.SlotDate == date)
            .Select(slot => new { slot.ClinicId, slot.StartTime, slot.Status })
            .ToListAsync(cancellationToken);

        var unavailable = existingSlots
            .Where(slot => slot.Status != SlotStatus.Available)
            .Select(slot => (slot.ClinicId, slot.StartTime))
            .ToHashSet();

        var currentTime = date == DateOnly.FromDateTime(DateTime.Now)
            ? TimeOnly.FromDateTime(DateTime.Now)
            : (TimeOnly?)null;
        var availability = workingHours
            .Where(hours => hours.SlotDurationMinutes > 0)
            .SelectMany(hours => CreateTimeSlots(hours, unavailable, currentTime))
            .OrderBy(slot => slot.StartTime)
            .ThenBy(slot => slot.ClinicId)
            .ToArray();

        return Ok(availability);
    }

    /// <summary>Lists appointments belonging to the authenticated patient.</summary>
    [Authorize(Roles = Roles.Patient)]
    [HttpGet("me")]
    [ProducesResponseType(typeof(IReadOnlyList<AppointmentResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IReadOnlyList<AppointmentResponse>>> GetMine(
        CancellationToken cancellationToken)
    {
        var patientId = User.GetUserId();
        var appointments = await AppointmentQuery()
            .Where(appointment => appointment.PatientId == patientId)
            .OrderByDescending(appointment => appointment.Slot.SlotDate)
            .ThenByDescending(appointment => appointment.Slot.StartTime)
            .ToListAsync(cancellationToken);

        return Ok(appointments.Select(ToResponse).ToArray());
    }

    /// <summary>Returns an appointment belonging to the authenticated patient.</summary>
    [Authorize(Roles = Roles.Patient)]
    [HttpGet("{id:long}", Name = "GetPatientAppointment")]
    [ProducesResponseType(typeof(AppointmentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AppointmentResponse>> GetById(
        long id,
        CancellationToken cancellationToken)
    {
        var appointment = await AppointmentQuery()
            .FirstOrDefaultAsync(
                item => item.Id == id && item.PatientId == User.GetUserId(),
                cancellationToken);

        return appointment is null ? NotFound() : Ok(ToResponse(appointment));
    }

    /// <summary>Cancels a future appointment belonging to the authenticated patient.</summary>
    [Authorize(Roles = Roles.Patient)]
    [HttpPatch("{id:long}/cancel")]
    [ProducesResponseType(typeof(AppointmentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AppointmentResponse>> Cancel(
        long id,
        CancellationToken cancellationToken)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        var appointment = await db.Appointments
            .Include(item => item.Slot)
            .FirstOrDefaultAsync(
                item => item.Id == id && item.PatientId == User.GetUserId(),
                cancellationToken);

        if (appointment is null)
            return NotFound();

        if (appointment.Status is not (AppointmentStatus.Pending or AppointmentStatus.Confirmed))
            return Conflict(new { error = "This appointment can no longer be cancelled." });

        var today = DateOnly.FromDateTime(DateTime.Now);
        var now = TimeOnly.FromDateTime(DateTime.Now);
        if (appointment.Slot.SlotDate < today ||
            (appointment.Slot.SlotDate == today && appointment.Slot.StartTime <= now))
        {
            return Conflict(new { error = "Past appointments can no longer be cancelled." });
        }

        appointment.Status = AppointmentStatus.CancelledByPatient;
        appointment.UpdatedAt = DateTime.UtcNow;
        appointment.Slot.Status = SlotStatus.Available;

        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        var updated = await AppointmentQuery()
            .FirstAsync(item => item.Id == appointment.Id, cancellationToken);

        return Ok(ToResponse(updated));
    }

    /// <summary>Creates an appointment request for the authenticated patient.</summary>
    [Authorize(Roles = Roles.Patient)]
    [HttpPost]
    [ProducesResponseType(typeof(AppointmentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AppointmentResponse>> Create(
        CreateAppointmentRequest request,
        CancellationToken cancellationToken)
    {
        if (request.DoctorId == Guid.Empty ||
            request.Date < DateOnly.FromDateTime(DateTime.Now) ||
            (request.Date == DateOnly.FromDateTime(DateTime.Now) &&
             request.StartTime <= TimeOnly.FromDateTime(DateTime.Now)))
        {
            return BadRequest(new { error = "Choose a valid doctor and a date that is not in the past." });
        }

        var workingHours = await db.DoctorWorkingHours
            .AsNoTracking()
            .FirstOrDefaultAsync(hours =>
                hours.DoctorId == request.DoctorId &&
                hours.ClinicId == request.ClinicId &&
                hours.Doctor.IsVerified &&
                hours.Doctor.User.IsActive &&
                hours.Clinic.IsActive &&
                hours.DayOfWeek == (short)request.Date.DayOfWeek &&
                hours.IsActive &&
                request.StartTime >= hours.StartTime &&
                request.StartTime.AddMinutes(hours.SlotDurationMinutes) <= hours.EndTime,
                cancellationToken);

        if (workingHours is null)
            return BadRequest(new { error = "The selected doctor has no available appointment at this clinic and time." });

        await using var transaction = await db.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        try
        {
            var slot = await db.AppointmentSlots.FirstOrDefaultAsync(
                item => item.DoctorId == request.DoctorId &&
                        item.ClinicId == request.ClinicId &&
                        item.SlotDate == request.Date &&
                        item.StartTime == request.StartTime,
                cancellationToken);

            if (slot is not null && slot.Status != SlotStatus.Available)
                return Conflict(new { error = "This appointment time has already been booked." });

            if (slot is null)
            {
                slot = new AppointmentSlot
                {
                    DoctorId = request.DoctorId,
                    ClinicId = request.ClinicId,
                    SlotDate = request.Date,
                    StartTime = request.StartTime,
                    EndTime = request.StartTime.AddMinutes(workingHours.SlotDurationMinutes)
                };
                db.AppointmentSlots.Add(slot);
                await db.SaveChangesAsync(cancellationToken);
            }

            var appointment = new Appointment
            {
                SlotId = slot.Id,
                PatientId = User.GetUserId(),
                DoctorId = request.DoctorId,
                ClinicId = request.ClinicId,
                Status = AppointmentStatus.Pending,
                Reason = request.Reason?.Trim()
            };

            slot.Status = SlotStatus.Booked;
            db.Appointments.Add(appointment);
            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            var created = await AppointmentQuery()
                .FirstAsync(item => item.Id == appointment.Id, cancellationToken);
            var response = ToResponse(created);

            return CreatedAtRoute("GetPatientAppointment", new { id = appointment.Id }, response);
        }
        catch (DbUpdateException exception)
        {
            logger.LogWarning(exception, "Appointment slot was booked concurrently.");
            return Conflict(new { error = "This appointment time has already been booked. Choose another time." });
        }
    }

    private IQueryable<Appointment> AppointmentQuery() =>
        db.Appointments
            .AsNoTracking()
            .Include(appointment => appointment.Doctor)
                .ThenInclude(doctor => doctor.User)
            .Include(appointment => appointment.Doctor)
                .ThenInclude(doctor => doctor.Specialties)
            .Include(appointment => appointment.Clinic)
            .Include(appointment => appointment.Slot);

    private static IEnumerable<AppointmentAvailabilityResponse> CreateTimeSlots(
        WorkingHoursData hours,
        HashSet<(int ClinicId, TimeOnly StartTime)> unavailable,
        TimeOnly? earliestStartTime)
    {
        var timeSlots = new List<AppointmentAvailabilityResponse>();
        var startTime = hours.StartTime;
        var endTime = hours.EndTime;
        var duration = hours.SlotDurationMinutes;
        var clinicId = hours.ClinicId;
        var clinicName = hours.ClinicName;
        var clinicAddress = hours.Address;

        while (startTime.AddMinutes(duration) <= endTime)
        {
            if ((!earliestStartTime.HasValue || startTime > earliestStartTime.Value) &&
                !unavailable.Contains((clinicId, startTime)))
            {
                timeSlots.Add(new AppointmentAvailabilityResponse(
                    clinicId,
                    clinicName,
                    clinicAddress,
                    startTime,
                    startTime.AddMinutes(duration)));
            }

            startTime = startTime.AddMinutes(duration);
        }

        return timeSlots;
    }

    private static AppointmentResponse ToResponse(Appointment appointment) =>
        new(
            appointment.Id,
            appointment.DoctorId,
            appointment.Doctor.User.FullName,
            appointment.Doctor.Specialties.FirstOrDefault()?.Name ?? "Specialty not specified",
            appointment.Clinic.Name,
            appointment.Clinic.Address,
            appointment.Slot.SlotDate,
            appointment.Slot.StartTime,
            appointment.Slot.EndTime,
            appointment.Status.ToString(),
            appointment.Reason,
            new DateTimeOffset(DateTime.SpecifyKind(appointment.CreatedAt, DateTimeKind.Utc)));
}
