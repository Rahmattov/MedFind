using iDoctor.Api.Dtos;
using iDoctor.Domain.Constants;
using iDoctor.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace iDoctor.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = Roles.Admin)]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public AdminController(ApplicationDbContext db) => _db = db;

    // GET /api/admin/doctors?verified=false  -> pending approvals
    [HttpGet("doctors")]
    public async Task<ActionResult<List<AdminDoctorDto>>> GetDoctors([FromQuery] bool? verified)
    {
        var query = _db.Doctors.AsQueryable();
        if (verified.HasValue) query = query.Where(d => d.IsVerified == verified.Value);

        var list = await query
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new AdminDoctorDto(d.UserId, d.User.FullName, d.User.Email!,
                                            d.User.PhoneNumber!, d.IsVerified, d.CreatedAt))
            .ToListAsync();
        return Ok(list);
    }

    [HttpPut("doctors/{id:guid}/verification")]
    public async Task<IActionResult> SetVerification(Guid id, SetVerificationRequest request)
    {
        var doctor = await _db.Doctors.FirstOrDefaultAsync(d => d.UserId == id);
        if (doctor is null) return NotFound();

        doctor.IsVerified = request.IsVerified;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}