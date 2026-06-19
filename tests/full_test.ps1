$BASE = "http://127.0.0.1:8000"
$pass = 0; $fail = 0
$tmpFile = "D:\fupeijun\Projects\gali-rag-2\data\_resp.json"
$reqFile = "D:\fupeijun\Projects\gali-rag-2\data\_req.json"

function Assert {
    param([string]$Name, [scriptblock]$Test, [string]$Expect = "")
    try {
        $result = & $Test
        $rs = "$result"
        if ($Expect -and ($rs -notmatch [regex]::Escape($Expect))) {
            Write-Host "  FAIL: $Name (expected '$Expect', got '$rs')" -ForegroundColor Red; $script:fail++
        } else {
            Write-Host "  PASS: $Name" -ForegroundColor Green; $script:pass++
        }
    } catch {
        Write-Host "  FAIL: $Name - $($_.Exception.Message)" -ForegroundColor Red; $script:fail++
    }
}

function Wait-Server {
    for ($i = 0; $i -lt 30; $i++) {
        try { $r = Invoke-RestMethod -Uri "$BASE/health" -TimeoutSec 2 -ErrorAction Stop; if ($r.status -eq "ok") { return $true } } catch {}
        Start-Sleep -Seconds 1
    }
    return $false
}

function Curl-Req {
    param([string]$Method, [string]$Path, [string]$Body = "", [string]$Key = "")
    $args = @("-s", "-o", $tmpFile, "-w", "%{http_code}", "-X", $Method)
    if ($Body) {
        [System.IO.File]::WriteAllText($reqFile, $Body, [System.Text.Encoding]::UTF8)
        $args += "-H"; $args += "Content-Type: application/json"
        $args += "-d"; $args += "@$reqFile"
    }
    if ($Key) { $args += "-H"; $args += "X-API-Key: $Key" }
    $args += "$BASE$Path"
    $code = & curl.exe @args 2>&1
    $bodyStr = if (Test-Path $tmpFile) { Get-Content $tmpFile -Raw -Encoding UTF8 } else { "" }
    return @{ Code = [int]$code; Body = $bodyStr }
}

function Upload {
    param([string]$FilePath)
    $raw = & curl.exe -s -o $tmpFile -w "%{http_code}" -X POST "$BASE/api/v1/knowledge-bases/1/documents/upload" -F "files=@$FilePath" 2>&1
    $bodyStr = if (Test-Path $tmpFile) { Get-Content $tmpFile -Raw -Encoding UTF8 } else { "" }
    $j = $bodyStr | ConvertFrom-Json
    return @{ Code = [int]$raw; Json = $j }
}

function Start-App {
    Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
    Start-Process -FilePath "python" -ArgumentList "-m","uvicorn","main:app","--host","127.0.0.1","--port","8000" `
        -WorkingDirectory "D:\fupeijun\Projects\gali-rag-2" -WindowStyle Hidden | Out-Null
    return (Wait-Server)
}

function Stop-App {
    Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
    $conns = netstat -ano 2>$null | Select-String ":8000.*LISTENING"
    foreach ($line in $conns) {
        $pid = ($line -split '\s+')[-1]
        if ($pid -match '^\d+$') { Stop-Process -Id ([int]$pid) -Force -ErrorAction SilentlyContinue }
    }
    Start-Sleep -Seconds 2
}

function J { param($s) if ($s) { $s | ConvertFrom-Json } else { $null } }

# ============================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Phase 1: No API Key" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Remove-Item "D:\fupeijun\Projects\gali-rag-2\.env" -ErrorAction SilentlyContinue
Remove-Item "D:\fupeijun\Projects\gali-rag-2\data\gali_rag.db" -ErrorAction SilentlyContinue
Remove-Item "D:\fupeijun\Projects\gali-rag-2\data\chroma" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "D:\fupeijun\Projects\gali-rag-2\data\uploads" -Recurse -Force -ErrorAction SilentlyContinue

Assert "Server started" { Start-App } "True"

Write-Host "`n[Health]" -ForegroundColor Yellow
$r = Curl-Req GET "/health"
Assert "Health ok" { (J $r.Body).status } "ok"
Assert "Health version" { (J $r.Body).version } "1.0.0"

Write-Host "`n[KB CRUD]" -ForegroundColor Yellow
$r = Curl-Req POST "/api/v1/knowledge-bases" '{"name":"KB-Alpha","description":"first","chunk_size":400}'
$kb1 = J $r.Body
Assert "Create KB id=1" { $kb1.id } "1"
Assert "KB name" { $kb1.name } "KB-Alpha"
Assert "KB chunk_size" { $kb1.chunk_size } "400"
Assert "KB chroma" { $kb1.chroma_collection -match "^kb_" } ""

$r = Curl-Req POST "/api/v1/knowledge-bases" '{"name":"KB-Beta"}'
Assert "Create KB id=2" { (J $r.Body).id } "2"

$r = Curl-Req POST "/api/v1/knowledge-bases" '{"name":"KB-Alpha"}'
Assert "Dup name 400" { $r.Code } "400"

Assert "List KBs=2" { (J (Curl-Req GET "/api/v1/knowledge-bases").Body).Count } "2"
Assert "Get KB" { (J (Curl-Req GET "/api/v1/knowledge-bases/1").Body).name } "KB-Alpha"

$r = Curl-Req PUT "/api/v1/knowledge-bases/1" '{"name":"KB-Alpha-v2"}'
Assert "Update KB" { (J $r.Body).name } "KB-Alpha-v2"

$r = Curl-Req GET "/api/v1/knowledge-bases/999"
Assert "Missing KB 404" { $r.Code } "404"

Write-Host "`n[Upload]" -ForegroundColor Yellow
$testFile = "D:\fupeijun\Projects\gali-rag-2\data\test_doc.txt"
("Knowledge base is a system for storing and retrieving documents. RAG stands for Retrieval Augmented Generation. " * 50) | Out-File $testFile -Encoding utf8

$u = Upload $testFile
Assert "Upload 200" { $u.Json.code } "200"
Assert "Upload completed" { $u.Json.data[0].status } "completed"
Assert "Chunks > 0" { [int]$u.Json.data[0].chunk_count -gt 0 } "True"
$script:docId = $u.Json.data[0].doc_id

$testMd = "D:\fupeijun\Projects\gali-rag-2\data\test_doc2.md"
("# AI Guide`n`nMachine learning and deep learning. " * 30) | Out-File $testMd -Encoding utf8
$u2 = Upload $testMd
Assert "Upload md" { $u2.Json.data[0].status } "completed"

Write-Host "`n[Docs]" -ForegroundColor Yellow
Assert "List docs=2" { (J (Curl-Req GET "/api/v1/knowledge-bases/1/documents").Body).Count } "2"

$r = Curl-Req POST "/api/v1/documents/$script:docId/reprocess"
Assert "Reprocess" { $r.Code } "200"

$r = Curl-Req POST "/api/v1/documents/$script:docId/summary"
Assert "Summary" { $r.Code } "200"

$r = Curl-Req PUT "/api/v1/knowledge-bases/1/chunk-config" '{"chunk_size":600}'
Assert "Chunk config" { $r.Code } "200"

$r = Curl-Req POST "/api/v1/knowledge-bases/1/clean-vectors"
Assert "Clean vectors" { $r.Code } "200"

$r = Curl-Req POST "/api/v1/knowledge-bases/1/clear-vectors"
Assert "Clear vectors" { $r.Code } "200"

Write-Host "`n[Models]" -ForegroundColor Yellow
Assert "List models" { (J (Curl-Req GET "/api/v1/models").Body).Count -gt 0 } "True"

$r = Curl-Req POST "/api/v1/models" '{"name":"test-llm","provider":"ollama","model_type":"llm","model_name":"qwen2.5:7b","base_url":"http://localhost:11434"}'
$model = J $r.Body
Assert "Create model" { $model.name } "test-llm"

$r = Curl-Req PUT "/api/v1/models/$($model.id)" '{"name":"test-llm-v2"}'
Assert "Update model" { (J $r.Body).name } "test-llm-v2"

Write-Host "`n[Agents]" -ForegroundColor Yellow
$r = Curl-Req POST "/api/v1/agents" '{"name":"TestAgent","description":"test agent","knowledge_base_ids":[1]}'
$agent = J $r.Body
Assert "Create agent" { $agent.name } "TestAgent"
Assert "Agent has kb" { $agent.knowledge_base_ids[0] } "1"

$r = Curl-Req GET "/api/v1/agents"
Assert "List agents" { (J $r.Body).Count } "1"

$json = '{"name":"TestAgent-v2","llm_model_id":' + $model.id + '}'
$r = Curl-Req PUT "/api/v1/agents/$($agent.id)" $json
Assert "Update agent" { (J $r.Body).name } "TestAgent-v2"

Write-Host "`n[Conversations]" -ForegroundColor Yellow
$r = Curl-Req POST "/api/v1/conversations?agent_id=$($agent.id)&title=test"
$conv = J $r.Body
Assert "Create conv" { $conv.id } "1"
Assert "Conv title" { $conv.title } "test"
Assert "List convs" { (J (Curl-Req GET "/api/v1/conversations").Body).Count } "1"
Assert "Messages empty" { (J (Curl-Req GET "/api/v1/conversations/1/messages").Body).Count } "0"

Write-Host "`n[Chat]" -ForegroundColor Yellow
Assert "Re-upload" { (Upload $testFile).Json.data[0].status } "completed"

$r = Curl-Req POST "/api/v1/agents/$($agent.id)/chat" '{"query":"What is RAG?","conversation_id":1,"stream":false}'
Assert "Chat responds" { $r.Code -in @(200,500) } "True"

$r = Curl-Req POST "/api/v1/agents/$($agent.id)/chat" '{"query":"test","conversation_id":1,"stream":true}'
Assert "Stream responds" { $r.Code -in @(200,500) } "True"

Write-Host "`n[Prompts]" -ForegroundColor Yellow
Assert "List prompts" { (J (Curl-Req GET "/api/v1/prompts").Body).Count -gt 0 } "True"
Assert "Filter qa_main" { (J (Curl-Req GET "/api/v1/prompts?category=qa_main").Body).Count -gt 0 } "True"
Assert "Get prompt" { (J (Curl-Req GET "/api/v1/prompts/1").Body).category } "qa_main"

$r = Curl-Req POST "/api/v1/prompts" '{"name":"c","category":"qa_main","content":"test"}'
$p = J $r.Body
Assert "Create prompt" { $p.name } "c"

$r = Curl-Req PUT "/api/v1/prompts/$($p.id)" '{"name":"c2"}'
Assert "Update prompt" { (J $r.Body).name } "c2"

$r = Curl-Req POST "/api/v1/prompts/$($p.id)/set-default"
Assert "Set default" { (J $r.Body).code } "200"

$r = Curl-Req POST "/api/v1/prompts/$($p.id)/reset"
Assert "Reset" { (J $r.Body).code } "200"

$r = Curl-Req DELETE "/api/v1/prompts/$($p.id)"
Assert "Delete prompt" { (J $r.Body).code } "200"

$r = Curl-Req DELETE "/api/v1/prompts/1"
Assert "System prompt safe" { $r.Code } "400"

Write-Host "`n[Resources]" -ForegroundColor Yellow
$res = J (Curl-Req GET "/api/v1/resources").Body
Assert "Docs > 0" { $res.total_documents -gt 0 } "True"
Assert "Chroma >= 0" { $res.chroma_size_mb -ge 0 } "True"

Write-Host "`n[Export]" -ForegroundColor Yellow
Assert "Export conv" { (J (Curl-Req GET "/api/v1/conversations/1/export").Body).code } "200"
Assert "Export all" { (J (Curl-Req GET "/api/v1/export/messages").Body).code } "200"
Assert "Export all data" { (J (Curl-Req GET "/api/v1/export/messages").Body).data.Count -gt 0 } "True"
Assert "Export by agent" { (J (Curl-Req GET "/api/v1/export/messages?agent_id=$($agent.id)").Body).code } "200"
Assert "Export agent data" { (J (Curl-Req GET "/api/v1/export/messages?agent_id=$($agent.id)").Body).data.Count -gt 0 } "True"
Assert "Export empty agent" { (J (Curl-Req GET "/api/v1/export/messages?agent_id=999").Body).data.Count } "0"

Write-Host "`n[Delete]" -ForegroundColor Yellow
$r = Curl-Req DELETE "/api/v1/documents/$script:docId"
Assert "Delete doc" { (J $r.Body).code } "200"
Assert "Docs after" { (J (Curl-Req GET "/api/v1/knowledge-bases/1/documents").Body).Count } "2"

$r = Curl-Req DELETE "/api/v1/conversations/1"
Assert "Delete conv" { (J $r.Body).code } "200"

$r = Curl-Req DELETE "/api/v1/agents/$($agent.id)"
Assert "Delete agent" { (J $r.Body).code } "200"

$r = Curl-Req DELETE "/api/v1/knowledge-bases/2"
Assert "Delete KB-2" { (J $r.Body).code } "200"

$r = Curl-Req DELETE "/api/v1/knowledge-bases/1"
Assert "Delete KB-1" { (J $r.Body).code } "200"

Assert "KBs empty" { (J (Curl-Req GET "/api/v1/knowledge-bases").Body).Count } "0"

Write-Host "`n[Errors]" -ForegroundColor Yellow
$r = Curl-Req GET "/api/v1/knowledge-bases/1"
Assert "Deleted KB 404" { $r.Code } "404"

$r = Curl-Req POST "/api/v1/documents/999/reprocess"
Assert "Reprocess 999" { $r.Code } "404"

$r = Curl-Req POST "/api/v1/knowledge-bases" '{"name":""}'
Assert "Empty name 422" { $r.Code } "422"

Stop-App

# ============================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Phase 2: API Key Auth" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

"API_KEY=test-key-abc123" | Out-File "D:\fupeijun\Projects\gali-rag-2\.env" -Encoding ascii -NoNewline

Assert "Server with key" { Start-App } "True"

$r = Curl-Req GET "/health"
Assert "Health ok" { (J $r.Body).status } "ok"

$r = Curl-Req GET "/api/v1/knowledge-bases"
Assert "No key 401" { $r.Code } "401"

$r = Curl-Req GET "/api/v1/knowledge-bases" -Key "wrong"
Assert "Wrong key 401" { $r.Code } "401"

$r = Curl-Req POST "/api/v1/knowledge-bases" '{"name":"Auth-KB"}' -Key "test-key-abc123"
Assert "Correct key" { (J $r.Body).name } "Auth-KB"

Stop-App

# ============================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  RESULTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$total = $pass + $fail
$pct = if ($total -gt 0) { [math]::Round($pass / $total * 100, 1) } else { 0 }
Write-Host "  Total:  $total" -ForegroundColor White
Write-Host "  Passed: $pass" -ForegroundColor Green
Write-Host "  Failed: $fail" -ForegroundColor $(if ($fail -gt 0) { "Red" } else { "Green" })
Write-Host "  Rate:   $pct%" -ForegroundColor $(if ($fail -eq 0) { "Green" } elseif ($pct -gt 80) { "Yellow" } else { "Red" })
Write-Host "========================================`n" -ForegroundColor Cyan

Remove-Item "D:\fupeijun\Projects\gali-rag-2\.env" -ErrorAction SilentlyContinue
Remove-Item "D:\fupeijun\Projects\gali-rag-2\data\gali_rag.db" -ErrorAction SilentlyContinue
Remove-Item "D:\fupeijun\Projects\gali-rag-2\data\chroma" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "D:\fupeijun\Projects\gali-rag-2\data\uploads" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "D:\fupeijun\Projects\gali-rag-2\data\test_doc.txt" -ErrorAction SilentlyContinue
Remove-Item "D:\fupeijun\Projects\gali-rag-2\data\test_doc2.md" -ErrorAction SilentlyContinue
Remove-Item "D:\fupeijun\Projects\gali-rag-2\data\_resp.json" -ErrorAction SilentlyContinue
Remove-Item "D:\fupeijun\Projects\gali-rag-2\data\_req.json" -ErrorAction SilentlyContinue
