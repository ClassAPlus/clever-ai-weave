import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, MessageSquare, User, Clock, RefreshCw, Filter,
  ArrowLeft, Send, Bot, ChevronRight
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Message {
  id: string;
  content: string;
  direction: string;
  ai_generated: boolean | null;
  created_at: string | null;
}

interface Conversation {
  id: string;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  contact: {
    id: string;
    name: string | null;
    phone_number: string;
  } | null;
  messages: Message[];
}

interface ConversationStats {
  total: number;
  active: number;
  closed: number;
}

export default function Conversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<ConversationStats>({ total: 0, active: 0, closed: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "closed">("all");
  const [businessId, setBusinessId] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // First get the business
      const { data: business, error: bizError } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_user_id", user.id)
        .single();

      if (bizError || !business) {
        console.error("Error fetching business:", bizError);
        return;
      }

      setBusinessId(business.id);

      // Fetch conversations with contact info and last message
      let query = supabase
        .from("conversations")
        .select(`
          id,
          status,
          created_at,
          updated_at,
          contact:contacts(id, name, phone_number)
        `)
        .eq("business_id", business.id)
        .order("updated_at", { ascending: false });

      if (filter === "active") {
        query = query.eq("status", "active");
      } else if (filter === "closed") {
        query = query.eq("status", "closed");
      }

      const { data: conversationsData, error: convsError } = await query.limit(50);

      if (convsError) {
        console.error("Error fetching conversations:", convsError);
        return;
      }

      // Fetch last message for each conversation
      const conversationsWithMessages = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          const { data: lastMessage } = await supabase
            .from("messages")
            .select("id, content, direction, ai_generated, created_at")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1);
          
          return {
            ...conv,
            messages: lastMessage || []
          };
        })
      );

      setConversations(conversationsWithMessages);

      // Fetch stats
      const { data: allConvs } = await supabase
        .from("conversations")
        .select("status")
        .eq("business_id", business.id);

      if (allConvs) {
        setStats({
          total: allConvs.length,
          active: allConvs.filter(c => c.status === "active").length,
          closed: allConvs.filter(c => c.status === "closed").length,
        });
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, filter]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      const { data: messagesData, error } = await supabase
        .from("messages")
        .select("id, content, direction, ai_generated, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      setMessages(messagesData || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation, fetchMessages]);

  // Real-time subscription for conversations
  useEffect(() => {
    if (!businessId) return;

    const conversationsChannel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `business_id=eq.${businessId}`
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
    };
  }, [businessId, fetchConversations]);

  // Real-time subscription for messages in selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const messagesChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`
        },
        () => {
          fetchMessages(selectedConversation.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [selectedConversation, fetchMessages]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBack = () => {
    setSelectedConversation(null);
    setMessages([]);
  };

  const formatPhoneNumber = (phone: string) => {
    return phone;
  };

  const truncateMessage = (content: string, maxLength: number = 50) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  // Message detail view
  if (selectedConversation) {
    return (
      <div className="space-y-4 h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleBack}
            className="text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">
              {selectedConversation.contact?.name || formatPhoneNumber(selectedConversation.contact?.phone_number || "Unknown")}
            </h1>
            {selectedConversation.contact?.name && (
              <p className="text-sm text-gray-400 font-mono">
                {formatPhoneNumber(selectedConversation.contact.phone_number)}
              </p>
            )}
          </div>
          <Badge 
            variant={selectedConversation.status === "active" ? "default" : "secondary"}
            className={selectedConversation.status === "active" 
              ? "bg-green-500/20 text-green-300 border-green-500/30" 
              : "bg-gray-500/20 text-gray-300 border-gray-500/30"
            }
          >
            {selectedConversation.status}
          </Badge>
        </div>

        {/* Messages */}
        <Card className="bg-gray-800/50 border-gray-700 flex-1 h-[calc(100%-4rem)]">
          <CardContent className="p-0 h-full">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <MessageSquare className="h-12 w-12 mb-3 opacity-50" />
                <p>No messages in this conversation</p>
              </div>
            ) : (
              <ScrollArea className="h-full p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.direction === "outbound" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          message.direction === "outbound"
                            ? "bg-purple-600 text-white rounded-br-md"
                            : "bg-gray-700 text-white rounded-bl-md"
                        }`}
                      >
                        {message.ai_generated && message.direction === "outbound" && (
                          <div className="flex items-center gap-1 text-xs text-purple-200 mb-1">
                            <Bot className="h-3 w-3" />
                            AI Generated
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.direction === "outbound" ? "text-purple-200" : "text-gray-400"
                        }`}>
                          {message.created_at 
                            ? format(new Date(message.created_at), "MMM d, h:mm a")
                            : "Unknown time"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Conversations list view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Conversations</h1>
          <p className="text-gray-400">View and manage SMS conversations</p>
        </div>
        <Button 
          onClick={fetchConversations} 
          variant="outline" 
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <MessageSquare className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-gray-400">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <MessageSquare className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.active}</p>
                <p className="text-sm text-gray-400">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-500/20 rounded-lg">
                <MessageSquare className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.closed}</p>
                <p className="text-sm text-gray-400">Closed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-gray-400" />
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all" className="text-white hover:bg-gray-700">All Conversations</SelectItem>
            <SelectItem value="active" className="text-white hover:bg-gray-700">Active</SelectItem>
            <SelectItem value="closed" className="text-white hover:bg-gray-700">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conversations List */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Conversations</CardTitle>
          <CardDescription className="text-gray-400">
            {conversations.length} conversations found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-sm">SMS conversations will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation)}
                  className="w-full flex items-center justify-between p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="p-2 bg-purple-500/20 rounded-full">
                      <User className="h-5 w-5 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white truncate">
                          {conversation.contact?.name || formatPhoneNumber(conversation.contact?.phone_number || "Unknown")}
                        </span>
                        {conversation.contact?.name && (
                          <span className="text-sm text-gray-400 font-mono hidden sm:inline">
                            {formatPhoneNumber(conversation.contact.phone_number)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        {conversation.messages[0] && (
                          <>
                            {conversation.messages[0].ai_generated && (
                              <Bot className="h-3 w-3 text-purple-400" />
                            )}
                            <span className="truncate">
                              {conversation.messages[0].direction === "outbound" ? "You: " : ""}
                              {truncateMessage(conversation.messages[0].content)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-gray-400">
                        {conversation.updated_at 
                          ? formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })
                          : "Unknown"}
                      </p>
                    </div>
                    <Badge 
                      variant={conversation.status === "active" ? "default" : "secondary"}
                      className={conversation.status === "active" 
                        ? "bg-green-500/20 text-green-300 border-green-500/30" 
                        : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                      }
                    >
                      {conversation.status}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
