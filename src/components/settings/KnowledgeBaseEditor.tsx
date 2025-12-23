import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, HelpCircle, FileText, DollarSign, Users } from "lucide-react";

export interface KnowledgeBase {
  faqs: { q: string; a: string }[];
  policies: Record<string, string>;
  pricing: { service: string; price: string }[];
  staff: { name: string; specialty: string }[];
}

interface KnowledgeBaseEditorProps {
  knowledgeBase: KnowledgeBase;
  onChange: (kb: KnowledgeBase) => void;
}

export function KnowledgeBaseEditor({ knowledgeBase, onChange }: KnowledgeBaseEditorProps) {
  const [newFaqQ, setNewFaqQ] = useState("");
  const [newFaqA, setNewFaqA] = useState("");
  const [newPolicyKey, setNewPolicyKey] = useState("");
  const [newPolicyValue, setNewPolicyValue] = useState("");
  const [newPricingService, setNewPricingService] = useState("");
  const [newPricingPrice, setNewPricingPrice] = useState("");
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffSpecialty, setNewStaffSpecialty] = useState("");

  const addFaq = () => {
    if (newFaqQ && newFaqA) {
      onChange({
        ...knowledgeBase,
        faqs: [...knowledgeBase.faqs, { q: newFaqQ, a: newFaqA }]
      });
      setNewFaqQ("");
      setNewFaqA("");
    }
  };

  const removeFaq = (index: number) => {
    onChange({
      ...knowledgeBase,
      faqs: knowledgeBase.faqs.filter((_, i) => i !== index)
    });
  };

  const addPolicy = () => {
    if (newPolicyKey && newPolicyValue) {
      onChange({
        ...knowledgeBase,
        policies: { ...knowledgeBase.policies, [newPolicyKey]: newPolicyValue }
      });
      setNewPolicyKey("");
      setNewPolicyValue("");
    }
  };

  const removePolicy = (key: string) => {
    const { [key]: _, ...rest } = knowledgeBase.policies;
    onChange({ ...knowledgeBase, policies: rest });
  };

  const addPricing = () => {
    if (newPricingService && newPricingPrice) {
      onChange({
        ...knowledgeBase,
        pricing: [...knowledgeBase.pricing, { service: newPricingService, price: newPricingPrice }]
      });
      setNewPricingService("");
      setNewPricingPrice("");
    }
  };

  const removePricing = (index: number) => {
    onChange({
      ...knowledgeBase,
      pricing: knowledgeBase.pricing.filter((_, i) => i !== index)
    });
  };

  const addStaff = () => {
    if (newStaffName) {
      onChange({
        ...knowledgeBase,
        staff: [...knowledgeBase.staff, { name: newStaffName, specialty: newStaffSpecialty }]
      });
      setNewStaffName("");
      setNewStaffSpecialty("");
    }
  };

  const removeStaff = (index: number) => {
    onChange({
      ...knowledgeBase,
      staff: knowledgeBase.staff.filter((_, i) => i !== index)
    });
  };

  return (
    <Tabs defaultValue="faqs" className="w-full">
      <TabsList className="grid w-full grid-cols-4 bg-gray-800">
        <TabsTrigger value="faqs" className="flex items-center gap-1 text-xs">
          <HelpCircle className="h-3 w-3" />
          FAQs
        </TabsTrigger>
        <TabsTrigger value="policies" className="flex items-center gap-1 text-xs">
          <FileText className="h-3 w-3" />
          Policies
        </TabsTrigger>
        <TabsTrigger value="pricing" className="flex items-center gap-1 text-xs">
          <DollarSign className="h-3 w-3" />
          Pricing
        </TabsTrigger>
        <TabsTrigger value="staff" className="flex items-center gap-1 text-xs">
          <Users className="h-3 w-3" />
          Staff
        </TabsTrigger>
      </TabsList>

      <TabsContent value="faqs" className="space-y-3">
        <p className="text-xs text-gray-500">
          Add frequently asked questions so AI can answer them automatically
        </p>
        
        {knowledgeBase.faqs.map((faq, index) => (
          <Card key={index} className="bg-gray-900/50 border-gray-700">
            <CardContent className="py-3 px-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-1">
                  <p className="text-sm text-white font-medium" dir="auto">Q: {faq.q}</p>
                  <p className="text-sm text-gray-400" dir="auto">A: {faq.a}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFaq(index)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="bg-gray-900/50 border-gray-700 border-dashed">
          <CardContent className="py-3 px-4 space-y-2">
            <Input
              value={newFaqQ}
              onChange={(e) => setNewFaqQ(e.target.value)}
              placeholder="Question (e.g., מה שעות הפעילות?)"
              className="bg-gray-700 border-gray-600 text-white text-sm"
              dir="auto"
            />
            <Textarea
              value={newFaqA}
              onChange={(e) => setNewFaqA(e.target.value)}
              placeholder="Answer (e.g., אנחנו פתוחים א'-ה' 9:00-18:00)"
              className="bg-gray-700 border-gray-600 text-white text-sm min-h-[60px]"
              dir="auto"
            />
            <Button
              onClick={addFaq}
              disabled={!newFaqQ || !newFaqA}
              size="sm"
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add FAQ
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="policies" className="space-y-3">
        <p className="text-xs text-gray-500">
          Define business policies (cancellation, payment, etc.)
        </p>
        
        {Object.entries(knowledgeBase.policies).map(([key, value]) => (
          <Card key={key} className="bg-gray-900/50 border-gray-700">
            <CardContent className="py-3 px-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-1">
                  <p className="text-sm text-purple-400 font-medium capitalize">{key}</p>
                  <p className="text-sm text-gray-300" dir="auto">{value}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePolicy(key)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="bg-gray-900/50 border-gray-700 border-dashed">
          <CardContent className="py-3 px-4 space-y-2">
            <Input
              value={newPolicyKey}
              onChange={(e) => setNewPolicyKey(e.target.value)}
              placeholder="Policy name (e.g., cancellation, payment)"
              className="bg-gray-700 border-gray-600 text-white text-sm"
            />
            <Textarea
              value={newPolicyValue}
              onChange={(e) => setNewPolicyValue(e.target.value)}
              placeholder="Policy details (e.g., ביטול עד 24 שעות מראש ללא חיוב)"
              className="bg-gray-700 border-gray-600 text-white text-sm min-h-[60px]"
              dir="auto"
            />
            <Button
              onClick={addPolicy}
              disabled={!newPolicyKey || !newPolicyValue}
              size="sm"
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Policy
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="pricing" className="space-y-3">
        <p className="text-xs text-gray-500">
          Add your services and prices so AI can share them
        </p>
        
        {knowledgeBase.pricing.map((item, index) => (
          <Card key={index} className="bg-gray-900/50 border-gray-700">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm text-white" dir="auto">{item.service}</span>
                  <span className="text-sm text-purple-400 font-medium">{item.price}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePricing(index)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="bg-gray-900/50 border-gray-700 border-dashed">
          <CardContent className="py-3 px-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={newPricingService}
                onChange={(e) => setNewPricingService(e.target.value)}
                placeholder="Service name"
                className="bg-gray-700 border-gray-600 text-white text-sm"
                dir="auto"
              />
              <Input
                value={newPricingPrice}
                onChange={(e) => setNewPricingPrice(e.target.value)}
                placeholder="Price (e.g., ₪100)"
                className="bg-gray-700 border-gray-600 text-white text-sm"
              />
            </div>
            <Button
              onClick={addPricing}
              disabled={!newPricingService || !newPricingPrice}
              size="sm"
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Pricing
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="staff" className="space-y-3">
        <p className="text-xs text-gray-500">
          List your team members and their specialties
        </p>
        
        {knowledgeBase.staff.map((member, index) => (
          <Card key={index} className="bg-gray-900/50 border-gray-700">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  <span className="text-sm text-white font-medium" dir="auto">{member.name}</span>
                  {member.specialty && (
                    <span className="text-sm text-gray-400 ml-2" dir="auto">- {member.specialty}</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStaff(index)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="bg-gray-900/50 border-gray-700 border-dashed">
          <CardContent className="py-3 px-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                placeholder="Name"
                className="bg-gray-700 border-gray-600 text-white text-sm"
                dir="auto"
              />
              <Input
                value={newStaffSpecialty}
                onChange={(e) => setNewStaffSpecialty(e.target.value)}
                placeholder="Specialty (optional)"
                className="bg-gray-700 border-gray-600 text-white text-sm"
                dir="auto"
              />
            </div>
            <Button
              onClick={addStaff}
              disabled={!newStaffName}
              size="sm"
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Staff Member
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
