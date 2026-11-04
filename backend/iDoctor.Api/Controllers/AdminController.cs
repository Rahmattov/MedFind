
using iDoctor.Api.Dtos;
using iDoctor.Api.Extensions;
using iDoctor.Domain.Constants;
using iDoctor.Domain.Entities;
using iDoctor.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace iDoctor.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = Roles.Admin)]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<User> _userManager;

    public AdminController(
        ApplicationDbContext db,
        UserManager<User> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    public sealed record SetDoctorClinicRequest(int ClinicId);

    public sealed record CreateWorkingHoursRequest(
        int ClinicId,
        short DayOfWeek,
        TimeOnly StartTime,
        TimeOnly EndTime,
        short SlotDurationMinutes = 30
    );

    // GET /api/admin/pharmacy-requests?status=Pending
    [Authorize(Roles = Roles.Admin)]
    [HttpGet("pharmacy-requests")]
    public async Task<IActionResult> GetPharmacyRequests(
        [FromQuery] string status = "Pending")
    {
        if (!Enum.TryParse<PharmacyApprovalStatus>(
            status, true, out var approvalStatus))
        {
            return BadRequest(new { error = "Invalid pharmacy status." });
        }

        var pharmacies = await _db.Pharmacies
            .AsNoTracking()
            .Where(p => p.ApprovalStatus == approvalStatus)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.CityId,
                CityName = p.City != null ? p.City.Name : null,
                p.Address,
                p.Phone,
                p.Description,
                p.ApprovalStatus,
                p.RejectionReason,
                p.CreatedAt,

                Manager = _userManager.Users
                    .Where(u => u.ManagedPharmacyId == p.Id)
                    .Select(u => new
                    {
                        u.Id,
                        u.FullName,
                        u.Email,
                        u.PhoneNumber
                    })
                    .FirstOrDefault()
            })
            .ToListAsync();

        return Ok(pharmacies);
    }

    // POST /api/admin/pharmacy-requests/4/approve
    [Authorize(Roles = Roles.Admin)]
    [HttpPost("pharmacy-requests/{id:int}/approve")]
    public async Task<IActionResult> ApprovePharmacy(int id)
    {
        var pharmacy = await _db.Pharmacies
            .FirstOrDefaultAsync(p => p.Id == id);

        if (pharmacy is null)
            return NotFound();

        if (pharmacy.ApprovalStatus == PharmacyApprovalStatus.Approved)
            return BadRequest(new { error = "Pharmacy is already approved." });

        var manager = await _userManager.Users
            .FirstOrDefaultAsync(u => u.ManagedPharmacyId == pharmacy.Id);

        if (manager is null)
            return BadRequest(new { error = "Pharmacy manager not found." });

        await using var tx = await _db.Database.BeginTransactionAsync();

        manager.IsActive = true;
        manager.UpdatedAt = DateTime.UtcNow;

        var updateResult = await _userManager.UpdateAsync(manager);

        if (!updateResult.Succeeded)
            return BadRequest(updateResult.Errors);

        if (!await _userManager.IsInRoleAsync(
            manager, Roles.PharmacyManager))
        {
            var roleResult = await _userManager.AddToRoleAsync(
                manager, Roles.PharmacyManager);

            if (!roleResult.Succeeded)
                return BadRequest(roleResult.Errors);
        }

        pharmacy.ApprovalStatus = PharmacyApprovalStatus.Approved;
        pharmacy.RejectionReason = null;
        pharmacy.IsActive = true;

        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(new
        {
            message = "Pharmacy approved successfully.",
            pharmacyId = pharmacy.Id,
            status = pharmacy.ApprovalStatus.ToString()
        });
    }

    // POST /api/admin/pharmacy-requests/4/reject
    [Authorize(Roles = Roles.Admin)]
    [HttpPost("pharmacy-requests/{id:int}/reject")]
    public async Task<IActionResult> RejectPharmacy(
        int id,
        [FromBody] RejectClinicRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Reason) ||
            request.Reason.Trim().Length < 3)
        {
            return BadRequest(new { error = "Rejection reason is required." });
        }

        var pharmacy = await _db.Pharmacies
            .FirstOrDefaultAsync(p => p.Id == id);

        if (pharmacy is null)
            return NotFound();

        if (pharmacy.ApprovalStatus == PharmacyApprovalStatus.Approved)
            return BadRequest(new { error = "Approved pharmacy cannot be rejected." });

        await using var tx = await _db.Database.BeginTransactionAsync();

        var manager = await _userManager.Users
            .FirstOrDefaultAsync(u => u.ManagedPharmacyId == pharmacy.Id);

        if (manager is not null)
        {
            manager.IsActive = false;
            manager.UpdatedAt = DateTime.UtcNow;

            if (await _userManager.IsInRoleAsync(
                manager, Roles.PharmacyManager))
            {
                var roleResult = await _userManager.RemoveFromRoleAsync(
                    manager, Roles.PharmacyManager);

                if (!roleResult.Succeeded)
                    return BadRequest(roleResult.Errors);
            }

            var updateResult = await _userManager.UpdateAsync(manager);

            if (!updateResult.Succeeded)
                return BadRequest(updateResult.Errors);
        }

        pharmacy.ApprovalStatus = PharmacyApprovalStatus.Rejected;
        pharmacy.RejectionReason = request.Reason.Trim();
        pharmacy.IsActive = false;

        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(new
        {
            message = "Pharmacy application rejected.",
            pharmacyId = pharmacy.Id,
            status = pharmacy.ApprovalStatus.ToString()
        });
    }

    // GET /api/admin/clients?q=ali
    [HttpGet("clients")]
    public async Task<IActionResult> GetClients(
        [FromQuery] string? q)
    {
        var query = _db.Patients
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var pattern = q.ToContainsPattern();

            query = query.Where(p =>
                EF.Functions.ILike(p.User.FullName, pattern) ||
                (p.User.Email != null &&
                 EF.Functions.ILike(p.User.Email, pattern)) ||
                (p.User.PhoneNumber != null &&
                 EF.Functions.ILike(p.User.PhoneNumber, pattern)));
        }

        var clients = await query
            .OrderByDescending(p => p.User.CreatedAt)
            .Select(p => new
            {
                id = p.UserId,
                fullName = p.User.FullName,
                email = p.User.Email,
                phoneNumber = p.User.PhoneNumber,
                cityName = p.City != null ? p.City.Name : null,
                dateOfBirth = p.DateOfBirth,
                gender = p.Gender,
                isActive = p.User.IsActive,
                createdAt = p.User.CreatedAt,
                appointmentsCount = p.Appointments.Count()
            })
            .ToListAsync();

        return Ok(clients);
    }

    // GET /api/admin/clients/{id}
    [HttpGet("clients/{id:guid}")]
    public async Task<IActionResult> GetClient(Guid id)
    {
        var client = await _db.Patients
            .AsNoTracking()
            .Where(p => p.UserId == id)
            .Select(p => new
            {
                id = p.UserId,
                fullName = p.User.FullName,
                email = p.User.Email,
                phoneNumber = p.User.PhoneNumber,
                cityName = p.City != null ? p.City.Name : null,
                dateOfBirth = p.DateOfBirth,
                gender = p.Gender,
                isActive = p.User.IsActive,
                createdAt = p.User.CreatedAt,
                updatedAt = p.User.UpdatedAt,
                appointmentsCount = p.Appointments.Count()
            })
            .FirstOrDefaultAsync();

        if (client is null)
            return NotFound(new { error = "Client not found." });

        return Ok(client);
    }

    // PUT /api/admin/clients/{id}/active
    [HttpPut("clients/{id:guid}/active")]
    public async Task<IActionResult> SetClientActive(
        Guid id,
        [FromBody] SetActiveRequest request)
    {
        var patient = await _db.Patients
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.UserId == id);

        if (patient is null)
            return NotFound(new { error = "Client not found." });

        patient.User.IsActive = request.IsActive;
        patient.User.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return NoContent();
    }


    // GET /api/admin/doctors?verified=false&q=ali
    [HttpGet("doctors")]
    public async Task<ActionResult<List<AdminDoctorDto>>> GetDoctors(
        [FromQuery] bool? verified,
        [FromQuery] string? q)
    {
        var query = _db.Doctors.AsNoTracking().AsQueryable();

        if (verified.HasValue)
            query = query.Where(d => d.IsVerified == verified.Value);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var pattern = q.ToContainsPattern();
            query = query.Where(d =>
                EF.Functions.ILike(d.User.FullName, pattern) ||
                EF.Functions.ILike(d.User.Email!, pattern));
        }

        var list = await query
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new AdminDoctorDto(
                d.UserId,
                d.User.FullName,
                d.User.Email!,
                d.User.PhoneNumber!,
                d.IsVerified,
                d.CreatedAt))
            .ToListAsync();

        return Ok(list);
    }




[HttpGet("doctors-without-clinics")]
public async Task<IActionResult> GetDoctorsWithoutClinics()
{
    var doctors = await _db.Doctors
        .AsNoTracking()
        .Where(d => !d.Clinics.Any())
        .OrderBy(d => d.User.FullName)
        .Select(d => new
        {
            id = d.UserId,
            fullName = d.User.FullName,
            email = d.User.Email,
            isVerified = d.IsVerified,
            isActive = d.User.IsActive
        })
        .ToListAsync();

    return Ok(doctors);
}

    [HttpGet("assignable-clinics")]
    public async Task<IActionResult> GetAssignableClinics()
    {
        var clinics = await _db.Clinics
            .AsNoTracking()
            .Where(c =>
                c.IsActive &&
                c.ApprovalStatus == ClinicApprovalStatus.Approved)
            .OrderBy(c => c.Name)
            .Select(c => new
            {
                id = c.Id,
                name = c.Name,
                cityName = c.City != null ? c.City.Name : null
            })
            .ToListAsync();

        return Ok(clinics);
    }

    [HttpPut("doctors/{id:guid}/verification")]
    public async Task<IActionResult> SetVerification(
        Guid id, SetVerificationRequest request)
    {
        var doctor = await _db.Doctors
            .FirstOrDefaultAsync(d => d.UserId == id);

        if (doctor is null)
            return NotFound();

        doctor.IsVerified = request.IsVerified;
        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpPut("doctors/{id:guid}/active")]
    public async Task<IActionResult> SetActive(
        Guid id, SetActiveRequest request)
    {
        var doctor = await _db.Doctors
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.UserId == id);

        if (doctor is null)
            return NotFound();

        doctor.User.IsActive = request.IsActive;
        doctor.User.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpPut("doctors/{id:guid}/clinics/{clinicId:int}")]
    public async Task<IActionResult> AssignClinic(
        Guid id, int clinicId)
    {
        var doctor = await _db.Doctors
            .Include(d => d.Clinics)
            .FirstOrDefaultAsync(d => d.UserId == id);

        if (doctor is null)
            return NotFound(new { error = "Doctor not found." });

        var clinic = await _db.Clinics
            .FirstOrDefaultAsync(c =>
                c.Id == clinicId &&
                c.IsActive &&
                c.ApprovalStatus == ClinicApprovalStatus.Approved);

        if (clinic is null)
            return NotFound(new { error = "Approved active clinic not found." });

        if (!doctor.Clinics.Any(c => c.Id == clinicId))
        {
            doctor.Clinics.Add(clinic);
            await _db.SaveChangesAsync();
        }

        return Ok(new
        {
            message = "Doctor assigned to clinic.",
            doctorId = id,
            clinicId
        });
    }

    [HttpPost("doctors/{id:guid}/working-hours")]
    public async Task<IActionResult> CreateWorkingHours(
        Guid id, [FromBody] CreateWorkingHoursRequest request)
    {
        if (request.ClinicId <= 0 ||
            request.DayOfWeek < 0 ||
            request.DayOfWeek > 6 ||
            request.StartTime >= request.EndTime ||
            request.SlotDurationMinutes <= 0 ||
            request.SlotDurationMinutes > 480)
        {
            return BadRequest(new
            {
                error = "Invalid working-hours details."
            });
        }

        var doctor = await _db.Doctors
            .Include(d => d.Clinics)
            .FirstOrDefaultAsync(d => d.UserId == id);

        if (doctor is null)
            return NotFound(new { error = "Doctor not found." });

        if (!doctor.IsVerified ||
            !await _db.Users.AnyAsync(u => u.Id == id && u.IsActive))
        {
            return BadRequest(new
            {
                error = "Doctor must be verified and active."
            });
        }

        var clinic = await _db.Clinics.FirstOrDefaultAsync(c =>
            c.Id == request.ClinicId &&
            c.IsActive &&
            c.ApprovalStatus == ClinicApprovalStatus.Approved);

        if (clinic is null)
            return NotFound(new { error = "Approved active clinic not found." });

        if (!doctor.Clinics.Any(c => c.Id == request.ClinicId))
            doctor.Clinics.Add(clinic);

        var schedules = await _db.DoctorWorkingHours
            .Where(w =>
                w.DoctorId == id &&
                w.ClinicId == request.ClinicId &&
                w.DayOfWeek == request.DayOfWeek &&
                w.IsActive)
            .ToListAsync();

        if (schedules.Any(w =>
            request.StartTime < w.EndTime &&
            request.EndTime > w.StartTime))
        {
            return Conflict(new
            {
                error = "Working hours overlap with an existing schedule."
            });
        }

        var workingHours = new DoctorWorkingHours
        {
            DoctorId = id,
            ClinicId = request.ClinicId,
            DayOfWeek = request.DayOfWeek,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            SlotDurationMinutes = request.SlotDurationMinutes,
            IsActive = true
        };

        _db.DoctorWorkingHours.Add(workingHours);
        await _db.SaveChangesAsync();

        return Created(
            $"/api/admin/doctors/{id}/working-hours",
            new
            {
                workingHours.Id,
                workingHours.DoctorId,
                workingHours.ClinicId,
                workingHours.DayOfWeek,
                startTime = workingHours.StartTime.ToString("HH:mm"),
                endTime = workingHours.EndTime.ToString("HH:mm"),
                workingHours.SlotDurationMinutes
            });
    }

    // GET /api/admin/clinic-requests?status=Pending
    [HttpGet("clinic-requests")]
    public async Task<IActionResult> GetClinicRequests(
        [FromQuery] string status = "Pending")
    {
        if (!Enum.TryParse<ClinicApprovalStatus>(
            status, true, out var parsedStatus))
        {
            return BadRequest(new { error = "Invalid clinic status." });
        }

        var requests = await _db.Clinics
            .AsNoTracking()
            .Where(c => c.ApprovalStatus == parsedStatus)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.CityId,
                CityName = c.City != null ? c.City.Name : null,
                c.Address,
                c.Phone,
                c.Description,
                Status = c.ApprovalStatus.ToString(),
                c.RejectionReason,
                c.ManagerUserId,
                ManagerName = _db.Users
                    .Where(u => u.Id == c.ManagerUserId)
                    .Select(u => u.FullName)
                    .FirstOrDefault(),
                ManagerEmail = _db.Users
                    .Where(u => u.Id == c.ManagerUserId)
                    .Select(u => u.Email)
                    .FirstOrDefault()
            })
            .ToListAsync();

        return Ok(requests);
    }

    // POST /api/admin/clinic-requests/{id}/approve
    [HttpPost("clinic-requests/{id:int}/approve")]
    public async Task<IActionResult> ApproveClinic(int id)
    {
        await using var tx = await _db.Database.BeginTransactionAsync();

        var clinic = await _db.Clinics
            .FirstOrDefaultAsync(c => c.Id == id);

        if (clinic is null)
            return NotFound(new { error = "Clinic not found." });

        if (clinic.ApprovalStatus == ClinicApprovalStatus.Approved)
            return Conflict(new { error = "Clinic is already approved." });

        if (clinic.ManagerUserId is null)
            return BadRequest(new { error = "Clinic has no manager account." });

        var manager = await _userManager.FindByIdAsync(
            clinic.ManagerUserId.Value.ToString());

        if (manager is null)
            return BadRequest(new { error = "Manager account not found." });

        manager.ManagedClinicId = clinic.Id;
        manager.IsActive = true;
        manager.UpdatedAt = DateTime.UtcNow;

        var updateResult = await _userManager.UpdateAsync(manager);

        if (!updateResult.Succeeded)
        {
            return BadRequest(new
            {
                errors = updateResult.Errors.Select(e => e.Description)
            });
        }

        if (!await _userManager.IsInRoleAsync(manager, Roles.ClinicManager))
        {
            var roleResult = await _userManager.AddToRoleAsync(
                manager, Roles.ClinicManager);

            if (!roleResult.Succeeded)
            {
                return BadRequest(new
                {
                    errors = roleResult.Errors.Select(e => e.Description)
                });
            }
        }

        clinic.ApprovalStatus = ClinicApprovalStatus.Approved;
        clinic.RejectionReason = null;
        clinic.IsActive = true;

        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(new
        {
            message = "Clinic approved.",
            clinicId = clinic.Id,
            managerId = manager.Id
        });
    }

    // POST /api/admin/clinic-requests/{id}/reject
    [HttpPost("clinic-requests/{id:int}/reject")]
    public async Task<IActionResult> RejectClinic(
        int id, [FromBody] RejectClinicRequest request)
    {
        await using var tx = await _db.Database.BeginTransactionAsync();

        var clinic = await _db.Clinics
            .FirstOrDefaultAsync(c => c.Id == id);

        if (clinic is null)
            return NotFound(new { error = "Clinic not found." });

        if (clinic.ApprovalStatus == ClinicApprovalStatus.Approved)
            return Conflict(new
            {
                error = "Approved clinics cannot be rejected here."
            });

        if (clinic.ManagerUserId is not null)
        {
            var manager = await _userManager.FindByIdAsync(
                clinic.ManagerUserId.Value.ToString());

            if (manager is not null)
            {
                manager.IsActive = false;
                manager.ManagedClinicId = null;

                var updateResult = await _userManager.UpdateAsync(manager);

                if (!updateResult.Succeeded)
                {
                    return BadRequest(new
                    {
                        errors = updateResult.Errors.Select(e => e.Description)
                    });
                }

                if (await _userManager.IsInRoleAsync(
                    manager, Roles.ClinicManager))
                {
                    var removeResult = await _userManager.RemoveFromRoleAsync(
                        manager, Roles.ClinicManager);

                    if (!removeResult.Succeeded)
                    {
                        return BadRequest(new
                        {
                            errors = removeResult.Errors.Select(e => e.Description)
                        });
                    }
                }
            }
        }

        clinic.ApprovalStatus = ClinicApprovalStatus.Rejected;
        clinic.RejectionReason = request.Reason.Trim();

        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(new
        {
            message = "Clinic application rejected.",
            clinicId = clinic.Id,
            reason = clinic.RejectionReason
        });
    }
}
