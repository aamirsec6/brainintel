# A/B Testing Playbook

Practical steps to run experiments on your customer data.

## 1) Create an experiment
- Go to `/ab-testing` → “+ New Experiment”
- Choose variants (A, B, …) and traffic split (sums to 100%)
- Set status to `running` when ready to serve

## 2) Assign variants (per user/session)
- Call the API Gateway:
  - `POST /v1/ab-testing/experiments/:id/assign` with `profile_id`
- In code, use `scripts/ab-sdk.ts` helpers:
  - `assignVariant(experimentId, profileId)`
- Cache the assigned variant client-side to keep the experience consistent

## 3) Log conversions
- When the user completes the goal, log it:
  - `POST /v1/ab-testing/experiments/:id/conversion` with `profile_id`, `conversion_type`, optional `value`
- Helpers: `recordConversion(experimentId, profileId, conversionType, value?)`
- Use a single primary metric (e.g., purchase conversion) and optional value (revenue)

## 4) View results
- `/ab-testing` → “Refresh Results” on an experiment card
- Shows per-variant:
  - Assigned, Converted, Conversion Rate, Uplift vs control, Avg value
- Pick the winner (highest conversion rate/uplift with adequate samples)

## 5) Good practices
- One primary metric; a few guardrails (spam/unsubscribes, margin).
- Run to sample-size completion; avoid early peeking.
- Keep users mutually exclusive across variants.
- Segment after the fact (high-LTV vs low-LTV), but don’t overfit tiny slices.

## 6) Suggested conversion events
- `purchase` (with value)
- `add_to_cart`
- `checkout_start`
- `signup` / `activation`
- `engagement_click` (for messaging tests)

## 7) Quick test (smoke)
```bash
# create
curl -s -X POST http://localhost:3000/v1/ab-testing/experiments \
  -H 'Content-Type: application/json' \
  -d '{"name":"Demo Subject","variants":["A","B"],"traffic_split":{"A":50,"B":50}}'

# assign
curl -s -X POST http://localhost:3000/v1/ab-testing/experiments/EXPERIMENT_ID/assign \
  -H 'Content-Type: application/json' \
  -d '{"profile_id":"test-user-1"}'

# convert
curl -s -X POST http://localhost:3000/v1/ab-testing/experiments/EXPERIMENT_ID/conversion \
  -H 'Content-Type: application/json' \
  -d '{"profile_id":"test-user-1","conversion_type":"purchase","value":1200}'
```

## 8) Where this helps
- Subject lines/offers/channels for nudges
- Upsell vs cross-sell for high-LTV customers
- Timing/cadence for lifecycle journeys
- Onsite/app CTA variants (if you send events back)

