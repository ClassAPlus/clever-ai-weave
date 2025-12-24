import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// System prompt for the AI receptionist
const getSystemPrompt = (businessName: string, instructions: string, language: string) => {
  const langMap: Record<string, string> = {
    "he-IL": "Hebrew",
    "en-US": "English",
    "en-GB": "British English",
    "ar-XA": "Arabic",
    "es-ES": "Spanish",
    "fr-FR": "French",
    "de-DE": "German",
    "ru-RU": "Russian",
  };
  
  const languageName = langMap[language] || "English";
  
  return `You are a friendly and professional AI receptionist for ${businessName}. 
Speak in ${languageName}.
Be concise but warm. Help callers with their questions, take messages, and schedule callbacks if needed.

${instructions || "Answer questions helpfully and take messages when the caller wants to leave one."}

Important guidelines:
- Keep responses brief (1-2 sentences when possible)
- If you don't know something specific about the business, offer to take a message
- Be polite and professional at all times
- If the caller wants to speak to a human, let them know you'll pass along their message`;
};

// Handle WebSocket upgrade for Twilio Media Streams
serve(async (req) => {
  const url = new URL(req.url);
  
  // Get business ID from query params
  const businessId = url.searchParams.get("businessId");
  const callSid = url.searchParams.get("callSid");
  
  console.log(`Voice realtime connection: businessId=${businessId}, callSid=${callSid}`);
  
  // Fetch business settings
  let businessName = "our business";
  let instructions = "";
  let voiceLanguage = "en-US";
  let voice = "alloy";
  
  if (businessId) {
    const { data: business } = await supabase
      .from("businesses")
      .select("name, ai_instructions, twilio_settings")
      .eq("id", businessId)
      .single();
    
    if (business) {
      businessName = business.name;
      instructions = business.ai_instructions || "";
      const settings = business.twilio_settings as any;
      voiceLanguage = settings?.voiceLanguage || "en-US";
      // Map gender to OpenAI voice
      const gender = settings?.voiceGender || "female";
      voice = gender === "male" ? "ash" : "alloy";
    }
  }
  
  // Check if this is a WebSocket upgrade request
  const upgrade = req.headers.get("upgrade") || "";
  if (upgrade.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket", { status: 426 });
  }
  
  // Upgrade to WebSocket
  const { socket: twilioWs, response } = Deno.upgradeWebSocket(req);
  
  let openaiWs: WebSocket | null = null;
  let streamSid: string | null = null;
  
  twilioWs.onopen = () => {
    console.log("Twilio WebSocket connected");
  };
  
  twilioWs.onmessage = async (event) => {
    try {
      const msg = JSON.parse(event.data);
      
      switch (msg.event) {
        case "connected":
          console.log("Twilio media stream connected");
          break;
          
        case "start":
          streamSid = msg.start.streamSid;
          console.log(`Stream started: ${streamSid}`);
          
          // Connect to OpenAI Realtime API
          openaiWs = new WebSocket(
            "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
            ["realtime", `openai-insecure-api-key.${OPENAI_API_KEY}`, "openai-beta.realtime-v1"]
          );
          
          openaiWs.onopen = () => {
            console.log("OpenAI WebSocket connected");
          };
          
          openaiWs.onmessage = (openaiEvent) => {
            try {
              const openaiMsg = JSON.parse(openaiEvent.data);
              
              switch (openaiMsg.type) {
                case "session.created":
                  console.log("OpenAI session created, sending config");
                  // Configure the session
                  const sessionUpdate = {
                    type: "session.update",
                    session: {
                      modalities: ["text", "audio"],
                      instructions: getSystemPrompt(businessName, instructions, voiceLanguage),
                      voice: voice,
                      input_audio_format: "g711_ulaw",
                      output_audio_format: "g711_ulaw",
                      input_audio_transcription: {
                        model: "whisper-1"
                      },
                      turn_detection: {
                        type: "server_vad",
                        threshold: 0.5,
                        prefix_padding_ms: 300,
                        silence_duration_ms: 800
                      },
                      temperature: 0.8,
                      max_response_output_tokens: 300
                    }
                  };
                  openaiWs?.send(JSON.stringify(sessionUpdate));
                  
                  // Send initial greeting
                  setTimeout(() => {
                    const greetingEvent = {
                      type: "conversation.item.create",
                      item: {
                        type: "message",
                        role: "user",
                        content: [{
                          type: "input_text",
                          text: "The caller just connected. Greet them warmly and ask how you can help."
                        }]
                      }
                    };
                    openaiWs?.send(JSON.stringify(greetingEvent));
                    openaiWs?.send(JSON.stringify({ type: "response.create" }));
                  }, 500);
                  break;
                  
                case "response.audio.delta":
                  // Send audio back to Twilio
                  if (streamSid && openaiMsg.delta) {
                    const audioMessage = {
                      event: "media",
                      streamSid: streamSid,
                      media: {
                        payload: openaiMsg.delta
                      }
                    };
                    twilioWs.send(JSON.stringify(audioMessage));
                  }
                  break;
                  
                case "response.audio_transcript.done":
                  console.log(`AI said: ${openaiMsg.transcript}`);
                  break;
                  
                case "conversation.item.input_audio_transcription.completed":
                  console.log(`Caller said: ${openaiMsg.transcript}`);
                  break;
                  
                case "error":
                  console.error("OpenAI error:", openaiMsg.error);
                  break;
              }
            } catch (err) {
              console.error("Error processing OpenAI message:", err);
            }
          };
          
          openaiWs.onerror = (err) => {
            console.error("OpenAI WebSocket error:", err);
          };
          
          openaiWs.onclose = () => {
            console.log("OpenAI WebSocket closed");
          };
          break;
          
        case "media":
          // Forward audio from Twilio to OpenAI
          if (openaiWs?.readyState === WebSocket.OPEN) {
            const audioAppend = {
              type: "input_audio_buffer.append",
              audio: msg.media.payload
            };
            openaiWs.send(JSON.stringify(audioAppend));
          }
          break;
          
        case "stop":
          console.log("Stream stopped");
          if (openaiWs) {
            openaiWs.close();
          }
          break;
      }
    } catch (err) {
      console.error("Error processing Twilio message:", err);
    }
  };
  
  twilioWs.onerror = (err) => {
    console.error("Twilio WebSocket error:", err);
    if (openaiWs) {
      openaiWs.close();
    }
  };
  
  twilioWs.onclose = () => {
    console.log("Twilio WebSocket closed");
    if (openaiWs) {
      openaiWs.close();
    }
  };
  
  return response;
});
