import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Phone, Plus } from "lucide-react";

const ISRAEL_AREA_CODES = [
  { code: "02", region: "Jerusalem" },
  { code: "03", region: "Tel Aviv" },
  { code: "04", region: "Haifa" },
  { code: "08", region: "South (Beersheba)" },
  { code: "09", region: "Sharon (Netanya)" },
];

interface AvailableNumber {
  phone_number: string;
  friendly_name: string;
  locality: string;
  region: string;
}

interface AddAIPhoneDialogProps {
  businessId: string;
  onUpdate: () => void;
  trigger?: React.ReactNode;
}

export function AddAIPhoneDialog({ businessId, onUpdate, trigger }: AddAIPhoneDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"search" | "select">("search");
  const [isSearching, setIsSearching] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [selectedAreaCode, setSelectedAreaCode] = useState("");
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([]);
  const [selectedNumber, setSelectedNumber] = useState("");
  const { toast } = useToast();

  const resetState = () => {
    setStep("search");
    setSelectedAreaCode("");
    setAvailableNumbers([]);
    setSelectedNumber("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetState();
    }
  };

  const searchNumbers = async () => {
    if (!selectedAreaCode) return;

    setIsSearching(true);
    setAvailableNumbers([]);
    setSelectedNumber("");

    try {
      const { data, error } = await supabase.functions.invoke("twilio-search-numbers", {
        body: {
          country_code: "IL",
          area_code: selectedAreaCode,
          limit: 10,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Failed to search numbers");

      setAvailableNumbers(data.available_numbers || []);
      if (data.available_numbers?.length > 0) {
        setStep("select");
      } else {
        toast({
          title: "No numbers available",
          description: "Try a different area code.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Search failed",
        description: error.message,
      });
    } finally {
      setIsSearching(false);
    }
  };

  const provisionNumber = async () => {
    if (!selectedNumber) return;

    setIsProvisioning(true);
    try {
      const { data, error } = await supabase.functions.invoke("twilio-provision-number", {
        body: {
          business_id: businessId,
          phone_number: selectedNumber,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Failed to provision number");

      toast({
        title: "Number activated!",
        description: `Your AI number is ${data.phone_number}`,
      });
      setOpen(false);
      resetState();
      onUpdate();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Provisioning failed",
        description: error.message,
      });
    } finally {
      setIsProvisioning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
            <Plus className="h-4 w-4 mr-2" />
            Add Phone Number
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
        {step === "search" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-purple-400" />
                Add AI Phone Number
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Select an area code to find available phone numbers for your AI assistant.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Area Code</Label>
                <Select value={selectedAreaCode} onValueChange={setSelectedAreaCode}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select area code" />
                  </SelectTrigger>
                  <SelectContent>
                    {ISRAEL_AREA_CODES.map((ac) => (
                      <SelectItem key={ac.code} value={ac.code}>
                        {ac.code} - {ac.region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={searchNumbers}
                disabled={!selectedAreaCode || isSearching}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSearching && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Search Numbers
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "select" && (
          <>
            <DialogHeader>
              <DialogTitle>Select Your AI Number</DialogTitle>
              <DialogDescription className="text-gray-400">
                Choose a number from the available options.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4 max-h-64 overflow-y-auto">
              {availableNumbers.map((num) => (
                <button
                  key={num.phone_number}
                  type="button"
                  onClick={() => setSelectedNumber(num.phone_number)}
                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                    selectedNumber === num.phone_number
                      ? "border-purple-500 bg-purple-500/20"
                      : "border-gray-600 bg-gray-700/50 hover:border-gray-500"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-purple-400" />
                    <div>
                      <div className="font-mono text-white">{num.friendly_name}</div>
                      <div className="text-xs text-gray-400">
                        {num.locality || num.region}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setStep("search")}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Back
              </Button>
              <Button
                onClick={provisionNumber}
                disabled={!selectedNumber || isProvisioning}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isProvisioning && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Activate Number
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
