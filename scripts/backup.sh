#!/usr/bin/env bash
# =============================================================================
# Dharma Calendar - Backup Script (Linux/WSL)
# =============================================================================
# Maakt een tar.gz backup van het project zonder node_modules, .next, etc.
#
# Gebruik:
#   ./scripts/backup.sh                    # Default backup locatie
#   ./scripts/backup.sh /path/to/backups   # Custom backup locatie
#   ./scripts/backup.sh --no-compress      # Alleen folder, geen tar.gz
# =============================================================================

set -e  # Exit on error

# =============================================================================
# CONFIGURATIE
# =============================================================================

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_NAME="dharma-calendar_${TIMESTAMP}"
NO_COMPRESS=false

# Default backup directory
if [[ -n "$WSL_DISTRO_NAME" ]]; then
    # WSL: Gebruik Windows filesystem voor toegankelijkheid
    BACKUP_DIR="/mnt/c/backups/dharma-calendar"
else
    # Native Linux
    BACKUP_DIR="${HOME}/backups/dharma-calendar"
fi

# Parse argumenten
if [[ $# -gt 0 ]]; then
    if [[ "$1" == "--no-compress" ]]; then
        NO_COMPRESS=true
    elif [[ "$1" != --* ]]; then
        BACKUP_DIR="$1"
    fi
fi

# Mappen en bestanden om te excluden
EXCLUDE_PATTERNS=(
    "node_modules"
    ".next"
    ".turbo"
    ".cache"
    "dist"
    "build"
    "out"
    ".git"
    "src/generated"
    "_dev"
    "_spike"
    "*.log"
    ".env.local"
    "*.tsbuildinfo"
    "backups"
)

# =============================================================================
# FUNCTIES
# =============================================================================

print_header() {
    echo ""
    echo -e "\033[1;36mDharma Calendar Backup\033[0m"
    echo -e "\033[1;36m======================\033[0m"
    echo ""
}

print_success() {
    echo -e "\033[1;32m[OK]\033[0m $1"
}

print_info() {
    echo -e "\033[1;33m[..]\033[0m $1"
}

print_error() {
    echo -e "\033[1;31m[ERROR]\033[0m $1"
}

format_size() {
    local bytes=$1
    if [[ $bytes -lt 1024 ]]; then
        echo "${bytes}B"
    elif [[ $bytes -lt 1048576 ]]; then
        echo "$(awk "BEGIN {printf \"%.2f\", $bytes/1024}")KB"
    elif [[ $bytes -lt 1073741824 ]]; then
        echo "$(awk "BEGIN {printf \"%.2f\", $bytes/1048576}")MB"
    else
        echo "$(awk "BEGIN {printf \"%.2f\", $bytes/1073741824}")GB"
    fi
}

# =============================================================================
# MAIN
# =============================================================================

print_header

echo "Source: $PROJECT_DIR"
echo "Backup: $BACKUP_DIR/$BACKUP_NAME"
echo ""

# Maak backup directory als die niet bestaat
if [[ ! -d "$BACKUP_DIR" ]]; then
    mkdir -p "$BACKUP_DIR"
    print_success "Backup directory aangemaakt: $BACKUP_DIR"
fi

# Tijdelijke directory voor backup
TEMP_BACKUP_DIR="$BACKUP_DIR/$BACKUP_NAME"

# Bouw exclude argumenten voor rsync
RSYNC_EXCLUDES=()
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    RSYNC_EXCLUDES+=("--exclude=$pattern")
done

# Kopieer bestanden met exclusies
print_info "Bestanden kopieren..."

if command -v rsync &> /dev/null; then
    # Gebruik rsync (sneller en betere progress)
    rsync -a --quiet \
        "${RSYNC_EXCLUDES[@]}" \
        "$PROJECT_DIR/" \
        "$TEMP_BACKUP_DIR/"
else
    # Fallback naar cp met find
    print_info "rsync niet gevonden, gebruik cp (langzamer)..."

    mkdir -p "$TEMP_BACKUP_DIR"

    # Build find exclude arguments
    FIND_EXCLUDES=()
    for pattern in "${EXCLUDE_PATTERNS[@]}"; do
        # Skip wildcard patterns for -name matching
        if [[ "$pattern" != *"*"* ]]; then
            FIND_EXCLUDES+=(-o -name "$pattern")
        fi
    done

    # Kopieer met find en exclude
    find "$PROJECT_DIR" -type f \
        ! \( -path "*/node_modules/*" -o -path "*/.next/*" -o -path "*/.git/*" \
             -o -path "*/_dev/*" -o -path "*/src/generated/*" -o -name "*.log" \) \
        -exec cp --parents {} "$TEMP_BACKUP_DIR/" \; 2>/dev/null
fi

print_success "Bestanden gekopieerd"

# Maak tar.gz bestand
if [[ "$NO_COMPRESS" == false ]]; then
    print_info "TAR.GZ bestand maken..."

    TAR_PATH="$BACKUP_DIR/$BACKUP_NAME.tar.gz"

    # Verwijder bestaand tar.gz bestand als het bestaat
    if [[ -f "$TAR_PATH" ]]; then
        rm -f "$TAR_PATH"
    fi

    # Maak tar.gz
    tar -czf "$TAR_PATH" -C "$BACKUP_DIR" "$BACKUP_NAME" 2>/dev/null

    if [[ $? -eq 0 ]]; then
        # Verwijder tijdelijke directory
        rm -rf "$TEMP_BACKUP_DIR"

        # Toon bestandsgrootte
        if [[ -f "$TAR_PATH" ]]; then
            TAR_SIZE=$(stat -f%z "$TAR_PATH" 2>/dev/null || stat -c%s "$TAR_PATH" 2>/dev/null)
            TAR_SIZE_FORMATTED=$(format_size "$TAR_SIZE")
            print_success "TAR.GZ aangemaakt: $TAR_PATH ($TAR_SIZE_FORMATTED)"
        fi
    else
        print_error "TAR.GZ creatie gefaald"
        print_info "Backup directory blijft behouden: $TEMP_BACKUP_DIR"
        echo ""
        exit 1
    fi
else
    print_success "Backup directory: $TEMP_BACKUP_DIR"
fi

echo ""
print_success "Backup compleet!"
echo ""

# Toon recente backups
echo -e "\033[1;36mRecente backups:\033[0m"

if [[ "$NO_COMPRESS" == false ]]; then
    # Toon tar.gz bestanden
    BACKUPS=$(find "$BACKUP_DIR" -maxdepth 1 -name "dharma-calendar_*.tar.gz" -type f 2>/dev/null | sort -r | head -n 5)

    if [[ -n "$BACKUPS" ]]; then
        while IFS= read -r backup; do
            if [[ -f "$backup" ]]; then
                BACKUP_SIZE=$(stat -f%z "$backup" 2>/dev/null || stat -c%s "$backup" 2>/dev/null)
                BACKUP_SIZE_FORMATTED=$(format_size "$BACKUP_SIZE")
                BACKUP_NAME=$(basename "$backup")
                echo "   $BACKUP_NAME ($BACKUP_SIZE_FORMATTED)"
            fi
        done <<< "$BACKUPS"
    else
        echo "   (geen backups gevonden)"
    fi
else
    # Toon directories
    BACKUPS=$(find "$BACKUP_DIR" -maxdepth 1 -name "dharma-calendar_*" -type d 2>/dev/null | sort -r | head -n 5)

    if [[ -n "$BACKUPS" ]]; then
        while IFS= read -r backup; do
            if [[ -d "$backup" ]]; then
                BACKUP_SIZE=$(du -sb "$backup" 2>/dev/null | cut -f1)
                BACKUP_SIZE_FORMATTED=$(format_size "$BACKUP_SIZE")
                BACKUP_NAME=$(basename "$backup")
                echo "   $BACKUP_NAME/ ($BACKUP_SIZE_FORMATTED)"
            fi
        done <<< "$BACKUPS"
    else
        echo "   (geen backups gevonden)"
    fi
fi

echo ""
