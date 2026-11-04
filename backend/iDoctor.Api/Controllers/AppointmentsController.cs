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
            request.ClinicId <= 0 ||
            (request.Reason?.Length ?? 0) > 500 ||
            request.Date < DateOnly.FromDateTime(DateTime.Now) ||
            (request.Date == DateOnly.FromDateTime(DateTime.Now) &&
             request.StartTime <= TimeOnly.FromDateTime(DateTime.Now)))
        {
            return BadRequest(new { error = "Choose a valid doctor and a date that is not in the past." });
        }

        var patientId = User.GetUserId();
        if (!await db.Patients.AnyAsync(p => p.UserId == patientId, cancellationToken))
            return NotFound(new { error = "Patient profile not found." });

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
                hours.SlotDurationMinutes > 0 &&
                request.StartTime >= hours.StartTime &&
                (request.StartTime - hours.StartTime).Ticks %
                    TimeSpan.FromMinutes(hours.SlotDurationMinutes).Ticks == 0 &&
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

            if (slot is not null &&
                (slot.Status != SlotStatus.Available ||
                 await db.Appointments.AnyAsync(a => a.SlotId == slot.Id, cancellationToken)))
                return Conflict(new { error = "This appointment time has already been booked." });

            if (slot is null)
            {
                slot = new AppointmentSlot
                {
                    DoctorId = request.DoctorId,
                    ClinicId = request.ClinicId,
                    SlotDate = request.Date,
                    StartTime = request.StartTime,
                    EndTime = request.StartTime.AddMinutes(workingHours.SlotDurationMinutes),
                    Status = SlotStatus.Available
                };
                db.AppointmentSlots.Add(slot);
                await db.SaveChangesAsync(cancellationToken);
            }

            var appointment = new Appointment
            {
                SlotId = slot.Id,
                PatientId = patientId,
                DoctorId = request.DoctorId,
                ClinicId = request.ClinicId,
                Status = AppointmentStatus.Pending,
                Reason = request.Reason?.Trim(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
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
            await transaction.RollbackAsync(cancellationToken);
            logger.LogWarning(exception, "Appointment slot was booked concurrently.");
            return Conflict(new { error = "This appointment time has already been booked. Choose another time." });
        }
    }

    // Compatibility endpoint for the clinic-specific slot picker.
    [AllowAnonymous]
    [HttpGet("slots")]
    public async Task<IActionResult> GetSlots(
        [FromQuery] Guid doctorId,
        [FromQuery] DateOnly date,
        [FromQuery] int clinicId,
        CancellationToken cancellationToken)
    {
        if (doctorId == Guid.Empty || clinicId <= 0 || date < DateOnly.FromDateTime(DateTime.Today))
            return BadRequest(new { error = "Invalid doctor, clinic or date." });

        var doctorExists = await db.Doctors.AnyAsync(d =>
            d.UserId == doctorId && d.IsVerified && d.User.IsActive &&
            d.WorkingHours.Any(w => w.ClinicId == clinicId && w.IsActive && w.Clinic.IsActive),
            cancellationToken);
        if (!doctorExists)
            return NotFound(new { error = "Doctor or clinic not found." });

        var schedules = await db.DoctorWorkingHours.AsNoTracking()
            .Where(w => w.DoctorId == doctorId && w.ClinicId == clinicId &&
                        w.DayOfWeek == (short)date.DayOfWeek && w.IsActive && w.Clinic.IsActive)
            .ToListAsync(cancellationToken);
        var existingSlots = await db.AppointmentSlots.AsNoTracking()
            .Where(s => s.DoctorId == doctorId && s.ClinicId == clinicId && s.SlotDate == date)
            .ToListAsync(cancellationToken);
        var bookedSlotIds = await db.Appointments.AsNoTracking()
            .Where(a => a.Slot.DoctorId == doctorId && a.Slot.ClinicId == clinicId &&
                        a.Slot.SlotDate == date &&
                        (a.Status == AppointmentStatus.Pending || a.Status == AppointmentStatus.Confirmed))
            .Select(a => a.SlotId).ToListAsync(cancellationToken);
        var booked = bookedSlotIds.ToHashSet();
        var result = new List<object>();
        var seen = new HashSet<TimeOnly>();
        foreach (var schedule in schedules)
        {
            if (schedule.SlotDurationMinutes <= 0) continue;
            var start = schedule.StartTime;
            while (start.AddMinutes(schedule.SlotDurationMinutes) <= schedule.EndTime)
            {
                var end = start.AddMinutes(schedule.SlotDurationMinutes);
                var existing = existingSlots.FirstOrDefault(s => s.StartTime == start);
                if (seen.Add(start) &&
                    (existing is null || (existing.Status == SlotStatus.Available && !booked.Contains(existing.Id))) &&
                    (date != DateOnly.FromDateTime(DateTime.Today) || start > TimeOnly.FromDateTime(DateTime.Now)))
                {
                    result.Add(new {
                        slotId = existing?.Id,
                        date,
                        startTime = start.ToString("HH:mm"),
                        endTime = end.ToString("HH:mm"),
                        clinicId
                    });
                }
                start = end;
            }
        }
        return Ok(result);
    }

    [Authorize(Roles = Roles.Patient)]
    [HttpGet("my")]
    public async Task<IActionResult> GetMyAppointments(CancellationToken cancellationToken)
    {
        var patientId = User.GetUserId();
        var appointments = await db.Appointments.AsNoTracking()
            .Where(a => a.PatientId == patientId)
            .OrderByDescending(a => a.Slot.SlotDate)
            .ThenByDescending(a => a.Slot.StartTime)
            .Select(a => new {
                a.Id, a.Status, a.Reason,
                date = a.Slot.SlotDate,
                startTime = a.Slot.StartTime.ToString(),
                endTime = a.Slot.EndTime.ToString(),
                doctorName = a.Doctor.User.FullName,
                clinicName = a.Clinic.Name,
                clinicAddress = a.Clinic.Address
            }).ToListAsync(cancellationToken);
        return Ok(appointments);
    }

    [HttpPatch("{id:long}/confirm")]
    [Authorize(Roles = Roles.Admin + "," + Roles.ClinicManager)]
    public async Task<IActionResult> Confirm(long id, CancellationToken cancellationToken)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var appointment = await db.Appointments.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (appointment is null) return NotFound(new { error = "Appointment not found." });
        if (!User.IsInRole(Roles.Admin))
        {
            var userId = User.GetUserId();
            var clinicId = await db.Users.Where(u => u.Id == userId && u.IsActive)
                .Select(u => u.ManagedClinicId).SingleOrDefaultAsync(cancellationToken);
            if (clinicId is null || clinicId.Value != appointment.ClinicId) return Forbid();
        }
        if (appointment.Status != AppointmentStatus.Pending)
            return Conflict(new { error = "Only pending appointments can be confirmed." });
        appointment.Status = AppointmentStatus.Confirmed;
        appointment.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Ok(new { appointment.Id, appointment.Status, message = "Appointment confirmed successfully." });
    }

    [HttpGet("clinic")]
    [Authorize(Roles = Roles.ClinicManager)]
    public async Task<IActionResult> GetClinicAppointments(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var clinicId = await db.Users.Where(u => u.Id == userId && u.IsActive)
            .Select(u => u.ManagedClinicId).SingleOrDefaultAsync(cancellationToken);
        if (clinicId is null) return Forbid();
        var appointments = await db.Appointments.AsNoTracking()
            .Where(a => a.ClinicId == clinicId.Value)
            .OrderByDescending(a => a.Slot.SlotDate)
            .ThenBy(a => a.Slot.StartTime)
            .Select(a => new {
                a.Id, a.Status, a.Reason, a.CancelReason,
                date = a.Slot.SlotDate,
                startTime = a.Slot.StartTime.ToString("HH:mm"),
                endTime = a.Slot.EndTime.ToString("HH:mm"),
                doctorName = a.Doctor.User.FullName,
                patientName = a.Patient.User.FullName,
                patientPhone = a.Patient.User.PhoneNumber,
                clinicName = a.Clinic.Name
            }).ToListAsync(cancellationToken);
        return Ok(appointments);
    }

    public sealed record RejectAppointmentRequest(string Reason);

    [HttpPatch("{id:long}/reject")]
    [Authorize(Roles = Roles.Admin + "," + Roles.ClinicManager)]
    public async Task<IActionResult> Reject(long id, [FromBody] RejectAppointmentRequest request,
        CancellationToken cancellationToken)
    {
        var reason = request?.Reason?.Trim();
        if (string.IsNullOrWhiteSpace(reason) || reason.Length > 500)
            return BadRequest(new { error = "A rejection reason of 1-500 characters is required." });
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var appointment = await db.Appointments.Include(a => a.Slot)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (appointment is null) return NotFound(new { error = "Appointment not found." });
        if (!User.IsInRole(Roles.Admin))
        {
            var userId = User.GetUserId();
            var clinicId = await db.Users.Where(u => u.Id == userId && u.IsActive)
                .Select(u => u.ManagedClinicId).SingleOrDefaultAsync(cancellationToken);
            if (clinicId is null || clinicId.Value != appointment.ClinicId) return Forbid();
        }
        if (appointment.Status != AppointmentStatus.Pending)
            return Conflict(new { error = "Only pending appointments can be rejected." });
        appointment.Status = AppointmentStatus.CancelledByDoctor;
        appointment.CancelReason = reason;
        appointment.UpdatedAt = DateTime.UtcNow;
        appointment.Slot.Status = SlotStatus.Available;
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Ok(new { appointment.Id, appointment.Status, appointment.CancelReason,
            message = "Appointment rejected successfully." });
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
