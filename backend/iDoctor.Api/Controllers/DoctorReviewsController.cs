
using iDoctor.Api.Dtos;
using iDoctor.Api.Extensions;
using iDoctor.Domain.Constants;
using iDoctor.Domain.Entities;
using iDoctor.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace iDoctor.Api.Controllers;

[ApiController]
[Route("api/doctors/{doctorId:guid}/reviews")]
public class DoctorReviewsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public DoctorReviewsController(ApplicationDbContext db)
    {
        _db = db;
    }

    // GET /api/doctors/{doctorId}/reviews
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<DoctorReviewsResponse>> GetReviews(
        Guid doctorId)
    {
        var doctor = await _db.Doctors
            .AsNoTracking()
            .FirstOrDefaultAsync(d =>
                d.UserId == doctorId &&
                d.IsVerified &&
                d.User.IsActive);

        if (doctor == null)
            return NotFound(new { error = "Doctor not found." });

        var reviews = await _db.DoctorReviews
            .AsNoTracking()
            .Where(r => r.DoctorId == doctorId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new DoctorReviewDto
            {
                Id = r.Id,
                DoctorId = r.DoctorId,
                PatientId = r.PatientId,
                PatientName = r.Patient.User.FullName,
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        return Ok(new DoctorReviewsResponse
        {
            AverageRating = doctor.AverageRating,
            ReviewCount = reviews.Count,
            Reviews = reviews
        });
    }

    // POST /api/doctors/{doctorId}/reviews
    [Authorize(Roles = Roles.Patient)]
    [HttpPost]
    public async Task<ActionResult<DoctorReviewDto>> CreateReview(
        Guid doctorId,
        [FromBody] CreateDoctorReviewRequest request)
    {
        var patientId = User.GetUserId();

        var comment = request.Comment?.Trim();

        if (string.IsNullOrWhiteSpace(comment))
            return BadRequest(new { error = "Comment cannot be empty." });

        var doctorExists = await _db.Doctors.AnyAsync(d =>
            d.UserId == doctorId &&
            d.IsVerified &&
            d.User.IsActive);

        if (!doctorExists)
            return NotFound(new { error = "Doctor not found." });

        var patientExists = await _db.Patients
            .AnyAsync(p => p.UserId == patientId);

        if (!patientExists)
            return BadRequest(new { error = "Patient profile not found." });

        var alreadyReviewed = await _db.DoctorReviews.AnyAsync(r =>
            r.DoctorId == doctorId &&
            r.PatientId == patientId);

        if (alreadyReviewed)
        {
            return Conflict(new
            {
                error = "You have already reviewed this doctor."
            });
        }

        var review = new DoctorReview
        {
            Id = Guid.NewGuid(),
            DoctorId = doctorId,
            PatientId = patientId,
            Rating = request.Rating,
            Comment = comment,
            CreatedAt = DateTime.UtcNow
        };

        _db.DoctorReviews.Add(review);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
            when (ex.InnerException is PostgresException
            {
                SqlState: PostgresErrorCodes.UniqueViolation
            })
        {
            return Conflict(new
            {
                error = "You have already reviewed this doctor."
            });
        }

        // Recalculate the doctor's average rating.
        var ratingStats = await _db.DoctorReviews
            .Where(r => r.DoctorId == doctorId)
            .GroupBy(r => r.DoctorId)
            .Select(g => new
            {
                Average = g.Average(r => (decimal)r.Rating),
                Count = g.Count()
            })
            .FirstAsync();

        var doctor = await _db.Doctors
            .FirstAsync(d => d.UserId == doctorId);

        doctor.AverageRating = Math.Round(
            ratingStats.Average, 2, MidpointRounding.AwayFromZero);

        await _db.SaveChangesAsync();

        return Ok(new DoctorReviewDto
        {
            Id = review.Id,
            DoctorId = review.DoctorId,
            PatientId = review.PatientId,
            PatientName = await _db.Users
                .Where(u => u.Id == patientId)
                .Select(u => u.FullName)
                .FirstAsync(),
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt
        });
    }
}
