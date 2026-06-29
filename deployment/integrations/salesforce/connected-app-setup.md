# Salesforce Connected App — Setup Instructions

Configure a Salesforce Connected App for server-to-server integration with GenuineStack voice agent webhooks (Lead create, Case create).

## Recommended Flow: OAuth 2.0 JWT Bearer

Best for self-hosted VPS automation (n8n or custom handler). No user interaction after initial setup.

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| Salesforce edition | Enterprise, Unlimited, or Developer Edition |
| Admin access | Setup → App Manager |
| OpenSSL | Generate RSA key pair on VPS |

---

## Step 1 — Generate Certificate (VPS)

Idempotent — skip if key already exists:

```bash
mkdir -p /root/voice-ai/deployment/integrations/salesforce/certs
cd /root/voice-ai/deployment/integrations/salesforce/certs

if [[ ! -f server.key ]]; then
  openssl genrsa -out server.key 2048
  openssl req -new -x509 -key server.key -out server.crt -days 3650 \
    -subj "/CN=genuinestack-voice-agent/O=GenuineStack Japan/C=JP"
  chmod 600 server.key
  cp server.key server.key.backup.$(date +%Y%m%d_%H%M%S)
fi
```

---

## Step 2 — Create Connected App

1. Salesforce Setup → **App Manager** → **New Connected App**
2. Basic info:
   - **Connected App Name:** `GenuineStack Voice Agent`
   - **API Name:** `GenuineStack_Voice_Agent`
   - **Contact Email:** your admin email
3. Enable **OAuth Settings**
4. **Callback URL:** `https://login.salesforce.com/services/oauth2/callback` (required but unused for JWT)
5. **Selected OAuth Scopes:**
   - `Manage user data via APIs (api)`
   - `Perform requests at any time (refresh_token, offline_access)` — optional
6. Enable **Use digital signatures**
7. Upload `server.crt` from Step 1
8. Save → **Manage Consumer Details** → note:
   - **Consumer Key** (Client ID)
   - **Consumer Secret** (not used in JWT flow but store securely)

---

## Step 3 — Pre-authorize Integration User

1. Connected App → **Manage** → **Edit Policies**
2. **Permitted Users:** Admin approved users are pre-authorized
3. Create or select an **Integration User** (dedicated, not personal admin)
4. Profile: minimum **API Enabled** + object permissions:
   - Lead: Create, Read
   - Case: Create, Read
5. **Manage** → **Manage Profiles** or **Manage Permission Sets** → assign integration user

---

## Step 4 — Environment Variables

Add to `deployment/automation/n8n/.env` or handler `.env`:

| Param ID | Variable | Example |
|----------|----------|---------|
| **SF-ENV-001** | `SALESFORCE_INSTANCE_URL` | `https://yourorg.my.salesforce.com` |
| **SF-ENV-002** | `SALESFORCE_CLIENT_ID` | Connected App Consumer Key |
| **SF-ENV-003** | `SALESFORCE_USERNAME` | `integration@genuinestack.example.com` |
| **SF-ENV-004** | `SALESFORCE_JWT_PRIVATE_KEY_PATH` | `/root/voice-ai/deployment/integrations/salesforce/certs/server.key` |
| **SF-ENV-005** | `SALESFORCE_API_VERSION` | `59.0` |
| **SF-ENV-006** | `SALESFORCE_ACCESS_TOKEN` | *(short-lived — obtain via JWT exchange)* |

Backup before editing:

```bash
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
```

---

## Step 5 — Obtain Access Token (JWT Bearer)

### JWT claims

```json
{
  "iss": "{SALESFORCE_CLIENT_ID}",
  "sub": "{SALESFORCE_USERNAME}",
  "aud": "https://login.salesforce.com",
  "exp": "{unix_timestamp + 300}"
}
```

Sign with `server.key` (RS256).

### Token exchange

```bash
curl -X POST "https://login.salesforce.com/services/oauth2/token" \
  -d "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer" \
  -d "assertion=${SIGNED_JWT}"
```

Response:

```json
{
  "access_token": "00D...",
  "instance_url": "https://yourorg.my.salesforce.com",
  "token_type": "Bearer"
}
```

In n8n, use the **Salesforce OAuth2 JWT** credential type or a Code node to refresh tokens per execution.

---

## Step 6 — Create Custom Fields (Optional)

Setup → Object Manager → Lead / Case → Fields & Relationships → New:

| API Name | Type | Purpose |
|----------|------|---------|
| `GenuineStack_Call_ID__c` | Text(255) | Workflow run traceability |
| `GenuineStack_Ticket_ID__c` | Text(255) | n8n ticket reference |
| `GenuineStack_Intent__c` | Text(100) | Extracted intent |
| `GenuineStack_Language__c` | Picklist | English, Japanese |
| `GenuineStack_Sentiment__c` | Picklist | positive, neutral, negative, frustrated |
| `GenuineStack_Source_Kit__c` | Picklist | TBIS, ICMG-LD |
| `GenuineStack_Escalated__c` | Checkbox | Human escalation flag |

---

## Step 7 — Wire Payloads

| Use Case | Payload File | Endpoint |
|----------|--------------|----------|
| TBIS admissions inquiry | [`lead-create.json`](lead-create.json) | `POST .../sobjects/Lead` |
| ICMG / TBIS escalation ticket | [`case-create.json`](case-create.json) | `POST .../sobjects/Case` |

### Example — Create Lead (curl)

```bash
curl -X POST "${SALESFORCE_INSTANCE_URL}/services/data/v59.0/sobjects/Lead" \
  -H "Authorization: Bearer ${SALESFORCE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "LastName": "Tanaka",
  "FirstName": "Hanako",
  "Company": "TBIS Inquiry — Grade 5",
  "LeadSource": "GenuineStack Voice Agent",
  "Status": "Open - Not Contacted",
  "Description": "Intent: admissions | Language: Japanese | Grade: Grade 5",
  "Country": "Japan"
}
EOF
```

Expected: `HTTP 201` with `{ "id": "00Q...", "success": true }`

### Example — Create Case (curl)

```bash
curl -X POST "${SALESFORCE_INSTANCE_URL}/services/data/v59.0/sobjects/Case" \
  -H "Authorization: Bearer ${SALESFORCE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "Subject": "[ICMG-LD] Voice Agent — compliance (Japanese)",
    "Description": "Escalated compliance inquiry from Finance department.",
    "Origin": "Phone",
    "Status": "New",
    "Priority": "High",
    "Type": "Voice Agent Escalation"
  }'
```

---

## n8n Integration

Add HTTP Request nodes after post-call normalization:

| Node | Method | URL |
|------|--------|-----|
| SF Create Lead | POST | `{{ $env.SALESFORCE_INSTANCE_URL }}/services/data/v59.0/sobjects/Lead` |
| SF Create Case | POST | `{{ $env.SALESFORCE_INSTANCE_URL }}/services/data/v59.0/sobjects/Case` |

Header: `Authorization: Bearer {{ $env.SALESFORCE_ACCESS_TOKEN }}`

Branch on `source` field:
- `TBIS` + intent in `[admissions, curriculum, fees]` → Lead
- `escalated: true` or negative sentiment → Case

---

## Security Checklist

| Check | Status |
|-------|--------|
| Integration user has minimum permissions | ☐ |
| Private key `chmod 600` | ☐ |
| Tokens not committed to git | ☐ |
| IP restrictions on Connected App (optional) | ☐ |
| Audit trail via `GenuineStack_Call_ID__c` | ☐ |

---

## Troubleshooting

| Error | Resolution |
|-------|------------|
| `invalid_grant` | Verify JWT `sub` matches authorized integration user |
| `INVALID_SESSION_ID` | Refresh access token — JWT tokens expire |
| `INSUFFICIENT_ACCESS` | Grant Lead/Case create on integration user profile |
| `REQUIRED_FIELD_MISSING` | Salesforce requires `LastName` on Lead — provide default |

---

## Alternative: Web Server Flow

For interactive OAuth (not recommended for VPS automation):

1. Use n8n Salesforce node with OAuth2 credential
2. Complete browser consent once
3. Store refresh token in n8n encrypted credentials

JWT Bearer is preferred for unattended post-call automation.

---

## Related Files

| File | Purpose |
|------|---------|
| [`lead-create.json`](lead-create.json) | Lead REST payload template |
| [`case-create.json`](case-create.json) | Case REST payload template |
| [`../kintone/`](../kintone/) | Japan-market alternative CRM |
