import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { api, businessId } = await req.json();

    console.log(`Testing API connection: ${api} for business: ${businessId}`);

    let result = { success: false, message: '' };

    switch (api) {
      case 'openai':
        result = await testOpenAI();
        break;
      case 'twilio':
        result = await testTwilio();
        break;
      case 'resend':
        result = await testResend();
        break;
      default:
        result = { success: false, message: `Unknown API: ${api}` };
    }

    console.log(`API test result for ${api}:`, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error testing API connection:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function testOpenAI(): Promise<{ success: boolean; message: string }> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!apiKey) {
    return { success: false, message: 'OpenAI API key not configured' };
  }

  try {
    // Test with a minimal models list request
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, message: error.error?.message || 'Failed to connect' };
    }

    return { success: true, message: 'OpenAI connection verified' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Connection failed' };
  }
}

async function testTwilio(): Promise<{ success: boolean; message: string }> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  
  if (!accountSid || !authToken) {
    return { success: false, message: 'Twilio credentials not configured' };
  }

  try {
    // Test by fetching account info
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, message: error.message || 'Invalid credentials' };
    }

    const data = await response.json();
    return { success: true, message: `Connected to account: ${data.friendly_name}` };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Connection failed' };
  }
}

async function testResend(): Promise<{ success: boolean; message: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  
  if (!apiKey) {
    return { success: false, message: 'Resend API key not configured' };
  }

  try {
    // Test by fetching domains list
    const response = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, message: error.message || 'Invalid API key' };
    }

    return { success: true, message: 'Resend connection verified' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Connection failed' };
  }
}
