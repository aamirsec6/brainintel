# A/B Testing Without a Customer-Facing Platform

You don't need a website or app to run A/B tests! You can test your **nudges, emails, and messaging** using your existing services.

## 🎯 What You Can Test

### 1. **Nudge Discounts**
Test different discount amounts in churn prevention nudges:
- Variant A: 10% discount
- Variant B: 20% discount
- **Question:** Which discount drives more purchases?

### 2. **Email Subject Lines**
Test different email subject lines:
- Variant A: "50% Off Today Only!"
- Variant B: "Your Exclusive Deal Inside"
- **Question:** Which gets more opens/purchases?

### 3. **Messaging Tone**
Test different messaging styles:
- Variant A: Friendly, casual tone
- Variant B: Urgent, limited-time tone
- **Question:** Which resonates better with customers?

### 4. **Nudge Timing**
Test when to send nudges:
- Variant A: Send at 9 AM
- Variant B: Send at 6 PM
- **Question:** Which time gets better response?

### 5. **Channel Selection**
Test which channel works better:
- Variant A: Email
- Variant B: WhatsApp
- **Question:** Which channel drives more conversions?

---

## 🔄 How It Works (Without a Platform)

### Step 1: Create Experiment
```bash
# Test discount amounts
curl -X POST http://localhost:3000/v1/ab-testing/experiments \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Churn Prevention Discount Test",
    "variants": ["A", "B"],
    "traffic_split": {"A": 50, "B": 50}
  }'
```

### Step 2: When Nudge Engine Evaluates Customer
```typescript
// In your nudge service
const experimentId = "your-experiment-id";
const variant = await getVariantForProfile(experimentId, profileId);

// Apply variant-specific discount
const discount = variant === "A" ? 10 : 20;
const nudge = {
  channel: "email",
  template: "churn_prevention",
  personalization: {
    discount: discount,
    message: `Get ${discount}% off!`
  }
};
```

### Step 3: Send Nudge
Send via your email/WhatsApp service (Twilio, SendGrid, etc.)

### Step 4: Track Conversion
When customer makes a purchase:
```bash
curl -X POST http://localhost:3000/v1/ab-testing/experiments/EXPERIMENT_ID/conversion \
  -H 'Content-Type: application/json' \
  -d '{
    "profile_id": "customer-id",
    "conversion_type": "purchase",
    "value": 1200
  }'
```

### Step 5: View Results
Check dashboard: http://localhost:3100/ab-testing

---

## 📊 Real-World Example

### Scenario: Testing Discount Amounts

**Setup:**
- Experiment: "Churn Prevention Discount Test"
- Variant A: 10% discount
- Variant B: 20% discount
- 100 customers tested (50 each)

**Results:**
- Variant A: 15 conversions (30% rate), ₹800 avg purchase
- Variant B: 25 conversions (50% rate), ₹750 avg purchase

**Insight:**
- Variant B (20% discount) has 67% higher conversion rate
- But lower average purchase value
- **Decision:** Use 20% discount if goal is more conversions, 10% if goal is higher margin

---

## 🚀 Quick Start

### Run the Demo
```bash
# Test A/B with nudge engine integration
bash scripts/test-ab-with-nudges.sh
```

This will:
1. Create an experiment
2. Assign variants to customers
3. Simulate nudge sends
4. Track conversions
5. Show results

### Integration Points

1. **Nudge Engine** (`services/nudge-engine/src/services/nudgeService.ts`)
   - When evaluating a nudge, check for active A/B tests
   - Assign variant and apply variant-specific personalization

2. **Intent Detection** (`services/intent-service/src/main.py`)
   - When detecting purchase intent, record conversion

3. **Event Collector** (`services/event-collector/`)
   - When customer makes purchase, record conversion

---

## 💡 Practical Use Cases

### Use Case 1: Email Campaign
1. Create experiment: "Black Friday Email Subject"
2. Send emails with different subject lines (A vs B)
3. Track opens and purchases
4. See which subject line wins

### Use Case 2: Churn Prevention
1. Create experiment: "Churn Discount Test"
2. Send nudges with 10% vs 20% discount
3. Track which customers purchase
4. Optimize discount strategy

### Use Case 3: Re-engagement
1. Create experiment: "Re-engagement Message Test"
2. Test friendly vs urgent messaging
3. Track response rates
4. Optimize messaging tone

---

## 🎯 Key Benefits

1. **No Platform Needed:** Test emails, nudges, messages directly
2. **Real Customer Data:** Use your actual customer profiles
3. **Data-Driven:** Make decisions based on real results
4. **Easy Integration:** Works with your existing services
5. **Track Everything:** Conversions, revenue, engagement

---

## 📝 Next Steps

1. **Run the demo:** `bash scripts/test-ab-with-nudges.sh`
2. **Create your first test:** Use the dashboard or API
3. **Integrate with nudges:** Modify nudge service to use A/B tests
4. **Track conversions:** Add conversion tracking to your purchase flow
5. **Analyze results:** Use dashboard to see which variants win

---

## 🔗 Related Files

- `services/nudge-engine/src/services/abTestingIntegration.ts` - Integration helper
- `scripts/test-ab-with-nudges.sh` - Practical demo
- `apps/dashboard/app/ab-testing/page.tsx` - Dashboard UI
- `services/ab-testing-service/` - A/B testing service

---

**Remember:** You don't need a website to test! Your emails, nudges, and messages ARE your platform. 🚀

