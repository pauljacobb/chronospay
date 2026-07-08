#!/bin/bash
# Pre-commit hook setup to prevent secret leakage for StellarVax

echo "Setting up StellarVax git hooks..."
mkdir -p .git/hooks

# Write pre-commit hook
cat << 'EOF' > .git/hooks/pre-commit
#!/bin/bash
# Check if secret keys are being committed
# Stellar private keys start with S followed by 55 alphanumeric characters

SECRET_PATTERN="S[A-D][A-Z0-9]{54}"

FILES=$(git diff --cached --name-only)

for FILE in $FILES; do
    if [ -f "$FILE" ]; then
        if grep -qE "$SECRET_PATTERN" "$FILE"; then
            echo -e "\033[31m[ERROR] Stellar Secret Key detected in: $FILE\033[0m"
            echo "Please remove all secret keys (S...) from your code before committing."
            exit 1
        fi
    fi
done

echo "Security pre-commit checks passed."
exit 0
EOF

chmod +x .git/hooks/pre-commit
echo "Git hooks installed successfully."
