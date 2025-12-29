# ElevenLabs Conversational AI Agent Setup Guide

This guide explains how to configure an ElevenLabs Conversational AI agent to work with this system.

## Prerequisites

1. An ElevenLabs account with Conversational AI access
2. Your Twilio phone number already configured
3. The `agent-webhook` edge function deployed

## Step 1: Create a New Agent

1. Go to [ElevenLabs Conversational AI](https://elevenlabs.io/app/conversational-ai)
2. Click "Create Agent"
3. Choose "Build from scratch"

## Step 2: Configure Agent Settings

### Basic Settings
- **Name**: Your Business AI Receptionist
- **Language**: Hebrew (or your preferred language)
- **Voice**: Choose from your ElevenLabs voices (same ones used in settings)

### System Prompt

Copy and customize this system prompt:

```
You are a friendly and professional AI receptionist for [BUSINESS_NAME].
Your DEFAULT language is Hebrew (עברית).
Be concise but warm. Help callers with their questions, take messages, and schedule appointments.

=== CURRENT DATE AND TIME ===
Use the current date/time from the system. The business timezone is [TIMEZONE] (e.g., Asia/Jerusalem).

=== LANGUAGE SWITCHING ===
- If the caller asks to speak in Hebrew, switch to Hebrew.
- If the caller asks to speak in English, switch to English.
- Supported languages: Hebrew, English, Arabic, Spanish, French, German, Russian

=== HEBREW GENDER-AWARE SPEECH ===
You are speaking as a [FEMALE/MALE] receptionist. Use appropriate gendered verb forms in Hebrew.
- Female: "אני שמחה לעזור לך" (I am happy-fem to help)
- Male: "אני שמח לעזור לך" (I am happy-masc to help)

=== APPOINTMENT BOOKING ===
CRITICAL: NEVER book an appointment without EXPLICIT verbal consent.
Before calling create_appointment:
1. Verify the time is within business hours
2. Summarize the appointment details
3. Ask: "Would you like me to confirm this appointment?"
4. Wait for clear YES before booking

=== TIME FORMAT ===
Speak times in [12h/24h] format as preferred by the business.

=== GUIDELINES ===
- Keep responses brief (1-2 sentences when possible)
- Be polite and professional
- If you don't know something, offer to take a message
- Collect caller's name early in the conversation
```

## Step 3: Configure Server Tools (Webhooks)

Add the following webhook tools in the ElevenLabs dashboard:

### Tool 1: Create Appointment

| Field | Value |
|-------|-------|
| **Name** | create_appointment |
| **Description** | Schedule a new appointment for the caller. MUST verify time is within business hours first. |
| **Method** | POST |
| **URL** | `https://wqhakzywmqirucmetnuo.supabase.co/functions/v1/agent-webhook` |

**Body Parameters:**
```json
{
  "tool_name": "create_appointment",
  "business_id": "{{business_id}}",
  "caller_phone": "{{caller_phone}}",
  "parameters": {
    "scheduled_date": {
      "type": "string",
      "description": "ISO 8601 date/time WITH timezone offset (e.g., 2025-01-15T14:00:00+02:00)"
    },
    "service_type": {
      "type": "string",
      "description": "The type of service"
    },
    "caller_name": {
      "type": "string",
      "description": "The caller's name"
    },
    "notes": {
      "type": "string",
      "description": "Additional notes"
    }
  }
}
```

### Tool 2: Check Available Slots

| Field | Value |
|-------|-------|
| **Name** | check_available_slots |
| **Description** | Check available appointment slots for a specific date |
| **Method** | POST |
| **URL** | `https://wqhakzywmqirucmetnuo.supabase.co/functions/v1/agent-webhook` |

**Body Parameters:**
```json
{
  "tool_name": "check_available_slots",
  "business_id": "{{business_id}}",
  "caller_phone": "{{caller_phone}}",
  "parameters": {
    "date": {
      "type": "string",
      "description": "Date to check: 'today', 'tomorrow', or ISO date"
    },
    "service_duration": {
      "type": "number",
      "description": "Duration in minutes (default 30)"
    }
  }
}
```

### Tool 3: Check Business Hours

| Field | Value |
|-------|-------|
| **Name** | check_business_hours |
| **Description** | Check if the business is open and get hours |
| **Method** | POST |
| **URL** | `https://wqhakzywmqirucmetnuo.supabase.co/functions/v1/agent-webhook` |

**Body Parameters:**
```json
{
  "tool_name": "check_business_hours",
  "business_id": "{{business_id}}",
  "caller_phone": "{{caller_phone}}",
  "parameters": {
    "day_of_week": {
      "type": "string",
      "enum": ["today", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      "description": "The day to check"
    }
  }
}
```

### Tool 4: Take Message

| Field | Value |
|-------|-------|
| **Name** | take_message |
| **Description** | Record a message from the caller |
| **Method** | POST |
| **URL** | `https://wqhakzywmqirucmetnuo.supabase.co/functions/v1/agent-webhook` |

**Body Parameters:**
```json
{
  "tool_name": "take_message",
  "business_id": "{{business_id}}",
  "caller_phone": "{{caller_phone}}",
  "parameters": {
    "caller_name": {
      "type": "string",
      "description": "The caller's name"
    },
    "message": {
      "type": "string",
      "description": "The message content"
    },
    "callback_requested": {
      "type": "boolean",
      "description": "Whether callback is requested"
    },
    "urgency": {
      "type": "string",
      "enum": ["low", "medium", "high"],
      "description": "Message urgency"
    }
  }
}
```

### Tool 5: Send SMS

| Field | Value |
|-------|-------|
| **Name** | send_confirmation_sms |
| **Description** | Send an SMS to the caller |
| **Method** | POST |
| **URL** | `https://wqhakzywmqirucmetnuo.supabase.co/functions/v1/agent-webhook` |

**Body Parameters:**
```json
{
  "tool_name": "send_confirmation_sms",
  "business_id": "{{business_id}}",
  "caller_phone": "{{caller_phone}}",
  "parameters": {
    "message": {
      "type": "string",
      "description": "The SMS message to send"
    }
  }
}
```

### Tool 6: Update Contact Info

| Field | Value |
|-------|-------|
| **Name** | update_contact_info |
| **Description** | Update caller's contact information |
| **Method** | POST |
| **URL** | `https://wqhakzywmqirucmetnuo.supabase.co/functions/v1/agent-webhook` |

**Body Parameters:**
```json
{
  "tool_name": "update_contact_info",
  "business_id": "{{business_id}}",
  "caller_phone": "{{caller_phone}}",
  "parameters": {
    "name": { "type": "string" },
    "email": { "type": "string" },
    "notes": { "type": "string" },
    "tags": { "type": "array", "items": { "type": "string" } }
  }
}
```

### Tool 7: Reschedule Appointment

| Field | Value |
|-------|-------|
| **Name** | reschedule_appointment |
| **Description** | Reschedule the caller's upcoming appointment |
| **Method** | POST |
| **URL** | `https://wqhakzywmqirucmetnuo.supabase.co/functions/v1/agent-webhook` |

**Body Parameters:**
```json
{
  "tool_name": "reschedule_appointment",
  "business_id": "{{business_id}}",
  "caller_phone": "{{caller_phone}}",
  "parameters": {
    "new_date": {
      "type": "string",
      "description": "New date/time in ISO 8601 format with timezone"
    },
    "reason": {
      "type": "string",
      "description": "Reason for rescheduling"
    }
  }
}
```

### Tool 8: Cancel Appointment

| Field | Value |
|-------|-------|
| **Name** | cancel_appointment |
| **Description** | Cancel the caller's upcoming appointment |
| **Method** | POST |
| **URL** | `https://wqhakzywmqirucmetnuo.supabase.co/functions/v1/agent-webhook` |

**Body Parameters:**
```json
{
  "tool_name": "cancel_appointment",
  "business_id": "{{business_id}}",
  "caller_phone": "{{caller_phone}}",
  "parameters": {
    "reason": {
      "type": "string",
      "description": "Reason for cancellation"
    }
  }
}
```

### Tool 9: Confirm Appointment

| Field | Value |
|-------|-------|
| **Name** | confirm_appointment |
| **Description** | Confirm the caller's upcoming appointment |
| **Method** | POST |
| **URL** | `https://wqhakzywmqirucmetnuo.supabase.co/functions/v1/agent-webhook` |

**Body Parameters:**
```json
{
  "tool_name": "confirm_appointment",
  "business_id": "{{business_id}}",
  "caller_phone": "{{caller_phone}}",
  "parameters": {}
}
```

### Tool 10: Get Services Info

| Field | Value |
|-------|-------|
| **Name** | get_services_info |
| **Description** | Get information about business services |
| **Method** | POST |
| **URL** | `https://wqhakzywmqirucmetnuo.supabase.co/functions/v1/agent-webhook` |

**Body Parameters:**
```json
{
  "tool_name": "get_services_info",
  "business_id": "{{business_id}}",
  "caller_phone": "{{caller_phone}}",
  "parameters": {
    "service_name": {
      "type": "string",
      "description": "Specific service to get info about (optional)"
    }
  }
}
```

## Step 4: Configure Dynamic Variables

In ElevenLabs, set up these dynamic variables that will be passed from Twilio:

- `{{business_id}}` - The business ID (passed from Twilio webhook)
- `{{caller_phone}}` - The caller's phone number (from Twilio)

## Step 5: Connect Twilio

1. In ElevenLabs dashboard, go to "Phone Numbers"
2. Click "Add Phone Number"
3. Enter your Twilio Account SID and Auth Token
4. Select your Twilio phone number
5. Assign this agent to handle calls

ElevenLabs will automatically configure the Twilio webhooks.

## Step 6: Test the Integration

1. Call your Twilio phone number
2. Verify the ElevenLabs agent answers
3. Test each tool:
   - Ask "What are your business hours?"
   - Ask "What times are available tomorrow?"
   - Try to book an appointment
   - Leave a message

## Troubleshooting

### Common Issues

1. **Tool not executing**: Check webhook URL is correct and edge function is deployed
2. **Missing business context**: Ensure `business_id` is passed correctly
3. **SMS not sending**: Verify Twilio credentials in environment variables
4. **Wrong timezone**: Check business timezone setting in dashboard

### Logs

Check edge function logs:
```
supabase functions logs agent-webhook
```

## Comparison: Old vs New Architecture

| Aspect | Old (OpenAI + ElevenLabs TTS) | New (ElevenLabs Conversational AI) |
|--------|-------------------------------|-------------------------------------|
| Latency | ~1-2 seconds | Sub-second |
| Complexity | High (2500 line edge function) | Low (webhook handlers only) |
| Voice Quality | Excellent | Same |
| Tool Calling | OpenAI function calls | ElevenLabs server tools |
| Twilio Integration | Manual WebSocket | Native, auto-configured |
