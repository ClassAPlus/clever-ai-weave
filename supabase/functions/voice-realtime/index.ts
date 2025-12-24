import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const LOG_EVENT_TYPES = [
  "response.content.done",
  "rate_limits.updated", 
  "response.done",
  "input_audio_buffer.committed",
  "input_audio_buffer.speech_stopped",
  "input_audio_buffer.speech_started",
  "session.created",
  "error"
];

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

serve(async (req) => {
  const url = new URL(req.url);
  
  // Get business ID from query params
  const businessId = url.searchParams.get("businessId");
  const callSid = url.searchParams.get("callSid");
  
  console.log(`Voice realtime connection request: businessId=${businessId}, callSid=${callSid}`);
  
  // Fetch business settings
  let businessName = "our business";
  let instructions = "";
  let voiceLanguage = "en-US";
  let voice = "alloy";
  
  if (businessId) {
    try {
      const { data: business } = await supabase
        .from("businesses")
        .select("name, ai_instructions, twilio_settings")
        .eq("id", businessId)
        .single();
      
      if (business) {
        businessName = business.name || "our business";
        instructions = business.ai_instructions || "";
        const settings = business.twilio_settings as any;
        voiceLanguage = settings?.voiceLanguage || "en-US";
        const gender = settings?.voiceGender || "female";
        voice = gender === "male" ? "ash" : "alloy";
        console.log(`Loaded business: ${businessName}, language: ${voiceLanguage}, voice: ${voice}`);
      }
    } catch (err) {
      console.error("Error fetching business:", err);
    }
  }
  
  // Check if this is a WebSocket upgrade request
  const upgrade = req.headers.get("upgrade") || "";
  if (upgrade.toLowerCase() !== "websocket") {
    console.log("Not a WebSocket upgrade request, returning 426");
    return new Response("Expected WebSocket upgrade", { status: 426 });
  }
  
  console.log("Upgrading to WebSocket...");
  
  // Upgrade to WebSocket
  const { socket: twilioWs, response } = Deno.upgradeWebSocket(req);
  
  let openaiWs: WebSocket | null = null;
  let streamSid: string | null = null;
  let latestMediaTimestamp = 0;
  let lastAssistantItem: string | null = null;
  let responseStartTimestamp: number | null = null;
  const markQueue: string[] = [];
  
  const sendSessionUpdate = () => {
    if (!openaiWs || openaiWs.readyState !== WebSocket.OPEN) return;
    
    const sessionUpdate = {
      type: "session.update",
      session: {
        turn_detection: { type: "server_vad" },
        input_audio_format: "g711_ulaw",
        output_audio_format: "g711_ulaw",
        voice: voice,
        instructions: getSystemPrompt(businessName, instructions, voiceLanguage),
        modalities: ["text", "audio"],
        temperature: 0.8,
      }
    };
    console.log("Sending session update");
    openaiWs.send(JSON.stringify(sessionUpdate));
  };
  
  const sendInitialGreeting = () => {
    if (!openaiWs || openaiWs.readyState !== WebSocket.OPEN) return;
    
    const greetingEvent = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{
          type: "input_text",
          text: "Greet the caller warmly and ask how you can help them today."
        }]
      }
    };
    openaiWs.send(JSON.stringify(greetingEvent));
    openaiWs.send(JSON.stringify({ type: "response.create" }));
    console.log("Sent initial greeting request");
  };
  
  const sendMark = () => {
    if (!twilioWs || twilioWs.readyState !== WebSocket.OPEN || !streamSid) return;
    
    const markEvent = {
      event: "mark",
      streamSid: streamSid,
      mark: { name: "responsePart" }
    };
    twilioWs.send(JSON.stringify(markEvent));
    markQueue.push("responsePart");
  };
  
  const connectToOpenAI = () => {
    console.log("Connecting to OpenAI Realtime API...");
    
    // Connect using fetch to get WebSocket with headers
    openaiWs = new WebSocket(
      "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17"
    );
    
    // Note: Deno WebSocket doesn't support custom headers directly
    // We need to send auth after connection or use a different approach
    
    openaiWs.onopen = () => {
      console.log("OpenAI WebSocket connected, sending auth...");
      // Send authentication via message since we can't use headers
      // Actually OpenAI Realtime requires headers - let's try the protocol approach
    };
    
    openaiWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (LOG_EVENT_TYPES.includes(data.type)) {
          console.log(`OpenAI event: ${data.type}`);
        }
        
        switch (data.type) {
          case "session.created":
            console.log("OpenAI session created, sending config...");
            sendSessionUpdate();
            setTimeout(sendInitialGreeting, 500);
            break;
            
          case "response.audio.delta":
            if (streamSid && data.delta) {
              const audioMessage = {
                event: "media",
                streamSid: streamSid,
                media: {
                  payload: data.delta
                }
              };
              if (twilioWs.readyState === WebSocket.OPEN) {
                twilioWs.send(JSON.stringify(audioMessage));
              }
              
              if (responseStartTimestamp === null) {
                responseStartTimestamp = latestMediaTimestamp;
              }
              
              if (data.item_id) {
                lastAssistantItem = data.item_id;
              }
              
              sendMark();
            }
            break;
            
          case "response.audio_transcript.done":
            console.log(`AI said: ${data.transcript}`);
            break;
            
          case "conversation.item.input_audio_transcription.completed":
            console.log(`Caller said: ${data.transcript}`);
            break;
            
          case "input_audio_buffer.speech_started":
            console.log("Speech started - handling interruption");
            if (markQueue.length > 0 && responseStartTimestamp !== null && lastAssistantItem) {
              const elapsedTime = latestMediaTimestamp - responseStartTimestamp;
              
              const truncateEvent = {
                type: "conversation.item.truncate",
                item_id: lastAssistantItem,
                content_index: 0,
                audio_end_ms: elapsedTime
              };
              openaiWs?.send(JSON.stringify(truncateEvent));
              
              if (twilioWs.readyState === WebSocket.OPEN && streamSid) {
                twilioWs.send(JSON.stringify({
                  event: "clear",
                  streamSid: streamSid
                }));
              }
              
              markQueue.length = 0;
              lastAssistantItem = null;
              responseStartTimestamp = null;
            }
            break;
            
          case "error":
            console.error("OpenAI error:", JSON.stringify(data.error));
            break;
        }
      } catch (err) {
        console.error("Error processing OpenAI message:", err);
      }
    };
    
    openaiWs.onerror = (err) => {
      console.error("OpenAI WebSocket error:", err);
    };
    
    openaiWs.onclose = (event) => {
      console.log(`OpenAI WebSocket closed: code=${event.code}, reason=${event.reason}`);
    };
  };
  
  twilioWs.onopen = () => {
    console.log("Twilio WebSocket connected");
  };
  
  twilioWs.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      
      switch (msg.event) {
        case "connected":
          console.log("Twilio media stream connected");
          break;
          
        case "start":
          streamSid = msg.start.streamSid;
          console.log(`Stream started: ${streamSid}`);
          responseStartTimestamp = null;
          latestMediaTimestamp = 0;
          lastAssistantItem = null;
          
          // Now connect to OpenAI with auth headers via fetch upgrade
          // Since Deno doesn't support headers on WebSocket, we'll try subprotocol
          console.log("Connecting to OpenAI with API key...");
          
          try {
            openaiWs = new WebSocket(
              "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
              ["realtime", `openai-insecure-api-key.${OPENAI_API_KEY}`, "openai-beta.realtime-v1"]
            );
            
            openaiWs.onopen = () => {
              console.log("OpenAI WebSocket opened via subprotocol auth");
            };
            
            openaiWs.onmessage = (openaiEvent) => {
              try {
                const data = JSON.parse(openaiEvent.data);
                
                if (LOG_EVENT_TYPES.includes(data.type)) {
                  console.log(`OpenAI event: ${data.type}`);
                }
                
                switch (data.type) {
                  case "session.created":
                    console.log("OpenAI session created!");
                    sendSessionUpdate();
                    setTimeout(sendInitialGreeting, 300);
                    break;
                    
                  case "response.audio.delta":
                    if (streamSid && data.delta && twilioWs.readyState === WebSocket.OPEN) {
                      twilioWs.send(JSON.stringify({
                        event: "media",
                        streamSid: streamSid,
                        media: { payload: data.delta }
                      }));
                      
                      if (responseStartTimestamp === null) {
                        responseStartTimestamp = latestMediaTimestamp;
                      }
                      if (data.item_id) {
                        lastAssistantItem = data.item_id;
                      }
                      sendMark();
                    }
                    break;
                    
                  case "response.audio_transcript.done":
                    console.log(`AI: ${data.transcript}`);
                    break;
                    
                  case "input_audio_buffer.speech_started":
                    if (markQueue.length > 0 && responseStartTimestamp !== null && lastAssistantItem) {
                      const elapsed = latestMediaTimestamp - responseStartTimestamp;
                      openaiWs?.send(JSON.stringify({
                        type: "conversation.item.truncate",
                        item_id: lastAssistantItem,
                        content_index: 0,
                        audio_end_ms: elapsed
                      }));
                      if (twilioWs.readyState === WebSocket.OPEN && streamSid) {
                        twilioWs.send(JSON.stringify({ event: "clear", streamSid }));
                      }
                      markQueue.length = 0;
                      lastAssistantItem = null;
                      responseStartTimestamp = null;
                    }
                    break;
                    
                  case "error":
                    console.error("OpenAI error:", JSON.stringify(data.error));
                    break;
                }
              } catch (err) {
                console.error("Error processing OpenAI message:", err);
              }
            };
            
            openaiWs.onerror = (err) => {
              console.error("OpenAI WebSocket error");
            };
            
            openaiWs.onclose = (e) => {
              console.log(`OpenAI closed: ${e.code}`);
            };
            
          } catch (err) {
            console.error("Failed to connect to OpenAI:", err);
          }
          break;
          
        case "media":
          latestMediaTimestamp = parseInt(msg.media.timestamp, 10);
          if (openaiWs?.readyState === WebSocket.OPEN) {
            openaiWs.send(JSON.stringify({
              type: "input_audio_buffer.append",
              audio: msg.media.payload
            }));
          }
          break;
          
        case "mark":
          if (markQueue.length > 0) {
            markQueue.shift();
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
    console.error("Twilio WebSocket error");
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
