# Laundry tracker Edge Functions

All four endpoints are public at the gateway level. The two write endpoints
authenticate the request with the machine's QR token before updating data.

| Function | Method | Request |
| --- | --- | --- |
| `get-machines` | GET | — |
| `mark-machine-in-use` | POST | `{ "machine_id": "washer_1", "qr_token": "..." }` |
| `mark-machine-free` | POST | `{ "machine_id": "washer_1", "qr_token": "..." }` |
| `validate-qr-token` | GET | `?token=...` |

Supabase provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to hosted Edge
Functions automatically. Never expose the service-role key in the frontend.

Deploy after linking the project:

```bash
supabase db push
supabase functions deploy get-machines
supabase functions deploy mark-machine-in-use
supabase functions deploy mark-machine-free
supabase functions deploy validate-qr-token
```
