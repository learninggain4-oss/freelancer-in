import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, ChevronLeft, HelpCircle, User, Wallet, Briefcase, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface ChatMessage {
  id: string;
  type: "bot" | "user";
  content: string;
}

const ACCOUNT_OPTIONS = [
  { id: "balance", label: "My Balance", icon: Wallet },
  { id: "account-type", label: "My Account Type", icon: User },
  { id: "approval-status", label: "My Approval Status", icon: Shield },
  { id: "user-code", label: "My User Code", icon: User },
];

const ChatBotPopup = () => {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"menu" | "faqs" | "account" | "chat">("menu");
  const scrollRef = useRef<HTMLDivElement>(null);
  const msgIdRef = useRef(0);

  const nextId = () => String(++msgIdRef.current);

  useEffect(() => {
    supabase
      .from("faqs")
      .select("id, question, answer")
      .eq("is_active", true)
      .order("display_order")
      .then(({ data }) => {
        if (data) setFaqs(data);
      });
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addBotMsg = (content: string) => {
    setMessages((prev) => [...prev, { id: nextId(), type: "bot", content }]);
  };

  const addUserMsg = (content: string) => {
    setMessages((prev) => [...prev, { id: nextId(), type: "user", content }]);
  };

  const handleOpen = () => {
    setOpen(true);
    if (messages.length === 0) {
      const name = profile?.full_name?.[0]?.split(" ")?.[0] || "there";
      addBotMsg(`Hi ${name}! 👋 How can I help you today? Choose a category below or type your question.`);
    }
  };

  const handleClose = () => setOpen(false);

  const handleFaqSelect = (faq: FAQ) => {
    addUserMsg(faq.question);
    setTimeout(() => addBotMsg(faq.answer), 300);
    setView("chat");
  };

  const handleAccountQuery = (optionId: string) => {
    const labels: Record<string, string> = {
      balance: "My Balance",
      "account-type": "My Account Type",
      "approval-status": "My Approval Status",
      "user-code": "My User Code",
    };
    addUserMsg(labels[optionId] || optionId);

    let answer = "Sorry, I couldn't find that information.";
    if (profile) {
      switch (optionId) {
        case "balance":
          answer = `💰 Your available balance is ₹${(profile.available_balance ?? 0).toLocaleString("en-IN")} and hold balance is ₹${(profile.hold_balance ?? 0).toLocaleString("en-IN")}.`;
          break;
        case "account-type":
          answer = `📋 Your account type is **${profile.user_type === "employee" ? "Employee" : "Client"}**.`;
          break;
        case "approval-status":
          answer = `✅ Your approval status is **${profile.approval_status?.charAt(0).toUpperCase()}${profile.approval_status?.slice(1)}**.`;
          break;
        case "user-code":
          answer = `🔑 Your user code is **${profile.user_code?.[0]}**.`;
          break;
      }
    }
    setTimeout(() => addBotMsg(answer), 300);
    setView("chat");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;

    const q = search.trim();
    addUserMsg(q);
    setSearch("");

    const lower = q.toLowerCase();
    const match = faqs.find(
      (f) =>
        f.question.toLowerCase().includes(lower) ||
        f.answer.toLowerCase().includes(lower)
    );

    setTimeout(() => {
      if (match) {
        addBotMsg(match.answer);
      } else {
        addBotMsg("I couldn't find an answer to that. Please try a different question or contact Help & Support for further assistance.");
      }
    }, 400);
    setView("chat");
  };

  const handleBackToMenu = () => setView("menu");

  const filteredFaqs = faqs.filter((f) =>
    f.question.toLowerCase().includes(search.toLowerCase())
  );

  if (!profile) return null;

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={handleOpen}
          className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg transition-transform hover:scale-105 active:scale-95"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6 text-primary-foreground" />
        </button>
      )}

      {/* Chat Popup */}
      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex h-[28rem] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl sm:right-6">
          {/* Header */}
          <div className="flex items-center gap-3 border-b bg-primary px-4 py-3">
            {view !== "menu" && view !== "chat" && (
              <button onClick={handleBackToMenu} className="text-primary-foreground/80 hover:text-primary-foreground">
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            {view === "chat" && (
              <button onClick={handleBackToMenu} className="text-primary-foreground/80 hover:text-primary-foreground">
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
              <MessageCircle className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-primary-foreground">Freelancer Bot</p>
              <p className="text-[11px] text-primary-foreground/70">Always here to help</p>
            </div>
            <button onClick={handleClose} className="text-primary-foreground/80 hover:text-primary-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden">
            {view === "menu" && (
              <ScrollArea className="h-full">
                <div className="space-y-4 p-4">
                  {/* Latest bot message */}
                  {messages.length > 0 && (
                    <div className="rounded-lg bg-muted p-3 text-sm text-foreground">
                      {messages[messages.length - 1].type === "bot"
                        ? messages[messages.length - 1].content
                        : messages.find((m) => m.type === "bot")?.content}
                    </div>
                  )}

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quick Help</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setView("faqs")}
                        className="flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors hover:bg-muted"
                      >
                        <HelpCircle className="h-5 w-5 text-primary" />
                        <span className="text-xs font-medium text-foreground">FAQs</span>
                      </button>
                      <button
                        onClick={() => setView("account")}
                        className="flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors hover:bg-muted"
                      >
                        <User className="h-5 w-5 text-primary" />
                        <span className="text-xs font-medium text-foreground">My Account</span>
                      </button>
                    </div>
                  </div>

                  {messages.length > 1 && (
                    <button
                      onClick={() => setView("chat")}
                      className="w-full rounded-lg border p-2.5 text-center text-xs font-medium text-primary transition-colors hover:bg-muted"
                    >
                      View Chat History →
                    </button>
                  )}
                </div>
              </ScrollArea>
            )}

            {view === "faqs" && (
              <ScrollArea className="h-full">
                <div className="space-y-2 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Frequently Asked Questions</p>
                  {filteredFaqs.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No FAQs found</p>
                  ) : (
                    filteredFaqs.map((faq) => (
                      <button
                        key={faq.id}
                        onClick={() => handleFaqSelect(faq)}
                        className="w-full rounded-lg border p-3 text-left text-sm text-foreground transition-colors hover:bg-muted"
                      >
                        {faq.question}
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}

            {view === "account" && (
              <ScrollArea className="h-full">
                <div className="space-y-2 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Account Information</p>
                  {ACCOUNT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleAccountQuery(opt.id)}
                      className="flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm text-foreground transition-colors hover:bg-muted"
                    >
                      <opt.icon className="h-4 w-4 text-primary" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}

            {view === "chat" && (
              <div ref={scrollRef} className="flex h-full flex-col overflow-y-auto p-4">
                <div className="flex-1 space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                          msg.type === "user"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSearch} className="flex items-center gap-2 border-t bg-card px-3 py-2.5">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type your question..."
              className="h-9 text-sm"
            />
            <Button type="submit" size="icon" className="h-9 w-9 shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatBotPopup;
