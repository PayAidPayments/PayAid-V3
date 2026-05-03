Add-Type -AssemblyName System.IO.Compression.FileSystem

$docxPath = "PayAid V3 Zero-Cost Blueprint.docx"
$outputPath = "blueprint-content.txt"

try {
    $zip = [System.IO.Compression.ZipFile]::OpenRead($docxPath)
    $entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
    
    if ($entry) {
        $stream = $entry.Open()
        $reader = New-Object System.IO.StreamReader($stream)
        $content = $reader.ReadToEnd()
        $reader.Close()
        $stream.Close()
        
        # Extract text from XML (simple extraction)
        $content = $content -replace '<[^>]+>', ' '
        $content = $content -replace '\s+', ' '
        $content = $content.Trim()
        
        $content | Out-File -FilePath $outputPath -Encoding UTF8
        Write-Host "Extracted successfully to $outputPath"
        Write-Host "First 2000 characters:"
        Write-Host $content.Substring(0, [Math]::Min(2000, $content.Length))
    } else {
        Write-Host "document.xml not found in the docx file"
    }
    
    $zip.Dispose()
} catch {
    Write-Host "Error: $_"
}
