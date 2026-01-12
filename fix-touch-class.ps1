Get-ChildItem -Path "apps/app" -Recurse -Include "*.tsx","*.ts" | ForEach-Object {
    if (Test-Path $_.FullName) {
        $content = Get-Content $_.FullName -Encoding UTF8
        $newContent = $content -replace "touch-action-manipulation", "touch-manipulation"
        if ($content -ne $newContent) {
            Set-Content $_.FullName -Value $newContent -Encoding UTF8
            Write-Host "Updated: $($_.FullName)"
        }
    }
}