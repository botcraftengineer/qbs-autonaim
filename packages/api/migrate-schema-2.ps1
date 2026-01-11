# PowerShell script for second pass of schema migration

$files = Get-ChildItem -Recurse -Filter "*.ts" -Path "src"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Fix remaining import issues
    $content = $content -replace "import \{([^}]*)\bvacancyResponse\b([^}]*)\} from `"@qbs-autonaim/db/schema`"", 'import {$1response as responseTable$2} from "@qbs-autonaim/db/schema"'
    $content = $content -replace "import \{([^}]*)\bgigResponse\b([^}]*)\} from `"@qbs-autonaim/db/schema`"", 'import {$1response as responseTable$2} from "@qbs-autonaim/db/schema"'
    $content = $content -replace "import \{([^}]*)\bvacancyResponse\b([^}]*)\} from `"@qbs-autonaim/db`"", 'import {$1response as responseTable$2} from "@qbs-autonaim/db"'
    $content = $content -replace "import \{([^}]*)\bgigResponse\b([^}]*)\} from `"@qbs-autonaim/db`"", 'import {$1response as responseTable$2} from "@qbs-autonaim/db"'
    
    # Fix type references
    $content = $content -replace ': botSettings\b', ': typeof botSettings'
    $content = $content -replace ': BotSettings\b', ': typeof botSettings.$inferSelect'
    
    # Fix property access on session.response
    $content = $content -replace '\.vacancyResponse\b', '.response'
    $content = $content -replace '\.gigResponse\b', '.response'
    
    # Fix with clauses
    $content = $content -replace 'with:\s*\{\s*vacancyResponse:', 'with: { response:'
    $content = $content -replace 'with:\s*\{\s*gigResponse:', 'with: { response:'
    
    # Fix columns selections
    $content = $content -replace 'vacancyResponsesAsResumePdf', 'responsesAsResumePdf'
    $content = $content -replace 'vacancyResponsesAsPhoto', 'responsesAsPhoto'
    
    # Fix field references in where clauses
    $content = $content -replace '\.vacancyId\b', '.entityId'
    $content = $content -replace '\.gigId\b', '.entityId'
    
    # Fix workspace.name references (should be workspace.botSettings.companyName)
    $content = $content -replace 'workspace\.name\b', 'workspace.botSettings?.companyName'
    
    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "Second migration pass complete!"
