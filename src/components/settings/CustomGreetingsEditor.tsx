import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, PhoneMissed, UserCheck, Moon } from "lucide-react";

export interface GreetingMessages {
  new_conversation: string;
  missed_call: string;
  returning_customer: string;
  after_hours: string;
}

interface CustomGreetingsEditorProps {
  greetings: GreetingMessages;
  onChange: (greetings: GreetingMessages) => void;
  businessName: string;
}

const GREETING_FIELDS = [
  {
    key: "new_conversation" as const,
    label: "New Conversation",
    icon: MessageSquare,
    description: "First message when a new customer texts",
    placeholder: "שלום! ברוכים הבאים ל{business_name}. איך אוכל לעזור?",
  },
  {
    key: "missed_call" as const,
    label: "Missed Call",
    icon: PhoneMissed,
    description: "Auto-text after a missed call",
    placeholder: "שלום! ראינו שהתקשרת. איך נוכל לעזור?",
  },
  {
    key: "returning_customer" as const,
    label: "Returning Customer",
    icon: UserCheck,
    description: "Message for recognized contacts",
    placeholder: "שמחים לראות אותך שוב! במה אוכל לעזור?",
  },
  {
    key: "after_hours" as const,
    label: "After Hours",
    icon: Moon,
    description: "When texting outside business hours",
    placeholder: "תודה על פנייתך! אנחנו כרגע סגורים. נחזור אליך בשעות הפעילות.",
  },
];

export function CustomGreetingsEditor({ greetings, onChange, businessName }: CustomGreetingsEditorProps) {
  const updateGreeting = (key: keyof GreetingMessages, value: string) => {
    onChange({ ...greetings, [key]: value });
  };

  const replaceVariables = (text: string) => {
    return text
      .replace(/{business_name}/g, businessName || "העסק")
      .replace(/{customer_name}/g, "[שם הלקוח]");
  };

  return (
    <div className="space-y-4">
      <div className="text-xs text-gray-500 p-2 bg-gray-800/50 rounded border border-gray-700">
        <span className="text-purple-400 font-medium">Available variables:</span>{" "}
        <code className="bg-gray-700 px-1 rounded">{"{business_name}"}</code>,{" "}
        <code className="bg-gray-700 px-1 rounded">{"{customer_name}"}</code>
      </div>

      <div className="grid gap-4">
        {GREETING_FIELDS.map((field) => (
          <Card key={field.key} className="bg-gray-900/50 border-gray-700">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <field.icon className="h-4 w-4 text-purple-400" />
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <Label className="text-gray-300">{field.label}</Label>
                    <p className="text-xs text-gray-500">{field.description}</p>
                  </div>
                  <Textarea
                    value={greetings[field.key]}
                    onChange={(e) => updateGreeting(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="bg-gray-700 border-gray-600 text-white min-h-[60px] text-sm"
                    dir="auto"
                  />
                  {greetings[field.key] && (
                    <p className="text-xs text-gray-400 p-2 bg-gray-800/50 rounded" dir="auto">
                      <span className="text-purple-400">Preview:</span>{" "}
                      {replaceVariables(greetings[field.key])}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
