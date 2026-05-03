# Script to fix Next.js 16 async params in route handlers
# This updates all route handlers to use Promise-based params

$apiDir = "app\api"
$files = Get-ChildItem -Path $apiDir -Filter "route.ts" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Pattern 1: { params }: { params: { id: string } }
    $content = $content -replace '\{ params \}: \{ params: \{ id: string \} \}', '{ params }: { params: Promise<{ id: string }> }'
    
    # Pattern 2: { params }: { params: { id: string; pageId: string } }
    $content = $content -replace '\{ params \}: \{ params: \{ id: string; pageId: string \} \}', '{ params }: { params: Promise<{ id: string; pageId: string }> }'
    
    # Pattern 3: { params }: { params: { id: string; variationId: string } }
    $content = $content -replace '\{ params \}: \{ params: \{ id: string; variationId: string \} \}', '{ params }: { params: Promise<{ id: string; variationId: string }> }'
    
    # Pattern 4: { params }: { params: { id: string; taskId: string } }
    $content = $content -replace '\{ params \}: \{ params: \{ id: string; taskId: string \} \}', '{ params }: { params: Promise<{ id: string; taskId: string }> }'
    
    # Pattern 5: { params }: { params: { conversationId: string } }
    $content = $content -replace '\{ params \}: \{ params: \{ conversationId: string \} \}', '{ params }: { params: Promise<{ conversationId: string }> }'
    
    # Pattern 6: { params }: { params: { channelId: string } }
    $content = $content -replace '\{ params \}: \{ params: \{ channelId: string \} \}', '{ params }: { params: Promise<{ channelId: string }> }'
    
    # Pattern 7: { params }: { params: { sessionId: string } }
    $content = $content -replace '\{ params \}: \{ params: \{ sessionId: string \} \}', '{ params }: { params: Promise<{ sessionId: string }> }'
    
    # Pattern 8: { params }: { params: { accountId: string } }
    $content = $content -replace '\{ params \}: \{ params: \{ accountId: string \} \}', '{ params }: { params: Promise<{ accountId: string }> }'
    
    # Pattern 9: { params }: { params: { paymentId: string } }
    $content = $content -replace '\{ params \}: \{ params: \{ paymentId: string \} \}', '{ params }: { params: Promise<{ paymentId: string }> }'
    
    # Pattern 10: { params }: { params: { industry: string } }
    $content = $content -replace '\{ params \}: \{ params: \{ industry: string \} \}', '{ params }: { params: Promise<{ industry: string }> }'
    
    # Now update all params.id, params.pageId, etc. to await params first
    # This is more complex - we need to find where params is used and add await
    
    if ($content -ne $originalContent) {
        # Add await for params usage
        # Replace params.id with const { id } = await params (if not already done)
        # This requires more careful parsing, so we'll do a simpler approach:
        # Replace direct params.property access with destructured await
        
        # Pattern: const something = params.id
        $content = $content -replace 'const (\w+) = params\.id', 'const { id: $1 } = await params'
        
        # Pattern: params.id (standalone usage)
        # We need to be more careful here - only replace in function bodies
        # For now, let's do a simple replacement and the developer can fix edge cases
        
        # Replace params.pageId
        $content = $content -replace 'const (\w+) = params\.pageId', 'const { pageId: $1 } = await params'
        
        # Replace params.variationId
        $content = $content -replace 'const (\w+) = params\.variationId', 'const { variationId: $1 } = await params'
        
        # Replace params.taskId
        $content = $content -replace 'const (\w+) = params\.taskId', 'const { taskId: $1 } = await params'
        
        # Replace params.conversationId
        $content = $content -replace 'const (\w+) = params\.conversationId', 'const { conversationId: $1 } = await params'
        
        # Replace params.channelId
        $content = $content -replace 'const (\w+) = params\.channelId', 'const { channelId: $1 } = await params'
        
        # Replace params.sessionId
        $content = $content -replace 'const (\w+) = params\.sessionId', 'const { sessionId: $1 } = await params'
        
        # Replace params.accountId
        $content = $content -replace 'const (\w+) = params\.accountId', 'const { accountId: $1 } = await params'
        
        # Replace params.paymentId
        $content = $content -replace 'const (\w+) = params\.paymentId', 'const { paymentId: $1 } = await params'
        
        # Replace params.industry
        $content = $content -replace 'const (\w+) = params\.industry', 'const { industry: $1 } = await params'
        
        # For direct usage like params.id in where clauses, we need await params first
        # This is trickier - we'll need to add await params at the start of the function
        # For now, let's handle the common case where params.id is used directly
        
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "Done! Note: You may need to manually fix some edge cases where params properties are used directly."
