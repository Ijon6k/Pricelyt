#!/bin/bash
# Generate summaries for all READY trackers
set -e

LOGIN=$(curl -s -X POST http://localhost:4444/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@pricelyt.dev","password":"demo123456"}')

TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

echo "Token obtained: ${TOKEN:0:15}..."

# Get all READY tracker IDs
IDS=$(curl -s "http://localhost:4444/api/trackers" | python3 -c "
import sys,json
data=json.load(sys.stdin)
for t in data:
    if t.get('status') == 'READY':
        print(t['id'])")

count=0
for id in $IDS; do
  keyword=$(curl -s "http://localhost:4444/api/trackers/$id" | python3 -c "
import sys,json
print(json.load(sys.stdin).get('keyword','?'))")
  
  result=$(curl -s -X POST "http://localhost:4444/api/trackers/$id/summary" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  
  if echo "$result" | grep -q '"success":true'; then
    echo "  ✅ $keyword"
  else
    error=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin).get('error','unknown'))" 2>/dev/null || echo "parse error")
    echo "  ❌ $keyword — $error"
  fi
  count=$((count+1))
done

echo ""
echo "✨ $count summaries attempted"
