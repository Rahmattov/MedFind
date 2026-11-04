
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
[Route("api/clinics")]
public class ClinicsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<User> _userManager;

    public ClinicsController(
        ApplicationDbContext db,
        UserManager<User> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    // GET /api/clinics?cityId=1&q=medical
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<List<ClinicDto>>> GetAll(
        [FromQuery] int? cityId,
        [FromQuery] string? q,
        [FromQuery] bool includeInactive = false)
    {
        var isAdmin = User.IsInRole(Roles.Admin);
        var query = _db.Clinics.AsNoTracking().AsQueryable();

        if (!(isAdmin && includeInactive))
        {
            query = query.Where(c =>
                c.IsActive &&
                c.ApprovalStatus == ClinicApprovalStatus.Approved);
        }

        if (cityId.HasValue)
            query = query.Where(c => c.CityId == cityId.Value);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var pattern = q.ToContainsPattern();
            query = query.Where(c => EF.Functions.ILike(c.Name, pattern));
        }

        return Ok(await Project(query.OrderBy(c => c.Name)).ToListAsync());
    }

    // GET /api/clinics/4
    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ClinicDto>> GetById(int id)
    {
        var query = _db.Clinics.AsNoTracking()
            .Where(c => c.Id == id);

        if (!User.IsInRole(Roles.Admin))
        {
            query = query.Where(c =>
                c.IsActive &&
                c.ApprovalStatus == ClinicApprovalStatus.Approved);
        }

        var dto = await Project(query).FirstOrDefaultAsync();

        return dto is null ? NotFound() : Ok(dto);
    }

    // POST /api/clinics/register
    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> RegisterClinic(
        [FromBody] ClinicRegistrationRequest request)
    {
        if (request.CityId.HasValue &&
            !await _db.Cities.AnyAsync(c => c.Id == request.CityId.Value))
        {
            return BadRequest(new { error = "Invalid cityId." });
        }

        var email = request.ManagerEmail.Trim();
        var phone = request.ManagerPhone.Trim();

        if (await _userManager.FindByEmailAsync(email) is not null)
            return Conflict(new { error = "Email is already registered." });

        if (await _userManager.Users.AnyAsync(u => u.PhoneNumber == phone))
            return Conflict(new { error = "Phone number is already registered." });

        await using var tx = await _db.Database.BeginTransactionAsync();

        var manager = new User
        {
            Id = Guid.NewGuid(),
            UserName = email,
            Email = email,
            PhoneNumber = phone,
            FullName = request.ManagerFullName.Trim(),
            IsActive = false
        };

        var result = await _userManager.CreateAsync(manager, request.Password);

        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                errors = result.Errors.Select(e => new
                {
                    e.Code,
                    e.Description
                })
            });
        }

        var clinic = new Clinic
        {
            Name = request.ClinicName.Trim(),
            CityId = request.CityId,
            Address = request.Address.Trim(),
            Phone = request.ClinicPhone?.Trim(),
            Description = request.Description?.Trim(),
            IsActive = true,
            ApprovalStatus = ClinicApprovalStatus.Pending,
            ManagerUserId = manager.Id
        };

        _db.Clinics.Add(clinic);
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return StatusCode(StatusCodes.Status201Created, new
        {
            message = "Clinic application submitted. Await administrator approval.",
            clinicId = clinic.Id,
            status = clinic.ApprovalStatus.ToString()
        });
    }

    // POST /api/clinics — admin creates an already approved clinic
    [Authorize(Roles = Roles.Admin)]
    [HttpPost]
    public async Task<ActionResult<ClinicDto>> Create(ClinicRequest request)
    {
        if (request.CityId.HasValue &&
            !await _db.Cities.AnyAsync(c => c.Id == request.CityId.Value))
        {
            return BadRequest(new { error = "Invalid cityId." });
        }

        var clinic = new Clinic
        {
            Name = request.Name.Trim(),
            CityId = request.CityId,
            Address = request.Address?.Trim(),
            Phone = request.Phone?.Trim(),
            Description = request.Description?.Trim(),
            IsActive = request.IsActive,
            ApprovalStatus = ClinicApprovalStatus.Approved
        };

        _db.Clinics.Add(clinic);
        await _db.SaveChangesAsync();

        var dto = await Project(
            _db.Clinics.AsNoTracking().Where(c => c.Id == clinic.Id))
            .FirstAsync();

        return CreatedAtAction(nameof(GetById), new { id = clinic.Id }, dto);
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ClinicDto>> Update(
        int id, ClinicRequest request)
    {
        var clinic = await _db.Clinics.FirstOrDefaultAsync(c => c.Id == id);
        if (clinic is null)
            return NotFound();

        if (request.CityId.HasValue &&
            !await _db.Cities.AnyAsync(c => c.Id == request.CityId.Value))
        {
            return BadRequest(new { error = "Invalid cityId." });
        }

        clinic.Name = request.Name.Trim();
        clinic.CityId = request.CityId;
        clinic.Address = request.Address?.Trim();
        clinic.Phone = request.Phone?.Trim();
        clinic.Description = request.Description?.Trim();
        clinic.IsActive = request.IsActive;

        await _db.SaveChangesAsync();

        return Ok(await Project(
            _db.Clinics.AsNoTracking().Where(c => c.Id == id))
            .FirstAsync());
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Deactivate(int id)
    {
        var clinic = await _db.Clinics.FirstOrDefaultAsync(c => c.Id == id);
        if (clinic is null)
            return NotFound();

        clinic.IsActive = false;
        await _db.SaveChangesAsync();

        return NoContent();
    }

    private static IQueryable<ClinicDto> Project(
        IQueryable<Clinic> query) =>
        query.Select(c => new ClinicDto(
            c.Id,
            c.Name,
            c.CityId,
            c.City != null ? c.City.Name : null,
            c.Address,
            c.Phone,
            c.Description,
            c.IsActive,
            c.Doctors.Count(d => d.IsVerified && d.User.IsActive),
            c.PhotoUrl));
}
