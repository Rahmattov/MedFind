using iDoctor.Api.DTOs.Medicines;
using iDoctor.Domain.Constants;
using iDoctor.Domain.Entities;
using iDoctor.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace iDoctor.Api.Controllers;

[ApiController]
[Route("api")]
public class MedicinesController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<User> _userManager;

    public MedicinesController(
        ApplicationDbContext db,
        UserManager<User> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    // GET /api/pharmacies/1/medicines
    [AllowAnonymous]
    [HttpGet("pharmacies/{pharmacyId:int}/medicines")]
    public async Task<ActionResult<List<MedicineDto>>> GetAll(
        int pharmacyId,
        [FromQuery] string? q,
        [FromQuery] string? category,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] bool inStock = false)
    {
        var pharmacy = await _db.Pharmacies
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == pharmacyId);

        if (pharmacy is null)
            return NotFound(new { error = "Pharmacy not found." });

        var query = _db.Medicines
            .AsNoTracking()
            .Where(m =>
                m.PharmacyId == pharmacyId &&
                m.IsActive);

        var isAdmin = User.IsInRole(Roles.Admin);
        var currentUser = await _userManager.GetUserAsync(User);
        var isOwner = currentUser?.ManagedPharmacyId == pharmacyId;

        if (!isAdmin && !isOwner)
        {
            if (!pharmacy.IsActive ||
                pharmacy.ApprovalStatus != PharmacyApprovalStatus.Approved)
            {
                return NotFound();
            }
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            query = query.Where(m =>
                EF.Functions.ILike(m.Name, $"%{q.Trim()}%"));
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(m => m.Category == category);
        }

        if (minPrice.HasValue)
            query = query.Where(m => m.Price >= minPrice.Value);

        if (maxPrice.HasValue)
            query = query.Where(m => m.Price <= maxPrice.Value);

        if (inStock)
            query = query.Where(m => m.StockQuantity > 0);

        return Ok(await Project(query.OrderBy(m => m.Name))
            .ToListAsync());
    }

    // POST /api/pharmacies/1/medicines
    [Authorize]
    [HttpPost("pharmacies/{pharmacyId:int}/medicines")]
    public async Task<ActionResult<MedicineDto>> Create(
        int pharmacyId,
        [FromBody] CreateMedicineDto request)
    {
        var accessError = await CheckPharmacyAccess(pharmacyId);

        if (accessError is not null)
            return accessError;

        var medicine = new Medicine
        {
            PharmacyId = pharmacyId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            Category = request.Category?.Trim(),
            Manufacturer = request.Manufacturer?.Trim(),
            Dosage = request.Dosage?.Trim(),
            Form = request.Form?.Trim(),
            Price = request.Price,
            StockQuantity = request.StockQuantity,
            PhotoUrl = request.PhotoUrl?.Trim(),
            IsActive = true
        };

        _db.Medicines.Add(medicine);
        await _db.SaveChangesAsync();

        var dto = await Project(
            _db.Medicines.AsNoTracking()
                .Where(m => m.Id == medicine.Id))
            .FirstAsync();

        return CreatedAtAction(
            nameof(GetAll),
            new { pharmacyId },
            dto);
    }

    // PUT /api/medicines/1
    [Authorize]
    [HttpPut("medicines/{id:int}")]
    public async Task<ActionResult<MedicineDto>> Update(
        int id,
        [FromBody] CreateMedicineDto request)
    {
        var medicine = await _db.Medicines
            .FirstOrDefaultAsync(m => m.Id == id);

        if (medicine is null)
            return NotFound();

        var accessError = await CheckPharmacyAccess(medicine.PharmacyId);

        if (accessError is not null)
            return accessError;

        medicine.Name = request.Name.Trim();
        medicine.Description = request.Description?.Trim();
        medicine.Category = request.Category?.Trim();
        medicine.Manufacturer = request.Manufacturer?.Trim();
        medicine.Dosage = request.Dosage?.Trim();
        medicine.Form = request.Form?.Trim();
        medicine.Price = request.Price;
        medicine.StockQuantity = request.StockQuantity;
        medicine.PhotoUrl = request.PhotoUrl?.Trim();

        await _db.SaveChangesAsync();

        return Ok(await Project(
            _db.Medicines.AsNoTracking()
                .Where(m => m.Id == id))
            .FirstAsync());
    }

    // DELETE /api/medicines/1
    [Authorize]
    [HttpDelete("medicines/{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var medicine = await _db.Medicines
            .FirstOrDefaultAsync(m => m.Id == id);

        if (medicine is null)
            return NotFound();

        var accessError = await CheckPharmacyAccess(medicine.PharmacyId);

        if (accessError is not null)
            return accessError;

        medicine.IsActive = false;

        await _db.SaveChangesAsync();

        return NoContent();
    }

    private async Task<ObjectResult?> CheckPharmacyAccess(int pharmacyId)
    {
        var isAdmin = User.IsInRole(Roles.Admin);

        if (isAdmin)
            return null;

        var currentUser = await _userManager.GetUserAsync(User);

        if (currentUser is null)
            return StatusCode(401, new
            {
                error = "Unauthorized."
        });

        var isManager = await _userManager.IsInRoleAsync(
            currentUser,
            Roles.PharmacyManager);

        if (!isManager || currentUser.ManagedPharmacyId != pharmacyId)
            return StatusCode(403, new
            {
                error = "You do not have permission to manage this pharmacy."
            });

        return null;
    }

    private static IQueryable<MedicineDto> Project(
        IQueryable<Medicine> query)
    {
        return query.Select(m => new MedicineDto
        {
            Id = m.Id,
            PharmacyId = m.PharmacyId,
            Name = m.Name,
            Description = m.Description,
            Category = m.Category,
            Manufacturer = m.Manufacturer,
            Dosage = m.Dosage,
            Form = m.Form,
            Price = m.Price,
            StockQuantity = m.StockQuantity,
            PhotoUrl = m.PhotoUrl
        });
    }
}