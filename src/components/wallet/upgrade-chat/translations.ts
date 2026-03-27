export type Lang = "en" | "hi" | "ml" | "ur" | "ar";

export interface TranslationSet {
  selectLanguage: string;
  langOptions: { key: string; label: string }[];
  confirmChange: string;
  confirmOptions: { key: string; label: string }[];
  upgradeMsg: (name: string, currentType: string, requestedType: string, price: string, features: string[]) => string;
  payOptions: (price: string) => { key: string; label: string }[];
  offlineMessage: string;
  adminLabel: string;
  appointmentIntro: string;
  selectDay: string;
  selectTime: string;
  bookingConfirmed: (day: string, date: string, time: string) => string;
  bookingCancelled: string;
  appointmentReminder: string;
  appointmentAutoCancel: string;
  appointmentConfirmedMsg: string;
  cancelBtn: string;
}

const langOptions = [
  { key: "en", label: "🇬🇧 English" },
  { key: "hi", label: "🇮🇳 हिन्दी (Hindi)" },
  { key: "ml", label: "🇮🇳 മലയാളം (Malayalam)" },
  { key: "ur", label: "🇵🇰 اردو (Urdu)" },
  { key: "ar", label: "🇸🇦 العربية (Arabic)" },
];

export const translations: Record<Lang, TranslationSet> = {
  en: {
    selectLanguage: "Welcome! 👋\n\nPlease select a language you are familiar with:",
    langOptions,
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
    offlineMessage: "⏳ All our agents are currently busy assisting other customers.\n\nKindly try again after some time.\nWe appreciate your understanding. 🙏",
    adminLabel: "Sajeer",
    appointmentIntro: "📅 Would you like to book an appointment with our team?\n\nPlease select a preferred day below:",
    selectDay: "Please select a preferred day:",
    selectTime: "Please select a preferred time slot:",
    bookingConfirmed: (day, date, time) =>
      `✅ Your appointment has been booked successfully.\n\n📋 Booking Details:\n📅 Day: ${day}\n📆 Date: ${date}\n🕐 Time: ${time}\n\nPlease be available at the scheduled time.\nThank you for your cooperation. 🙏`,
    bookingCancelled: "❌ Your booking process has been cancelled successfully.",
    appointmentReminder: "🔔 You have successfully booked an appointment.\nYour appointment time has started.\n\nTo keep your appointment active, please send a message such as 'Hi' or 'Hello' within the next 5 minutes.\n\nIf no message is received within 5 minutes, your appointment will be automatically cancelled.",
    appointmentAutoCancel: "⏰ Your appointment has been automatically cancelled due to no response.\n\nYou may book a new appointment at any time.",
    appointmentConfirmedMsg: "✅ Your appointment has been confirmed successfully.\nPlease stay available for your scheduled session.",
    cancelBtn: "❌ Cancel",
  },
  hi: {
    selectLanguage: "स्वागत है! 👋\n\nकृपया वह भाषा चुनें जिससे आप परिचित हैं:",
    langOptions,
    confirmChange: "क्या आप अपने वॉलेट का प्लान बदलना चाहते हैं?",
    confirmOptions: [
      { key: "yes", label: "✅ हाँ, मैं वॉलेट बदलना चाहता/चाहती हूँ" },
      { key: "no", label: "❌ नहीं, मैं वॉलेट नहीं बदलना चाहता/चाहती" },
      { key: "change_lang", label: "🌐 मैं भाषा बदलना चाहता/चाहती हूँ" },
    ],
    upgradeMsg: (name, currentType, requestedType, price, features) =>
      `📋 *वॉलेट अपग्रेड विवरण*\n\n👤 कर्मचारी: ${name}\n💼 वर्तमान वॉलेट: ${currentType}\n🎯 चयनित वॉलेट: ${requestedType}\n💰 वॉलेट मूल्य: ${price}\n\n✨ *विशेषताएँ:*\n${features.map(f => `  • ${f}`).join("\n")}\n\nकृपया अपग्रेड के लिए भुगतान पूरा करें। 🙏`,
    payOptions: (price) => [
      { key: "pay", label: `💳 भुगतान करें (${price})` },
      { key: "cancel", label: `❌ भुगतान रद्द करें (${price})` },
    ],
    offlineMessage: "⏳ हमारे सभी एजेंट वर्तमान में व्यस्त हैं।\n\nकृपया कुछ समय बाद पुनः प्रयास करें। 🙏",
    adminLabel: "Sajeer",
    appointmentIntro: "📅 क्या आप हमारी टीम के साथ अपॉइंटमेंट बुक करना चाहेंगे?\n\nकृपया नीचे एक दिन चुनें:",
    selectDay: "कृपया एक दिन चुनें:",
    selectTime: "कृपया एक समय स्लॉट चुनें:",
    bookingConfirmed: (day, date, time) =>
      `✅ आपका अपॉइंटमेंट सफलतापूर्वक बुक हो गया।\n\n📋 बुकिंग विवरण:\n📅 दिन: ${day}\n📆 तारीख: ${date}\n🕐 समय: ${time}\n\nकृपया निर्धारित समय पर उपलब्ध रहें। 🙏`,
    bookingCancelled: "❌ आपकी बुकिंग प्रक्रिया रद्द कर दी गई।",
    appointmentReminder: "🔔 आपका अपॉइंटमेंट शुरू हो गया है।\n\nकृपया 5 मिनट के भीतर 'Hi' या 'Hello' भेजें।",
    appointmentAutoCancel: "⏰ कोई प्रतिक्रिया न मिलने के कारण अपॉइंटमेंट रद्द हो गया।",
    appointmentConfirmedMsg: "✅ आपका अपॉइंटमेंट सफलतापूर्वक पुष्टि हो गया।",
    cancelBtn: "❌ रद्द करें",
  },
  ml: {
    selectLanguage: "സ്വാഗതം! 👋\n\nദയവായി നിങ്ങൾക്ക് പരിചയമുള്ള ഒരു ഭാഷ തിരഞ്ഞെടുക്കുക:",
    langOptions,
    confirmChange: "നിങ്ങളുടെ വാലറ്റിന്റെ പ്ലാൻ മാറ്റാൻ ആഗ്രഹിക്കുന്നുണ്ടോ?",
    confirmOptions: [
      { key: "yes", label: "✅ അതെ, ഞാൻ വാലറ്റ് മാറ്റാൻ ആഗ്രഹിക്കുന്നു" },
      { key: "no", label: "❌ ഇല്ല, ഞാൻ വാലറ്റ് മാറ്റാൻ ആഗ്രഹിക്കുന്നില്ല" },
      { key: "change_lang", label: "🌐 ഭാഷ മാറ്റാൻ ഞാൻ ആഗ്രഹിക്കുന്നു" },
    ],
    upgradeMsg: (name, currentType, requestedType, price, features) =>
      `📋 *വാലറ്റ് അപ്‌ഗ്രേഡ് വിവരങ്ങൾ*\n\n👤 ജീവനക്കാരൻ: ${name}\n💼 നിലവിലെ വാലറ്റ്: ${currentType}\n🎯 തിരഞ്ഞെടുത്ത വാലറ്റ്: ${requestedType}\n💰 വാലറ്റ് വില: ${price}\n\n✨ *ഫീച്ചറുകൾ:*\n${features.map(f => `  • ${f}`).join("\n")}\n\nദയവായി പേയ്‌മെന്റ് പൂർത്തിയാക്കുക. 🙏`,
    payOptions: (price) => [
      { key: "pay", label: `💳 പേയ് ചെയ്യുക (${price})` },
      { key: "cancel", label: `❌ പേയ് റദ്ദാക്കുക (${price})` },
    ],
    offlineMessage: "⏳ ഞങ്ങളുടെ എല്ലാ ഏജന്റുമാരും ഇപ്പോൾ തിരക്കിലാണ്.\n\nദയവായി കുറച്ച് സമയത്തിന് ശേഷം ശ്രമിക്കുക. 🙏",
    adminLabel: "Sajeer",
    appointmentIntro: "📅 ഞങ്ങളുടെ ടീമുമായി ഒരു അപ്പോയിന്റ്‌മെന്റ് ബുക്ക് ചെയ്യാൻ ആഗ്രഹിക്കുന്നുണ്ടോ?",
    selectDay: "ദയവായി ഒരു ദിവസം തിരഞ്ഞെടുക്കുക:",
    selectTime: "ദയവായി ഒരു സമയ സ്ലോട്ട് തിരഞ്ഞെടുക്കുക:",
    bookingConfirmed: (day, date, time) =>
      `✅ നിങ്ങളുടെ അപ്പോയിന്റ്‌മെന്റ് ബുക്ക് ചെയ്തു.\n\n📅 ദിവസം: ${day}\n📆 തീയതി: ${date}\n🕐 സമയം: ${time}\n\nനിർദ്ദിഷ്ട സമയത്ത് ലഭ്യമായിരിക്കുക. 🙏`,
    bookingCancelled: "❌ നിങ്ങളുടെ ബുക്കിംഗ് റദ്ദാക്കി.",
    appointmentReminder: "🔔 നിങ്ങളുടെ അപ്പോയിന്റ്‌മെന്റ് സമയം ആരംഭിച്ചു.\n\n5 മിനിറ്റിനുള്ളിൽ 'Hi' അയക്കുക.",
    appointmentAutoCancel: "⏰ പ്രതികരണമില്ലാത്തതിനാൽ അപ്പോയിന്റ്‌മെന്റ് റദ്ദാക്കി.",
    appointmentConfirmedMsg: "✅ നിങ്ങളുടെ അപ്പോയിന്റ്‌മെന്റ് സ്ഥിരീകരിച്ചു.",
    cancelBtn: "❌ റദ്ദാക്കുക",
  },
  ur: {
    selectLanguage: "خوش آمدید! 👋\n\nبراہ کرم وہ زبان منتخب کریں جس سے آپ واقف ہیں:",
    langOptions,
    confirmChange: "کیا آپ اپنے والٹ کا پلان تبدیل کرنا چاہتے ہیں؟",
    confirmOptions: [
      { key: "yes", label: "✅ ہاں، میں والٹ تبدیل کرنا چاہتا ہوں" },
      { key: "no", label: "❌ نہیں، میں والٹ تبدیل نہیں کرنا چاہتا" },
      { key: "change_lang", label: "🌐 میں زبان تبدیل کرنا چاہتا ہوں" },
    ],
    upgradeMsg: (name, currentType, requestedType, price, features) =>
      `📋 *والٹ اپ گریڈ تفصیلات*\n\n👤 ملازم: ${name}\n💼 موجودہ والٹ: ${currentType}\n🎯 منتخب والٹ: ${requestedType}\n💰 والٹ قیمت: ${price}\n\n✨ *خصوصیات:*\n${features.map(f => `  • ${f}`).join("\n")}\n\nبراہ کرم ادائیگی مکمل کریں۔ 🙏`,
    payOptions: (price) => [
      { key: "pay", label: `💳 ادائیگی کریں (${price})` },
      { key: "cancel", label: `❌ ادائیگی منسوخ کریں (${price})` },
    ],
    offlineMessage: "⏳ ہمارے تمام ایجنٹ مصروف ہیں۔\n\nبراہ کرم بعد میں کوشش کریں۔ 🙏",
    adminLabel: "Sajeer",
    appointmentIntro: "📅 کیا آپ ہماری ٹیم کے ساتھ ملاقات بک کرنا چاہیں گے؟",
    selectDay: "براہ کرم ایک دن منتخب کریں:",
    selectTime: "براہ کرم ایک وقت منتخب کریں:",
    bookingConfirmed: (day, date, time) =>
      `✅ آپ کی ملاقات بک ہو گئی۔\n\n📅 دن: ${day}\n📆 تاریخ: ${date}\n🕐 وقت: ${time}\n\nمقررہ وقت پر دستیاب رہیں۔ 🙏`,
    bookingCancelled: "❌ آپ کی بکنگ منسوخ ہو گئی۔",
    appointmentReminder: "🔔 آپ کی ملاقات کا وقت شروع ہو گیا۔\n\n5 منٹ میں 'Hi' بھیجیں۔",
    appointmentAutoCancel: "⏰ جواب نہ ملنے کی وجہ سے ملاقات منسوخ ہو گئی۔",
    appointmentConfirmedMsg: "✅ آپ کی ملاقات کی تصدیق ہو گئی۔",
    cancelBtn: "❌ منسوخ کریں",
  },
  ar: {
    selectLanguage: "مرحباً! 👋\n\nيرجى اختيار اللغة التي تعرفها:",
    langOptions,
    confirmChange: "هل تريد تغيير خطة محفظتك؟",
    confirmOptions: [
      { key: "yes", label: "✅ نعم، أريد تغيير المحفظة" },
      { key: "no", label: "❌ لا، لا أريد تبديل المحافظ" },
      { key: "change_lang", label: "🌐 أريد تغيير اللغة" },
    ],
    upgradeMsg: (name, currentType, requestedType, price, features) =>
      `📋 *تفاصيل ترقية المحفظة*\n\n👤 الموظف: ${name}\n💼 المحفظة الحالية: ${currentType}\n🎯 المحفظة المختارة: ${requestedType}\n💰 السعر: ${price}\n\n✨ *الميزات:*\n${features.map(f => `  • ${f}`).join("\n")}\n\nيرجى إتمام الدفع. 🙏`,
    payOptions: (price) => [
      { key: "pay", label: `💳 ادفع (${price})` },
      { key: "cancel", label: `❌ إلغاء (${price})` },
    ],
    offlineMessage: "⏳ جميع وكلائنا مشغولون حالياً.\n\nيرجى المحاولة لاحقاً. 🙏",
    adminLabel: "Sajeer",
    appointmentIntro: "📅 هل تود حجز موعد مع فريقنا؟",
    selectDay: "يرجى اختيار يوم:",
    selectTime: "يرجى اختيار وقت:",
    bookingConfirmed: (day, date, time) =>
      `✅ تم حجز موعدك بنجاح.\n\n📅 اليوم: ${day}\n📆 التاريخ: ${date}\n🕐 الوقت: ${time}\n\nيرجى التواجد في الوقت المحدد. 🙏`,
    bookingCancelled: "❌ تم إلغاء عملية الحجز.",
    appointmentReminder: "🔔 بدأ وقت موعدك.\n\nأرسل 'Hi' خلال 5 دقائق.",
    appointmentAutoCancel: "⏰ تم إلغاء الموعد تلقائياً لعدم الاستجابة.",
    appointmentConfirmedMsg: "✅ تم تأكيد موعدك بنجاح.",
    cancelBtn: "❌ إلغاء",
  },
};
