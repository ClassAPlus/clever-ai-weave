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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Phone, Plus, Info, RefreshCw, Search } from "lucide-react";

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
  const [step, setStep] = useState<"info" | "select">("info");
  const [isSearching, setIsSearching] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([]);
  const [selectedNumber, setSelectedNumber] = useState("");
  const [searchPattern, setSearchPattern] = useState("");
  const { toast } = useToast();

  const resetState = () => {
    setStep("info");
    setAvailableNumbers([]);
    setSelectedNumber("");
    setSearchPattern("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetState();
    }
  };

  const searchNumbers = async (pattern?: string) => {
    setIsSearching(true);
    setAvailableNumbers([]);
    setSelectedNumber("");

    try {
      const body: { country_code: string; limit: number; contains?: string } = {
        country_code: "IL",
        limit: 30,
      };
      
      // Use provided pattern or current state
      const searchValue = pattern !== undefined ? pattern : searchPattern;
      if (searchValue.trim()) {
        body.contains = searchValue.trim();
      }

      const { data, error } = await supabase.functions.invoke("twilio-search-numbers", {
        body,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Failed to search numbers");

      setAvailableNumbers(data.available_numbers || []);
      if (data.available_numbers?.length > 0) {
        setStep("select");
      } else {
        toast({
          title: "No numbers found",
          description: searchValue.trim() 
            ? `No numbers containing "${searchValue}" available. Try a different pattern.`
            : "Please try again later.",
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
        {step === "info" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-purple-400" />
                Add AI Phone Number
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Get a dedicated phone number for your AI assistant.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <div className="flex gap-2">
                  <Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-300">
                    <p className="font-medium text-blue-400 mb-1">Mobile Numbers Only</p>
                    <p>Your AI assistant requires SMS capability to communicate with customers. 
                    In Israel, only mobile numbers support both voice and SMS.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Search for specific digits (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    value={searchPattern}
                    onChange={(e) => setSearchPattern(e.target.value.replace(/[^0-9*]/g, ''))}
                    placeholder="e.g., 777, 123, 5000"
                    className="bg-gray-700 border-gray-600 text-white font-mono"
                    maxLength={10}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Find numbers containing your lucky digits or memorable patterns
                </p>
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
                onClick={() => searchNumbers()}
                disabled={isSearching}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSearching && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Find Available Numbers
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "select" && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>Select Your AI Number</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    {availableNumbers.length} numbers available
                    {searchPattern && ` containing "${searchPattern}"`}
                  </DialogDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => searchNumbers()}
                  disabled={isSearching}
                  className="text-gray-400 hover:text-white hover:bg-gray-700"
                  title="Refresh list"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </DialogHeader>
            <div className="flex gap-2 mb-2">
              <Input
                value={searchPattern}
                onChange={(e) => setSearchPattern(e.target.value.replace(/[^0-9*]/g, ''))}
                placeholder="Filter by digits..."
                className="bg-gray-700 border-gray-600 text-white font-mono text-sm"
                maxLength={10}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => searchNumbers()}
                disabled={isSearching}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 px-3"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="space-y-2 py-4 max-h-80 overflow-y-auto">
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
                        Mobile • Voice & SMS enabled
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setStep("info")}
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
