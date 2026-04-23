$destDir = "C:\Users\Usuario\Documents\Chip NFC\INDAUTOR_USB"
if (-not (Test-Path -Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir | Out-Null
    Write-Host "Carpeta C:\Users\Usuario\Documents\Chip NFC\INDAUTOR_USB creada."
} else {
    Write-Host "La carpeta C:\Users\Usuario\Documents\Chip NFC\INDAUTOR_USB ya existe."
}

$files = @(
    'src\middleware.ts',
    'src\app\activate\page.tsx',
    'src\app\profile\[id]\page.tsx',
    'src\app\dashboard\page.tsx',
    'src\app\api\log-access\route.ts',
    'src\app\api\activate\validate\route.ts',
    'src\app\emergencia\[token]\page.tsx',
    'src\components\ProfileViewer.tsx',
    'src\app\emergencia\[token]\EmergencyFamilyClient.tsx'
)

foreach ($file in $files) {
    if (Test-Path -LiteralPath $file) {
        $parentPath = Split-Path -Parent $file
        $destTargetPath = Join-Path -Path $destDir -ChildPath $parentPath
        if (-not (Test-Path -LiteralPath $destTargetPath)) {
            New-Item -ItemType Directory -Path $destTargetPath -Force | Out-Null
        }
        Copy-Item -LiteralPath $file -Destination $destTargetPath -Force
        Write-Host "Copiado: $file"
    } else {
        Write-Host "Archivo no encontrado: $file" -ForegroundColor Red
    }
}

if (Test-Path -Path "package.json") {
    Copy-Item -Path "package.json" -Destination $destDir -Force
    Write-Host "Copiado: package.json"
} else {
    Write-Host "Archivo package.json no encontrado." -ForegroundColor Red
}

tree src /F > "$destDir\ESTRUCTURA.txt"
Write-Host "Generado: ESTRUCTURA.txt en $destDir"
Write-Host "¡Exportación finalizada exitosamente!" -ForegroundColor Green
