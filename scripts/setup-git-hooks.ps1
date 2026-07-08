# PowerShell script to setup pre-commit hooks for Windows developers
Write-Output "Setting up StellarVax git hooks for Windows..."

$hookDir = ".git/hooks"
if (!(Test-Path $hookDir)) {
    New-Item -ItemType Directory -Force -Path $hookDir
}

$hookFile = "$hookDir/pre-commit"
$hookContent = @"
#!/bin/sh
# Check if secret keys are being committed
# Stellar private keys start with S followed by 55 alphanumeric characters

SECRET_PATTERN="S[A-D][A-Z0-9]{54}"

FILES=\$(git diff --cached --name-only)

for FILE in \$FILES; do
    if [ -f "\$FILE" ]; then
        if grep -qE "\$SECRET_PATTERN" "\$FILE"; then
            echo "[ERROR] Stellar Secret Key detected in: \$FILE"
            echo "Please remove all secret keys (S...) from your code before committing."
            exit 1
        fi
    fi
done

echo "Security pre-commit checks passed."
exit 0
"@

Set-Content -Path $hookFile -Value $hookContent
Write-Output "Git hooks installed successfully."
