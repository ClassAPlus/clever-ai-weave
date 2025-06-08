
import { useLanguage } from "@/contexts/LanguageContext";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const AdminTableHeader = () => {
  const { isHebrew } = useLanguage();

  return (
    <TableHeader>
      <TableRow>
        <TableHead className="text-gray-300">
          {isHebrew ? "שם" : "Name"}
        </TableHead>
        <TableHead className="text-gray-300">
          {isHebrew ? "אימייל" : "Email"}
        </TableHead>
        <TableHead className="text-gray-300">
          {isHebrew ? "חברה" : "Company"}
        </TableHead>
        <TableHead className="text-gray-300">
          {isHebrew ? "הודעה" : "Message"}
        </TableHead>
        <TableHead className="text-gray-300">
          {isHebrew ? "תאריך" : "Date"}
        </TableHead>
        <TableHead className="text-gray-300">
          {isHebrew ? "פעולות" : "Actions"}
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};
