# 📥 CSV Upload Guide

Yes! You can upload CSV files to import customer data into your platform.

## 🚀 How to Use

### Step 1: Access the Import Page

1. Open your dashboard: `http://localhost:3100`
2. Click on **"Import CSV"** from the Quick Actions section
3. Or navigate directly to: `http://localhost:3100/import`

### Step 2: Upload Your CSV File

1. Click the upload area or select a CSV file
2. Your CSV should have headers in the first row
3. Click **"Upload & Preview"**

### Step 3: Map Columns

The system will auto-detect your columns and suggest mappings:
- **Phone** - Customer phone number
- **Email** - Customer email address
- **Name** - Full name
- **First Name** - First name
- **Last Name** - Last name
- **City** - City
- **State** - State

**Important:** You must map at least one of:
- Phone, OR
- Email

### Step 4: Review Preview

Review the first 5 rows to ensure data looks correct.

### Step 5: Import

Click **"Import [X] Customers"** to start the import process.

---

## 📋 CSV Format

### Required Columns

At least one of:
- `phone` or `Phone` or `mobile` or `Mobile`
- `email` or `Email` or `email_address`

### Optional Columns

- `name` or `Name` or `full_name`
- `first_name` or `First Name`
- `last_name` or `Last Name`
- `city` or `City`
- `state` or `State`

### Example CSV

```csv
phone,email,name,city,state
+1234567890,john@example.com,John Doe,New York,NY
+1987654321,jane@example.com,Jane Smith,Los Angeles,CA
+1555555555,bob@example.com,Bob Johnson,Chicago,IL
```

---

## ✅ What Happens During Import

1. **Identity Resolution**: The system automatically:
   - Checks if customers already exist (by phone/email)
   - Merges duplicate profiles
   - Creates new profiles for new customers

2. **Data Processing**:
   - Normalizes phone numbers
   - Normalizes email addresses
   - Hashes identifiers for privacy
   - Creates unified customer profiles

3. **Results**:
   - Shows how many profiles were created
   - Shows how many profiles were updated
   - Reports any errors

---

## 🔧 API Endpoints

If you want to use the API directly:

### Upload CSV
```bash
curl -X POST http://localhost:3000/v1/onboarding/csv/upload \
  -F "file=@customers.csv"
```

### Preview CSV
```bash
curl -X POST http://localhost:3000/v1/onboarding/csv/preview \
  -H "Content-Type: application/json" \
  -d '{
    "file_path": "/tmp/uploads/customers.csv",
    "column_mapping": {
      "phone": "phone",
      "email": "email",
      "name": "name"
    }
  }'
```

### Import CSV
```bash
curl -X POST http://localhost:3000/v1/onboarding/csv/import \
  -H "Content-Type: application/json" \
  -d '{
    "file_path": "/tmp/uploads/customers.csv",
    "column_mapping": {
      "phone": "phone",
      "email": "email",
      "name": "name"
    }
  }'
```

---

## 🚨 Troubleshooting

### Service Not Running

If you get an error, make sure the Onboarding Service is running:

```bash
# Check if running
curl http://localhost:3005/health

# Start it if needed
cd services/onboarding-service
pnpm dev
```

### File Upload Fails

1. Check file size (should be < 10MB for MVP)
2. Ensure file is valid CSV format
3. Check service logs: `tail -f /tmp/onboarding-service.log`

### Import Errors

- **"Missing phone or email"**: Ensure at least one identifier column is mapped
- **"Invalid phone format"**: Phone numbers are normalized automatically
- **"Invalid email format"**: Emails are validated

---

## 📝 Sample CSV File

Create a file `sample-customers.csv`:

```csv
phone,email,name,city,state
+1234567890,john@example.com,John Doe,New York,NY
+1987654321,jane@example.com,Jane Smith,Los Angeles,CA
+1555555555,bob@example.com,Bob Johnson,Chicago,IL
+1444444444,alice@example.com,Alice Brown,Houston,TX
+1333333333,charlie@example.com,Charlie Wilson,Phoenix,AZ
```

Then upload it through the dashboard!

---

## ✅ Success!

After import, you'll see:
- ✅ Profiles created count
- ✅ Profiles updated count
- ✅ Any errors
- ✅ Import duration

Then you'll be redirected to the Customers page to see your imported data!

