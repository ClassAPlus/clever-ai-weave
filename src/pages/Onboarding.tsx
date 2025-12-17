import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, Phone, CheckCircle2, ArrowRight, ArrowLeft, PhoneForwarded, PhoneCall } from "lucide-react";

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

type PhoneSetupType = "new" | "existing" | null;

export default function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  
  // Step 1: Business details
  const [businessName, setBusinessName] = useState("");
  const [forwardPhone, setForwardPhone] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [services, setServices] = useState("");
  const [aiInstructions, setAiInstructions] = useState("");
  const [aiLanguage, setAiLanguage] = useState("hebrew");
  
  // Step 2: Phone setup type choice
  const [phoneSetupType, setPhoneSetupType] = useState<PhoneSetupType>(null);
  const [existingBusinessNumber, setExistingBusinessNumber] = useState("");
  
  // Step 2b: Phone number selection (for new number flow)
  const [selectedAreaCode, setSelectedAreaCode] = useState("");
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([]);
  const [selectedNumber, setSelectedNumber] = useState("");
  
  // Created business
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user?.email && !ownerEmail) {
      setOwnerEmail(user.email);
    }
  }, [user]);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create the business record
      const { data, error } = await supabase
        .from("businesses")
        .insert({
          owner_user_id: user?.id,
          name: businessName,
          forward_to_phones: forwardPhone ? [forwardPhone] : [],
          owner_email: ownerEmail,
          owner_phone: ownerPhone,
          services: services.split(",").map(s => s.trim()).filter(Boolean),
          ai_instructions: aiInstructions,
          ai_language: aiLanguage,
        })
        .select()
        .single();

      if (error) throw error;

      setBusinessId(data.id);
      setStep(2);
      toast({
        title: "Business created",
        description: "Now let's set up your phone system!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
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

      if (!data.success) {
        throw new Error(data.error || "Failed to search numbers");
      }

      setAvailableNumbers(data.available_numbers || []);

      if (data.available_numbers?.length === 0) {
        toast({
          title: "No numbers available",
          description: "Try a different area code or check back later.",
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
    if (!selectedNumber || !businessId) return;

    setIsProvisioning(true);

    try {
      const { data, error } = await supabase.functions.invoke("twilio-provision-number", {
        body: {
          business_id: businessId,
          phone_number: selectedNumber,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Failed to provision number");
      }

      toast({
        title: "Phone number activated!",
        description: `Your new number is ${data.phone_number}`,
      });

      setStep(3);
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

  const provisionForExisting = async () => {
    if (!selectedNumber || !businessId) return;

    setIsProvisioning(true);

    try {
      const { data, error } = await supabase.functions.invoke("twilio-provision-number", {
        body: {
          business_id: businessId,
          phone_number: selectedNumber,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Failed to provision number");
      }

      toast({
        title: "SMS number activated!",
        description: "Now set up call forwarding from your existing number.",
      });

      setStep(3);
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

  const skipPhoneSetup = () => {
    toast({
      title: "Setup skipped",
      description: "You can add a phone number later from settings.",
    });
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= s ? "bg-purple-600" : "bg-gray-700"
                }`}>
                  {step > s ? (
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  ) : (
                    <span className="text-white font-medium">{s}</span>
                  )}
                </div>
                {s < 3 && (
                  <div className={`w-16 h-1 ${step > s ? "bg-purple-600" : "bg-gray-700"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Business Details */}
        {step === 1 && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Building2 className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Business Details</CardTitle>
                  <CardDescription className="text-gray-400">
                    Tell us about your business
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStep1Submit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-gray-300">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="My Business"
                    required
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="forwardPhone" className="text-gray-300">
                    Forward calls to (your phone number)
                  </Label>
                  <Input
                    id="forwardPhone"
                    value={forwardPhone}
                    onChange={(e) => setForwardPhone(e.target.value)}
                    placeholder="+972501234567"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <p className="text-xs text-gray-500">We'll try to reach you first before AI takes over</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerEmail" className="text-gray-300">Owner Email</Label>
                    <Input
                      id="ownerEmail"
                      type="email"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerPhone" className="text-gray-300">Owner Phone (for alerts)</Label>
                    <Input
                      id="ownerPhone"
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      placeholder="+972501234567"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="services" className="text-gray-300">Services (comma-separated)</Label>
                  <Input
                    id="services"
                    value={services}
                    onChange={(e) => setServices(e.target.value)}
                    placeholder="Haircut, Coloring, Styling"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aiLanguage" className="text-gray-300">AI Language</Label>
                  <Select value={aiLanguage} onValueChange={setAiLanguage}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hebrew">עברית (Hebrew)</SelectItem>
                      <SelectItem value="english">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aiInstructions" className="text-gray-300">
                    Custom AI Instructions (optional)
                  </Label>
                  <Textarea
                    id="aiInstructions"
                    value={aiInstructions}
                    onChange={(e) => setAiInstructions(e.target.value)}
                    placeholder="Special instructions for the AI assistant..."
                    className="bg-gray-700 border-gray-600 text-white min-h-[80px]"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Phone Setup Type Choice */}
        {step === 2 && phoneSetupType === null && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Phone className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Phone Setup</CardTitle>
                  <CardDescription className="text-gray-400">
                    How would you like to set up your phone system?
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Option 1: Get new number */}
              <button
                type="button"
                onClick={() => setPhoneSetupType("new")}
                className="w-full p-4 rounded-lg border border-gray-600 bg-gray-700/50 hover:border-purple-500 hover:bg-purple-500/10 transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30">
                    <PhoneCall className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white mb-1">Get a New Business Number</h3>
                    <p className="text-sm text-gray-400">
                      We'll provide you with a new Israeli phone number. Give this number to your customers.
                      Calls will try to reach you first, and if unanswered, AI takes over.
                    </p>
                    <p className="text-xs text-purple-400 mt-2">Recommended for new businesses</p>
                  </div>
                </div>
              </button>

              {/* Option 2: Keep existing number */}
              <button
                type="button"
                onClick={() => setPhoneSetupType("existing")}
                className="w-full p-4 rounded-lg border border-gray-600 bg-gray-700/50 hover:border-purple-500 hover:bg-purple-500/10 transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30">
                    <PhoneForwarded className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white mb-1">Keep My Existing Number</h3>
                    <p className="text-sm text-gray-400">
                      Keep using your current business number. Set up call forwarding on no-answer to our system.
                      AI handles only calls you don't answer.
                    </p>
                    <p className="text-xs text-purple-400 mt-2">Recommended for established businesses</p>
                  </div>
                </div>
              </button>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </div>

              <button
                onClick={skipPhoneSetup}
                className="w-full text-sm text-gray-500 hover:text-gray-400"
              >
                Skip for now, I'll add a number later
              </button>
            </CardContent>
          </Card>
        )}

        {/* Step 2a: New Number Flow */}
        {step === 2 && phoneSetupType === "new" && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <PhoneCall className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Choose Your Phone Number</CardTitle>
                  <CardDescription className="text-gray-400">
                    Select an Israeli phone number for your business
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-gray-300">Area Code</Label>
                <Select value={selectedAreaCode} onValueChange={setSelectedAreaCode}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select area code" />
                  </SelectTrigger>
                  <SelectContent>
                    {ISRAEL_AREA_CODES.map((area) => (
                      <SelectItem key={area.code} value={area.code}>
                        {area.code} - {area.region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={searchNumbers}
                disabled={!selectedAreaCode || isSearching}
                variant="outline"
                className="w-full border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Search Available Numbers"
                )}
              </Button>

              {availableNumbers.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-gray-300">Available Numbers</Label>
                  <div className="grid gap-2 max-h-60 overflow-y-auto">
                    {availableNumbers.map((num) => (
                      <button
                        key={num.phone_number}
                        type="button"
                        onClick={() => setSelectedNumber(num.phone_number)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedNumber === num.phone_number
                            ? "border-purple-500 bg-purple-500/20"
                            : "border-gray-600 bg-gray-700/50 hover:border-gray-500"
                        }`}
                      >
                        <div className="font-mono text-white">{num.phone_number}</div>
                        {num.locality && (
                          <div className="text-sm text-gray-400">{num.locality}</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPhoneSetupType(null);
                    setAvailableNumbers([]);
                    setSelectedNumber("");
                    setSelectedAreaCode("");
                  }}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={provisionNumber}
                  disabled={!selectedNumber || isProvisioning}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {isProvisioning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Activating...
                    </>
                  ) : (
                    <>
                      Activate Number
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              <button
                onClick={skipPhoneSetup}
                className="w-full text-sm text-gray-500 hover:text-gray-400"
              >
                Skip for now, I'll add a number later
              </button>
            </CardContent>
          </Card>
        )}

        {/* Step 2b: Existing Number Flow */}
        {step === 2 && phoneSetupType === "existing" && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <PhoneForwarded className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Set Up Call Forwarding</CardTitle>
                  <CardDescription className="text-gray-400">
                    Keep your existing number and forward missed calls to our system
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-700/50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-white">How it works:</h4>
                <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
                  <li>Customers call your existing business number</li>
                  <li>If you don't answer, the call forwards to our system</li>
                  <li>Our AI sends an SMS to the caller and handles the conversation</li>
                </ol>
              </div>

              <div className="space-y-2">
                <Label htmlFor="existingNumber" className="text-gray-300">
                  Your Existing Business Number (optional)
                </Label>
                <Input
                  id="existingNumber"
                  value={existingBusinessNumber}
                  onChange={(e) => setExistingBusinessNumber(e.target.value)}
                  placeholder="+972-3-XXX-XXXX"
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-500">For your records only</p>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <h4 className="font-medium text-white mb-3">Step 1: Choose an SMS number</h4>
                <p className="text-sm text-gray-400 mb-4">
                  We need a number to send SMS messages from. Choose an area code:
                </p>
                
                <div className="space-y-2">
                  <Select value={selectedAreaCode} onValueChange={setSelectedAreaCode}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select area code" />
                    </SelectTrigger>
                    <SelectContent>
                      {ISRAEL_AREA_CODES.map((area) => (
                        <SelectItem key={area.code} value={area.code}>
                          {area.code} - {area.region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={searchNumbers}
                  disabled={!selectedAreaCode || isSearching}
                  variant="outline"
                  className="w-full mt-3 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    "Search Available Numbers"
                  )}
                </Button>

                {availableNumbers.length > 0 && (
                  <div className="space-y-3 mt-4">
                    <Label className="text-gray-300">Available SMS Numbers</Label>
                    <div className="grid gap-2 max-h-40 overflow-y-auto">
                      {availableNumbers.map((num) => (
                        <button
                          key={num.phone_number}
                          type="button"
                          onClick={() => setSelectedNumber(num.phone_number)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            selectedNumber === num.phone_number
                              ? "border-purple-500 bg-purple-500/20"
                              : "border-gray-600 bg-gray-700/50 hover:border-gray-500"
                          }`}
                        >
                          <div className="font-mono text-white">{num.phone_number}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPhoneSetupType(null);
                    setAvailableNumbers([]);
                    setSelectedNumber("");
                    setSelectedAreaCode("");
                  }}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={provisionForExisting}
                  disabled={!selectedNumber || isProvisioning}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {isProvisioning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Activating...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              <button
                onClick={skipPhoneSetup}
                className="w-full text-sm text-gray-500 hover:text-gray-400"
              >
                Skip for now, I'll add a number later
              </button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Success - New Number */}
        {step === 3 && phoneSetupType === "new" && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="text-center">
              <div className="mx-auto p-4 bg-green-500/20 rounded-full w-fit mb-4">
                <CheckCircle2 className="h-12 w-12 text-green-400" />
              </div>
              <CardTitle className="text-white text-2xl">You're All Set!</CardTitle>
              <CardDescription className="text-gray-400">
                Your AI missed call system is now active
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                <p className="text-gray-400 text-sm mb-1">Your business phone number</p>
                <p className="text-2xl font-mono text-purple-400">{selectedNumber}</p>
              </div>

              <div className="space-y-3 text-gray-300">
                <p>✓ Give this number to your customers</p>
                <p>✓ Missed calls will trigger AI SMS conversations</p>
                <p>✓ Conversations are in {aiLanguage === "hebrew" ? "Hebrew" : "English"}</p>
                <p>✓ You'll get notified of new inquiries</p>
              </div>

              <Button
                onClick={() => navigate("/dashboard")}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Success - Existing Number */}
        {step === 3 && phoneSetupType === "existing" && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="text-center">
              <div className="mx-auto p-4 bg-green-500/20 rounded-full w-fit mb-4">
                <CheckCircle2 className="h-12 w-12 text-green-400" />
              </div>
              <CardTitle className="text-white text-2xl">Almost Done!</CardTitle>
              <CardDescription className="text-gray-400">
                One more step: set up call forwarding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                <p className="text-gray-400 text-sm mb-1">Forward missed calls to:</p>
                <p className="text-2xl font-mono text-purple-400">{selectedNumber}</p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <h4 className="font-medium text-amber-400 mb-2">Set up call forwarding on no-answer</h4>
                <p className="text-sm text-gray-300 mb-3">
                  Configure your phone carrier to forward calls when you don't answer:
                </p>
                <div className="space-y-2 text-sm text-gray-400">
                  <p><strong className="text-gray-300">Partner:</strong> *61*{selectedNumber}#</p>
                  <p><strong className="text-gray-300">Cellcom:</strong> *61*{selectedNumber}#</p>
                  <p><strong className="text-gray-300">Pelephone:</strong> *61*{selectedNumber}#</p>
                  <p><strong className="text-gray-300">HOT Mobile:</strong> Contact support</p>
                  <p className="text-xs mt-2 text-gray-500">
                    * Codes may vary. Contact your carrier for exact instructions.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-gray-300">
                <p>✓ Keep using your existing business number</p>
                <p>✓ Only missed calls go to AI</p>
                <p>✓ SMS replies come from: {selectedNumber}</p>
                <p>✓ Conversations are in {aiLanguage === "hebrew" ? "Hebrew" : "English"}</p>
              </div>

              <Button
                onClick={() => navigate("/dashboard")}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
