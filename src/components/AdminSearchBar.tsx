
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, RefreshCw } from "lucide-react";

interface AdminSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  submissionCount: number;
  onRefresh: () => void;
}

export const AdminSearchBar = ({ 
  searchTerm, 
  onSearchChange, 
  submissionCount, 
  onRefresh 
}: AdminSearchBarProps) => {
  const { isHebrew } = useLanguage();

  return (
    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder={isHebrew ? "חיפוש פניות..." : "Search submissions..."}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
        />
      </div>
      
      <div className="flex gap-4 items-center">
        <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
          {submissionCount} {isHebrew ? "פניות" : "submissions"}
        </Badge>
        <Button
          onClick={onRefresh}
          variant="outline"
          size="sm"
          className="border-white/20 text-white hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {isHebrew ? "רענן" : "Refresh"}
        </Button>
      </div>
    </div>
  );
};
