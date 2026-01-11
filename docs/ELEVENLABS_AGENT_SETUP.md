# ElevenLabs Conversational AI - Multi-Tenant Setup Guide

This guide shows how to set up **ONE ElevenLabs agent** that handles calls for **ALL your businesses** using dynamic variables.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        SINGLE AGENT                             │
│  (Created once in ElevenLabs with all webhook tools configured) │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     TWILIO PHONE NUMBERS                        │
│  Each business has their own Twilio number connected to agent   │
│  Passes: business_id + caller_phone as dynamic variables        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      agent-webhook                              │
│  Receives business_id → Fetches business settings from DB      │
│  Returns customized responses based on that business's config  │
└─────────────────────────────────────────────────────────────────┘
```

## Step 1: Create the Agent in ElevenLabs

1. Go to [ElevenLabs Conversational AI](https://elevenlabs.io/app/conversational-ai)
2. Click **"Create Agent"**
3. Choose **"Blank"** template

### Basic Settings

| Setting | Value |
|---------|-------|
| **Name** | `Multi-Tenant AI Receptionist` |
| **Language** | `English` (default - will switch based on caller) |
| **Voice** | Pick any voice (can be overridden per-business) |

### System Prompt

Use this generic prompt that works for all businesses:

```
You are a friendly and professional AI receptionist.

Your job is to:
1. Greet callers warmly
2. Answer questions about the business
3. Schedule, reschedule, or cancel appointments
4. Take messages when needed
5. Provide business information

CRITICAL RULES:
- NEVER book an appointment without explicit verbal consent
- Always confirm details before taking action
- If you don't know something, offer to take a message
- Collect the caller's name early in the conversation
- Keep responses brief (1-2 sentences when possible)

Use the available tools to:
- check_business_hours - Get the business operating hours
- check_available_slots - Find available appointment times
- create_appointment - Book an appointment (only after consent!)
- take_message - Record messages for the business owner
- get_services_info - Get information about services offered

The business_id and caller_phone are provided automatically - use them with all tools.
```

### First Message

```
Hello! Thank you for calling. How can I help you today?
```

## Step 2: Add Webhook Tools

In the ElevenLabs agent dashboard, go to **Tools** and add each of these:

### Tool 1: check_business_hours

| Field | Value |
|-------|-------|
| **Type** | Server (Webhook) |
| **Name** | `check_business_hours` |
| **Description** | Check if the business is open and get operating hours |
| **Method** | POST |
| **URL** | `https://wqhakzywmqirucmetnuo.supabase.co/functions/v1/agent-webhook` |

**Request Body Schema:**
```json
{
  "type": "object",
  "properties": {
    "tool_name": {
      "type": "string",
      "const": "check_business_hours"
    },
    "business_id": {
      "type": "string",
      "description": "The business ID (from dynamic variable)"
    },
    "caller_phone": {
      "type": "string",
      "description": "Caller's phone number (from dynamic variable)"
    },
    "parameters": {
      "type": "object",
      "properties": {
        "day_of_week": {
          "type": "string",
          "enum": ["today", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
          "description": "The day to check"
        }
      }
    }
  },
  "required": ["tool_name", "business_id"]
}
```

---

### Tool 2: check_available_slots

| Field | Value |
|-------|-------|
| **Type** | Server (Webhook) |
| **Name** | `check_available_slots` |
| **Description** | Check available appointment slots for a specific date |
| **Method** | POST |
| **URL** | `https://wqhakzywmqirucmetnuo.supabase.co/functions/v1/agent-webhook` |

**Request Body Schema:**
```json
{
  "type": "object",
  "properties": {
    "tool_name": {
      "type": "string",
      "const": "check_available_slots"
    },
    "business_id": {
      "type": "string"
    },
    "caller_phone": {
      "type": "string"
    },
    "parameters": {
      "type": "object",
      "properties": {
        "date": {
          "type": "string",
          "description": "Date to check: 'today', 'tomorrow', or YYYY-MM-DD"
        },
        "service_duration": {
          "type": "number",
          "description": "Duration in minutes (default 30)"
        }
      },
      "required": ["date"]
    }
  },
  "required": ["tool_name", "business_id", "parameters"]
}
```

---

### Tool 3: create_appointment

| Field | Value |
|-------|-------|
| **Type** | Server (Webhook) |
| **Name** | `create_appointment` |
| **Description** | Schedule a new appointment. MUST get verbal consent first! |
| **Method** | POST |
| **URL** | `https://wqhakzywmqirucmetnuo.supabase.co/functions/v1/agent-webhook` |

**Request Body Schema:**
```json
{
  "type": "object",
  "properties": {
    "tool_name": {
      "type": "string",
      "const": "create_appointment"
    },
    "business_id": {
      "type": "string"
    },
    "caller_phone": {
      "type": "string"
    },
    "parameters": {
      "type": "object",
      "properties": {
        "scheduled_date": {
          "type": "string",
          "description": "ISO 8601 date/time with timezone (e.g., 2025-01-15T14:00:00+02:00)"
        },
        "service_type": {
          "type": "string",
          "description": "Type of service requested"
        },
        "caller_name": {
          "type": "string",
          "description": "Caller's name"
        },
        "notes": {
          "type": "string",
          "description": "Additional notes"
        }
      },
      "required": ["scheduled_date"]
    }
  },
  "required": ["tool_name", "business_id", "parameters"]
}
```

---

### Tool 4: take_message

| Field | Value |
|-------|-------|
| **Type** | Server (Webhook) |
| **Name** | `take_message` |
| **Description** | Record a message from the caller for the business owner |
| **Method** | POST |
| **URL** | `https://wqhakzywmqirucmetnuo.supabase.co/functions/v1/agent-webhook` |

**Request Body Schema:**
```json
{
  "type": "object",
  "properties": {
    "tool_name": {
      "type": "string",
      "const": "take_message"
    },
    "business_id": {
      "type": "string"
    },
    "caller_phone": {
      "type": "string"
    },
    "parameters": {
      "type": "object",
      "properties": {
        "caller_name": {
          "type": "string",
          "description": "Caller's name"
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
      },
      "required": ["message"]
    }
  },
  "required": ["tool_name", "business_id", "parameters"]
}
```

---

### Tool 5: get_services_info

| Field | Value |
|-------|-------|
| **Type** | Server (Webhook) |
| **Name** | `get_services_info` |
| **Description** | Get information about services offered by the business |
| **Method** | POST |
| **URL** | `https://wqhakzywmqirucmetnuo.supabase.co/functions/v1/agent-webhook` |

**Request Body Schema:**
```json
{
  "type": "object",
  "properties": {
    "tool_name": {
      "type": "string",
      "const": "get_services_info"
    },
    "business_id": {
      "type": "string"
    },
    "caller_phone": {
      "type": "string"
    },
    "parameters": {
      "type": "object",
      "properties": {
        "service_name": {
          "type": "string",
          "description": "Specific service to get info about (optional)"
        }
      }
    }
  },
  "required": ["tool_name", "business_id"]
}
```

---

## Step 3: Configure Dynamic Variables

In the ElevenLabs agent settings, add these **Dynamic Variables**:

| Variable Name | Description |
|---------------|-------------|
| `business_id` | The ID of the business (passed from Twilio) |
| `caller_phone` | The caller's phone number (passed from Twilio) |

These will be injected into every tool call automatically.

## Step 4: Connect Twilio Phone Numbers

For **each business**, you need to connect their Twilio phone number to the agent:

1. In ElevenLabs, go to **Phone Numbers** 
2. Click **"Add Phone Number"**
3. Enter your Twilio Account SID and Auth Token
4. Select the business's Twilio phone number
5. Assign the agent to handle calls
6. **Important**: Configure the dynamic variables to pass the `business_id` for this specific business

### Setting business_id per Phone Number

When configuring each phone number, set the `business_id` variable to the specific business's ID from your database.

This is how the same agent knows which business's settings to use!

## Step 5: Save Agent ID

After creating the agent, copy the **Agent ID** from ElevenLabs and save it. You'll need this for the Twilio integration.

The Agent ID looks like: `agent_xxxxxxxxxxxxxxxx`

## How It Works

1. **Customer calls** a business's Twilio number
2. **Twilio routes** the call to ElevenLabs agent
3. **ElevenLabs passes** `business_id` and `caller_phone` as dynamic variables
4. **Agent uses tools** → calls your `agent-webhook` with the business_id
5. **Webhook fetches** that business's settings from database
6. **Webhook returns** customized response (hours, services, etc.)
7. **Agent speaks** the response to the caller

## Testing

1. Call the Twilio phone number
2. Check the edge function logs:
   ```
   supabase functions logs agent-webhook
   ```
3. Verify the `business_id` is being passed correctly

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Tools not working | Check webhook URL is correct, edge function is deployed |
| Wrong business data | Verify `business_id` is set correctly for the phone number |
| Agent not responding | Check ElevenLabs logs, verify agent is connected to Twilio |
| Missing caller phone | Ensure `caller_phone` dynamic variable is configured |

## Optional: Additional Tools

You can add more tools following the same pattern:

- `reschedule_appointment`
- `cancel_appointment`
- `confirm_appointment`
- `send_confirmation_sms`
- `update_contact_info`

See the `agent-webhook` edge function for all supported tool names.
