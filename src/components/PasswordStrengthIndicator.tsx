import { useMemo } from "react";
import { Check, X } from "lucide-react";

interface PasswordRequirement {
  label: string;
  met: boolean;
}

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const requirements = useMemo((): PasswordRequirement[] => {
    return [
      { label: "At least 6 characters", met: password.length >= 6 },
      { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
      { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
      { label: "Contains a number", met: /\d/.test(password) },
      { label: "Contains special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ];
  }, [password]);

  const strength = useMemo(() => {
    const metCount = requirements.filter((r) => r.met).length;
    if (metCount <= 1) return { label: "Weak", color: "bg-red-500", width: "20%" };
    if (metCount === 2) return { label: "Fair", color: "bg-orange-500", width: "40%" };
    if (metCount === 3) return { label: "Good", color: "bg-yellow-500", width: "60%" };
    if (metCount === 4) return { label: "Strong", color: "bg-green-400", width: "80%" };
    return { label: "Very Strong", color: "bg-green-500", width: "100%" };
  }, [requirements]);

  if (!password) return null;

  return (
    <div className="space-y-3 mt-2">
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Password strength</span>
          <span className="text-gray-300">{strength.label}</span>
        </div>
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${strength.color} transition-all duration-300`}
            style={{ width: strength.width }}
          />
        </div>
      </div>
      <ul className="space-y-1">
        {requirements.map((req) => (
          <li key={req.label} className="flex items-center gap-2 text-xs">
            {req.met ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <X className="h-3 w-3 text-gray-500" />
            )}
            <span className={req.met ? "text-green-400" : "text-gray-500"}>
              {req.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
