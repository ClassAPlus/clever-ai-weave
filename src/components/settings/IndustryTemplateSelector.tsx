import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Building2, Scissors, UtensilsCrossed, Stethoscope, Scale, Home, Dumbbell, Car, Briefcase, Camera, Music,
  GraduationCap, Dog, Flower2, Hammer, Plane, ShoppingBag, Sparkles, Baby, Heart, Palette, Laptop, Wrench,
  Church, Truck, Warehouse, Headphones, BookOpen, Shirt, Cake, Coffee
} from "lucide-react";

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
  },
  {
    id: "education",
    name: "Education / Tutoring",
    icon: <GraduationCap className="h-4 w-4" />,
    personality: { tone: "friendly", style: "detailed", emoji_usage: "moderate", response_length: "medium" },
    defaultTools: ["book_appointment", "check_availability", "create_inquiry"],
    greetings: {
      new_conversation: "שלום! מחפש שיעורים פרטיים? נשמח לעזור!",
      missed_call: "שלום! ראינו שהתקשרת. באילו מקצועות אתה מעוניין?",
      returning_customer: "שלום! מוכן לשיעור הבא?",
      after_hours: "תודה על פנייתך! נחזור אליך מחר."
    },
    sampleKnowledge: {
      faqs: [
        { q: "באילו מקצועות אתם מלמדים?", a: "מתמטיקה, פיזיקה, אנגלית, ועוד" },
        { q: "מה המחיר לשיעור?", a: "150-200₪ לשעה בהתאם למקצוע" }
      ],
      policies: {
        cancellation: "ביטול עד 12 שעות מראש",
        payment: "תשלום בסוף כל חודש"
      }
    }
  },
  {
    id: "pet_services",
    name: "Pet Services",
    icon: <Dog className="h-4 w-4" />,
    personality: { tone: "friendly", style: "conversational", emoji_usage: "frequent", response_length: "short" },
    defaultTools: ["book_appointment", "check_availability", "send_pricing"],
    greetings: {
      new_conversation: "שלום! 🐾 איך נוכל לעזור לחיית המחמד שלך?",
      missed_call: "היי! ראינו שהתקשרת. צריך שירות לחיית המחמד?",
      returning_customer: "שלום! מוכנים לטיפול הבא?",
      after_hours: "תודה! נחזור אליך מחר בבוקר."
    },
    sampleKnowledge: {
      faqs: [
        { q: "מה השירותים שלכם?", a: "ספא, תספורת, אמבטיה, חיתוך ציפורניים" },
        { q: "כמה זמן לוקח טיפול?", a: "1-2 שעות בהתאם לגודל ולסוג הטיפול" }
      ],
      policies: {
        vaccination: "יש להציג פנקס חיסונים מעודכן",
        cancellation: "ביטול עד 24 שעות מראש"
      }
    }
  },
  {
    id: "florist",
    name: "Florist / Garden",
    icon: <Flower2 className="h-4 w-4" />,
    personality: { tone: "friendly", style: "conversational", emoji_usage: "frequent", response_length: "medium" },
    defaultTools: ["create_inquiry", "send_pricing", "book_appointment"],
    greetings: {
      new_conversation: "שלום! 🌸 מחפש פרחים לאירוע מיוחד?",
      missed_call: "היי! ראינו שהתקשרת. במה נוכל לעזור?",
      returning_customer: "שלום! שמחים לראות אותך שוב!",
      after_hours: "תודה! נחזור אליך מחר."
    },
    sampleKnowledge: {
      faqs: [
        { q: "יש משלוחים?", a: "כן! משלוחים בכל הארץ" },
        { q: "כמה מראש צריך להזמין?", a: "לאירועים - לפחות שבוע מראש" }
      ],
      policies: {
        delivery: "משלוח חינם מעל 200₪",
        freshness: "אחריות טריות 7 ימים"
      }
    }
  },
  {
    id: "construction",
    name: "Construction / Renovation",
    icon: <Hammer className="h-4 w-4" />,
    personality: { tone: "professional", style: "detailed", emoji_usage: "minimal", response_length: "medium" },
    defaultTools: ["create_inquiry", "request_callback", "book_appointment"],
    greetings: {
      new_conversation: "שלום! מתכננים שיפוץ? נשמח לעזור.",
      missed_call: "שלום, ראינו שהתקשרת. נשמח לקבוע פגישת ייעוץ.",
      returning_customer: "שלום! במה נוכל לסייע?",
      after_hours: "תודה על פנייתך. ניצור קשר בהקדם."
    },
    sampleKnowledge: {
      faqs: [
        { q: "מה סוגי העבודות שלכם?", a: "שיפוצים, בנייה, גמר, חשמל ואינסטלציה" },
        { q: "יש אחריות על העבודה?", a: "אחריות שנה על כל עבודות הגמר" }
      ],
      policies: {
        quote: "הצעת מחיר לאחר סיור באתר",
        payment: "תשלום בשלבים לפי התקדמות"
      }
    }
  },
  {
    id: "travel",
    name: "Travel / Tourism",
    icon: <Plane className="h-4 w-4" />,
    personality: { tone: "friendly", style: "detailed", emoji_usage: "moderate", response_length: "detailed" },
    defaultTools: ["create_inquiry", "book_appointment", "send_pricing"],
    greetings: {
      new_conversation: "שלום! ✈️ מתכננים טיול? נשמח לעזור!",
      missed_call: "היי! ראינו שהתקשרת. לאן חולמים לטוס?",
      returning_customer: "שלום! מוכנים להרפתקה הבאה?",
      after_hours: "תודה! נחזור אליך מחר עם הצעות מעניינות."
    },
    sampleKnowledge: {
      faqs: [
        { q: "לאילו יעדים אתם מתמחים?", a: "אירופה, אמריקה, המזרח הרחוק ועוד" },
        { q: "מה כולל החבילה?", a: "טיסות, מלון, העברות וסיורים" }
      ],
      policies: {
        cancellation: "ביטול לפי תנאי חברות התעופה",
        payment: "מקדמה 30%, היתרה עד שבועיים לפני היציאה"
      }
    }
  },
  {
    id: "retail",
    name: "Retail / Shop",
    icon: <ShoppingBag className="h-4 w-4" />,
    personality: { tone: "friendly", style: "conversational", emoji_usage: "moderate", response_length: "short" },
    defaultTools: ["check_availability", "create_inquiry", "send_pricing"],
    greetings: {
      new_conversation: "שלום! 🛍️ איך נוכל לעזור?",
      missed_call: "היי! ראינו שהתקשרת. מחפש מוצר מסוים?",
      returning_customer: "שלום! שמחים לראות אותך!",
      after_hours: "החנות סגורה כרגע. נחזור אליך מחר."
    },
    sampleKnowledge: {
      faqs: [
        { q: "יש משלוחים?", a: "כן! משלוח עד הבית" },
        { q: "מה מדיניות ההחזרות?", a: "החזרה תוך 14 יום עם קבלה" }
      ],
      policies: {
        returns: "החזרה מלאה תוך 14 יום",
        shipping: "משלוח חינם מעל 200₪"
      }
    }
  },
  {
    id: "cleaning",
    name: "Cleaning Services",
    icon: <Sparkles className="h-4 w-4" />,
    personality: { tone: "professional", style: "conversational", emoji_usage: "minimal", response_length: "medium" },
    defaultTools: ["book_appointment", "send_pricing", "create_inquiry"],
    greetings: {
      new_conversation: "שלום! צריכים שירותי ניקיון? נשמח לעזור.",
      missed_call: "שלום, ראינו שהתקשרת. במה נוכל לסייע?",
      returning_customer: "שלום! מוכנים לניקיון הבא?",
      after_hours: "תודה! נחזור אליך מחר."
    },
    sampleKnowledge: {
      faqs: [
        { q: "מה סוגי הניקיון שלכם?", a: "ניקיון בתים, משרדים, חלונות, ספות" },
        { q: "האם אתם מביאים ציוד?", a: "כן! כל הציוד וחומרי הניקוי כלולים" }
      ],
      policies: {
        cancellation: "ביטול עד 24 שעות מראש",
        satisfaction: "אחריות שביעות רצון מלאה"
      }
    }
  },
  {
    id: "childcare",
    name: "Childcare / Daycare",
    icon: <Baby className="h-4 w-4" />,
    personality: { tone: "friendly", style: "detailed", emoji_usage: "moderate", response_length: "medium" },
    defaultTools: ["create_inquiry", "book_appointment", "request_callback"],
    greetings: {
      new_conversation: "שלום! 👶 מחפשים מסגרת לילד? נשמח לספר עלינו.",
      missed_call: "שלום! ראינו שהתקשרת. נשמח לקבוע סיור.",
      returning_customer: "שלום! איך הילד/ה?",
      after_hours: "תודה! נחזור אליך מחר."
    },
    sampleKnowledge: {
      faqs: [
        { q: "מה הגילאים שאתם מקבלים?", a: "מגיל 3 חודשים עד 3 שנים" },
        { q: "מה שעות הפעילות?", a: "7:30-17:00, א'-ה'" }
      ],
      policies: {
        registration: "הרשמה עם מקדמה",
        illness: "ילד חולה נשאר בבית"
      }
    }
  },
  {
    id: "therapy",
    name: "Therapy / Wellness",
    icon: <Heart className="h-4 w-4" />,
    personality: { tone: "professional", style: "detailed", emoji_usage: "minimal", response_length: "medium" },
    defaultTools: ["book_appointment", "create_inquiry", "request_callback"],
    greetings: {
      new_conversation: "שלום, ברוכים הבאים. איך אוכל לסייע?",
      missed_call: "שלום, ראינו שהתקשרת. נשמח לחזור אליך.",
      returning_customer: "שלום, שמחים לשמוע ממך.",
      after_hours: "תודה על פנייתך. נחזור אליך בשעות הפעילות."
    },
    sampleKnowledge: {
      faqs: [
        { q: "באילו תחומים אתם מתמחים?", a: "ייעוץ זוגי, אישי, משפחתי" },
        { q: "כמה עולה פגישה?", a: "400-500₪ לפגישה של 50 דקות" }
      ],
      policies: {
        confidentiality: "סודיות מלאה מובטחת",
        cancellation: "ביטול עד 24 שעות מראש"
      }
    }
  },
  {
    id: "art",
    name: "Art / Design Studio",
    icon: <Palette className="h-4 w-4" />,
    personality: { tone: "friendly", style: "conversational", emoji_usage: "moderate", response_length: "medium" },
    defaultTools: ["create_inquiry", "book_appointment", "send_pricing"],
    greetings: {
      new_conversation: "שלום! 🎨 מחפש עבודות אומנות או עיצוב?",
      missed_call: "היי! ראינו שהתקשרת. במה נוכל לעזור?",
      returning_customer: "שלום! שמחים לראות אותך!",
      after_hours: "תודה! נחזור אליך מחר."
    },
    sampleKnowledge: {
      faqs: [
        { q: "מה סוגי העבודות שלכם?", a: "ציורים, עיצוב גרפי, לוגו, מיתוג" },
        { q: "כמה זמן לוקח פרויקט?", a: "תלוי בהיקף - בין שבוע לחודש" }
      ],
      policies: {
        revisions: "עד 3 סבבי תיקונים כלולים",
        payment: "50% מקדמה, 50% בסיום"
      }
    }
  },
  {
    id: "tech",
    name: "Tech / IT Services",
    icon: <Laptop className="h-4 w-4" />,
    personality: { tone: "professional", style: "detailed", emoji_usage: "minimal", response_length: "medium" },
    defaultTools: ["create_inquiry", "request_callback", "book_appointment"],
    greetings: {
      new_conversation: "שלום! צריך עזרה טכנית? נשמח לסייע.",
      missed_call: "שלום, ראינו שהתקשרת. במה נוכל לעזור?",
      returning_customer: "שלום! הכל עובד כמו שצריך?",
      after_hours: "תודה! נחזור אליך בהקדם."
    },
    sampleKnowledge: {
      faqs: [
        { q: "מה השירותים שלכם?", a: "תיקון מחשבים, אבטחת מידע, תמיכה IT" },
        { q: "יש שירות מרחוק?", a: "כן! תמיכה מרחוק זמינה" }
      ],
      policies: {
        warranty: "אחריות 30 יום על תיקונים",
        response: "זמן תגובה עד 24 שעות"
      }
    }
  },
  {
    id: "plumbing",
    name: "Plumbing / HVAC",
    icon: <Wrench className="h-4 w-4" />,
    personality: { tone: "professional", style: "conversational", emoji_usage: "minimal", response_length: "short" },
    defaultTools: ["request_callback", "book_appointment", "create_inquiry"],
    greetings: {
      new_conversation: "שלום! צריך אינסטלטור או טכנאי מיזוג? נשמח לעזור.",
      missed_call: "שלום, ראינו שהתקשרת. מה הבעיה?",
      returning_customer: "שלום! הכל בסדר?",
      after_hours: "תודה! לחירום התקשר למספר הזה. אחרת נחזור מחר."
    },
    sampleKnowledge: {
      faqs: [
        { q: "יש שירות חירום?", a: "כן! זמינים 24/7 לחירום" },
        { q: "מה המחיר לביקור?", a: "קריאה + אבחון 150₪, עבודה לפי הצעה" }
      ],
      policies: {
        emergency: "שירות חירום בתוספת 50%",
        warranty: "אחריות שנה על עבודה"
      }
    }
  },
  {
    id: "religious",
    name: "Religious / Community",
    icon: <Church className="h-4 w-4" />,
    personality: { tone: "professional", style: "detailed", emoji_usage: "none", response_length: "medium" },
    defaultTools: ["create_inquiry", "book_appointment", "request_callback"],
    greetings: {
      new_conversation: "שלום, ברוכים הבאים. איך נוכל לסייע?",
      missed_call: "שלום, ראינו שהתקשרת. נשמח לחזור אליך.",
      returning_customer: "שלום, שמחים לשמוע ממך.",
      after_hours: "תודה על פנייתך. נחזור אליך בהקדם."
    },
    sampleKnowledge: {
      faqs: [
        { q: "מה שעות הפעילות?", a: "משרד פתוח א'-ה' 9:00-17:00" },
        { q: "איך מתקשרים לרב?", a: "ניתן לקבוע פגישה דרך המשרד" }
      ],
      policies: {
        events: "הזמנת אולם בתיאום מראש",
        donations: "תרומות מוכרות לצורכי מס"
      }
    }
  },
  {
    id: "moving",
    name: "Moving / Logistics",
    icon: <Truck className="h-4 w-4" />,
    personality: { tone: "professional", style: "conversational", emoji_usage: "minimal", response_length: "medium" },
    defaultTools: ["create_inquiry", "send_pricing", "book_appointment"],
    greetings: {
      new_conversation: "שלום! מתכננים הובלה? נשמח לעזור!",
      missed_call: "שלום, ראינו שהתקשרת. מתי ההובלה?",
      returning_customer: "שלום! עוד הובלה?",
      after_hours: "תודה! נחזור אליך מחר עם הצעת מחיר."
    },
    sampleKnowledge: {
      faqs: [
        { q: "מה כולל השירות?", a: "אריזה, פירוק, הרכבה, הובלה" },
        { q: "איך מחשבים מחיר?", a: "לפי גודל הדירה והמרחק" }
      ],
      policies: {
        insurance: "ביטוח מלא על תכולה",
        payment: "תשלום בסיום ההובלה"
      }
    }
  },
  {
    id: "storage",
    name: "Storage / Warehouse",
    icon: <Warehouse className="h-4 w-4" />,
    personality: { tone: "professional", style: "detailed", emoji_usage: "minimal", response_length: "medium" },
    defaultTools: ["create_inquiry", "send_pricing", "check_availability"],
    greetings: {
      new_conversation: "שלום! מחפש מקום אחסון? נשמח לעזור.",
      missed_call: "שלום, ראינו שהתקשרת. איזה גודל מחסן צריך?",
      returning_customer: "שלום! הכל בסדר במחסן?",
      after_hours: "תודה! נחזור אליך מחר."
    },
    sampleKnowledge: {
      faqs: [
        { q: "מה הגדלים הזמינים?", a: "מ-2 מ״ר עד 50 מ״ר" },
        { q: "יש מיזוג?", a: "יש מחסנים ממוזגים ורגילים" }
      ],
      policies: {
        access: "גישה 24/7 עם קוד אישי",
        contract: "חוזה מינימום חודש"
      }
    }
  },
  {
    id: "podcast",
    name: "Podcast / Media",
    icon: <Headphones className="h-4 w-4" />,
    personality: { tone: "casual", style: "conversational", emoji_usage: "frequent", response_length: "short" },
    defaultTools: ["create_inquiry", "book_appointment", "send_pricing"],
    greetings: {
      new_conversation: "היי! 🎙️ מעוניין להקליט פודקאסט?",
      missed_call: "היי! ראינו שהתקשרת. רוצה לקבוע הקלטה?",
      returning_customer: "שלום! מוכנים לפרק הבא?",
      after_hours: "תודה! נחזור אליך מחר."
    },
    sampleKnowledge: {
      faqs: [
        { q: "מה כולל האולפן?", a: "ציוד הקלטה מקצועי, עריכה, הפקה" },
        { q: "כמה עולה שעת הקלטה?", a: "300₪ לשעה כולל עריכה בסיסית" }
      ],
      policies: {
        booking: "הזמנה מראש בלבד",
        cancellation: "ביטול עד 48 שעות מראש"
      }
    }
  },
  {
    id: "library",
    name: "Library / Bookstore",
    icon: <BookOpen className="h-4 w-4" />,
    personality: { tone: "friendly", style: "detailed", emoji_usage: "minimal", response_length: "medium" },
    defaultTools: ["check_availability", "create_inquiry", "book_appointment"],
    greetings: {
      new_conversation: "שלום! 📚 מחפש ספר מסוים?",
      missed_call: "שלום! ראינו שהתקשרת. איזה ספר חיפשת?",
      returning_customer: "שלום! סיימת את הספר האחרון?",
      after_hours: "תודה! נחזור אליך מחר."
    },
    sampleKnowledge: {
      faqs: [
        { q: "אפשר להזמין ספרים?", a: "כן! גם ספרים שלא במלאי" },
        { q: "יש מועדון לקוחות?", a: "כן! 10% הנחה קבועה לחברים" }
      ],
      policies: {
        returns: "החזרה תוך 14 יום",
        order: "הזמנות מגיעות תוך 3-5 ימים"
      }
    }
  },
  {
    id: "fashion",
    name: "Fashion / Tailor",
    icon: <Shirt className="h-4 w-4" />,
    personality: { tone: "friendly", style: "conversational", emoji_usage: "moderate", response_length: "medium" },
    defaultTools: ["book_appointment", "create_inquiry", "send_pricing"],
    greetings: {
      new_conversation: "שלום! 👗 מחפש בגד מיוחד או תיקונים?",
      missed_call: "היי! ראינו שהתקשרת. במה נוכל לעזור?",
      returning_customer: "שלום! הבגד מוכן לאיסוף!",
      after_hours: "תודה! נחזור אליך מחר."
    },
    sampleKnowledge: {
      faqs: [
        { q: "כמה זמן לוקח תיקון?", a: "תיקונים פשוטים 2-3 ימים" },
        { q: "יש תפירה לפי מידה?", a: "כן! הזמנה לפי מידה אישית" }
      ],
      policies: {
        pickup: "איסוף תוך שבועיים",
        payment: "50% מקדמה להזמנות"
      }
    }
  },
  {
    id: "bakery",
    name: "Bakery / Pastry",
    icon: <Cake className="h-4 w-4" />,
    personality: { tone: "friendly", style: "conversational", emoji_usage: "frequent", response_length: "short" },
    defaultTools: ["create_inquiry", "send_pricing", "book_appointment"],
    greetings: {
      new_conversation: "שלום! 🎂 מחפש עוגה לאירוע מיוחד?",
      missed_call: "היי! ראינו שהתקשרת. מתי האירוע?",
      returning_customer: "שלום! עוד אירוע באופק?",
      after_hours: "תודה! נחזור אליך מחר."
    },
    sampleKnowledge: {
      faqs: [
        { q: "כמה מראש להזמין עוגה?", a: "מומלץ שבוע מראש לפחות" },
        { q: "יש אפשרויות ללא גלוטן?", a: "כן! יש מגוון אפשרויות" }
      ],
      policies: {
        order: "הזמנה עם מקדמה 30%",
        pickup: "איסוף ביום האירוע"
      }
    }
  },
  {
    id: "cafe",
    name: "Coffee Shop / Cafe",
    icon: <Coffee className="h-4 w-4" />,
    personality: { tone: "casual", style: "conversational", emoji_usage: "frequent", response_length: "short" },
    defaultTools: ["check_availability", "create_inquiry", "book_appointment"],
    greetings: {
      new_conversation: "היי! ☕ במה נוכל לעזור?",
      missed_call: "היי! ראינו שהתקשרת. רוצה לשריין מקום?",
      returning_customer: "שלום! הרגיל שלך?",
      after_hours: "סגורים כרגע! נפתח מחר בבוקר."
    },
    sampleKnowledge: {
      faqs: [
        { q: "יש Wi-Fi?", a: "כן! חינם לכל הלקוחות" },
        { q: "אפשר לשבת לעבוד?", a: "בהחלט! יש לנו פינות עבודה" }
      ],
      policies: {
        reservation: "שמירת מקום לקבוצות מעל 6",
        dogs: "בעלי חיים מותרים בחוץ"
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
