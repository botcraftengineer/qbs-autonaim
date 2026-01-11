# Fix remaining entityId references in input schemas
$ErrorActionPreference = "Stop"

# Files that need input.entityId -> input.vacancyId
$filesToFix = @(
    "src/routers/analytics/export-data.ts",
    "src/routers/analytics/get-vacancy-analytics.ts",
    "src/routers/analytics/track-event.ts",
    "src/routers/candidates/add-comment.ts",
    "src/routers/candidates/list.ts",
    "src/routers/freelance-platforms/check-duplicate-response.ts",
    "src/routers/freelance-platforms/delete-vacancy.ts",
    "src/routers/freelance-platforms/export-analytics.ts",
    "src/routers/freelance-platforms/generate-interview-link.ts",
    "src/routers/freelance-platforms/get-analytics.ts",
    "src/routers/freelance-platforms/get-interview-link.ts",
    "src/routers/freelance-platforms/get-shortlist.ts",
    "src/routers/freelance-platforms/import-bulk-responses.ts",
    "src/routers/freelance-platforms/import-single-response.ts",
    "src/routers/freelance-platforms/retry-bulk-import.ts",
    "src/routers/recruiter-agent/configure-rules.ts",
    "src/routers/recruiter-agent/get-recommendations.ts"
)

$totalFixed = 0

foreach ($filePath in $filesToFix) {
    $fullPath = Join-Path "." $filePath
    if (Test-Path $fullPath) {
        $content = Get-Content -Path $fullPath -Raw -Encoding UTF8
        $originalContent = $content
        
        # Replace input.entityId with input.vacancyId
        $content = $content -replace 'input\.entityId\b', 'input.vacancyId'
        
        # Replace candidate.entityId with candidate.vacancyId
        $content = $content -replace 'candidate\.entityId\b', 'candidate.vacancyId'
        
        # Replace v.entityId with v.vacancyId (for analytics)
        $content = $content -replace '\bv\.entityId\b', 'v.vacancyId'
        
        # Replace s.entityId with s.vacancyId (for sessions)
        $content = $content -replace '\bs\.entityId\b', 'session.vacancyId'
        
        # Replace rule.entityId with rule.vacancyId
        $content = $content -replace 'rule\.entityId\b', 'rule.vacancyId'
        
        # Replace action.entityId with action.vacancyId
        $content = $content -replace 'action\.entityId\b', 'action.vacancyId'
        
        if ($content -ne $originalContent) {
            Set-Content -Path $fullPath -Value $content -Encoding UTF8 -NoNewline
            Write-Host "Fixed: $filePath"
            $totalFixed++
        }
    } else {
        Write-Host "Not found: $filePath" -ForegroundColor Yellow
    }
}

Write-Host "`nTotal files fixed: $totalFixed"
