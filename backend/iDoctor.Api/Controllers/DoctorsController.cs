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
[Route("api/doctors")]
public class DoctorsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public DoctorsController(ApplicationDbContext db) => _db = db;

    // Public: only verified, active doctors are visible
    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<DoctorProfileDto>> GetById(Guid id)
    {
        var doctor = await DoctorQuery()
            .FirstOrDefaultAsync(d => d.UserId == id && d.IsVerified && d.User.IsActive);
        return doctor is null ? NotFound() : Ok(ToDto(doctor));
    }

    [Authorize(Roles = Roles.Doctor)]
    [HttpGet("me")]
    public async Task<ActionResult<DoctorProfileDto>> GetMe()
    {
        var doctor = await DoctorQuery().FirstOrDefaultAsync(d => d.UserId == User.GetUserId());
        return doctor is null ? NotFound() : Ok(ToDto(doctor));
    }

    [Authorize(Roles = Roles.Doctor)]
    [HttpPut("me")]
    public async Task<ActionResult<DoctorProfileDto>> UpdateMe(UpdateDoctorProfileRequest request)
    {
        var specialtyIds = request.SpecialtyIds.Distinct().ToList();
        var clinicIds = request.ClinicIds.Distinct().ToList();

        var specialties = await _db.Specialties.Where(s => specialtyIds.Contains(s.Id)).ToListAsync();
        if (specialties.Count != specialtyIds.Count)
            return BadRequest(new { error = "One or more specialtyIds are invalid." });

        var clinics = await _db.Clinics.Where(c => clinicIds.Contains(c.Id) && c.IsActive).ToListAsync();
        if (clinics.Count != clinicIds.Count)
            return BadRequest(new { error = "One or more clinicIds are invalid." });

        var doctor = await DoctorQuery().FirstOrDefaultAsync(d => d.UserId == User.GetUserId());
        if (doctor is null) return NotFound();

        doctor.User.FullName = request.FullName;
        doctor.User.UpdatedAt = DateTime.UtcNow;
        doctor.Bio = request.Bio;
        doctor.ExperienceYears = request.ExperienceYears;
        doctor.ConsultationPrice = request.ConsultationPrice;
        doctor.PhotoUrl = request.PhotoUrl;

        doctor.Specialties.Clear();
        foreach (var s in specialties) doctor.Specialties.Add(s);
        doctor.Clinics.Clear();
        foreach (var c in clinics) doctor.Clinics.Add(c);

        await _db.SaveChangesAsync();
        return Ok(ToDto(doctor));
    }

    private IQueryable<Doctor> DoctorQuery() =>
        _db.Doctors.Include(d => d.User).Include(d => d.Specialties).Include(d => d.Clinics);

    private static DoctorProfileDto ToDto(Doctor d) => new()
    {
        Id = d.UserId,
        FullName = d.User.FullName,
        Bio = d.Bio,
        ExperienceYears = d.ExperienceYears,
        ConsultationPrice = d.ConsultationPrice,
        PhotoUrl = d.PhotoUrl,
        IsVerified = d.IsVerified,
        AverageRating = d.AverageRating,
        Specialties = d.Specialties.Select(s => new SpecialtyDto(s.Id, s.Name)).ToList(),
        Clinics = d.Clinics.Select(c => new ClinicSummaryDto(c.Id, c.Name, c.Address)).ToList()
    };
}