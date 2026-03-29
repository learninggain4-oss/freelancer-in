import { useState, useRef, useEffect } from "react";
import { Send, HelpCircle, Search, X, MessageSquare, BookOpen, UserCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useSupportChat, useMyConversation } from "@/hooks/use-support-chat";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SupportMessageBubble from "@/components/chat/SupportMessageBubble";

const HelpSupport = () => {
  const { profile } = useAuth();
  const { data: conversation, isLoading: loadingConv } = useMyConversation();
  const { messages, isLoading: loadingMessages, sendMessage, toggleReaction } = useSupportChat(conversation?.id);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: faqs = [] } = useQuery({
    queryKey: ["help-faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data || [];
    },
  });

  const unreadCount = messages.filter(
    (m) => !m.is_read && m.sender_id !== profile?.id
  ).length;

  useEffect(() => {
    if (activeTab === "messages" && !searchOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, searchOpen, activeTab]);

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content) return;
    try {
      await sendMessage(content);
      setNewMessage("");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const filteredMessages = searchQuery
    ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  if (loadingConv) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        {/* Header */}
        <div className="border-b bg-card/50 px-4 pt-4 pb-0">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">Help & Support</h1>
              <p className="text-xs text-muted-foreground">Get help, browse FAQs, or chat with support</p>
            </div>
          </div>
          <TabsList className="w-full">
            <TabsTrigger value="dashboard" className="flex-1 text-xs">Dashboard</TabsTrigger>
            <TabsTrigger value="faqs" className="flex-1 text-xs">FAQs</TabsTrigger>
            <TabsTrigger value="messages" className="relative flex-1 text-xs">
              Messages
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 min-w-4 px-1 text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="mt-0 px-4 py-4">
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setActiveTab("messages")}
                className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 transition-colors hover:bg-muted"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-foreground">Chat</span>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[10px]">
                    {unreadCount}
                  </Badge>
                )}
              </button>
              <button
                onClick={() => setActiveTab("faqs")}
                className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 transition-colors hover:bg-muted"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                  <BookOpen className="h-5 w-5 text-accent" />
                </div>
                <span className="text-xs font-medium text-foreground">FAQs</span>
                {faqs.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">{faqs.length} topics</span>
                )}
              </button>
              <div className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20">
                  <UserCircle className="h-5 w-5 text-secondary-foreground" />
                </div>
                <span className="text-xs font-medium text-foreground">Account</span>
                <span className="text-[10px] text-muted-foreground capitalize">{profile?.user_type}</span>
              </div>
            </div>

            {/* Account Summary Card */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-4">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Account Summary</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-card/80 p-3">
                    <p className="text-[10px] text-muted-foreground">Status</p>
                    <p className="text-sm font-semibold capitalize text-foreground">
                      {profile?.approval_status || "—"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-card/80 p-3">
                    <p className="text-[10px] text-muted-foreground">User Code</p>
                    <p className="text-sm font-semibold text-foreground">
                      {profile?.user_code || "—"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-card/80 p-3">
                    <p className="text-[10px] text-muted-foreground">Available Balance</p>
                    <p className="text-sm font-semibold text-foreground">
                      ₹{(profile?.available_balance ?? 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="rounded-lg bg-card/80 p-3">
                    <p className="text-[10px] text-muted-foreground">Hold Balance</p>
                    <p className="text-sm font-semibold text-foreground">
                      ₹{(profile?.hold_balance ?? 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* FAQs Tab */}
        <TabsContent value="faqs" className="mt-0 px-4 py-4">
          <div className="space-y-2">
            {faqs.length === 0 ? (
              <div className="py-12 text-center">
                <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No FAQs available yet.</p>
              </div>
            ) : (
              faqs.map((faq) => (
                <button
                  key={faq.id}
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  className="w-full rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted"
                >
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 shrink-0 text-primary" />
                    <span className="flex-1 text-sm font-medium text-foreground">{faq.question}</span>
                    <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFaq === faq.id ? "rotate-90" : ""}`} />
                  </div>
                  {expandedFaq === faq.id && (
                    <p className="mt-2 pl-6 text-xs leading-relaxed text-muted-foreground">{faq.answer}</p>
                  )}
                </button>
              ))
            )}
          </div>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="mt-0 flex h-[calc(100vh-14rem)] flex-col">
          {/* Search bar */}
          <div className="flex items-center gap-2 border-b px-4 py-2">
            <div className="flex-1">
              {searchOpen ? (
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                />
              ) : (
                <p className="text-xs text-muted-foreground">
                  {messages.length} message{messages.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => { setSearchOpen(!searchOpen); setSearchQuery(""); }}
            >
              {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          {searchOpen && searchQuery && (
            <p className="border-b px-4 py-1 text-[10px] text-muted-foreground">
              {filteredMessages.length} result{filteredMessages.length !== 1 ? "s" : ""} found
            </p>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-2">
            {loadingMessages ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-3/4" />
                ))}
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="py-8 text-center">
                <HelpCircle className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? "No messages match your search."
                    : "Send a message and our team will get back to you."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMessages.map((msg) => (
                  <SupportMessageBubble
                    key={msg.id}
                    message={msg}
                    isMe={msg.sender_id === profile?.id}
                    senderLabel={msg.sender_id === profile?.id ? "You" : "Support Team"}
                    currentUserId={profile?.id || ""}
                    onReaction={toggleReaction}
                  />
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="flex items-center gap-2 border-t px-4 py-3">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1"
            />
            <Button size="icon" onClick={handleSend} disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HelpSupport;
