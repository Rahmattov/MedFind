using iDoctor.Api.DTOs.Pharmacies;
using iDoctor.Domain.Constants;
using iDoctor.Domain.Entities;
using iDoctor.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace iDoctor.Api.Controllers;

[ApiController]
[Route("api/pharmacies")]
public class PharmaciesController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<User> _userManager;

    public PharmaciesController(
        ApplicationDbContext db,
        UserManager<User> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    // GET /api/pharmacies?cityId=1&q=medical
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<List<PharmacyDto>>> GetAll(
        [FromQuery] int? cityId,
        [FromQuery] string? q,
        [FromQuery] bool includeInactive = false)
    {
        var isAdmin = User.IsInRole(Roles.Admin);

        var query = _db.Pharmacies
            .AsNoTracking()
            .AsQueryable();

        if (!(isAdmin && includeInactive))
        {
            query = query.Where(p =>
                p.IsActive &&
                p.ApprovalStatus == PharmacyApprovalStatus.Approved);
        }

        if (cityId.HasValue)
            query = query.Where(p => p.CityId == cityId.Value);

        if (!string.IsNullOrWhiteSpace(q))
        {
            query = query.Where(p =>
                EF.Functions.ILike(p.Name, $"%{q.Trim()}%"));
        }

        return Ok(await Project(query.OrderBy(p => p.Name))
            .ToListAsync());
    }

    // GET /api/pharmacies/4
    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<PharmacyDto>> GetById(int id)
    {
        var query = _db.Pharmacies
            .AsNoTracking()
            .Where(p => p.Id == id);

        if (!User.IsInRole(Roles.Admin))
        {
            query = query.Where(p =>
                p.IsActive &&
                p.ApprovalStatus == PharmacyApprovalStatus.Approved);
        }

        var dto = await Project(query).FirstOrDefaultAsync();

        return dto is null ? NotFound() : Ok(dto);
    }

    // POST /api/pharmacies/register
    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> RegisterPharmacy(
        [FromBody] PharmacyRegistrationRequest request)
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

        var result = await _userManager.CreateAsync(
            manager,
            request.Password);

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

        var roleResult = await _userManager.AddToRoleAsync(
            manager,
            Roles.PharmacyManager);

        if (!roleResult.Succeeded)
        {
            return BadRequest(new
            {
                errors = roleResult.Errors.Select(e => new
                {
                    e.Code,
                    e.Description
                })
            });
        }

        var pharmacy = new Pharmacy
        {
            Name = request.PharmacyName.Trim(),
            CityId = request.CityId,
            Address = request.Address?.Trim(),
            Phone = request.PharmacyPhone?.Trim(),
            Description = request.Description?.Trim(),
            IsActive = true,
            ApprovalStatus = PharmacyApprovalStatus.Pending
        };

        _db.Pharmacies.Add(pharmacy);
        await _db.SaveChangesAsync();

        manager.ManagedPharmacyId = pharmacy.Id;

        var updateResult = await _userManager.UpdateAsync(manager);

        if (!updateResult.Succeeded)
        {
            return BadRequest(new
            {
                errors = updateResult.Errors.Select(e => new
                {
                    e.Code,
                    e.Description
                })
            });
        }

        await tx.CommitAsync();

        return StatusCode(StatusCodes.Status201Created, new
        {
            message = "Pharmacy application submitted. Await administrator approval.",
            pharmacyId = pharmacy.Id,
            status = pharmacy.ApprovalStatus.ToString()
        });
    }

    // POST /api/pharmacies — admin creates an approved pharmacy
    [Authorize(Roles = Roles.Admin)]
    [HttpPost]
    public async Task<ActionResult<PharmacyDto>> Create(
        [FromBody] CreatePharmacyDto request)
    {
        if (request.CityId.HasValue &&
            !await _db.Cities.AnyAsync(c => c.Id == request.CityId.Value))
        {
            return BadRequest(new { error = "Invalid cityId." });
        }

        var pharmacy = new Pharmacy
        {
            Name = request.Name.Trim(),
            CityId = request.CityId,
            Address = request.Address?.Trim(),
            Phone = request.Phone?.Trim(),
            Description = request.Description?.Trim(),
            PhotoUrl = request.PhotoUrl?.Trim(),
            IsActive = true,
            ApprovalStatus = PharmacyApprovalStatus.Approved
        };

        _db.Pharmacies.Add(pharmacy);
        await _db.SaveChangesAsync();

        var dto = await Project(
            _db.Pharmacies.AsNoTracking()
                .Where(p => p.Id == pharmacy.Id))
            .FirstAsync();

        return CreatedAtAction(
            nameof(GetById),
            new { id = pharmacy.Id },
            dto);
    }

    // PUT /api/pharmacies/4
    [Authorize(Roles = Roles.Admin)]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<PharmacyDto>> Update(
        int id,
        [FromBody] CreatePharmacyDto request)
    {
        var pharmacy = await _db.Pharmacies
            .FirstOrDefaultAsync(p => p.Id == id);

        if (pharmacy is null)
            return NotFound();

        if (request.CityId.HasValue &&
            !await _db.Cities.AnyAsync(c => c.Id == request.CityId.Value))
        {
            return BadRequest(new { error = "Invalid cityId." });
        }

        pharmacy.Name = request.Name.Trim();
        pharmacy.CityId = request.CityId;
        pharmacy.Address = request.Address?.Trim();
        pharmacy.Phone = request.Phone?.Trim();
        pharmacy.Description = request.Description?.Trim();
        pharmacy.PhotoUrl = request.PhotoUrl?.Trim();

        await _db.SaveChangesAsync();

        return Ok(await Project(
            _db.Pharmacies.AsNoTracking()
                .Where(p => p.Id == id))
            .FirstAsync());
    }

    // DELETE /api/pharmacies/4 — actually deactivates the pharmacy
    [Authorize(Roles = Roles.Admin)]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Deactivate(int id)
    {
        var pharmacy = await _db.Pharmacies
            .FirstOrDefaultAsync(p => p.Id == id);

        if (pharmacy is null)
            return NotFound();

        pharmacy.IsActive = false;

        await _db.SaveChangesAsync();

        return NoContent();
    }

    private static IQueryable<PharmacyDto> Project(
        IQueryable<Pharmacy> query)
    {
        return query.Select(p => new PharmacyDto
        {
            Id = p.Id,
            Name = p.Name,
            CityName = p.City != null ? p.City.Name : null,
            Address = p.Address,
            Phone = p.Phone,
            Description = p.Description,
            PhotoUrl = p.PhotoUrl
        });
    }
}