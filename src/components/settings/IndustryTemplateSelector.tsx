import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Building2, Scissors, UtensilsCrossed, Stethoscope, Scale, Home, Dumbbell, Car, Briefcase, Camera, Music } from "lucide-react";

export interface IndustryTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  personality: {
    tone: string;
    style: string;
    emoji_usage: string;
    response_length: string;
  };
  defaultTools: string[];
  greetings: {
    new_conversation: string;
    missed_call: string;
    returning_customer: string;
    after_hours: string;
  };
  sampleKnowledge: {
    faqs: { q: string; a: string }[];
    policies: Record<string, string>;
  };
}

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  {
    id: "salon",
    name: "Salon / Spa",
    icon: <Scissors className="h-4 w-4" />,
    personality: { tone: "friendly", style: "conversational", emoji_usage: "moderate", response_length: "medium" },
    defaultTools: ["book_appointment", "check_availability", "send_pricing"],
    greetings: {
      new_conversation: "שלום! ברוכים הבאים. במה אוכל לעזור לך היום?",
      missed_call: "שלום! ראינו שהתקשרת. איך נוכל לעזור?",
      returning_customer: "שמחים לראות אותך שוב! במה אוכל לעזור?",
      after_hours: "תודה על פנייתך! אנחנו כרגע סגורים. נחזור אליך מחר בבוקר."
    },
    sampleKnowledge: {
      faqs: [
        { q: "מה שעות הפעילות?", a: "אנחנו פתוחים א'-ה' 9:00-20:00, ו' 9:00-14:00" },
        { q: "האם צריך לקבוע תור מראש?", a: "מומלץ לקבוע תור מראש, אבל אנחנו גם מקבלים לקוחות ללא תור בהתאם לזמינות" }
      ],
      policies: {
        cancellation: "ביטול תור עד 24 שעות מראש ללא חיוב",
        payment: "מקבלים מזומן, אשראי וביט"
      }
    }
  },
  {
    id: "restaurant",
    name: "Restaurant / Cafe",
    icon: <UtensilsCrossed className="h-4 w-4" />,
    personality: { tone: "casual", style: "conversational", emoji_usage: "frequent", response_length: "short" },
    defaultTools: ["book_appointment", "send_menu", "check_availability"],
    greetings: {
      new_conversation: "שלום! תודה שפנית אלינו. רוצה להזמין שולחן?",
      missed_call: "היי! ראינו שהתקשרת. רוצה לשריין מקום?",
      returning_customer: "שמחים לראות אותך שוב! מה יהיה הפעם?",
      after_hours: "תודה! אנחנו כרגע סגורים. מחכים לך מחר!"
    },
    sampleKnowledge: {
      faqs: [
        { q: "יש משלוחים?", a: "כן! משלוחים דרך וולט, תן ביס ומשלוח עצמי" },
        { q: "יש אפשרות לאירועים פרטיים?", a: "בהחלט! אנחנו מארחים אירועים עד 50 איש" }
      ],
      policies: {
        reservation: "הזמנה לשולחן נשמרת 15 דקות",
        payment: "מזומן, אשראי, ביט"
      }
    }
  },
  {
    id: "clinic",
    name: "Medical Clinic",
    icon: <Stethoscope className="h-4 w-4" />,
    personality: { tone: "professional", style: "detailed", emoji_usage: "minimal", response_length: "medium" },
    defaultTools: ["book_appointment", "create_inquiry", "request_callback"],
    greetings: {
      new_conversation: "שלום, ברוכים הבאים למרפאה. איך אוכל לסייע?",
      missed_call: "שלום, ראינו שהתקשרת. נשמח לעזור לך.",
      returning_customer: "שלום, שמחים לשמוע ממך. במה אוכל לעזור?",
      after_hours: "המרפאה סגורה כרגע. במקרה חירום פנה למוקד 101. נחזור אליך בשעות הפעילות."
    },
    sampleKnowledge: {
      faqs: [
        { q: "אילו קופות חולים אתם עובדים איתן?", a: "אנחנו עובדים עם כל קופות החולים" },
        { q: "צריך הפניה?", a: "לרופא משפחה לא צריך הפניה. למומחים יש צורך בהפניה" }
      ],
      policies: {
        cancellation: "ביטול תור עד 24 שעות מראש",
        documents: "יש להביא תעודת זהות וכרטיס קופת חולים"
      }
    }
  },
  {
    id: "legal",
    name: "Legal Office",
    icon: <Scale className="h-4 w-4" />,
    personality: { tone: "formal", style: "detailed", emoji_usage: "none", response_length: "medium" },
    defaultTools: ["create_inquiry", "request_callback", "book_appointment"],
    greetings: {
      new_conversation: "שלום, ברוכים הבאים למשרדנו. איך נוכל לסייע לך?",
      missed_call: "שלום, ראינו שהתקשרת למשרד. נשמח לחזור אליך.",
      returning_customer: "שלום, שמחים לשמוע ממך שוב. במה נוכל לעזור?",
      after_hours: "המשרד סגור כרגע. נחזור אליך ביום העסקים הבא."
    },
    sampleKnowledge: {
      faqs: [
        { q: "באילו תחומים אתם מתמחים?", a: "המשרד מתמחה בדיני משפחה, נדל״ן ומסחרי" },
        { q: "כמה עולה פגישת ייעוץ?", a: "פגישת ייעוץ ראשונית ללא עלות" }
      ],
      policies: {
        confidentiality: "כל המידע נשמר בסודיות מלאה",
        fees: "שכר הטרחה נקבע בהתאם לאופי התיק"
      }
    }
  },
  {
    id: "real_estate",
    name: "Real Estate",
    icon: <Home className="h-4 w-4" />,
    personality: { tone: "friendly", style: "detailed", emoji_usage: "moderate", response_length: "medium" },
    defaultTools: ["book_appointment", "create_inquiry", "send_listing"],
    greetings: {
      new_conversation: "שלום! מחפש דירה? נשמח לעזור!",
      missed_call: "היי! ראינו שהתקשרת. מעוניין לקבוע סיור בנכס?",
      returning_customer: "שלום! יש לנו נכסים חדשים שאולי יתאימו לך!",
      after_hours: "תודה על פנייתך! נחזור אליך מחר בבוקר עם פרטים נוספים."
    },
    sampleKnowledge: {
      faqs: [
        { q: "באילו אזורים אתם פועלים?", a: "אנחנו פועלים בכל אזור המרכז" },
        { q: "מה העמלה שלכם?", a: "העמלה היא 2% + מע״מ" }
      ],
      policies: {
        viewing: "סיורים בנכסים בתיאום מראש בלבד",
        documents: "יש להביא תעודת זהות לסיור"
      }
    }
  },
  {
    id: "fitness",
    name: "Fitness / Gym",
    icon: <Dumbbell className="h-4 w-4" />,
    personality: { tone: "friendly", style: "conversational", emoji_usage: "frequent", response_length: "short" },
    defaultTools: ["book_appointment", "check_availability", "create_inquiry"],
    greetings: {
      new_conversation: "היי! 💪 רוצה להתחיל להתאמן? נשמח לספר על השיעורים שלנו!",
      missed_call: "היי! ראינו שהתקשרת. מעוניין בשיעור ניסיון?",
      returning_customer: "שלום! מוכן לאימון הבא?",
      after_hours: "הסטודיו סגור כרגע. נחזור אליך מחר!"
    },
    sampleKnowledge: {
      faqs: [
        { q: "יש שיעורי ניסיון?", a: "כן! שיעור ניסיון ראשון חינם" },
        { q: "מה המחירים?", a: "מנוי חודשי 299₪, כרטיסייה 10 שיעורים 350₪" }
      ],
      policies: {
        cancellation: "ביטול שיעור עד 4 שעות מראש",
        equipment: "יש להביא מגבת ובקבוק מים"
      }
    }
  },
  {
    id: "auto",
    name: "Auto Service",
    icon: <Car className="h-4 w-4" />,
    personality: { tone: "professional", style: "conversational", emoji_usage: "minimal", response_length: "medium" },
    defaultTools: ["book_appointment", "create_inquiry", "request_callback"],
    greetings: {
      new_conversation: "שלום! צריך טיפול לרכב? נשמח לעזור.",
      missed_call: "שלום, ראינו שהתקשרת. במה נוכל לסייע?",
      returning_customer: "שלום! הגיע זמן לטיפול תקופתי?",
      after_hours: "המוסך סגור כרגע. נחזור אליך בשעות הפעילות."
    },
    sampleKnowledge: {
      faqs: [
        { q: "כמה זמן לוקח טיפול?", a: "טיפול רגיל כ-2 שעות. טיפולים מורכבים יותר בהתאם" },
        { q: "יש רכב חלופי?", a: "כן, בתיאום מראש" }
      ],
      policies: {
        warranty: "אחריות על עבודה 12 חודשים",
        payment: "מזומן, אשראי, צ'קים"
      }
    }
  },
  {
    id: "consulting",
    name: "Consulting / B2B",
    icon: <Briefcase className="h-4 w-4" />,
    personality: { tone: "professional", style: "detailed", emoji_usage: "none", response_length: "detailed" },
    defaultTools: ["create_inquiry", "request_callback", "book_appointment"],
    greetings: {
      new_conversation: "שלום, תודה על פנייתך. נשמח לשמוע על הצרכים שלך.",
      missed_call: "שלום, ראינו שהתקשרת. נשמח לקבוע שיחת היכרות.",
      returning_customer: "שלום, שמחים לשמוע ממך. במה נוכל לסייע?",
      after_hours: "תודה על פנייתך. ניצור קשר ביום העסקים הבא."
    },
    sampleKnowledge: {
      faqs: [
        { q: "מה התהליך שלכם?", a: "פגישת היכרות, אבחון צרכים, הצעת מחיר, ביצוע" },
        { q: "איך מתחילים?", a: "נשמח לקבוע שיחת היכרות ללא התחייבות" }
      ],
      policies: {
        consultation: "פגישת היכרות ראשונה ללא עלות",
        confidentiality: "סודיות מלאה מובטחת"
      }
    }
  },
  {
    id: "photography",
    name: "Photography / Events",
    icon: <Camera className="h-4 w-4" />,
    personality: { tone: "friendly", style: "conversational", emoji_usage: "moderate", response_length: "medium" },
    defaultTools: ["book_appointment", "create_inquiry", "send_pricing"],
    greetings: {
      new_conversation: "שלום! מחפש צלם לאירוע? נשמח לשמוע פרטים!",
      missed_call: "היי! ראינו שהתקשרת. מתי האירוע שלך?",
      returning_customer: "שלום! שמחים לשמוע ממך. יש אירוע חדש?",
      after_hours: "תודה על פנייתך! נחזור אליך מחר עם פרטים."
    },
    sampleKnowledge: {
      faqs: [
        { q: "כמה זמן עד לקבלת התמונות?", a: "התמונות מוכנות תוך 2-3 שבועות" },
        { q: "יש אפשרות לאלבום?", a: "כן! יש מגוון אפשרויות לאלבומים" }
      ],
      policies: {
        booking: "הזמנה מתבצעת עם מקדמה של 30%",
        cancellation: "ביטול עד 14 יום מהאירוע ללא חיוב"
      }
    }
  },
  {
    id: "music",
    name: "Music / Entertainment",
    icon: <Music className="h-4 w-4" />,
    personality: { tone: "casual", style: "conversational", emoji_usage: "frequent", response_length: "short" },
    defaultTools: ["book_appointment", "create_inquiry", "send_pricing"],
    greetings: {
      new_conversation: "היי! 🎵 מחפש מוזיקה לאירוע? נשמח לעזור!",
      missed_call: "היי! ראינו שהתקשרת. מתי האירוע שלך?",
      returning_customer: "שלום! יש אירוע נוסף באופק?",
      after_hours: "תודה! נחזור אליך מחר עם הצעה."
    },
    sampleKnowledge: {
      faqs: [
        { q: "איזה סגנונות אתם מנגנים?", a: "כל סגנון! פופ, רוק, מזרחי, דיסקו..." },
        { q: "מה כולל המחיר?", a: "הופעה של 4 שעות כולל הגברה ותאורה" }
      ],
      policies: {
        booking: "הזמנה עם מקדמה של 50%",
        cancellation: "ביטול עד חודש מהאירוע - החזר מלא"
      }
    }
  }
];

interface IndustryTemplateSelectorProps {
  value: string | null;
  onChange: (templateId: string | null, template: IndustryTemplate | null) => void;
}

export function IndustryTemplateSelector({ value, onChange }: IndustryTemplateSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-gray-300">Industry Template</Label>
      <p className="text-xs text-gray-500 mb-2">
        Choose a template to auto-configure AI personality, tools, and greetings
      </p>
      <Select 
        value={value || "custom"} 
        onValueChange={(val) => {
          if (val === "custom") {
            onChange(null, null);
          } else {
            const template = INDUSTRY_TEMPLATES.find(t => t.id === val);
            onChange(val, template || null);
          }
        }}
      >
        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
          <SelectValue placeholder="Select industry template..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="custom">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>Custom (No Template)</span>
            </div>
          </SelectItem>
          {INDUSTRY_TEMPLATES.map(template => (
            <SelectItem key={template.id} value={template.id}>
              <div className="flex items-center gap-2">
                {template.icon}
                <span>{template.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
