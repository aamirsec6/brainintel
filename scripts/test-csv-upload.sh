#!/bin/bash

# Test CSV Upload Functionality

echo "🧪 Testing CSV Upload"
echo "===================="
echo ""

# Check if onboarding service is running
echo "1. Checking Onboarding Service..."
if curl -s http://localhost:3005/health > /dev/null 2>&1; then
    echo "   ✅ Onboarding Service is running"
else
    echo "   ❌ Onboarding Service is NOT running"
    echo "   Start it with: cd services/onboarding-service && pnpm dev"
    exit 1
fi

# Create sample CSV
echo ""
echo "2. Creating sample CSV file..."
cat > /tmp/test-customers.csv << 'EOF'
phone,email,name,city,state
+1234567890,john@example.com,John Doe,New York,NY
+1987654321,jane@example.com,Jane Smith,Los Angeles,CA
+1555555555,bob@example.com,Bob Johnson,Chicago,IL
EOF
echo "   ✅ Created /tmp/test-customers.csv"

# Test upload
echo ""
echo "3. Testing CSV upload..."
UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:3005/onboarding/csv/upload \
  -F "file=@/tmp/test-customers.csv")

if echo "$UPLOAD_RESPONSE" | grep -q "rows_count"; then
    echo "   ✅ Upload successful"
    echo "$UPLOAD_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$UPLOAD_RESPONSE"
else
    echo "   ❌ Upload failed"
    echo "$UPLOAD_RESPONSE"
    exit 1
fi

echo ""
echo "✅ CSV Upload Test Complete!"
echo ""
echo "To test in the dashboard:"
echo "1. Go to http://localhost:3100/import"
echo "2. Upload /tmp/test-customers.csv"
echo "3. Map columns and import"

