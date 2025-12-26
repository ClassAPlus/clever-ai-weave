import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader && action !== 'callback') {
      throw new Error('Missing authorization header');
    }

    let userId: string | null = null;
    let businessId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const supabaseClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: `Bearer ${token}` } }
      });
      
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      if (userError || !user) throw new Error('Unauthorized');
      userId = user.id;

      // Get business for user
      const { data: business, error: bizError } = await supabaseAdmin
        .from('businesses')
        .select('id')
        .eq('owner_user_id', userId)
        .single();
      
      if (bizError || !business) throw new Error('Business not found');
      businessId = business.id;
    }

    console.log(`Google Calendar action: ${action}, userId: ${userId}`);

    switch (action) {
      case 'auth-url': {
        const redirectUri = url.searchParams.get('redirect_uri');
        if (!redirectUri) throw new Error('Missing redirect_uri');

        const state = JSON.stringify({ businessId, redirectUri });
        const encodedState = btoa(state);

        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
        authUrl.searchParams.set('redirect_uri', `${SUPABASE_URL}/functions/v1/google-calendar?action=callback`);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly');
        authUrl.searchParams.set('access_type', 'offline');
        authUrl.searchParams.set('prompt', 'consent');
        authUrl.searchParams.set('state', encodedState);

        return new Response(JSON.stringify({ url: authUrl.toString() }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'callback': {
        const code = url.searchParams.get('code');
        const stateParam = url.searchParams.get('state');
        const error = url.searchParams.get('error');

        if (error) {
          console.error('OAuth error:', error);
          return new Response(`<html><body><script>window.close();</script>Error: ${error}</body></html>`, {
            headers: { 'Content-Type': 'text/html' },
          });
        }

        if (!code || !stateParam) {
          throw new Error('Missing code or state');
        }

        const state = JSON.parse(atob(stateParam));
        const { businessId: bizId, redirectUri } = state;

        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: `${SUPABASE_URL}/functions/v1/google-calendar?action=callback`,
            grant_type: 'authorization_code',
          }),
        });

        const tokens = await tokenResponse.json();
        console.log('Token exchange response status:', tokenResponse.status);

        if (!tokenResponse.ok) {
          console.error('Token exchange error:', tokens);
          throw new Error(tokens.error_description || 'Failed to exchange code');
        }

        // Calculate expiration time
        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

        // Store tokens in database
        const { error: upsertError } = await supabaseAdmin
          .from('google_calendar_tokens')
          .upsert({
            business_id: bizId,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expires_at: expiresAt.toISOString(),
          }, { onConflict: 'business_id' });

        if (upsertError) {
          console.error('Failed to store tokens:', upsertError);
          throw new Error('Failed to store tokens');
        }

        console.log('Tokens stored successfully for business:', bizId);

        // Redirect back to app
        return new Response(`
          <html>
            <body>
              <script>
                window.opener?.postMessage({ type: 'google-calendar-connected' }, '*');
                window.close();
              </script>
              <p>Connected! You can close this window.</p>
            </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html' },
        });
      }

      case 'status': {
        const { data: token, error: tokenError } = await supabaseAdmin
          .from('google_calendar_tokens')
          .select('*')
          .eq('business_id', businessId)
          .single();

        if (tokenError || !token) {
          return new Response(JSON.stringify({ connected: false }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ 
          connected: true, 
          calendarId: token.calendar_id,
          expiresAt: token.token_expires_at 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'disconnect': {
        const { error: deleteError } = await supabaseAdmin
          .from('google_calendar_tokens')
          .delete()
          .eq('business_id', businessId);

        if (deleteError) {
          console.error('Failed to disconnect:', deleteError);
          throw new Error('Failed to disconnect');
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'sync-appointment': {
        const body = await req.json();
        const { appointmentId } = body;

        if (!appointmentId) throw new Error('Missing appointmentId');

        // Get tokens
        const { data: tokenData, error: tokenError } = await supabaseAdmin
          .from('google_calendar_tokens')
          .select('*')
          .eq('business_id', businessId)
          .single();

        if (tokenError || !tokenData) {
          throw new Error('Google Calendar not connected');
        }

        // Refresh token if needed
        let accessToken = tokenData.access_token;
        if (new Date(tokenData.token_expires_at) < new Date()) {
          console.log('Refreshing expired token');
          const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: GOOGLE_CLIENT_ID,
              client_secret: GOOGLE_CLIENT_SECRET,
              refresh_token: tokenData.refresh_token,
              grant_type: 'refresh_token',
            }),
          });

          const newTokens = await refreshResponse.json();
          if (!refreshResponse.ok) {
            console.error('Token refresh failed:', newTokens);
            throw new Error('Failed to refresh token');
          }

          accessToken = newTokens.access_token;
          const expiresAt = new Date(Date.now() + newTokens.expires_in * 1000);

          await supabaseAdmin
            .from('google_calendar_tokens')
            .update({
              access_token: accessToken,
              token_expires_at: expiresAt.toISOString(),
            })
            .eq('business_id', businessId);
        }

        // Get appointment details
        const { data: appointment, error: aptError } = await supabaseAdmin
          .from('appointments')
          .select('*, contact:contacts(*)')
          .eq('id', appointmentId)
          .single();

        if (aptError || !appointment) {
          throw new Error('Appointment not found');
        }

        // Get business for timezone
        const { data: business } = await supabaseAdmin
          .from('businesses')
          .select('name, timezone')
          .eq('id', businessId)
          .single();

        const startTime = new Date(appointment.scheduled_at);
        const endTime = new Date(startTime.getTime() + (appointment.duration_minutes || 60) * 60000);

        const calendarEvent = {
          summary: `${appointment.service_type || 'Appointment'} - ${appointment.contact?.name || 'Unknown'}`,
          description: `Phone: ${appointment.contact?.phone_number || 'N/A'}\nNotes: ${appointment.notes || 'None'}\nStatus: ${appointment.status}`,
          start: {
            dateTime: startTime.toISOString(),
            timeZone: business?.timezone || 'UTC',
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: business?.timezone || 'UTC',
          },
        };

        let eventId = appointment.google_calendar_event_id;
        let response;

        if (eventId) {
          // Update existing event
          console.log('Updating existing calendar event:', eventId);
          response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(calendarEvent),
          });
        } else {
          // Create new event
          console.log('Creating new calendar event');
          response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(calendarEvent),
          });
        }

        const eventData = await response.json();
        
        if (!response.ok) {
          console.error('Calendar API error:', eventData);
          throw new Error(eventData.error?.message || 'Failed to sync with Google Calendar');
        }

        // Store the event ID
        if (!eventId) {
          await supabaseAdmin
            .from('appointments')
            .update({ google_calendar_event_id: eventData.id })
            .eq('id', appointmentId);
        }

        console.log('Appointment synced to Google Calendar:', eventData.id);

        return new Response(JSON.stringify({ 
          success: true, 
          eventId: eventData.id,
          eventLink: eventData.htmlLink 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'sync-all': {
        // Get tokens
        const { data: tokenData, error: tokenError } = await supabaseAdmin
          .from('google_calendar_tokens')
          .select('*')
          .eq('business_id', businessId)
          .single();

        if (tokenError || !tokenData) {
          throw new Error('Google Calendar not connected');
        }

        // Get all unsynced appointments
        const { data: appointments, error: aptError } = await supabaseAdmin
          .from('appointments')
          .select('id')
          .eq('business_id', businessId)
          .is('google_calendar_event_id', null)
          .in('status', ['pending', 'confirmed']);

        if (aptError) throw new Error('Failed to fetch appointments');

        console.log(`Syncing ${appointments?.length || 0} appointments`);

        let synced = 0;
        let failed = 0;

        for (const apt of appointments || []) {
          try {
            // Call sync-appointment action for each
            const syncResponse = await fetch(`${SUPABASE_URL}/functions/v1/google-calendar?action=sync-appointment`, {
              method: 'POST',
              headers: {
                Authorization: authHeader!,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ appointmentId: apt.id }),
            });

            if (syncResponse.ok) {
              synced++;
            } else {
              failed++;
            }
          } catch (e) {
            console.error('Failed to sync appointment:', apt.id, e);
            failed++;
          }
        }

        return new Response(JSON.stringify({ synced, failed, total: appointments?.length || 0 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Error in google-calendar function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
