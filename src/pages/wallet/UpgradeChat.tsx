import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Globe, Loader2, Check, CheckCheck, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUpgradeChat } from "@/hooks/use-upgrade-chat";
import { useAdminPresence } from "@/hooks/use-admin-presence";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { translations, type Lang } from "@/components/wallet/upgrade-chat/translations";

type ChatStep =
  | "language" | "confirm" | "details" | "payment" | "waiting"
  | "appointment_day" | "appointment_time" | "appointment_booked"
  | "appointment_active" | "live_chat";

interface BotMessage {
  id: string;
  content: string;
  type: "bot" | "user" | "system";
  options?: { key: string; label: string }[];
  timestamp: Date;
  selectedOption?: string;
}

const BOT_PREFIX = "[BOT] ";
const SYSTEM_PREFIX = "[SYSTEM] ";
const TYPING_DURATION = 10000; // 10 seconds

let msgIdCounter = 0;
const genId = () => `bot-${Date.now()}-${++msgIdCounter}`;

const formatFullTimestamp = (date: Date) => format(date, "EEEE, dd MMMM yyyy — hh:mm a");

const TypingAnimation = ({ label }: { label?: string }) => (
  <div className="flex justify-start">
    <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-muted text-foreground rounded-bl-md">
      <p className="text-[10px] font-semibold text-primary mb-1.5">{label || "🤖 FlexPay Bot"}</p>
      <div className="flex items-center gap-1.5">
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
          <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:200ms]" />
          <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:400ms]" />
        </div>
        <span className="text-xs text-muted-foreground ml-1">Typing...</span>
      </div>
    </div>
  </div>
);

const MessageStatus = ({ isOwn, isRead }: { isOwn: boolean; isRead?: boolean }) => {
  if (!isOwn) return null;
  return (
    <span className="inline-flex items-center gap-0.5 ml-1.5">
      {isRead ? (
        <CheckCheck className="h-3 w-3 text-blue-400" />
      ) : (
        <Check className="h-3 w-3 text-primary-foreground/50" />
      )}
      <span className="text-[9px]">{isRead ? "Seen" : "Delivered"}</span>
    </span>
  );
};

const UpgradeChat = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [lang, setLang] = useState<Lang>("en");
  const [step, setStep] = useState<ChatStep>("language");
  const [botMessages, setBotMessages] = useState<BotMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [answeredMessages, setAnsweredMessages] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingMessageRef = useRef<{ content: string; options?: { key: string; label: string }[]; callback?: () => void } | null>(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const isInitializedRef = useRef(false);
  // Track processed message IDs to prevent duplicates
  const processedOptionsRef = useRef<Set<string>>(new Set());

  // Appointment state
  const [selectedDay, setSelectedDay] = useState<{ dayName: string; date: Date } | null>(null);
  const [appointmentTimerId, setAppointmentTimerId] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Admin presence
  const { adminOnline, isAdminTyping, broadcastTyping } = useAdminPresence(requestId);

  // Fetch auto-responses from DB
  const { data: autoResponses = [] } = useQuery({
    queryKey: ["upgrade-auto-responses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("upgrade_auto_responses")
        .select("*")
        .eq("is_enabled", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data || []).map((r: any) => ({
        ...r,
        buttons: Array.isArray(r.buttons) ? r.buttons : [],
      }));
    },
  });

  // Fetch time slots from DB
  const { data: dbTimeSlots = [] } = useQuery({
    queryKey: ["upgrade-chat-time-slots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("upgrade_chat_time_slots")
        .select("*")
        .eq("is_enabled", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Helper to get DB message by step key and language
  const getDbMessage = useCallback((stepKey: string, language: string) => {
    const key = `${stepKey}_${language}`;
    return autoResponses.find((r: any) => r.step_key === key) || null;
  }, [autoResponses]);

  // Helper to replace template placeholders
  const replaceTemplateVars = useCallback((text: string, vars: Record<string, string>) => {
    let result = text;
    for (const [key, value] of Object.entries(vars)) {
      result = result.split(`{{${key}}}`).join(value);
    }
    return result;
  }, []);

  // Fetch upgrade request
  const { data: request, isLoading: loadingRequest } = useQuery({
    queryKey: ["upgrade-request-detail", requestId],
    queryFn: async () => {
      if (!requestId) return null;
      const { data, error } = await supabase.from("wallet_upgrade_requests").select("*").eq("id", requestId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!requestId,
  });

  const { data: requestedWallet } = useQuery({
    queryKey: ["wallet-type-detail", request?.requested_wallet_type],
    queryFn: async () => {
      if (!request?.requested_wallet_type) return null;
      const { data, error } = await supabase.from("wallet_types").select("*").eq("name", request.requested_wallet_type).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!request?.requested_wallet_type,
  });

  const { messages: realtimeMessages, isLoading: loadingMessages, sendMessage } = useUpgradeChat(requestId);

  // Save bot/system message to DB
  const saveBotMessageToDB = useCallback(async (content: string, isSystem = false) => {
    if (!requestId || !profile?.id) return;
    try {
      const prefix = isSystem ? SYSTEM_PREFIX : BOT_PREFIX;
      await supabase.from("upgrade_request_messages").insert({
        upgrade_request_id: requestId,
        sender_id: profile.id,
        content: `${prefix}${content}`,
      });
    } catch (err) {
      console.error("Failed to save bot message:", err);
    }
  }, [requestId, profile?.id]);

  const addBotMessageDirect = useCallback((content: string, options?: { key: string; label: string }[]) => {
    const msg: BotMessage = { id: genId(), content, type: "bot", options, timestamp: new Date() };
    setBotMessages(prev => [...prev, msg]);
    if (content) saveBotMessageToDB(content);
    return msg.id;
  }, [saveBotMessageToDB]);

  const addBotMessageWithTyping = useCallback((content: string, options?: { key: string; label: string }[], afterReveal?: () => void) => {
    setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    pendingMessageRef.current = { content, options, callback: afterReveal };
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      const pending = pendingMessageRef.current;
      if (pending) {
        const msg: BotMessage = { id: genId(), content: pending.content, type: "bot", options: pending.options, timestamp: new Date() };
        setBotMessages(prev => [...prev, msg]);
        if (pending.content) saveBotMessageToDB(pending.content);
        pendingMessageRef.current = null;
        if (pending.callback) pending.callback();
      }
    }, TYPING_DURATION);
  }, [saveBotMessageToDB]);

  const addUserMessage = useCallback((content: string) => {
    setBotMessages(prev => [...prev, { id: genId(), content, type: "user", timestamp: new Date() }]);
    if (requestId && profile?.id) {
      supabase.from("upgrade_request_messages").insert({
        upgrade_request_id: requestId, sender_id: profile.id, content,
      }).then();
    }
  }, [requestId, profile?.id]);

  const addSystemMessage = useCallback((content: string) => {
    setBotMessages(prev => [...prev, { id: genId(), content, type: "system", timestamp: new Date() }]);
    saveBotMessageToDB(content, true);
  }, [saveBotMessageToDB]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (appointmentTimerId) clearTimeout(appointmentTimerId);
    };
  }, [appointmentTimerId]);

  // Initialize only once
  useEffect(() => {
    if (!isInitializedRef.current && botMessages.length === 0 && !isTyping) {
      isInitializedRef.current = true;
      const dbMsg = getDbMessage("language", "en");
      if (dbMsg) {
        addBotMessageWithTyping(dbMsg.message_text, dbMsg.buttons.filter((b: any) => b.is_enabled !== false));
      } else {
        const t = translations.en;
        addBotMessageWithTyping(t.selectLanguage, t.langOptions);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // NO auto-scroll — removed per requirement

  // Show "New Message" indicator when admin sends messages
  const prevAdminMsgCountRef = useRef(0);
  const adminManualMessages = realtimeMessages.filter(msg => {
    if (msg.sender_id === profile?.id) return false;
    if (msg.content.startsWith(BOT_PREFIX) || msg.content.startsWith(SYSTEM_PREFIX)) return false;
    return true;
  });

  useEffect(() => {
    if (adminManualMessages.length > prevAdminMsgCountRef.current) {
      setHasNewMessage(true);
    }
    prevAdminMsgCountRef.current = adminManualMessages.length;
  }, [adminManualMessages.length]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setHasNewMessage(false);
  }, []);

  // Generate day options for next 7 days
  const getDayOptions = useCallback(() => {
    const t = translations[lang];
    const options: { key: string; label: string }[] = [];
    for (let i = 1; i <= 7; i++) {
      const date = addDays(new Date(), i);
      const dayName = format(date, "EEEE");
      const dateStr = format(date, "dd MMM yyyy");
      options.push({ key: `day_${i}`, label: `📅 ${dayName}, ${dateStr}` });
    }
    options.push({ key: "cancel_booking", label: t.cancelBtn });
    return options;
  }, [lang]);

  // Generate time slot options from DB filtered by selected day
  // Accepts an optional `forDate` so it can be called immediately after day selection
  // without waiting for the async `selectedDay` state update.
  const getTimeOptions = useCallback((forDate?: Date) => {
    const t = translations[lang];
    const options: { key: string; label: string }[] = [];
    // Prefer the explicitly passed date, fall back to state
    const dateToUse = forDate ?? selectedDay?.date ?? null;
    const dayOfWeek = dateToUse !== null ? dateToUse.getDay() : null;
    if (dbTimeSlots.length > 0 && dayOfWeek !== null) {
      const filteredSlots = dbTimeSlots.filter((slot: any) => slot.day_of_week === dayOfWeek);
      for (const slot of filteredSlots) {
        options.push({ key: `time_${slot.start_hour}`, label: slot.label });
      }
    } else if (dbTimeSlots.length > 0 && dayOfWeek === null) {
      // No day selected yet, show nothing
    } else {
      // Fallback to hardcoded if DB is empty
      for (let hour = 9; hour < 18; hour++) {
        const startTime = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? "PM" : "AM"}`;
        const endHour = hour + 1;
        const endTime = `${endHour > 12 ? endHour - 12 : endHour}:00 ${endHour >= 12 ? "PM" : "AM"}`;
        options.push({ key: `time_${hour}`, label: `🕐 ${startTime} - ${endTime}` });
      }
    }
    options.push({ key: "cancel_booking", label: t.cancelBtn });
    return options;
  }, [lang, dbTimeSlots, selectedDay]);

  const markMessageAnswered = useCallback((messageId: string, optionKey: string) => {
    setAnsweredMessages(prev => new Set(prev).add(messageId));
    setBotMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, selectedOption: optionKey } : msg
    ));
  }, []);

  const handleOptionSelect = useCallback(async (optionKey: string, messageId: string) => {
    // Prevent duplicate processing
    if (answeredMessages.has(messageId)) return;
    const processKey = `${messageId}:${optionKey}`;
    if (processedOptionsRef.current.has(processKey)) return;
    processedOptionsRef.current.add(processKey);

    markMessageAnswered(messageId, optionKey);

    const t = translations[lang];

    switch (step) {
      case "language": {
        const selectedLang = optionKey as Lang;
        const dbLang = getDbMessage("language", "en");
        const langLabel = dbLang?.buttons?.find((b: any) => b.key === optionKey)?.label
          || translations.en.langOptions.find(o => o.key === optionKey)?.label || optionKey;
        addUserMessage(langLabel);
        setLang(selectedLang);
        setStep("confirm");
        const dbConfirm = getDbMessage("confirm", selectedLang);
        if (dbConfirm) {
          addBotMessageWithTyping(dbConfirm.message_text, dbConfirm.buttons.filter((b: any) => b.is_enabled !== false));
        } else {
          const newT = translations[selectedLang];
          addBotMessageWithTyping(newT.confirmChange, newT.confirmOptions);
        }
        break;
      }

      case "confirm": {
        const dbConfirm = getDbMessage("confirm", lang);
        const selectedLabel = dbConfirm?.buttons?.find((b: any) => b.key === optionKey)?.label
          || t.confirmOptions.find(o => o.key === optionKey)?.label || optionKey;
        addUserMessage(selectedLabel);
        if (optionKey === "no" || optionKey === "change_lang") {
          // Do NOT auto-reset. Just stay.
        } else if (optionKey === "yes") {
          setStep("details");
          if (!request || !requestedWallet) {
            addBotMessageWithTyping("Unable to load wallet details.");
            return;
          }
          const employeeName = profile?.full_name?.join(" ") || "Freelancer";
          const price = requestedWallet.wallet_price || "N/A";
          const features = (requestedWallet.perks as string[]) || [];
          const dbDetails = getDbMessage("details", lang);
          let detailsMsg: string;
          if (dbDetails) {
            detailsMsg = replaceTemplateVars(dbDetails.message_text, {
              employee_name: employeeName,
              current_wallet: request.current_wallet_type,
              requested_wallet: request.requested_wallet_type,
              price: String(price),
              features: features.map(f => `  • ${f}`).join("\n"),
            });
          } else {
            detailsMsg = t.upgradeMsg(employeeName, request.current_wallet_type, request.requested_wallet_type, price, features);
          }
          addBotMessageWithTyping(detailsMsg, undefined, () => {
            setStep("payment");
            const dbPayment = getDbMessage("payment", lang);
            if (dbPayment) {
              const payBtns = dbPayment.buttons.filter((b: any) => b.is_enabled !== false).map((b: any) => ({
                ...b,
                label: replaceTemplateVars(b.label, { price: String(price) }),
              }));
              addBotMessageWithTyping(dbPayment.message_text, payBtns);
            } else {
              addBotMessageWithTyping("", t.payOptions(price));
            }
          });
        }
        break;
      }

      case "payment": {
        const price = requestedWallet?.wallet_price || "N/A";
        const dbPayment = getDbMessage("payment", lang);
        const selectedLabel = dbPayment?.buttons?.find((b: any) => b.key === optionKey)?.label
          ? replaceTemplateVars(dbPayment.buttons.find((b: any) => b.key === optionKey)!.label, { price: String(price) })
          : t.payOptions(price).find(o => o.key === optionKey)?.label || optionKey;
        addUserMessage(selectedLabel);
        if (optionKey === "cancel") {
          // Do NOT auto-reset
        } else if (optionKey === "pay") {
          setStep("waiting");
          // Notify admin
          try {
            const employeeName = profile?.full_name?.join(" ") || "Freelancer";
            const { data: adminProfiles } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
            if (adminProfiles?.length) {
              await supabase.from("notifications").insert(
                adminProfiles.map((ap: any) => ({
                  user_id: ap.user_id,
                  title: "Wallet Upgrade Payment",
                  message: `${employeeName} wants to pay for wallet upgrade to ${request?.requested_wallet_type}.`,
                  type: "info",
                  reference_id: requestId,
                  reference_type: "wallet_upgrade",
                }))
              );
            }
          } catch {}

          // Always show offline message from DB or fallback
          const dbOffline = getDbMessage("offline_message", lang);
          const offlineMsg = dbOffline?.message_text || t.offlineMessage;
          addBotMessageWithTyping(offlineMsg, undefined, () => {
            // Then show appointment booking
            const dbApptIntro = getDbMessage("appointment_intro", lang);
            const apptMsg = dbApptIntro?.message_text || t.appointmentIntro;
            addBotMessageWithTyping(apptMsg, getDayOptions(), () => {
              setStep("appointment_day");
            });
          });
        }
        break;
      }

      case "appointment_day": {
        if (optionKey === "cancel_booking") {
          addUserMessage(t.cancelBtn);
          const dbCancelled = getDbMessage("booking_cancelled", lang);
          addBotMessageWithTyping(dbCancelled?.message_text || t.bookingCancelled);
          return;
        }
        const dayIndex = parseInt(optionKey.replace("day_", ""));
        const date = addDays(new Date(), dayIndex);
        const dayName = format(date, "EEEE");
        const dateStr = format(date, "dd MMM yyyy");
        addUserMessage(`📅 ${dayName}, ${dateStr}`);
        setSelectedDay({ dayName, date });
        setStep("appointment_time");
        const dbTime = getDbMessage("select_time", lang);
        // Pass `date` directly so we get the correct day's slots immediately
        // (setSelectedDay is async and selectedDay won't update until next render)
        addBotMessageWithTyping(dbTime?.message_text || t.selectTime, getTimeOptions(date));
        break;
      }

      case "appointment_time": {
        if (optionKey === "cancel_booking") {
          addUserMessage(t.cancelBtn);
          const dbCancelled = getDbMessage("booking_cancelled", lang);
          addBotMessageWithTyping(dbCancelled?.message_text || t.bookingCancelled);
          return;
        }
        const hour = parseInt(optionKey.replace("time_", ""));
        // Try to find label from DB slots, matching both hour and day_of_week
        const selectedDayOfWeek = selectedDay?.date.getDay() ?? -1;
        const dbSlot = dbTimeSlots.find(
          (s: any) => s.start_hour === hour && s.day_of_week === selectedDayOfWeek
        ) ?? dbTimeSlots.find((s: any) => s.start_hour === hour);
        let timeSlot: string;
        if (dbSlot) {
          timeSlot = dbSlot.label.replace(/^🕐\s*/, "");
        } else {
          const startTime = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? "PM" : "AM"}`;
          const endHour = hour + 1;
          const endTime = `${endHour > 12 ? endHour - 12 : endHour}:00 ${endHour >= 12 ? "PM" : "AM"}`;
          timeSlot = `${startTime} - ${endTime}`;
        }
        addUserMessage(`🕐 ${timeSlot}`);

        if (!selectedDay) return;
        const dayName = selectedDay.dayName;
        const dateStr = format(selectedDay.date, "dd MMMM yyyy");

        // Save appointment to DB
        if (requestId && profile?.id) {
          supabase.from("upgrade_appointments").insert({
            upgrade_request_id: requestId,
            profile_id: profile.id,
            appointment_date: format(selectedDay.date, "yyyy-MM-dd"),
            time_slot: timeSlot,
            status: "booked",
          }).then();
        }

        setStep("appointment_booked");
        const dbBooked = getDbMessage("booking_confirmed", lang);
        const bookedMsg = dbBooked
          ? replaceTemplateVars(dbBooked.message_text, { day: dayName, date: dateStr, time: timeSlot })
          : t.bookingConfirmed(dayName, dateStr, timeSlot);
        addBotMessageWithTyping(bookedMsg, undefined, () => {
          // Start monitoring appointment time (employer-side)
          const timer = setTimeout(() => {
            setStep("appointment_active");
            const dbReminder = getDbMessage("appointment_reminder", lang);
            addBotMessageWithTyping(dbReminder?.message_text || t.appointmentReminder, undefined, () => {
              // 5 minute auto-cancel timer
              const cancelTimer = setTimeout(() => {
                const dbAutoCancel = getDbMessage("appointment_auto_cancel", lang);
                addBotMessageWithTyping(dbAutoCancel?.message_text || t.appointmentAutoCancel, undefined, () => {
                  if (requestId && profile?.id) {
                    supabase.from("upgrade_appointments")
                      .update({ status: "cancelled" })
                      .eq("upgrade_request_id", requestId)
                      .eq("profile_id", profile.id)
                      .eq("status", "booked")
                      .then();
                  }
                });
              }, 5 * 60 * 1000); // 5 minutes
              setAppointmentTimerId(cancelTimer);
            });
          }, 30000); // 30s demo delay
          setAppointmentTimerId(timer);
        });
        break;
      }

      default:
        break;
    }
  }, [lang, step, request, requestedWallet, profile, addBotMessageWithTyping, addUserMessage, getDayOptions, getTimeOptions, selectedDay, requestId, answeredMessages, markMessageAnswered, getDbMessage, replaceTemplateVars]);

  // Check if freelancer sends message during appointment_active to confirm
  useEffect(() => {
    if (step !== "appointment_active") return;
    const employeeMessages = realtimeMessages.filter(msg =>
      msg.sender_id === profile?.id &&
      !msg.content.startsWith(BOT_PREFIX) &&
      !msg.content.startsWith(SYSTEM_PREFIX)
    );
    if (employeeMessages.length > 0) {
      const latestMsg = employeeMessages[employeeMessages.length - 1];
      const msgTime = new Date(latestMsg.created_at).getTime();
      const now = Date.now();
      if (now - msgTime < 30000) {
        if (appointmentTimerId) {
          clearTimeout(appointmentTimerId);
          setAppointmentTimerId(null);
        }
        const t = translations[lang];
        const dbConfirmedAppt = getDbMessage("appointment_confirmed", lang);
        addBotMessageWithTyping(dbConfirmedAppt?.message_text || t.appointmentConfirmedMsg);
        if (requestId && profile?.id) {
          supabase.from("upgrade_appointments")
            .update({ status: "confirmed" })
            .eq("upgrade_request_id", requestId)
            .eq("profile_id", profile.id)
            .eq("status", "booked")
            .then();
        }
        setStep("live_chat");
      }
    }
  }, [realtimeMessages, step, profile?.id, appointmentTimerId, lang, addBotMessageWithTyping, requestId]);

  // Freelancer real-time messages (for display below bot messages in sequence)
  const employeeRtMessages = realtimeMessages.filter(msg => {
    if (msg.content.startsWith(BOT_PREFIX) || msg.content.startsWith(SYSTEM_PREFIX)) return false;
    return msg.sender_id === profile?.id;
  });

  // Merge admin + freelancer realtime messages in chronological order for display after bot messages
  const allRealtimeMessages = realtimeMessages
    .filter(msg => !msg.content.startsWith(BOT_PREFIX) && !msg.content.startsWith(SYSTEM_PREFIX))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // Live chat input
  const [liveChatInput, setLiveChatInput] = useState("");
  const liveChatTextareaRef = useRef<HTMLTextAreaElement>(null);
  const typingBroadcastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = liveChatTextareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [liveChatInput]);

  const handleInputChange = (val: string) => {
    setLiveChatInput(val);
    broadcastTyping(true);
    if (typingBroadcastRef.current) clearTimeout(typingBroadcastRef.current);
    typingBroadcastRef.current = setTimeout(() => broadcastTyping(false), 2000);
  };

  const handleLiveSend = async () => {
    const content = liveChatInput.trim();
    if (!content) return;
    try {
      await sendMessage(content);
      setLiveChatInput("");
      broadcastTyping(false);
      if (liveChatTextareaRef.current) liveChatTextareaRef.current.style.height = "auto";
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loadingRequest) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <p className="text-sm text-muted-foreground">Upgrade request not found.</p>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col bg-background">
      {/* Header */}
      <div className="relative overflow-hidden border-b bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5">
        <div className="absolute inset-0 backdrop-blur-xl" />
        <div className="relative flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9 rounded-xl hover:bg-background/60">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground">Wallet Upgrade</h2>
              <div className="flex items-center gap-1">
                <span className={cn(
                  "h-2 w-2 rounded-full",
                  adminOnline ? "bg-green-500 animate-pulse" : "bg-muted-foreground/40"
                )} />
                <span className="text-[10px] text-muted-foreground">
                  {adminOnline ? "Online" : "Offline"}
                </span>
              </div>
            </div>
            <span className="text-[11px] font-medium text-primary/80">
              {isAdminTyping ? "Flexpay is Typing..." : `${request.current_wallet_type} → ${request.requested_wallet_type}`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1">
            <Globe className="h-3 w-3 text-accent" />
            <span className="text-[10px] font-medium text-accent uppercase">{lang}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 relative" ref={scrollAreaRef}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.02)_0%,transparent_70%)]" />
        <div className="relative px-4 py-3 space-y-3">
          {/* Bot messages */}
          {botMessages.map((msg) => {
            if (msg.type === "system") {
              return (
                <div key={msg.id} className="flex justify-center">
                  <div className="rounded-full bg-muted px-4 py-1.5">
                    <p className="text-[11px] text-muted-foreground text-center">{msg.content}</p>
                    <p className="text-[9px] text-muted-foreground/60 text-center mt-0.5">{formatFullTimestamp(msg.timestamp)}</p>
                  </div>
                </div>
              );
            }

            const isUser = msg.type === "user";
            const isAnswered = answeredMessages.has(msg.id);

            return (
              <div key={msg.id}>
                <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                    isUser
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  )}>
                    {!isUser && <p className="text-[10px] font-semibold text-primary mb-1">🤖 FlexPay Bot</p>}
                    {msg.content && <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>}
                    <div className={cn("flex items-center gap-1 mt-1", isUser ? "justify-end" : "")}>
                      <p className={cn("text-[9px]", isUser ? "text-primary-foreground/50" : "text-muted-foreground/60")}>
                        {formatFullTimestamp(msg.timestamp)}
                      </p>
                      <MessageStatus isOwn={isUser} isRead={true} />
                    </div>
                  </div>
                </div>

                {/* Option buttons */}
                {msg.options && msg.options.length > 0 && (
                  <div className="mt-2 ml-2 space-y-1.5">
                    {msg.options.map((opt) => {
                      const isSelected = msg.selectedOption === opt.key;
                      const isDisabled = isAnswered;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => handleOptionSelect(opt.key, msg.id)}
                          disabled={isDisabled}
                          className={cn(
                            "block w-full max-w-[85%] text-left rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-md"
                              : isDisabled
                                ? "bg-muted/50 text-muted-foreground border-border/30 opacity-60 cursor-not-allowed"
                                : "bg-background text-foreground border-primary/20 hover:bg-primary/5 hover:border-primary/40 hover:shadow-sm active:scale-[0.98]"
                          )}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing indicator for bot */}
          {isTyping && <TypingAnimation />}

          {/* Admin typing indicator */}
          {isAdminTyping && !isTyping && (
            <TypingAnimation label="Flexpay" />
          )}

          {/* Realtime messages (admin + freelancer) in chronological order */}
          {allRealtimeMessages.map((msg) => {
            const isMine = msg.sender_id === profile?.id;
            return (
              <div key={`rt-${msg.id}`} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                  isMine
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                )}>
                  {!isMine && <p className="text-[10px] font-semibold text-primary mb-1">Flexpay</p>}
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <div className={cn("flex items-center gap-1 mt-1", isMine ? "justify-end" : "")}>
                    <p className={cn("text-[9px]", isMine ? "text-primary-foreground/50" : "text-muted-foreground/60")}>
                      {formatFullTimestamp(new Date(msg.created_at))}
                    </p>
                    {isMine && <MessageStatus isOwn={true} isRead={msg.is_read} />}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* New Message indicator */}
      {hasNewMessage && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
          <Button
            size="sm"
            variant="secondary"
            className="rounded-full shadow-lg gap-1.5 text-xs"
            onClick={scrollToBottom}
          >
            <ChevronDown className="h-3.5 w-3.5" />
            New message
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="border-t bg-gradient-to-t from-background to-background/80">
        <div className="flex items-end gap-2 px-4 py-3">
          <div className="flex-1">
            <textarea
              ref={liveChatTextareaRef}
              placeholder="Type your message..."
              value={liveChatInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleLiveSend();
                }
              }}
              rows={1}
              className="flex min-h-[44px] max-h-[160px] w-full resize-none rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 text-sm leading-relaxed ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
            />
          </div>
          <Button
            size="icon"
            onClick={handleLiveSend}
            disabled={!liveChatInput.trim()}
            className="h-11 w-11 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-200 disabled:shadow-none disabled:opacity-40 shrink-0"
          >
            <Send className="h-4.5 w-4.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeChat;
