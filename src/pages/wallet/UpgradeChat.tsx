import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useUpgradeChat } from "@/hooks/use-upgrade-chat";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type Lang = "en" | "hi" | "ml" | "ur" | "ar";
type ChatStep = "language" | "confirm" | "details" | "payment" | "waiting" | "admin_offline" | "live_chat";

interface BotMessage {
  id: string;
  content: string;
  type: "bot" | "user" | "system";
  options?: { key: string; label: string }[];
  timestamp: Date;
}

const translations: Record<Lang, {
  selectLanguage: string;
  langOptions: { key: string; label: string }[];
  confirmChange: string;
  confirmOptions: { key: string; label: string }[];
  upgradeMsg: (name: string, currentType: string, requestedType: string, price: string, features: string[]) => string;
  payOptions: (price: string) => { key: string; label: string }[];
  requestReceived: string;
  agentsBusy: string;
  adminLabel: string;
}> = {
  en: {
    selectLanguage: "Welcome! 👋\n\nPlease select a language you are familiar with:",
    langOptions: [
      { key: "en", label: "🇬🇧 English" },
      { key: "hi", label: "🇮🇳 हिन्दी (Hindi)" },
      { key: "ml", label: "🇮🇳 മലയാളം (Malayalam)" },
      { key: "ur", label: "🇵🇰 اردو (Urdu)" },
      { key: "ar", label: "🇸🇦 العربية (Arabic)" },
    ],
    confirmChange: "Do you want to change the plan for your wallet?",
    confirmOptions: [
      { key: "yes", label: "✅ Yes, I want to change wallet" },
      { key: "no", label: "❌ No, I don't want to switch wallets" },
      { key: "change_lang", label: "🌐 I want to change language" },
    ],
    upgradeMsg: (name, currentType, requestedType, price, features) =>
      `📋 *Wallet Upgrade Details*\n\n👤 Employee: ${name}\n💼 Current Wallet: ${currentType}\n🎯 Selected Wallet: ${requestedType}\n💰 Wallet Price: ${price}\n\n✨ *Features:*\n${features.map(f => `  • ${f}`).join("\n")}\n\n---\n\nDear ${name},\n\nTo upgrade your wallet plan, a payment is required.\nThe wallet plan you have selected is *${requestedType}*.\nThe price of this wallet plan is *${price}*.\nTherefore, the total amount you need to pay for the upgrade is *${price}*.\n\nKindly complete the payment to proceed with the upgrade.\nThank you for your cooperation. 🙏`,
    payOptions: (price) => [
      { key: "pay", label: `💳 Pay (${price})` },
      { key: "cancel", label: `❌ Cancel Pay (${price})` },
    ],
    requestReceived: "✅ Your request has been received successfully.\n\nKindly wait for a few minutes while we review your request.\nOur team will get back to you soon. 🙏",
    agentsBusy: "⏳ All our agents are currently busy assisting other customers.\n\nKindly try again after some time.\nWe appreciate your understanding. 🙏",
    adminLabel: "Admin",
  },
  hi: {
    selectLanguage: "स्वागत है! 👋\n\nकृपया वह भाषा चुनें जिससे आप परिचित हैं:",
    langOptions: [
      { key: "en", label: "🇬🇧 English" },
      { key: "hi", label: "🇮🇳 हिन्दी (Hindi)" },
      { key: "ml", label: "🇮🇳 മലయാളം (Malayalam)" },
      { key: "ur", label: "🇵🇰 اردو (Urdu)" },
      { key: "ar", label: "🇸🇦 العربية (Arabic)" },
    ],
    confirmChange: "क्या आप अपने वॉलेट का प्लान बदलना चाहते हैं?",
    confirmOptions: [
      { key: "yes", label: "✅ हाँ, मैं वॉलेट बदलना चाहता/चाहती हूँ" },
      { key: "no", label: "❌ नहीं, मैं वॉलेट नहीं बदलना चाहता/चाहती" },
      { key: "change_lang", label: "🌐 मैं भाषा बदलना चाहता/चाहती हूँ" },
    ],
    upgradeMsg: (name, currentType, requestedType, price, features) =>
      `📋 *वॉलेट अपग्रेड विवरण*\n\n👤 कर्मचारी: ${name}\n💼 वर्तमान वॉलेट: ${currentType}\n🎯 चयनित वॉलेट: ${requestedType}\n💰 वॉलेट मूल्य: ${price}\n\n✨ *विशेषताएँ:*\n${features.map(f => `  • ${f}`).join("\n")}\n\n---\n\nप्रिय ${name},\n\nआपके वॉलेट प्लान को अपग्रेड करने के लिए भुगतान आवश्यक है।\nआपने जो वॉलेट प्लान चुना है वह *${requestedType}* है।\nइस वॉलेट प्लान की कीमत *${price}* है।\nइसलिए, अपग्रेड के लिए आपको कुल *${price}* का भुगतान करना होगा।\n\nकृपया अपग्रेड के लिए भुगतान पूरा करें।\nआपके सहयोग के लिए धन्यवाद। 🙏`,
    payOptions: (price) => [
      { key: "pay", label: `💳 भुगतान करें (${price})` },
      { key: "cancel", label: `❌ भुगतान रद्द करें (${price})` },
    ],
    requestReceived: "✅ आपका अनुरोध सफलतापूर्वक प्राप्त हो गया है।\n\nकृपया कुछ मिनट प्रतीक्षा करें जब तक हम आपके अनुरोध की समीक्षा करते हैं।\nहमारी टीम जल्द ही आपसे संपर्क करेगी। 🙏",
    agentsBusy: "⏳ हमारे सभी एजेंट वर्तमान में अन्य ग्राहकों की सहायता में व्यस्त हैं।\n\nकृपया कुछ समय बाद पुनः प्रयास करें।\nहम आपकी समझ की सराहना करते हैं। 🙏",
    adminLabel: "एडमिन",
  },
  ml: {
    selectLanguage: "സ്വാഗതം! 👋\n\nദയവായി നിങ്ങൾക്ക് പരിചയമുള്ള ഒരു ഭാഷ തിരഞ്ഞെടുക്കുക:",
    langOptions: [
      { key: "en", label: "🇬🇧 English" },
      { key: "hi", label: "🇮🇳 हिन्दी (Hindi)" },
      { key: "ml", label: "🇮🇳 മലയാളം (Malayalam)" },
      { key: "ur", label: "🇵🇰 اردو (Urdu)" },
      { key: "ar", label: "🇸🇦 العربية (Arabic)" },
    ],
    confirmChange: "നിങ്ങളുടെ വാലറ്റിന്റെ പ്ലാൻ മാറ്റാൻ ആഗ്രഹിക്കുന്നുണ്ടോ?",
    confirmOptions: [
      { key: "yes", label: "✅ അതെ, ഞാൻ വാലറ്റ് മാറ്റാൻ ആഗ്രഹിക്കുന്നു" },
      { key: "no", label: "❌ ഇല്ല, ഞാൻ വാലറ്റ് മാറ്റാൻ ആഗ്രഹിക്കുന്നില്ല" },
      { key: "change_lang", label: "🌐 ഭാഷ മാറ്റാൻ ഞാൻ ആഗ്രഹിക്കുന്നു" },
    ],
    upgradeMsg: (name, currentType, requestedType, price, features) =>
      `📋 *വാലറ്റ് അപ്‌ഗ്രേഡ് വിവരങ്ങൾ*\n\n👤 ജീവനക്കാരൻ: ${name}\n💼 നിലവിലെ വാലറ്റ്: ${currentType}\n🎯 തിരഞ്ഞെടുത്ത വാലറ്റ്: ${requestedType}\n💰 വാലറ്റ് വില: ${price}\n\n✨ *ഫീച്ചറുകൾ:*\n${features.map(f => `  • ${f}`).join("\n")}\n\n---\n\nപ്രിയ ${name},\n\nനിങ്ങളുടെ വാലറ്റ് പ്ലാൻ അപ്‌ഗ്രേഡ് ചെയ്യുന്നതിന് പേയ്‌മെന്റ് ആവശ്യമാണ്.\nനിങ്ങൾ തിരഞ്ഞെടുത്ത വാലറ്റ് പ്ലാൻ *${requestedType}* ആണ്.\nഈ വാലറ്റ് പ്ലാനിന്റെ വില *${price}* ആണ്.\nഅതിനാൽ, അപ്‌ഗ്രേഡിനായി നിങ്ങൾ അടയ്‌ക്കേണ്ട മൊത്തം തുക *${price}* ആണ്.\n\nദയവായി അപ്‌ഗ്രേഡ് തുടരാൻ പേയ്‌മെന്റ് പൂർത്തിയാക്കുക.\nനിങ്ങളുടെ സഹകരണത്തിന് നന്ദി. 🙏`,
    payOptions: (price) => [
      { key: "pay", label: `💳 പേയ് ചെയ്യുക (${price})` },
      { key: "cancel", label: `❌ പേയ് റദ്ദാക്കുക (${price})` },
    ],
    requestReceived: "✅ നിങ്ങളുടെ അഭ്യർത്ഥന വിജയകരമായി ലഭിച്ചു.\n\nഞങ്ങൾ നിങ്ങളുടെ അഭ്യർത്ഥന പരിശോധിക്കുന്നതിനിടയിൽ ദയവായി കുറച്ച് മിനിറ്റ് കാത്തിരിക്കുക.\nഞങ്ങളുടെ ടീം ഉടൻ നിങ്ങളെ ബന്ധപ്പെടും. 🙏",
    agentsBusy: "⏳ ഞങ്ങളുടെ എല്ലാ ഏജന്റുമാരും ഇപ്പോൾ മറ്റ് ഉപഭോക്താക്കളെ സഹായിക്കുന്നതിൽ തിരക്കിലാണ്.\n\nദയവായി കുറച്ച് സമയത്തിന് ശേഷം വീണ്ടും ശ്രമിക്കുക.\nനിങ്ങളുടെ ധാരണയെ ഞങ്ങൾ വിലമതിക്കുന്നു. 🙏",
    adminLabel: "അഡ്മിൻ",
  },
  ur: {
    selectLanguage: "خوش آمدید! 👋\n\nبراہ کرم وہ زبان منتخب کریں جس سے آپ واقف ہیں:",
    langOptions: [
      { key: "en", label: "🇬🇧 English" },
      { key: "hi", label: "🇮🇳 हिन्दी (Hindi)" },
      { key: "ml", label: "🇮🇳 മലయാളം (Malayalam)" },
      { key: "ur", label: "🇵🇰 اردو (Urdu)" },
      { key: "ar", label: "🇸🇦 العربية (Arabic)" },
    ],
    confirmChange: "کیا آپ اپنے والٹ کا پلان تبدیل کرنا چاہتے ہیں؟",
    confirmOptions: [
      { key: "yes", label: "✅ ہاں، میں والٹ تبدیل کرنا چاہتا/چاہتی ہوں" },
      { key: "no", label: "❌ نہیں، میں والٹ تبدیل نہیں کرنا چاہتا/چاہتی" },
      { key: "change_lang", label: "🌐 میں زبان تبدیل کرنا چاہتا/چاہتی ہوں" },
    ],
    upgradeMsg: (name, currentType, requestedType, price, features) =>
      `📋 *والٹ اپ گریڈ تفصیلات*\n\n👤 ملازم: ${name}\n💼 موجودہ والٹ: ${currentType}\n🎯 منتخب والٹ: ${requestedType}\n💰 والٹ قیمت: ${price}\n\n✨ *خصوصیات:*\n${features.map(f => `  • ${f}`).join("\n")}\n\n---\n\nعزیز ${name}،\n\nآپ کے والٹ پلان کو اپ گریڈ کرنے کے لیے ادائیگی ضروری ہے۔\nآپ نے جو والٹ پلان منتخب کیا ہے وہ *${requestedType}* ہے۔\nاس والٹ پلان کی قیمت *${price}* ہے۔\nلہذا، اپ گریڈ کے لیے آپ کو کل *${price}* ادا کرنا ہوگا۔\n\nبراہ کرم اپ گریڈ جاری رکھنے کے لیے ادائیگی مکمل کریں۔\nآپ کے تعاون کا شکریہ۔ 🙏`,
    payOptions: (price) => [
      { key: "pay", label: `💳 ادائیگی کریں (${price})` },
      { key: "cancel", label: `❌ ادائیگی منسوخ کریں (${price})` },
    ],
    requestReceived: "✅ آپ کی درخواست کامیابی سے موصول ہو گئی ہے۔\n\nبراہ کرم چند منٹ انتظار کریں جب تک ہم آپ کی درخواست کا جائزہ لیتے ہیں۔\nہماری ٹیم جلد آپ سے رابطہ کرے گی۔ 🙏",
    agentsBusy: "⏳ ہمارے تمام ایجنٹ اس وقت دوسرے صارفین کی مدد میں مصروف ہیں۔\n\nبراہ کرم کچھ وقت بعد دوبارہ کوشش کریں۔\nہم آپ کی سمجھ کی تعریف کرتے ہیں۔ 🙏",
    adminLabel: "ایڈمن",
  },
  ar: {
    selectLanguage: "مرحباً! 👋\n\nيرجى اختيار اللغة التي تعرفها:",
    langOptions: [
      { key: "en", label: "🇬🇧 English" },
      { key: "hi", label: "🇮🇳 हिन्दी (Hindi)" },
      { key: "ml", label: "🇮🇳 മലയാളം (Malayalam)" },
      { key: "ur", label: "🇵🇰 اردو (Urdu)" },
      { key: "ar", label: "🇸🇦 العربية (Arabic)" },
    ],
    confirmChange: "هل تريد تغيير خطة محفظتك؟",
    confirmOptions: [
      { key: "yes", label: "✅ نعم، أريد تغيير المحفظة" },
      { key: "no", label: "❌ لا، لا أريد تبديل المحافظ" },
      { key: "change_lang", label: "🌐 أريد تغيير اللغة" },
    ],
    upgradeMsg: (name, currentType, requestedType, price, features) =>
      `📋 *تفاصيل ترقية المحفظة*\n\n👤 الموظف: ${name}\n💼 المحفظة الحالية: ${currentType}\n🎯 المحفظة المختارة: ${requestedType}\n💰 سعر المحفظة: ${price}\n\n✨ *الميزات:*\n${features.map(f => `  • ${f}`).join("\n")}\n\n---\n\nعزيزي ${name}،\n\nلترقية خطة محفظتك، يلزم الدفع.\nخطة المحفظة التي اخترتها هي *${requestedType}*.\nسعر خطة المحفظة هذه هو *${price}*.\nلذلك، المبلغ الإجمالي الذي تحتاج لدفعه للترقية هو *${price}*.\n\nيرجى إتمام الدفع للمتابعة مع الترقية.\nشكراً لتعاونك. 🙏`,
    payOptions: (price) => [
      { key: "pay", label: `💳 ادفع (${price})` },
      { key: "cancel", label: `❌ إلغاء الدفع (${price})` },
    ],
    requestReceived: "✅ تم استلام طلبك بنجاح.\n\nيرجى الانتظار بضع دقائق بينما نراجع طلبك.\nسيتواصل معك فريقنا قريباً. 🙏",
    agentsBusy: "⏳ جميع وكلائنا مشغولون حالياً بمساعدة عملاء آخرين.\n\nيرجى المحاولة مرة أخرى بعد بعض الوقت.\nنقدر تفهمك. 🙏",
    adminLabel: "المسؤول",
  },
};

let msgIdCounter = 0;
const genId = () => `bot-${Date.now()}-${++msgIdCounter}`;

const UpgradeChat = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [lang, setLang] = useState<Lang>("en");
  const [step, setStep] = useState<ChatStep>("language");
  const [botMessages, setBotMessages] = useState<BotMessage[]>([]);
  const [walletDetails, setWalletDetails] = useState<any>(null);

  // Fetch upgrade request
  const { data: request, isLoading: loadingRequest } = useQuery({
    queryKey: ["upgrade-request-detail", requestId],
    queryFn: async () => {
      if (!requestId) return null;
      const { data, error } = await supabase
        .from("wallet_upgrade_requests")
        .select("*")
        .eq("id", requestId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!requestId,
  });

  // Fetch requested wallet type details
  const { data: requestedWallet } = useQuery({
    queryKey: ["wallet-type-detail", request?.requested_wallet_type],
    queryFn: async () => {
      if (!request?.requested_wallet_type) return null;
      const { data, error } = await supabase
        .from("wallet_types")
        .select("*")
        .eq("name", request.requested_wallet_type)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!request?.requested_wallet_type,
  });

  // Real-time chat for admin messages (live_chat step)
  const { messages: realtimeMessages, isLoading: loadingMessages, sendMessage } = useUpgradeChat(
    step === "live_chat" ? requestId : undefined
  );

  // Check admin online status
  const checkAdminOnline = useCallback(async (): Promise<boolean> => {
    // Get admin user IDs from user_roles, then check last_seen_at
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    if (!adminRoles || adminRoles.length === 0) return false;
    const adminUserIds = adminRoles.map((r: any) => r.user_id);
    const { data } = await supabase
      .from("profiles")
      .select("last_seen_at")
      .in("user_id", adminUserIds)
      .order("last_seen_at", { ascending: false })
      .limit(1);
    if (data && data.length > 0 && data[0].last_seen_at) {
      const lastSeen = new Date(data[0].last_seen_at);
      const diff = Date.now() - lastSeen.getTime();
      return diff < 5 * 60 * 1000; // 5 minutes
    }
    return false;
  }, []);

  const addBotMessage = useCallback((content: string, options?: { key: string; label: string }[]) => {
    setBotMessages(prev => [...prev, {
      id: genId(),
      content,
      type: "bot",
      options,
      timestamp: new Date(),
    }]);
  }, []);

  const addUserMessage = useCallback((content: string) => {
    setBotMessages(prev => [...prev, {
      id: genId(),
      content,
      type: "user",
      timestamp: new Date(),
    }]);
  }, []);

  const addSystemMessage = useCallback((content: string) => {
    setBotMessages(prev => [...prev, {
      id: genId(),
      content,
      type: "system",
      timestamp: new Date(),
    }]);
  }, []);

  // Initialize with language selection
  useEffect(() => {
    if (botMessages.length === 0) {
      const t = translations.en;
      addBotMessage(t.selectLanguage, t.langOptions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom
  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [botMessages, realtimeMessages]);

  const resetToLanguage = useCallback(() => {
    setBotMessages([]);
    setStep("language");
    setTimeout(() => {
      const t = translations.en;
      addBotMessage(t.selectLanguage, t.langOptions);
    }, 300);
  }, [addBotMessage]);

  const handleOptionSelect = useCallback(async (optionKey: string) => {
    const t = translations[lang];

    switch (step) {
      case "language": {
        const selectedLang = optionKey as Lang;
        const langLabel = translations.en.langOptions.find(o => o.key === optionKey)?.label || optionKey;
        addUserMessage(langLabel);
        setLang(selectedLang);
        const newT = translations[selectedLang];
        setStep("confirm");
        setTimeout(() => {
          addBotMessage(newT.confirmChange, newT.confirmOptions);
        }, 500);
        break;
      }

      case "confirm": {
        const selectedLabel = t.confirmOptions.find(o => o.key === optionKey)?.label || optionKey;
        addUserMessage(selectedLabel);

        if (optionKey === "no" || optionKey === "change_lang") {
          setTimeout(() => resetToLanguage(), 800);
        } else if (optionKey === "yes") {
          setStep("details");
          setTimeout(() => {
            if (!request || !requestedWallet) {
              addBotMessage("Unable to load wallet details. Please try again.");
              return;
            }
            const employeeName = profile?.full_name?.join(" ") || "Employee";
            const price = requestedWallet.wallet_price || "N/A";
            const features = (requestedWallet.perks as string[]) || [];
            const msg = t.upgradeMsg(
              employeeName,
              request.current_wallet_type,
              request.requested_wallet_type,
              price,
              features
            );
            addBotMessage(msg);

            setTimeout(() => {
              setStep("payment");
              addBotMessage("", t.payOptions(price));
            }, 800);
          }, 500);
        }
        break;
      }

      case "payment": {
        const price = requestedWallet?.wallet_price || "N/A";
        const selectedLabel = t.payOptions(price).find(o => o.key === optionKey)?.label || optionKey;
        addUserMessage(selectedLabel);

        if (optionKey === "cancel") {
          setTimeout(() => resetToLanguage(), 800);
        } else if (optionKey === "pay") {
          setStep("waiting");
          
          // Send notification to admin
          try {
            const employeeName = profile?.full_name?.join(" ") || "Employee";
            // Insert a notification for admin users
            const { data: adminProfiles } = await supabase
              .from("user_roles")
              .select("user_id")
              .eq("role", "admin");

            if (adminProfiles && adminProfiles.length > 0) {
              const notifications = adminProfiles.map((ap: any) => ({
                user_id: ap.user_id,
                title: "Wallet Upgrade Payment",
                message: `${employeeName} wants to pay for wallet upgrade to ${request?.requested_wallet_type}.`,
                type: "info",
                reference_id: requestId,
                reference_type: "wallet_upgrade",
              }));
              await supabase.from("notifications").insert(notifications);
            }
          } catch (err) {
            console.error("Failed to send admin notification:", err);
          }

          // Check admin online status
          setTimeout(async () => {
            const isOnline = await checkAdminOnline();
            if (isOnline) {
              addBotMessage(t.requestReceived);
              // Send initial message to DB for admin to see
              try {
                const employeeName = profile?.full_name?.join(" ") || "Employee";
                await sendMessage(`[Payment Request] ${employeeName} wants to pay for wallet upgrade to ${request?.requested_wallet_type}. Price: ${requestedWallet?.wallet_price || "N/A"}`);
              } catch (err) {
                console.error("Failed to send chat message:", err);
              }
              setTimeout(() => {
                setStep("live_chat");
                addSystemMessage("You are now connected with an admin. You can chat below.");
              }, 1000);
            } else {
              addBotMessage(t.agentsBusy);
              setTimeout(() => resetToLanguage(), 3000);
            }
          }, 1000);
        }
        break;
      }

      default:
        break;
    }
  }, [lang, step, request, requestedWallet, profile, addBotMessage, addUserMessage, addSystemMessage, resetToLanguage, checkAdminOnline, sendMessage, requestId]);

  // Live chat send
  const [liveChatInput, setLiveChatInput] = useState("");
  const liveChatTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = liveChatTextareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [liveChatInput]);

  const handleLiveSend = async () => {
    const content = liveChatInput.trim();
    if (!content) return;
    try {
      await sendMessage(content);
      setLiveChatInput("");
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-xl hover:bg-background/60"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-foreground">Wallet Upgrade</h2>
            <span className="text-[11px] font-medium text-primary/80">
              {request.current_wallet_type} → {request.requested_wallet_type}
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1">
            <Globe className="h-3 w-3 text-accent" />
            <span className="text-[10px] font-medium text-accent uppercase">{lang}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.02)_0%,transparent_70%)]" />
        <div className="relative px-4 py-3 space-y-3">
          {/* Bot conversation */}
          {botMessages.map((msg) => {
            if (msg.type === "system") {
              return (
                <div key={msg.id} className="flex justify-center">
                  <div className="rounded-full bg-muted px-4 py-1.5">
                    <p className="text-[11px] text-muted-foreground text-center">{msg.content}</p>
                  </div>
                </div>
              );
            }

            const isUser = msg.type === "user";
            return (
              <div key={msg.id}>
                <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                      isUser
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    )}
                  >
                    {!isUser && (
                      <p className="text-[10px] font-semibold text-primary mb-1">🤖 FlexPay Bot</p>
                    )}
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                    <p className={cn("text-[10px] mt-1", isUser ? "text-primary-foreground/60" : "text-muted-foreground")}>
                      {format(msg.timestamp, "hh:mm a")}
                    </p>
                  </div>
                </div>
                {/* Option buttons */}
                {msg.options && msg.options.length > 0 && step !== "live_chat" && (
                  <div className="mt-2 ml-2 space-y-1.5">
                    {msg.options.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => handleOptionSelect(opt.key)}
                        className="block w-full max-w-[85%] text-left rounded-xl border border-primary/20 bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-primary/5 hover:border-primary/40 hover:shadow-sm active:scale-[0.98]"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Real-time messages in live_chat step */}
          {step === "live_chat" && realtimeMessages.map((msg) => {
            const isMine = msg.sender_id === profile?.id;
            return (
              <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                    isMine
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  )}
                >
                  {!isMine && (
                    <p className="text-[10px] font-semibold text-primary mb-1">
                      {translations[lang].adminLabel}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={cn("text-[10px] mt-1", isMine ? "text-primary-foreground/60" : "text-muted-foreground")}>
                    {format(new Date(msg.created_at), "hh:mm a")}
                  </p>
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input - only in live_chat step */}
      {step === "live_chat" && (
        <div className="border-t bg-gradient-to-t from-background to-background/80">
          <div className="flex items-end gap-2 px-4 py-3">
            <div className="flex-1">
              <textarea
                ref={liveChatTextareaRef}
                placeholder="Type your message..."
                value={liveChatInput}
                onChange={(e) => setLiveChatInput(e.target.value)}
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
      )}
    </div>
  );
};

export default UpgradeChat;
