# Migration script 3: Fix remaining schema issues
# This script fixes:
# 1. gigResponse/vacancyResponse -> response
# 2. entityId -> vacancyId/gigId
# 3. entityType references in interviewSession
# 4. salaryExpectations -> salaryExpectationsAmount
# 5. botSettings field names

$ErrorActionPreference = "Stop"

# Get all TypeScript files recursively
$files = Get-ChildItem -Path "src" -Filter "*.ts" -Recurse -File

Write-Host "Found $($files.Count) files to process"

$totalReplacements = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    $fileReplacements = 0

    # 1. Replace table references
    $content = $content -replace '\bgigResponse\b', 'response'
    $content = $content -replace '\bvacancyResponse\b', 'response'
    
    # 2. Replace import statements
    $content = $content -replace 'gigResponse,', 'response,'
    $content = $content -replace 'vacancyResponse,', 'response,'
    $content = $content -replace 'import\s+\{\s*gigResponse\s*\}', 'import { response }'
    $content = $content -replace 'import\s+\{\s*vacancyResponse\s*\}', 'import { response }'
    
    # 3. Replace gigResponseScreening -> responseScreening
    $content = $content -replace '\bgigResponseScreening\b', 'responseScreening'
    
    # 4. Replace input.entityId with context-aware replacements
    # For gig routers
    if ($file.FullName -match '\\routers\\gig\\') {
        $content = $content -replace 'input\.entityId', 'input.gigId'
        $content = $content -replace 'gigInterviewMedia\.entityId', 'gigInterviewMedia.gigId'
    }
    # For vacancy routers
    elseif ($file.FullName -match '\\routers\\vacancy\\') {
        $content = $content -replace 'input\.entityId', 'input.vacancyId'
    }
    # For prequalification (always vacancy)
    elseif ($file.FullName -match '\\routers\\prequalification\\') {
        $content = $content -replace 'input\.entityId', 'input.vacancyId'
        $content = $content -replace 'session\.entityId', 'session.vacancyId'
        $content = $content -replace 'dialogueContext\.entityId', 'dialogueContext.vacancyId'
    }
    # For analytics (context-dependent)
    elseif ($file.FullName -match '\\routers\\analytics\\') {
        $content = $content -replace 'params\.entityId', 'params.vacancyId'
    }
    # For services
    elseif ($file.FullName -match '\\services\\') {
        $content = $content -replace 'prequalificationSession\.entityId', 'prequalificationSession.vacancyId'
        $content = $content -replace 'analyticsEvent\.entityId', 'analyticsEvent.vacancyId'
        $content = $content -replace 'session\.entityId', 'session.vacancyId'
        $content = $content -replace 'rule\.entityId', 'rule.vacancyId'
        $content = $content -replace 'action\.entityId', 'action.vacancyId'
        $content = $content -replace '\.entityId', '.vacancyId'
    }
    # For audit logger
    elseif ($file.FullName -match '\\audit-logger\.ts') {
        $content = $content -replace 'params\.entityId', 'params.vacancyId'
    }
    
    # 5. Remove entityType references from interviewSession
    $content = $content -replace 'interviewSession\.entityType[,\s]*', ''
    $content = $content -replace 'entityType:\s*interviewSession\.entityType[,\s]*', ''
    $content = $content -replace 'eq\(interviewSession\.entityType,\s*"[^"]+"\)[,\s]*', ''
    $content = $content -replace 'and\(\s*eq\(interviewSession\.entityType,\s*"[^"]+"\),\s*', 'and('
    
    # 6. Fix salaryExpectations -> salaryExpectationsAmount
    $content = $content -replace '\.salaryExpectations\b', '.salaryExpectationsAmount'
    $content = $content -replace 'salaryExpectations:', 'salaryExpectationsAmount:'
    
    # 7. Fix botSettings field names
    $content = $content -replace 'botSettings\.name\b', 'botSettings.companyName'
    $content = $content -replace 'botSettings\.website\b', 'botSettings.companyWebsite'
    $content = $content -replace 'botSettings\.description\b', 'botSettings.companyDescription'
    $content = $content -replace 'botSettings\?\.name\b', 'botSettings?.companyName'
    $content = $content -replace 'botSettings\?\.website\b', 'botSettings?.companyWebsite'
    $content = $content -replace 'botSettings\?\.description\b', 'botSettings?.companyDescription'
    
    # 8. Fix workspace.botSettings references
    $content = $content -replace 'workspace\.botSettings\?\.companyName', 'workspace.name'
    
    # Count replacements
    if ($content -ne $originalContent) {
        $fileReplacements++
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($file.FullName)"
        $totalReplacements++
    }
}

Write-Host "`nMigration complete!"
Write-Host "Total files updated: $totalReplacements"
