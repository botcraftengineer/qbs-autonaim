# PowerShell script to migrate schema references in API package

$files = Get-ChildItem -Recurse -Filter "*.ts" -Path "src"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Replace imports
    $content = $content -replace 'vacancyResponseComment', 'responseComment'
    $content = $content -replace 'vacancyResponseHistory', 'responseHistory'
    $content = $content -replace 'vacancyResponseScreening', 'responseScreening'
    $content = $content -replace 'vacancyResponseInvitation', 'responseInvitation'
    $content = $content -replace 'gigInvitation', 'responseInvitation'
    $content = $content -replace 'freelanceInvitation', 'responseInvitation'
    $content = $content -replace 'companySettings', 'botSettings'
    $content = $content -replace 'CompanySettings', 'BotSettings'
    
    # Replace table references in queries (but not in comments or strings)
    $content = $content -replace '\.vacancyResponse\.', '.response.'
    $content = $content -replace '\.gigResponse\.', '.response.'
    $content = $content -replace 'from\(vacancyResponse\)', 'from(response)'
    $content = $content -replace 'from\(gigResponse\)', 'from(response)'
    
    # Replace field names
    $content = $content -replace 'vacancyResponseId', 'responseId'
    $content = $content -replace 'gigResponseId', 'responseId'
    $content = $content -replace '\.salaryExpectations([^A])', '.salaryExpectationsAmount$1'
    
    # Replace enum values
    $content = $content -replace 'gigResponseStatusValues', 'responseStatusValues'
    $content = $content -replace 'gigHrSelectionStatusValues', 'hrSelectionStatusValues'
    $content = $content -replace 'gigImportSourceValues', 'importSourceValues'
    
    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "Migration complete!"
