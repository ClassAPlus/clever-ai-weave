import { AlertTriangle, ExternalLink, Bug, Phone, Webhook } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function TwilioDebuggerHints() {
  const [isOpen, setIsOpen] = useState(false);

  const debugSteps = [
    {
      icon: Bug,
      title: "Check Twilio Error Logs",
      description: "Go to Twilio Console → Monitor → Errors to see real-time error logs for your calls and SMS.",
      link: "https://console.twilio.com/us1/monitor/logs/errors",
      linkText: "Open Error Logs",
    },
    {
      icon: Webhook,
      title: "Webhook Debugger",
      description: "View detailed webhook request/response data in Twilio Console → Monitor → Debugger.",
      link: "https://console.twilio.com/us1/monitor/logs/debugger",
      linkText: "Open Debugger",
    },
    {
      icon: Phone,
      title: "Call Logs",
      description: "Review call history and see if calls connected, failed, or were rejected.",
      link: "https://console.twilio.com/us1/monitor/calls",
      linkText: "View Call Logs",
    },
  ];

  const commonErrors = [
    {
      error: "Application Error",
      causes: ["Invalid TwiML response", "Webhook timeout (>15s)", "Invalid voice/language"],
      solution: "Check webhook URL returns valid XML and responds quickly",
    },
    {
      error: "No Answer / Busy",
      causes: ["Forward phones not reachable", "Ring timeout too short"],
      solution: "Verify forward numbers and increase ring timeout",
    },
    {
      error: "Invalid Voice",
      causes: ["Unsupported Polly voice for language", "Typo in voice name"],
      solution: "Use a supported voice from Twilio's voice list",
    },
  ];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full justify-between p-4 h-auto bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <div className="text-left">
              <p className="text-sm font-medium text-amber-300">Calls not working?</p>
              <p className="text-xs text-amber-400/80">Click to see troubleshooting tips</p>
            </div>
          </div>
          <span className="text-amber-400 text-xs">{isOpen ? "Hide" : "Show"}</span>
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-3 space-y-4">
        {/* Debug Steps */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-300">Where to check for errors:</p>
          {debugSteps.map((step) => (
            <div 
              key={step.title}
              className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700"
            >
              <step.icon className="h-5 w-5 text-purple-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{step.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
              </div>
              <a
                href={step.link}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                {step.linkText}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ))}
        </div>

        {/* Common Errors */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-300">Common errors and fixes:</p>
          {commonErrors.map((item) => (
            <Alert 
              key={item.error}
              className="bg-gray-800/50 border-gray-700"
            >
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <AlertTitle className="text-amber-300 text-sm">{item.error}</AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <div>
                  <span className="text-xs text-gray-500">Possible causes: </span>
                  <span className="text-xs text-gray-400">{item.causes.join(", ")}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Fix: </span>
                  <span className="text-xs text-emerald-400">{item.solution}</span>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>

        {/* Direct Link */}
        <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30 flex items-center justify-between">
          <p className="text-sm text-blue-300">
            Full Twilio Debugger Console
          </p>
          <a
            href="https://console.twilio.com/us1/develop/phone-numbers/manage/incoming"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            Open Console
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
