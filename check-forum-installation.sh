#!/bin/bash

# 📋 CHECKLIST DE DÉPLOIEMENT DU FORUM LIONTRACK
# Exécutez ce script pour vérifier l'installation

set -e

echo "🦁 VERIFICATION FORUM LIONTRACK"
echo "================================"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
PASSED=0
FAILED=0

check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
  fi
}

check_dir() {
  if [ -d "$1" ]; then
    echo -e "${GREEN}✓${NC} $1/"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $1/"
    ((FAILED++))
  fi
}

echo "📁 FICHIERS FRONTEND"
echo "---"
check_file "public/forum.html"
check_file "public/css/forum-styles.css"
check_file "public/css/forum-animations.css"
check_file "public/js/forum.js"
check_file "public/js/forum-mock.js"
echo ""

echo "📁 FICHIERS BACKEND"
echo "---"
check_dir "services/forum"
check_file "services/forum/forum.routes.js"
check_file "services/forum/forum.controller.js"
check_file "services/forum/forum.model.js"
echo ""

echo "📚 DOCUMENTATION"
echo "---"
check_file "public/FORUM_README.md"
check_file "FORUM_INTEGRATION.md"
check_file "public/FORUM_INTEGRATION_EXAMPLES.html"
check_file "FORUM_CHANGELOG.md"
echo ""

echo "🔍 VÉRIFICATIONS SUPPLÉMENTAIRES"
echo "---"

# Vérifier si forum.html inclut les bons CSS/JS
if grep -q "forum-styles.css" public/forum.html; then
  echo -e "${GREEN}✓${NC} forum.html inclut forum-styles.css"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} forum.html ne trouvé pas forum-styles.css"
  ((FAILED++))
fi

if grep -q "forum.js" public/forum.html; then
  echo -e "${GREEN}✓${NC} forum.html inclut forum.js"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} forum.html ne trouvé pas forum.js"
  ((FAILED++))
fi

# Vérifier les icones Font Awesome
if grep -q "font-awesome" public/forum.html; then
  echo -e "${GREEN}✓${NC} Font Awesome inclus"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Font Awesome manquant"
  ((FAILED++))
fi

# Vérifier responsivité CSS
if grep -q "@media" public/css/forum-styles.css; then
  echo -e "${GREEN}✓${NC} Media queries présentes (responsive)"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Media queries manquantes"
  ((FAILED++))
fi

echo ""
echo "================================"
echo -e "RÉSULTATS: ${GREEN}$PASSED réussis${NC}, ${RED}$FAILED échoués${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ Installation réussie ! 🎉${NC}"
  echo ""
  echo "Prochaines étapes:"
  echo "1. Ouvrir public/forum.html dans le navigateur"
  echo "2. Vérifier le bon fonctionnement avec forum-mock.js"
  echo "3. Implémenter les endpoints backend selon FORUM_INTEGRATION.md"
  echo "4. Intégrer dans votre application"
  exit 0
else
  echo -e "${RED}✗ Quelques fichiers manquent${NC}"
  echo ""
  echo "Fichiers requis:"
  echo "- public/forum.html"
  echo "- public/css/forum-styles.css"
  echo "- public/js/forum.js"
  echo "- public/js/forum-mock.js"
  echo "- services/forum/*"
  exit 1
fi
