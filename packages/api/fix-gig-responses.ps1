# Fix all gig/responses files
$ErrorActionPreference = "Stop"

$files = Get-ChildItem -Path "src/routers/gig/responses" -Filter "*.ts" -Exclude "index.ts"

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Fix import type response -> regular import
    $content = $content -replace 'import \{\s*type response,', 'import {'
    $content = $content -replace ',\s*type response\s*,', ','
    
    # Fix response variable conflicts - rename to gigResponse
    # Only in query contexts where it's used as variable
    $content = $content -replace 'const response = await ctx\.db\.query\.response', 'const gigResponse = await ctx.db.query.response'
    $content = $content -replace '\[response\] = await', '[gigResponse] = await'
    
    # Fix references to the renamed variable
    $content = $content -replace 'if \(!response\)', 'if (!gigResponse)'
    $content = $content -replace 'if \(response\.', 'if (gigResponse.'
    $content = $content -replace 'return response;', 'return gigResponse;'
    
    # Remove gig from with clause (doesn't exist anymore)
    $content = $content -replace 'with:\s*\{\s*gig:\s*true,?\s*\}', 'with: { globalCandidate: true }'
    $content = $content -replace 'with:\s*\{\s*gig:\s*true\s*\}', 'with: { globalCandidate: true }'
    
    # Fix response.gig references - need to load gig separately
    # This is more complex, will handle manually if needed
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Fixed: $($file.Name)"
    }
}

Write-Host "`nDone!"
