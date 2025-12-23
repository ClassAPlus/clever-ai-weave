import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin, CreditCard, MessageSquareHeart, Tag, UserPlus, AlertCircle } from "lucide-react";

export const AVAILABLE_TOOLS = [
  {
    id: "book_appointment",
    name: "Book Appointment",
    description: "Allow AI to schedule appointments for customers",
    icon: Calendar,
    default: true,
  },
  {
    id: "create_inquiry",
    name: "Create Inquiry",
    description: "Create inquiries for owner review",
    icon: AlertCircle,
    default: true,
  },
  {
    id: "request_callback",
    name: "Request Callback",
    description: "Let customers request a call back",
    icon: UserPlus,
    default: true,
  },
  {
    id: "check_availability",
    name: "Check Availability",
    description: "Check available appointment slots",
    icon: Clock,
    default: false,
  },
  {
    id: "send_directions",
    name: "Send Directions",
    description: "Send business location/directions",
    icon: MapPin,
    default: false,
  },
  {
    id: "send_pricing",
    name: "Send Pricing",
    description: "Send price list from knowledge base",
    icon: Tag,
    default: false,
  },
  {
    id: "send_payment_link",
    name: "Send Payment Link",
    description: "Generate and send payment links",
    icon: CreditCard,
    default: false,
  },
  {
    id: "collect_feedback",
    name: "Collect Feedback",
    description: "Ask for and store customer feedback",
    icon: MessageSquareHeart,
    default: false,
  },
];

interface CustomToolsToggleProps {
  enabledTools: string[];
  onChange: (tools: string[]) => void;
}

export function CustomToolsToggle({ enabledTools, onChange }: CustomToolsToggleProps) {
  const toggleTool = (toolId: string) => {
    if (enabledTools.includes(toolId)) {
      onChange(enabledTools.filter(t => t !== toolId));
    } else {
      onChange([...enabledTools, toolId]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500 mb-2">
        Enable or disable AI capabilities based on your business needs
      </div>
      
      <div className="grid gap-2">
        {AVAILABLE_TOOLS.map((tool) => {
          const isEnabled = enabledTools.includes(tool.id);
          return (
            <Card 
              key={tool.id} 
              className={`border transition-colors ${
                isEnabled 
                  ? "bg-purple-500/10 border-purple-500/30" 
                  : "bg-gray-900/50 border-gray-700"
              }`}
            >
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isEnabled ? "bg-purple-500/20" : "bg-gray-700"
                    }`}>
                      <tool.icon className={`h-4 w-4 ${
                        isEnabled ? "text-purple-400" : "text-gray-400"
                      }`} />
                    </div>
                    <div>
                      <Label className={`text-sm ${isEnabled ? "text-white" : "text-gray-300"}`}>
                        {tool.name}
                      </Label>
                      <p className="text-xs text-gray-500">{tool.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => toggleTool(tool.id)}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <p className="text-xs text-gray-500 mt-2">
        {enabledTools.length} tool{enabledTools.length !== 1 ? "s" : ""} enabled
      </p>
    </div>
  );
}
