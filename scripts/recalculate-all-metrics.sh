#!/bin/bash
# Recalculate all customer profile metrics (total_spent, LTV, total_orders, etc.)

echo "🔄 Recalculating all customer profile metrics..."
echo ""

# Check if PostgreSQL container is running
if ! docker ps | grep -q retail-brain-postgres; then
    echo "❌ PostgreSQL container is not running!"
    echo "   Start it with: docker-compose up -d postgres"
    exit 1
fi

# Execute SQL script
echo "📊 Updating metrics from order_placed events..."
docker exec -i retail-brain-postgres psql -U retail_brain_user -d retail_brain < scripts/recalculate-all-metrics.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All profile metrics updated successfully!"
    echo ""
    echo "💡 Metrics updated:"
    echo "   - total_orders"
    echo "   - total_spent"
    echo "   - avg_order_value"
    echo "   - ltv (Lifetime Value)"
    echo "   - last_purchase_at"
    echo ""
    echo "🔄 Refresh your browser to see updated values!"
else
    echo ""
    echo "❌ Error updating metrics"
    exit 1
fi

