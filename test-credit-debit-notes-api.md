# Testing Credit Notes & Debit Notes API

## Prerequisites

1. **Stop the dev server** (if running) to unlock Prisma files
2. **Regenerate Prisma Client**:
   ```bash
   npx prisma generate
   ```
3. **Restart the dev server**:
   ```bash
   npm run dev
   ```

## Test API Routes

### 1. Test Credit Notes API

#### List Credit Notes
```bash
# Replace YOUR_TENANT_ID and YOUR_TOKEN with actual values
curl -X GET "http://localhost:3000/api/finance/credit-notes?tenantId=YOUR_TENANT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response**: 
- Status: 200
- Body: `{ "creditNotes": [], "pagination": {...}, "summary": {...} }`

#### Create Credit Note
```bash
curl -X POST "http://localhost:3000/api/finance/credit-notes" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "YOUR_TENANT_ID",
    "invoiceId": null,
    "invoiceNumber": "INV-2025-001",
    "reason": "return",
    "reasonDescription": "Product returned by customer",
    "subtotal": 10000,
    "tax": 1800,
    "total": 11800,
    "gstRate": 18,
    "gstAmount": 1800,
    "cgst": 900,
    "sgst": 900,
    "isInterState": false,
    "customerName": "Test Customer",
    "customerEmail": "test@example.com",
    "currency": "INR"
  }'
```

**Expected Response**:
- Status: 201
- Body: `{ "creditNote": { "id": "...", "creditNoteNumber": "CN-2025-0001", ... } }`

### 2. Test Debit Notes API

#### List Debit Notes
```bash
curl -X GET "http://localhost:3000/api/finance/debit-notes?tenantId=YOUR_TENANT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Create Debit Note
```bash
curl -X POST "http://localhost:3000/api/finance/debit-notes" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "YOUR_TENANT_ID",
    "invoiceId": null,
    "invoiceNumber": "INV-2025-001",
    "reason": "additional_charge",
    "reasonDescription": "Additional shipping charges",
    "subtotal": 5000,
    "tax": 900,
    "total": 5900,
    "gstRate": 18,
    "gstAmount": 900,
    "cgst": 450,
    "sgst": 450,
    "isInterState": false,
    "customerName": "Test Customer",
    "customerEmail": "test@example.com",
    "currency": "INR"
  }'
```

**Expected Response**:
- Status: 201
- Body: `{ "debitNote": { "id": "...", "debitNoteNumber": "DN-2025-0001", ... } }`

### 3. Test Individual Operations

#### Get Single Credit Note
```bash
# Replace CREDIT_NOTE_ID with actual ID from create response
curl -X GET "http://localhost:3000/api/finance/credit-notes/CREDIT_NOTE_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Update Credit Note Status
```bash
curl -X PATCH "http://localhost:3000/api/finance/credit-notes/CREDIT_NOTE_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "issued"}'
```

#### Cancel Credit Note
```bash
curl -X DELETE "http://localhost:3000/api/finance/credit-notes/CREDIT_NOTE_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Verification Checklist

After testing, verify:

- [ ] `GET /api/finance/credit-notes` returns 200 with empty array initially
- [ ] `POST /api/finance/credit-notes` creates a credit note and returns 201
- [ ] Credit note number is auto-generated (CN-YYYY-#### format)
- [ ] `GET /api/finance/credit-notes/[id]` returns the created credit note
- [ ] `PATCH /api/finance/credit-notes/[id]` updates status successfully
- [ ] `DELETE /api/finance/credit-notes/[id]` cancels the credit note
- [ ] Same tests work for debit notes (DN-YYYY-#### format)
- [ ] Summary statistics are calculated correctly
- [ ] Pagination works correctly
- [ ] Filtering by status works

## Common Issues

### Issue: "Cannot find module '@/lib/db/prisma'"
**Solution**: Regenerate Prisma client: `npx prisma generate`

### Issue: "Table 'CreditNote' does not exist"
**Solution**: Verify migration was run. Check in Supabase:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('CreditNote', 'DebitNote');
```

### Issue: "EPERM: operation not permitted" during generate
**Solution**: Stop the dev server, run `npx prisma generate`, then restart server

### Issue: 401 Unauthorized
**Solution**: Ensure you're passing a valid Bearer token in the Authorization header

## Next Steps

Once API routes are verified working:
1. ✅ Create UI pages for Credit Notes listing
2. ✅ Create UI pages for Debit Notes listing  
3. ✅ Create forms for creating Credit/Debit Notes
4. ✅ Add to Finance dashboard navigation
5. ✅ Add Credit/Debit Note counts to Finance dashboard KPIs
