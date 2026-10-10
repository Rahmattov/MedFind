# Local backend development

Prerequisites: .NET 10 SDK, Docker Desktop, and Node.js for the frontend.

From the repository root, start the local PostgreSQL database:

```powershell
docker compose up -d db
```

Configure the API's local database connection in .NET User Secrets:

```powershell
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5434;Database=idoctor_db;Username=abduqodir;Password=medfind_local_dev_password" --project backend\iDoctor.Api
$keyBytes = New-Object byte[] 48
[System.Security.Cryptography.RandomNumberGenerator]::Fill($keyBytes)
$jwtKey = [Convert]::ToBase64String($keyBytes)
dotnet user-secrets set "Jwt:Key" $jwtKey --project backend\iDoctor.Api
```

Apply the database migrations, then run the API:

```powershell
dotnet ef database update --project backend\iDoctor.Infrastructure --startup-project backend\iDoctor.Api
dotnet run --project backend\iDoctor.Api --launch-profile http
```

The API listens at `http://localhost:5195`; Swagger is at
`http://localhost:5195/swagger`. The frontend defaults to this local API. Start
it in a separate terminal with `cd frontend; npm run dev`.

The Compose database credentials are for local development only. Do not reuse
them outside your development machine.
