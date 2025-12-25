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
import { Loader2, Phone, ArrowRight, ArrowLeft, Check, AlertCircle, Info, CheckCircle } from "lucide-react";

interface PortNumberDialogProps {
  businessId: string;
  onUpdate: () => void;
  trigger?: React.ReactNode;
}

type Step = "enter" | "carrier" | "address" | "confirm" | "success";

interface PortFormData {
  phoneNumber: string;
  customerName: string;
  authorizedRep: string;
  authorizedRepEmail: string;
  accountNumber: string;
  accountPin: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  targetDate: string;
  notificationEmails: string;
}

interface PortabilityResult {
  portable: boolean;
  reason?: string;
  not_supported?: boolean;
  pin_required?: boolean;
}

export function PortNumberDialog({ businessId, onUpdate, trigger }: PortNumberDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("enter");
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [portabilityResult, setPortabilityResult] = useState<PortabilityResult | null>(null);
  const [portRequestId, setPortRequestId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<PortFormData>({
    phoneNumber: "",
    customerName: "",
    authorizedRep: "",
    authorizedRepEmail: "",
    accountNumber: "",
    accountPin: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
    targetDate: "",
    notificationEmails: "",
  });

  const { toast } = useToast();

  const resetState = () => {
    setStep("enter");
    setPortabilityResult(null);
    setPortRequestId(null);
    setFormData({
      phoneNumber: "",
      customerName: "",
      authorizedRep: "",
      authorizedRepEmail: "",
      accountNumber: "",
      accountPin: "",
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "US",
      targetDate: "",
      notificationEmails: "",
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetState();
    }
  };

  const updateField = (field: keyof PortFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const checkPortability = async () => {
    if (!formData.phoneNumber) {
      toast({ variant: "destructive", title: "Enter a phone number" });
      return;
    }

    setIsChecking(true);
    setPortabilityResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("twilio-check-portability", {
        body: { phone_number: formData.phoneNumber },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setPortabilityResult({
        portable: data.portable,
        reason: data.reason,
        not_supported: data.not_supported,
        pin_required: data.pin_required,
      });

      if (data.portable || data.not_supported) {
        // Allow to proceed if portable or if check is not supported (manual verification needed)
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Check failed",
        description: error.message,
      });
    } finally {
      setIsChecking(false);
    }
  };

  const submitPortRequest = async () => {
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("twilio-create-port-request", {
        body: {
          business_id: businessId,
          phone_number: formData.phoneNumber,
          customer_name: formData.customerName,
          authorized_representative: formData.authorizedRep,
          authorized_rep_email: formData.authorizedRepEmail,
          account_number: formData.accountNumber || undefined,
          account_pin: formData.accountPin || undefined,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          country: formData.country,
          target_port_date: formData.targetDate || undefined,
          notification_emails: formData.notificationEmails
            ? formData.notificationEmails.split(",").map(e => e.trim()).filter(Boolean)
            : [],
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setPortRequestId(data.port_request_id);
      setStep("success");
      onUpdate();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to submit port request",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedFromEnter = portabilityResult?.portable || portabilityResult?.not_supported;

  // Calculate minimum date (7 days from now)
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 7);
  const minDateStr = minDate.toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
            <Phone className="h-4 w-4 mr-2" />
            Port My Number
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-lg">
        {/* Step 1: Enter Number */}
        {step === "enter" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-purple-400" />
                Port Your Existing Number
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Transfer your current phone number to use with our AI assistant.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <div className="flex gap-2">
                  <Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-300">
                    <p className="font-medium text-blue-400 mb-1">Number Porting</p>
                    <p>This process typically takes 2-4 weeks. Your number will continue working 
                    with your current carrier until the port is complete.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Phone Number to Port</Label>
                <Input
                  value={formData.phoneNumber}
                  onChange={(e) => updateField("phoneNumber", e.target.value)}
                  placeholder="+1 555 123 4567"
                  className="bg-gray-700 border-gray-600 text-white font-mono"
                />
                <p className="text-xs text-gray-500">
                  Enter your number in international format (e.g., +1 for US)
                </p>
              </div>

              {portabilityResult && (
                <div className={`rounded-lg p-3 ${
                  portabilityResult.portable 
                    ? "bg-green-500/10 border border-green-500/30" 
                    : portabilityResult.not_supported
                      ? "bg-yellow-500/10 border border-yellow-500/30"
                      : "bg-red-500/10 border border-red-500/30"
                }`}>
                  <div className="flex gap-2">
                    {portabilityResult.portable ? (
                      <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                        portabilityResult.not_supported ? "text-yellow-400" : "text-red-400"
                      }`} />
                    )}
                    <div className="text-sm">
                      {portabilityResult.portable ? (
                        <p className="text-green-400">This number can be ported to Twilio!</p>
                      ) : portabilityResult.not_supported ? (
                        <>
                          <p className="text-yellow-400 font-medium">Manual Verification Required</p>
                          <p className="text-gray-300 mt-1">{portabilityResult.reason}</p>
                          <p className="text-gray-400 mt-1 text-xs">You can still proceed and we'll verify manually.</p>
                        </>
                      ) : (
                        <>
                          <p className="text-red-400 font-medium">Cannot Port</p>
                          <p className="text-gray-300 mt-1">{portabilityResult.reason}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              {!portabilityResult ? (
                <Button
                  onClick={checkPortability}
                  disabled={isChecking || !formData.phoneNumber}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isChecking && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Check Portability
                </Button>
              ) : canProceedFromEnter ? (
                <Button
                  onClick={() => setStep("carrier")}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => setPortabilityResult(null)}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Try Another Number
                </Button>
              )}
            </DialogFooter>
          </>
        )}

        {/* Step 2: Carrier Information */}
        {step === "carrier" && (
          <>
            <DialogHeader>
              <DialogTitle>Carrier Information</DialogTitle>
              <DialogDescription className="text-gray-400">
                Information about your current phone service provider.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Customer Name (on account)</Label>
                  <Input
                    value={formData.customerName}
                    onChange={(e) => updateField("customerName", e.target.value)}
                    placeholder="John Doe or Business Name LLC"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Authorized Representative</Label>
                  <Input
                    value={formData.authorizedRep}
                    onChange={(e) => updateField("authorizedRep", e.target.value)}
                    placeholder="Person authorized to request port"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Representative Email</Label>
                  <Input
                    type="email"
                    value={formData.authorizedRepEmail}
                    onChange={(e) => updateField("authorizedRepEmail", e.target.value)}
                    placeholder="email@example.com"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <p className="text-xs text-gray-500">
                    The Letter of Authorization (LOA) will be sent here for signing.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Account Number (optional)</Label>
                    <Input
                      value={formData.accountNumber}
                      onChange={(e) => updateField("accountNumber", e.target.value)}
                      placeholder="Your carrier account #"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">PIN (if required)</Label>
                    <Input
                      type="password"
                      value={formData.accountPin}
                      onChange={(e) => updateField("accountPin", e.target.value)}
                      placeholder="Account PIN"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setStep("enter")}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setStep("address")}
                disabled={!formData.customerName || !formData.authorizedRep || !formData.authorizedRepEmail}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 3: Service Address */}
        {step === "address" && (
          <>
            <DialogHeader>
              <DialogTitle>Service Address</DialogTitle>
              <DialogDescription className="text-gray-400">
                This must match the address on file with your current carrier.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Street Address</Label>
                <Input
                  value={formData.street}
                  onChange={(e) => updateField("street", e.target.value)}
                  placeholder="123 Main St, Apt 4"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">City</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    placeholder="New York"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">State/Region</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    placeholder="NY"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">ZIP/Postal Code</Label>
                  <Input
                    value={formData.zip}
                    onChange={(e) => updateField("zip", e.target.value)}
                    placeholder="10001"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Country</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => updateField("country", e.target.value)}
                    placeholder="US"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Target Port Date (optional)</Label>
                <Input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => updateField("targetDate", e.target.value)}
                  min={minDateStr}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-500">
                  Minimum 7 business days from now. Leave blank for earliest possible date.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setStep("carrier")}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setStep("confirm")}
                disabled={!formData.street || !formData.city || !formData.state || !formData.zip}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Review & Submit
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 4: Confirm */}
        {step === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Port Request</DialogTitle>
              <DialogDescription className="text-gray-400">
                Please review your information before submitting.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="bg-gray-700/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Phone Number:</span>
                  <span className="text-white font-mono">{formData.phoneNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Account Name:</span>
                  <span className="text-white">{formData.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Authorized Rep:</span>
                  <span className="text-white">{formData.authorizedRep}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Email:</span>
                  <span className="text-white">{formData.authorizedRepEmail}</span>
                </div>
                <div className="border-t border-gray-600 pt-3">
                  <span className="text-gray-400">Address:</span>
                  <p className="text-white mt-1">
                    {formData.street}<br />
                    {formData.city}, {formData.state} {formData.zip}<br />
                    {formData.country}
                  </p>
                </div>
                {formData.targetDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Target Date:</span>
                    <span className="text-white">{formData.targetDate}</span>
                  </div>
                )}
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <div className="flex gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-300">
                    <p className="font-medium text-yellow-400 mb-1">Important</p>
                    <ul className="list-disc list-inside text-xs space-y-1">
                      <li>A Letter of Authorization (LOA) will be emailed for e-signature</li>
                      <li>The address must exactly match your carrier's records</li>
                      <li>Porting typically takes 2-4 weeks</li>
                      <li>Do not cancel your current service until porting is complete</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setStep("address")}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={submitPortRequest}
                disabled={isSubmitting}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Submit Port Request
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 5: Success */}
        {step === "success" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                Port Request Submitted!
              </DialogTitle>
            </DialogHeader>
            <div className="py-6 space-y-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                <p className="text-green-400 font-medium mb-2">Your request has been submitted</p>
                <p className="text-gray-300 text-sm">
                  Check your email ({formData.authorizedRepEmail}) for the Letter of Authorization (LOA) to sign.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-white font-medium">Next Steps:</h4>
                <ol className="list-decimal list-inside text-sm text-gray-300 space-y-2">
                  <li>Sign the LOA sent to your email</li>
                  <li>We'll submit the request to your current carrier</li>
                  <li>Track the status in your Settings page</li>
                  <li>Once complete, your number will be active with AI</li>
                </ol>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => setOpen(false)}
                className="bg-purple-600 hover:bg-purple-700 w-full"
              >
                <Check className="h-4 w-4 mr-2" />
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
