#!/bin/bash
# Database Setup Script for Vercel Deployment
# Replace YOUR_VERCEL_URL with your actual Vercel deployment URL

VERCEL_URL="${1:-YOUR_VERCEL_URL}"

if [ "$VERCEL_URL" = "YOUR_VERCEL_URL" ]; then
    echo "Usage: ./setup-database.sh https://your-app.vercel.app"
    echo ""
    echo "Or set it manually:"
    echo "curl -X POST https://your-app.vercel.app/api/setup"
    exit 1
fi

echo "Setting up database schema on: $VERCEL_URL"
echo ""

response=$(curl -s -X POST "$VERCEL_URL/api/setup")
echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"

echo ""
echo "Done! Check the response above to confirm success."

