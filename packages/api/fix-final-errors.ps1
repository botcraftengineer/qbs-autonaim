# Fix final batch of errors
$ErrorActionPreference = "Stop"

# Массовые замены для всех файлов
$globalReplacements = @{
    # Fix funnel routers
    "src/routers/funnel/analytics.ts" = @(
        @{ Old = 'input\.entityId'; New = 'input.vacancyId' }
    )
    "src/routers/funnel/list.ts" = @(
        @{ Old = 'input\.entityId'; New = 'input.vacancyId' }
    )
    "src/routers/funnel/vacancy-stats.ts" = @(
        @{ Old = 'input\.entityId'; New = 'input.vacancyId' }
    )
    
    # Fix export-analytics - use entityId field from response table
    "src/routers/freelance-platforms/export-analytics.ts" = @(
        @{ Old = 'responseTable\.vacancyId'; New = 'responseTable.entityId' }
    )
    
    # Fix get-interview-media remaining entityId
    "src/routers/files/get-interview-media.ts" = @(
        @{ Old = 'input\.entityId'; New = 'input.gigId' }
    )
    
    # Fix candidates/update-salary - convert comment to string
    "src/routers/candidates/update-salary.ts" = @(
        @{ Old = 'salaryExpectationsComment: input\.comment,'; New = 'salaryExpectationsComment: input.comment || null,' }
    )
    
    # Fix company/update-onboarding
    "src/routers/company/update-onboarding.ts" = @(
        @{ Old = 'name:'; New = 'companyName:' }
        @{ Old = 'website:'; New = 'companyWebsite:' }
        @{ Old = 'description:'; New = 'companyDescription:' }
    )
}

$totalFixed = 0

foreach ($file in $globalReplacements.Keys) {
    $fullPath = Join-Path "." $file
    if (Test-Path $fullPath) {
        $content = Get-Content -Path $fullPath -Raw -Encoding UTF8
        $originalContent = $content
        
        foreach ($replacement in $globalReplacements[$file]) {
            $content = $content -replace $replacement.Old, $replacement.New
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
