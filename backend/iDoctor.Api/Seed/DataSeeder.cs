using iDoctor.Domain.Constants;
using iDoctor.Domain.Entities;
using iDoctor.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace iDoctor.Api.Seed;

public class DataSeeder : IHostedService
{
    private readonly IServiceProvider _services;
    private readonly IConfiguration _config;
    private readonly IHostEnvironment _environment;

    public DataSeeder(IServiceProvider services, IConfiguration config, IHostEnvironment environment)
    {
        _services = services;
        _config = config;
        _environment = environment;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        using var scope = _services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();

        // Roles
        foreach (var role in new[] { Roles.Patient, Roles.Doctor, Roles.Admin })
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new ApplicationRole { Id = Guid.NewGuid(), Name = role });
        }

        // Admin user
        var email = _config["Seed:AdminEmail"];
        var password = _config["Seed:AdminPassword"];
        if (!string.IsNullOrWhiteSpace(email) && !string.IsNullOrWhiteSpace(password)
            && await userManager.FindByEmailAsync(email) is null)
        {
            var admin = new User
            {
                Id = Guid.NewGuid(),
                UserName = email,
                Email = email,
                EmailConfirmed = true,
                PhoneNumber = _config["Seed:AdminPhone"] ?? "+992900000000",
                FullName = "Platform Admin"
            };
            var result = await userManager.CreateAsync(admin, password);
            if (!result.Succeeded)
                throw new InvalidOperationException("Admin seed failed: " +
                    string.Join("; ", result.Errors.Select(e => e.Description)));
            await userManager.AddToRoleAsync(admin, Roles.Admin);
        }

        // Starter lookup data (so doctor registration has something to reference)
        if (!await db.Cities.AnyAsync(cancellationToken))
        {
            db.Cities.AddRange(
                new City { Name = "Dushanbe" }, new City { Name = "Khujand" },
                new City { Name = "Bokhtar" }, new City { Name = "Kulob" });
        }
        if (!await db.Specialties.AnyAsync(cancellationToken))
        {
            db.Specialties.AddRange(
                new Specialty { Name = "Therapist" }, new Specialty { Name = "Cardiologist" },
                new Specialty { Name = "Pediatrician" }, new Specialty { Name = "Neurologist" },
                new Specialty { Name = "Dermatologist" });
        }
        await db.SaveChangesAsync(cancellationToken);

                // Starter clinics (placeholder data, replace with real clinics later)
        if (!await db.Clinics.AnyAsync(cancellationToken))
        {
            var dushanbe = await db.Cities.FirstOrDefaultAsync(c => c.Name == "Dushanbe", cancellationToken);
            var khujand = await db.Cities.FirstOrDefaultAsync(c => c.Name == "Khujand", cancellationToken);

            db.Clinics.AddRange(
                new Clinic { Name = "City Medical Center", CityId = dushanbe?.Id, Address = "Rudaki Ave 10", Phone = "+992372000001" },
                new Clinic { Name = "Family Health Clinic", CityId = dushanbe?.Id, Address = "Somoni Ave 25", Phone = "+992372000002" },
                new Clinic { Name = "Sughd Diagnostic Center", CityId = khujand?.Id, Address = "Ismoili Somoni St 5", Phone = "+992342000003" });
            await db.SaveChangesAsync(cancellationToken);
        }

        if (_environment.IsDevelopment())
            await SeedDevelopmentDoctorsAsync(db, userManager, cancellationToken);
    }

    private static async Task SeedDevelopmentDoctorsAsync(
        ApplicationDbContext db,
        UserManager<User> userManager,
        CancellationToken cancellationToken)
    {
        foreach (var legacyEmail in new[]
                 {
                     "demo.cardiologist@example.test",
                     "demo.therapist@example.test",
                     "demo.pediatrician@example.test"
                 })
        {
            var legacyUser = await userManager.FindByEmailAsync(legacyEmail);
            if (legacyUser is null) continue;

            var deleteResult = await userManager.DeleteAsync(legacyUser);
            if (!deleteResult.Succeeded)
                throw new InvalidOperationException(
                    $"Development demo doctor cleanup failed for {legacyEmail}: " +
                    string.Join("; ", deleteResult.Errors.Select(e => e.Description)));
        }

        var doctors = new[]
        {
            new
            {
                Email = "dev.doctor.001@example.test",
                Phone = "+992900000201",
                FullName = "Farzona Sharifzoda",
                SpecialtyName = "Cardiologist",
                ClinicName = "City Medical Center",
                Bio = "Fictional local-development profile.",
                ExperienceYears = (short)12,
                ConsultationPrice = 150m
            },
            new
            {
                Email = "dev.doctor.002@example.test",
                Phone = "+992900000202",
                FullName = "Muhammadali Rahmonov",
                SpecialtyName = "Therapist",
                ClinicName = "Family Health Clinic",
                Bio = "Fictional local-development profile.",
                ExperienceYears = (short)8,
                ConsultationPrice = 100m
            },
            new
            {
                Email = "dev.doctor.003@example.test",
                Phone = "+992900000203",
                FullName = "Nigina Saidova",
                SpecialtyName = "Pediatrician",
                ClinicName = "Sughd Diagnostic Center",
                Bio = "Fictional local-development profile.",
                ExperienceYears = (short)10,
                ConsultationPrice = 120m
            },
            new
            {
                Email = "dev.doctor.004@example.test",
                Phone = "+992900000204",
                FullName = "Rustam Karimov",
                SpecialtyName = "Neurologist",
                ClinicName = "City Medical Center",
                Bio = "Fictional local-development profile.",
                ExperienceYears = (short)15,
                ConsultationPrice = 180m
            },
            new
            {
                Email = "dev.doctor.005@example.test",
                Phone = "+992900000205",
                FullName = "Malika Ismoilova",
                SpecialtyName = "Dermatologist",
                ClinicName = "Family Health Clinic",
                Bio = "Fictional local-development profile.",
                ExperienceYears = (short)9,
                ConsultationPrice = 130m
            },
            new
            {
                Email = "dev.doctor.006@example.test",
                Phone = "+992900000206",
                FullName = "Shabnam Davlatova",
                SpecialtyName = "Cardiologist",
                ClinicName = "Sughd Diagnostic Center",
                Bio = "Fictional local-development profile.",
                ExperienceYears = (short)11,
                ConsultationPrice = 160m
            },
            new
            {
                Email = "dev.doctor.007@example.test",
                Phone = "+992900000207",
                FullName = "Firuz Nematov",
                SpecialtyName = "Therapist",
                ClinicName = "City Medical Center",
                Bio = "Fictional local-development profile.",
                ExperienceYears = (short)7,
                ConsultationPrice = 90m
            },
            new
            {
                Email = "dev.doctor.008@example.test",
                Phone = "+992900000208",
                FullName = "Munira Abdullaeva",
                SpecialtyName = "Pediatrician",
                ClinicName = "Family Health Clinic",
                Bio = "Fictional local-development profile.",
                ExperienceYears = (short)14,
                ConsultationPrice = 140m
            },
            new
            {
                Email = "dev.doctor.009@example.test",
                Phone = "+992900000209",
                FullName = "Komron Safarov",
                SpecialtyName = "Neurologist",
                ClinicName = "Sughd Diagnostic Center",
                Bio = "Fictional local-development profile.",
                ExperienceYears = (short)6,
                ConsultationPrice = 110m
            },
            new
            {
                Email = "dev.doctor.010@example.test",
                Phone = "+992900000210",
                FullName = "Zebo Qodirova",
                SpecialtyName = "Dermatologist",
                ClinicName = "City Medical Center",
                Bio = "Fictional local-development profile.",
                ExperienceYears = (short)13,
                ConsultationPrice = 170m
            }
        };

        foreach (var sample in doctors)
        {
            if (await db.Doctors.AnyAsync(d => d.User.Email == sample.Email, cancellationToken))
                continue;

            var user = await userManager.FindByEmailAsync(sample.Email);
            if (user is null)
            {
                user = new User
                {
                    Id = Guid.NewGuid(),
                    UserName = sample.Email,
                    Email = sample.Email,
                    EmailConfirmed = true,
                    PhoneNumber = sample.Phone,
                    FullName = sample.FullName
                };
                var createResult = await userManager.CreateAsync(user);
                if (!createResult.Succeeded)
                    throw new InvalidOperationException(
                        $"Development doctor seed failed for {sample.Email}: " +
                        string.Join("; ", createResult.Errors.Select(e => e.Description)));
            }

            if (!await userManager.IsInRoleAsync(user, Roles.Doctor))
            {
                var roleResult = await userManager.AddToRoleAsync(user, Roles.Doctor);
                if (!roleResult.Succeeded)
                    throw new InvalidOperationException(
                        $"Development doctor role seed failed for {sample.Email}: " +
                        string.Join("; ", roleResult.Errors.Select(e => e.Description)));
            }

            var specialty = await db.Specialties
                .FirstOrDefaultAsync(s => s.Name == sample.SpecialtyName, cancellationToken)
                ?? throw new InvalidOperationException(
                    $"Development doctor seed requires specialty '{sample.SpecialtyName}'.");
            var clinic = await db.Clinics
                .FirstOrDefaultAsync(c => c.Name == sample.ClinicName, cancellationToken)
                ?? throw new InvalidOperationException(
                    $"Development doctor seed requires clinic '{sample.ClinicName}'.");

            db.Doctors.Add(new Doctor
            {
                UserId = user.Id,
                Bio = sample.Bio,
                ExperienceYears = sample.ExperienceYears,
                ConsultationPrice = sample.ConsultationPrice,
                IsVerified = true,
                Specialties = new List<Specialty> { specialty },
                Clinics = new List<Clinic> { clinic }
            });
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}