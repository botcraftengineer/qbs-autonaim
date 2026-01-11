# Fix specific remaining errors
$ErrorActionPreference = "Stop"

$fixes = @{
    # Fix gigInterviewMedia.entityId -> gigInterviewMedia.gigId
    "src/routers/files/get-interview-media.ts" = @(
        @{ Old = 'gigInterviewMedia\.entityId'; New = 'gigInterviewMedia.gigId' }
    )
    "src/routers/files/upload-interview-media.ts" = @(
        @{ Old = 'input\.entityId'; New = 'input.gigId' }
    )
    
    # Fix export-analytics entityId references
    "src/routers/freelance-platforms/export-analytics.ts" = @(
        @{ Old = '\.entityId'; New = '.vacancyId' }
    )
    
    # Fix get-image vacancyId in with clause
    "src/routers/files/get-image.ts" = @(
        @{ Old = 'vacancyId: true'; New = 'entityId: true, entityType: true' }
    )
    
    # Fix update-salary salaryExpectationsComment type
    "src/routers/candidates/update-salary.ts" = @(
        @{ Old = 'salaryExpectationsComment: input\.comment'; New = 'salaryExpectationsComment: input.comment ? String(input.comment) : null' }
    )
    
    # Fix company/update-onboarding botSettings fields
    "src/routers/company/update-onboarding.ts" = @(
        @{ Old = '\.name\b'; New = '.companyName' }
        @{ Old = '\.website\b'; New = '.companyWebsite' }
        @{ Old = '\.description\b'; New = '.companyDescription' }
    )
}

$totalFixed = 0

foreach ($file in $fixes.Keys) {
    $fullPath = Join-Path "." $file
    if (Test-Path $fullPath) {
        $content = Get-Content -Path $fullPath -Raw -Encoding UTF8
        $originalContent = $content
        
        foreach ($fix in $fixes[$file]) {
            $content = $content -replace $fix.Old, $fix.New
        }
        
        if ($content -ne $originalContent) {
            Set-Content -Path $fullPath -Value $content -Encoding UTF8 -NoNewline
            Write-Host "Fixed: $file"
            $totalFixed++
        }
    } else {
        Write-Host "Not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "`nTotal files fixed: $totalFixed"
