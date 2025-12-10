# 📥 CSV Import Instructions - 5,000 Customers with Merge Testing

## 📁 File Location

The CSV file is located at:
```
customers-5000.csv
```

## 📊 File Contents

- **Total Records**: 5,000 customer records
- **Unique Base Customers**: 4,000
- **Duplicate Records**: 1,000 (for merge testing)

### Duplicate Types Included:

1. **Same Phone, Different Email** (300 records)
   - Tests: Phone-based identity resolution
   - Example: Same phone number but different email addresses

2. **Same Email, Different Phone** (300 records)
   - Tests: Email-based identity resolution
   - Example: Same email but different phone numbers

3. **Same Phone + Email, Different Name** (200 records)
   - Tests: Name variation handling
   - Example: "John Doe" vs "J. Doe" vs "John Doe Jr."

4. **Phone Variations** (200 records)
   - Tests: Phone normalization
   - Example: "+919876543210" vs "919876543210" vs "09876543210"

## 🚀 How to Import

### Method 1: Using Dashboard (Recommended)

1. **Start the Onboarding Service** (if not running):
   ```bash
   cd services/onboarding-service
   pnpm dev
   ```

2. **Open the Import Page**:
   - Go to: `http://localhost:3100/import`
   - Or click "Import CSV" from dashboard home

3. **Upload the CSV**:
   - Click to select `customers-5000.csv`
   - Click "Upload & Preview"
   - Review the detected columns
   - Map columns (should auto-detect):
     - `phone` → Phone
     - `email` → Email
     - `name` → Full Name
     - `first_name` → First Name
     - `last_name` → Last Name
     - `city` → City
     - `state` → State

4. **Import**:
   - Click "Import 5000 Customers"
   - Wait for processing (may take 1-2 minutes)
   - Review results:
     - **Profiles Created**: New unique customers
     - **Profiles Updated**: Existing customers that were merged
     - **Errors**: Any rows that couldn't be processed

### Method 2: Using API

```bash
# Upload CSV
curl -X POST http://localhost:3005/onboarding/csv/upload \
  -F "file=@customers-5000.csv"

# Note the file_path from response, then import:
curl -X POST http://localhost:3005/onboarding/csv/import \
  -H "Content-Type: application/json" \
  -d '{
    "file_path": "/tmp/uploads/[filename]",
    "column_mapping": {
      "phone": "phone",
      "email": "email",
      "name": "name",
      "first_name": "first_name",
      "last_name": "last_name",
      "city": "city",
      "state": "state"
    }
  }'
```

## ✅ Expected Results

After import, you should see:

- **~4,000 unique customer profiles** (duplicates merged)
- **~1,000 merge operations** (duplicates resolved)
- **Identity resolution working**:
  - Same phone → merged into one profile
  - Same email → merged into one profile
  - Phone variations → normalized and merged

## 🔍 Verify Merge Functionality

### Check Merge Logs

```sql
-- View merge operations
SELECT 
  source_profile_id,
  target_profile_id,
  merge_reason,
  created_at
FROM identity_merge_log
ORDER BY created_at DESC
LIMIT 20;
```

### Check Customer Count

```sql
-- Should show ~4,000 unique profiles
SELECT COUNT(*) as total_profiles FROM customer_profile;
```

### Check for Duplicates

```sql
-- Find profiles with multiple identifiers (should be merged)
SELECT 
  profile_id,
  COUNT(*) as identifier_count
FROM profile_identifier
GROUP BY profile_id
HAVING COUNT(*) > 1
ORDER BY identifier_count DESC
LIMIT 10;
```

## 📈 Performance Notes

- **Import Time**: ~1-2 minutes for 5,000 records
- **Processing**: Each row is processed in a transaction
- **Identity Resolution**: Automatic during import
- **Memory**: Should handle 5K records easily

## 🐛 Troubleshooting

### Import Fails

1. **Check Onboarding Service**:
   ```bash
   curl http://localhost:3005/health
   ```

2. **Check Logs**:
   ```bash
   tail -f /tmp/onboarding-service.log
   ```

3. **Verify CSV Format**:
   ```bash
   head -5 customers-5000.csv
   ```

### Merge Not Working

1. **Check Identity Engine**:
   ```bash
   curl http://localhost:3002/health
   ```

2. **Verify Database**:
   ```bash
   docker exec retail-brain-postgres psql -U retail_brain_user -d retail_brain -c "SELECT COUNT(*) FROM customer_profile;"
   ```

## 🎯 Test Scenarios

After import, test these scenarios:

1. **Search by Phone**: Should find merged profile
2. **Search by Email**: Should find merged profile
3. **View Profile**: Should show all merged identifiers
4. **Check Timeline**: Should show merge events

---

**File**: `customers-5000.csv`  
**Records**: 5,000  
**Expected Unique Profiles**: ~4,000  
**Ready to Import**: ✅

