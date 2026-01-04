# Voiceflow AI Phone Agent Setup

> **Note**: This is admin-level configuration. End users simply enable/disable the AI Receptionist toggle in their settings. The Voiceflow integration is managed platform-wide.

## Prerequisites

- A Voiceflow account ([creator.voiceflow.com](https://creator.voiceflow.com))
- A Voiceflow API Key (stored as `VOICEFLOW_API_KEY` secret in Supabase)
- Twilio phone number configured for the business

## Admin Configuration Steps

### 1. Get Your Voiceflow Credentials

1. Log in to [Voiceflow](https://creator.voiceflow.com)
2. Create or open your voice agent project
3. Copy the **Project ID** from the project settings or URL
4. Note your **Version ID** (use `production` for the published version)

### 2. Configure Business Settings (via Supabase)

Update the business record's `twilio_settings` JSON column:

```sql
UPDATE businesses 
SET twilio_settings = jsonb_set(
  COALESCE(twilio_settings, '{}'::jsonb),
  '{voiceflowProjectId}',
  '"YOUR_PROJECT_ID"'
)
WHERE id = 'BUSINESS_ID';
```

Or update directly in Supabase Dashboard → Table Editor → businesses.

### 3. Design Your Voiceflow Agent

| Voiceflow Block | Phone Behavior |
|-----------------|----------------|
| **Speak** / **Text** | Spoken via Twilio's Polly voice |
| **Audio** | Plays the audio file URL |
| **End** | Hangs up the call |

### 4. Add Tool Webhooks (Optional)

To enable your agent to perform actions like booking appointments, create tools in Voiceflow that call the `agent-webhook` edge function.

**Webhook URL:**
```
https://wqhakzywmqirucmetnuo.supabase.co/functions/v1/agent-webhook
```

**Available Actions:**

#### Create Appointment
```json
{
  "action": "create_appointment",
  "businessId": "{{business_id}}",
  "callerPhone": "{{caller_phone}}",
  "date": "2024-01-15",
  "time": "14:00",
  "serviceType": "Consultation",
  "notes": "Customer notes"
}
```

#### Check Available Slots
```json
{
  "action": "check_available_slots",
  "businessId": "{{business_id}}",
  "date": "2024-01-15"
}
```

#### Take a Message
```json
{
  "action": "take_message",
  "businessId": "{{business_id}}",
  "callerPhone": "{{caller_phone}}",
  "message": "Customer's message"
}
```

#### Get Services Info
```json
{
  "action": "get_services_info",
  "businessId": "{{business_id}}"
}
```

## How It Works

1. **Incoming Call**: Twilio receives the call and routes to `voice-incoming`
2. **Voiceflow Check**: If `voiceflowProjectId` is configured, redirects to `voiceflow-phone`
3. **Conversation Loop**: 
   - Voiceflow sends text responses → Twilio speaks them
   - Twilio gathers speech → Sends to Voiceflow as text
   - Loop continues until Voiceflow sends an `end` block
4. **Call End**: Voiceflow's end block triggers Twilio hangup

## Voice Configuration

The integration uses Amazon Polly voices:
- **English**: `Polly.Joanna`
- **Hebrew**: `Polly.Adina`

Language is determined by the `voiceLanguage` setting (e.g., `en-US`, `he-IL`).

## Troubleshooting

### Call disconnects immediately
- Check that `VOICEFLOW_API_KEY` is configured in Supabase secrets
- Verify the Project ID and Version ID are correct
- Check edge function logs for errors

### Agent doesn't respond correctly
- Test your Voiceflow agent in the Voiceflow preview first
- Ensure your agent handles the `launch` action for initial greeting
- Check that text responses don't contain unsupported SSML

### Speech recognition issues
- Verify the `voiceLanguage` matches the expected caller language
- Increase the speech timeout if callers speak slowly

## Edge Function Logs

Monitor conversations in Supabase:
- [voiceflow-phone logs](https://supabase.com/dashboard/project/wqhakzywmqirucmetnuo/functions/voiceflow-phone/logs)
- [voice-incoming logs](https://supabase.com/dashboard/project/wqhakzywmqirucmetnuo/functions/voice-incoming/logs)

## API Reference

### Voiceflow Dialog API

The integration uses Voiceflow's Dialog API:
```
POST https://general-runtime.voiceflow.com/state/user/{sessionId}/interact
```

Headers:
- `Authorization`: Your Voiceflow API key
- `versionID`: `production` or specific version

Request body:
```json
{
  "action": { "type": "launch" },  // or { "type": "text", "payload": "user input" }
  "config": {
    "tts": false,
    "stripSSML": true
  }
}
```
