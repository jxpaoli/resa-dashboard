#!/bin/sh
# Teste l'accès GitHub du jeton projet. N'affiche QUE des codes HTTP, jamais de secret.
root="$(cd "$(dirname "$0")/.." && pwd)"
token=$(grep '^GITHUB_TOKEN=' "$root/.env.project.local" | cut -d= -f2- | tr -d '\r ')
[ -n "$token" ] || { echo "GITHUB_TOKEN vide"; exit 1; }

check() {
  code=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $token" \
    -H "Accept: application/vnd.github+json" "https://api.github.com$1")
  echo "$2 -> HTTP $code (attendu $3)"
}

check "/repos/jxpaoli/resa-dashboard" "depot du projet (lecture)" 200
check "/repos/jxpaoli/resa-dashboard/collaborators" "depot du projet (droit ecriture)" 200
check "/repos/jxpaoli/boulangerie-U/collaborators" "autre depot du compte (isolation)" "403/404"
