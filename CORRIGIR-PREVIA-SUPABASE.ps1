# Corrige o historico de migracoes quando o esquema principal ja foi aplicado
# manualmente no Supabase, mas nao foi registrado como migration.
# Execute este arquivo no PowerShell, dentro da raiz do repositorio GitHub.

$ErrorActionPreference = 'Stop'
$migrationVersion = '20261003120000'
$projectRef = 'glzerebxnlkdtsbrwbhh'
$migrationFile = Join-Path (Get-Location).Path 'supabase\migrations\20261003120000_diario_bns_core.sql'
$configFile = Join-Path (Get-Location).Path 'supabase\config.toml'
$linkedProjectFile = Join-Path (Get-Location).Path 'supabase\.temp\project-ref'

if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
  Write-Host 'Supabase CLI nao encontrado. Instale o CLI e abra um novo PowerShell.' -ForegroundColor Red
  exit 1
}

if (-not (Test-Path -LiteralPath $migrationFile)) {
  Write-Host 'Nao encontrei supabase\migrations\20261003120000_diario_bns_core.sql.' -ForegroundColor Red
  Write-Host 'Execute este arquivo na raiz do repositorio que contem a pasta supabase\migrations.'
  exit 1
}

if (-not (Test-Path -LiteralPath $configFile)) {
  Write-Host 'A pasta supabase nao tem config.toml. Na raiz do repositorio, execute supabase init e rode este arquivo novamente.' -ForegroundColor Yellow
  exit 1
}

if (-not (Test-Path -LiteralPath $linkedProjectFile)) {
  Write-Host 'Projeto ainda nao vinculado. Execute estes comandos na raiz do repositorio e rode este arquivo novamente:' -ForegroundColor Yellow
  Write-Host '  supabase login'
  Write-Host "  supabase link --project-ref $projectRef"
  exit 1
}

$linkedProject = (Get-Content -LiteralPath $linkedProjectFile -Raw).Trim()
if ($linkedProject -ne $projectRef) {
  Write-Host "O projeto vinculado ($linkedProject) nao e o projeto esperado ($projectRef). Nada foi alterado." -ForegroundColor Red
  exit 1
}

Write-Host ''
Write-Host 'Este procedimento NAO apaga tabelas, usuarios nem dados.' -ForegroundColor Cyan
Write-Host 'Ele apenas registra no historico que a migration inicial ja foi aplicada.'
Write-Host ''
Write-Host "Projeto Supabase esperado: $projectRef"
Write-Host "Migration: $migrationVersion (Diario dos BNs - esquema principal)"
Write-Host ''
Write-Host 'ANTES DE CONTINUAR: confirme que o SQL da migration principal ja terminou com sucesso no projeto Supabase.' -ForegroundColor Yellow
Write-Host 'Se a migration falhou antes de criar todas as tabelas e funcoes, feche esta janela e nao continue.' -ForegroundColor Yellow
Write-Host ''

$confirmation = Read-Host 'Digite APLICADA para registrar a migration no historico remoto'
if ($confirmation -cne 'APLICADA') {
  Write-Host 'Cancelado. Nenhuma alteracao foi feita.'
  exit 0
}

Write-Host 'Atualizando apenas o historico de migrations do projeto vinculado…'
& supabase migration repair --status applied $migrationVersion --linked
if ($LASTEXITCODE -ne 0) {
  Write-Host ''
  Write-Host 'Nao foi possivel reparar. Confirme o login e o projeto vinculado:' -ForegroundColor Red
  Write-Host '  supabase login'
  Write-Host "  supabase link --project-ref $projectRef"
  Write-Host 'Depois execute este arquivo novamente.'
  exit $LASTEXITCODE
}

Write-Host ''
Write-Host 'Historico atualizado. Confira o resultado com:' -ForegroundColor Green
Write-Host '  supabase migration list --linked'
Write-Host 'A migration 20261003120000 deve aparecer como aplicada no remoto.'
Write-Host 'Depois volte ao GitHub Actions e escolha Reexecutar verificacoes.'
