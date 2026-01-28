#!/bin/bash

# Script pour générer les icônes PWA à partir du SVG
# Ce script nécessite ImageMagick (brew install imagemagick)

echo "🦁 Génération des icônes PWA pour LionTrack..."

# Vérifier si ImageMagick est installé
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick n'est pas installé."
    echo "📦 Installation : brew install imagemagick"
    exit 1
fi

cd "$(dirname "$0")"

# Convertir le SVG en PNG haute résolution
echo "📐 Conversion du SVG..."
convert -background none icon-base.svg -resize 512x512 icon-base.png

# Générer toutes les tailles
sizes=(72 96 128 144 152 192 384 512)

for size in "${sizes[@]}"; do
    echo "✨ Génération de l'icône ${size}x${size}..."
    convert icon-base.png -resize ${size}x${size} icon-${size}x${size}.png
done

echo "✅ Toutes les icônes ont été générées avec succès!"
echo "📁 Les icônes se trouvent dans le dossier: public/images/"
