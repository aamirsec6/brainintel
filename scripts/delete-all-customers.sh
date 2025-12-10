#!/bin/bash
# Delete all customer data from the database

echo "🗑️  Deleting all customer data..."
echo ""

# Check if PostgreSQL container is running
if ! docker ps | grep -q retail-brain-postgres; then
    echo "❌ PostgreSQL container is not running!"
    echo "   Start it with: docker-compose up -d postgres"
    exit 1
fi

# Execute SQL script
echo "📊 Executing deletion script..."
docker exec -i retail-brain-postgres psql -U retail_brain_user -d retail_brain < scripts/delete-all-customers.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All customer data deleted successfully!"
    echo ""
    echo "💡 Dashboard will now show 'No customers found'"
else
    echo ""
    echo "❌ Error deleting customer data"
    exit 1
fi

