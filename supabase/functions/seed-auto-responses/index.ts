import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const base = { is_enabled: true, typing_enabled: true, typing_duration_seconds: 10 };
  const langBtns = [
    {key:"en",label:"🇬🇧 English",next_step:"confirm",is_enabled:true},
    {key:"hi",label:"🇮🇳 हिन्दी (Hindi)",next_step:"confirm",is_enabled:true},
    {key:"ml",label:"🇮🇳 മലയാളം (Malayalam)",next_step:"confirm",is_enabled:true},
    {key:"ur",label:"🇵🇰 اردو (Urdu)",next_step:"confirm",is_enabled:true},
    {key:"ar",label:"🇸🇦 العربية (Arabic)",next_step:"confirm",is_enabled:true},
  ];

  const rows = [
    // language (en already exists)
    {...base, step_key:"language_hi", message_text:"स्वागत है! 👋\n\nकृपया वह भाषा चुनें जिससे आप परिचित हैं:", buttons:langBtns, display_order:0, trigger_type:"first_message", trigger_value:null, language:"hi"},
    {...base, step_key:"language_ml", message_text:"സ്വാഗതം! 👋\n\nദയവായി നിങ്ങൾക്ക് പരിചയമുള്ള ഒരു ഭാഷ തിരഞ്ഞെടുക്കുക:", buttons:langBtns, display_order:0, trigger_type:"first_message", trigger_value:null, language:"ml"},
    {...base, step_key:"language_ur", message_text:"خوش آمدید! 👋\n\nبراہ کرم وہ زبان منتخب کریں جس سے آپ واقف ہیں:", buttons:langBtns, display_order:0, trigger_type:"first_message", trigger_value:null, language:"ur"},
    {...base, step_key:"language_ar", message_text:"مرحباً! 👋\n\nيرجى اختيار اللغة التي تعرفها:", buttons:langBtns, display_order:0, trigger_type:"first_message", trigger_value:null, language:"ar"},

    // confirm
    {...base, step_key:"confirm_en", message_text:"Do you want to change the plan for your wallet?", buttons:[{key:"yes",label:"✅ Yes, I want to change wallet",next_step:"details",is_enabled:true},{key:"no",label:"❌ No, I don't want to switch wallets",next_step:"",is_enabled:true},{key:"change_lang",label:"🌐 I want to change language",next_step:"language",is_enabled:true}], display_order:1, trigger_type:"button_click", trigger_value:"language", language:"en"},
    {...base, step_key:"confirm_hi", message_text:"क्या आप अपने वॉलेट का प्लान बदलना चाहते हैं?", buttons:[{key:"yes",label:"✅ हाँ, मैं वॉलेट बदलना चाहता/चाहती हूँ",next_step:"details",is_enabled:true},{key:"no",label:"❌ नहीं, मैं वॉलेट नहीं बदलना चाहता/चाहती",next_step:"",is_enabled:true},{key:"change_lang",label:"🌐 मैं भाषा बदलना चाहता/चाहती हूँ",next_step:"language",is_enabled:true}], display_order:1, trigger_type:"button_click", trigger_value:"language", language:"hi"},
    {...base, step_key:"confirm_ml", message_text:"നിങ്ങളുടെ വാലറ്റിന്റെ പ്ലാൻ മാറ്റാൻ ആഗ്രഹിക്കുന്നുണ്ടോ?", buttons:[{key:"yes",label:"✅ അതെ, ഞാൻ വാലറ്റ് മാറ്റാൻ ആഗ്രഹിക്കുന്നു",next_step:"details",is_enabled:true},{key:"no",label:"❌ ഇല്ല, ഞാൻ വാലറ്റ് മാറ്റാൻ ആഗ്രഹിക്കുന്നില്ല",next_step:"",is_enabled:true},{key:"change_lang",label:"🌐 ഭാഷ മാറ്റാൻ ഞാൻ ആഗ്രഹിക്കുന്നു",next_step:"language",is_enabled:true}], display_order:1, trigger_type:"button_click", trigger_value:"language", language:"ml"},
    {...base, step_key:"confirm_ur", message_text:"کیا آپ اپنے والٹ کا پلان تبدیل کرنا چاہتے ہیں؟", buttons:[{key:"yes",label:"✅ ہاں، میں والٹ تبدیل کرنا چاہتا ہوں",next_step:"details",is_enabled:true},{key:"no",label:"❌ نہیں، میں والٹ تبدیل نہیں کرنا چاہتا",next_step:"",is_enabled:true},{key:"change_lang",label:"🌐 میں زبان تبدیل کرنا چاہتا ہوں",next_step:"language",is_enabled:true}], display_order:1, trigger_type:"button_click", trigger_value:"language", language:"ur"},
    {...base, step_key:"confirm_ar", message_text:"هل تريد تغيير خطة محفظتك؟", buttons:[{key:"yes",label:"✅ نعم، أريد تغيير المحفظة",next_step:"details",is_enabled:true},{key:"no",label:"❌ لا، لا أريد تبديل المحافظ",next_step:"",is_enabled:true},{key:"change_lang",label:"🌐 أريد تغيير اللغة",next_step:"language",is_enabled:true}], display_order:1, trigger_type:"button_click", trigger_value:"language", language:"ar"},

    // details
    {...base, step_key:"details_en", message_text:"📋 *Wallet Upgrade Details*\n\n👤 Employee: {{employee_name}}\n💼 Current Wallet: {{current_wallet}}\n🎯 Selected Wallet: {{requested_wallet}}\n💰 Wallet Price: {{price}}\n\n✨ *Features:*\n{{features}}\n\n---\n\nDear {{employee_name}},\n\nTo upgrade your wallet plan, a payment is required.\nThe wallet plan you have selected is *{{requested_wallet}}*.\nThe price of this wallet plan is *{{price}}*.\nTherefore, the total amount you need to pay for the upgrade is *{{price}}*.\n\nKindly complete the payment to proceed with the upgrade.\nThank you for your cooperation. 🙏", buttons:[], display_order:2, trigger_type:"button_click", trigger_value:"confirm", language:"en"},
    {...base, step_key:"details_hi", message_text:"📋 *वॉलेट अपग्रेड विवरण*\n\n👤 कर्मचारी: {{employee_name}}\n💼 वर्तमान वॉलेट: {{current_wallet}}\n🎯 चयनित वॉलेट: {{requested_wallet}}\n💰 वॉलेट मूल्य: {{price}}\n\n✨ *विशेषताएँ:*\n{{features}}\n\nकृपया अपग्रेड के लिए भुगतान पूरा करें। 🙏", buttons:[], display_order:2, trigger_type:"button_click", trigger_value:"confirm", language:"hi"},
    {...base, step_key:"details_ml", message_text:"📋 *വാലറ്റ് അപ്‌ഗ്രേഡ് വിവരങ്ങൾ*\n\n👤 ജീവനക്കാരൻ: {{employee_name}}\n💼 നിലവിലെ വാലറ്റ്: {{current_wallet}}\n🎯 തിരഞ്ഞെടുത്ത വാലറ്റ്: {{requested_wallet}}\n💰 വാലറ്റ് വില: {{price}}\n\n✨ *ഫീച്ചറുകൾ:*\n{{features}}\n\nദയവായി പേയ്‌മെന്റ് പൂർത്തിയാക്കുക. 🙏", buttons:[], display_order:2, trigger_type:"button_click", trigger_value:"confirm", language:"ml"},
    {...base, step_key:"details_ur", message_text:"📋 *والٹ اپ گریڈ تفصیلات*\n\n👤 ملازم: {{employee_name}}\n💼 موجودہ والٹ: {{current_wallet}}\n🎯 منتخب والٹ: {{requested_wallet}}\n💰 والٹ قیمت: {{price}}\n\n✨ *خصوصیات:*\n{{features}}\n\nبراہ کرم ادائیگی مکمل کریں۔ 🙏", buttons:[], display_order:2, trigger_type:"button_click", trigger_value:"confirm", language:"ur"},
    {...base, step_key:"details_ar", message_text:"📋 *تفاصيل ترقية المحفظة*\n\n👤 الموظف: {{employee_name}}\n💼 المحفظة الحالية: {{current_wallet}}\n🎯 المحفظة المختارة: {{requested_wallet}}\n💰 السعر: {{price}}\n\n✨ *الميزات:*\n{{features}}\n\nيرجى إتمام الدفع. 🙏", buttons:[], display_order:2, trigger_type:"button_click", trigger_value:"confirm", language:"ar"},

    // payment
    {...base, step_key:"payment_en", message_text:"", buttons:[{key:"pay",label:"💳 Pay ({{price}})",next_step:"waiting",is_enabled:true},{key:"cancel",label:"❌ Cancel Pay ({{price}})",next_step:"",is_enabled:true}], display_order:3, trigger_type:"button_click", trigger_value:"details", language:"en"},
    {...base, step_key:"payment_hi", message_text:"", buttons:[{key:"pay",label:"💳 भुगतान करें ({{price}})",next_step:"waiting",is_enabled:true},{key:"cancel",label:"❌ भुगतान रद्द करें ({{price}})",next_step:"",is_enabled:true}], display_order:3, trigger_type:"button_click", trigger_value:"details", language:"hi"},
    {...base, step_key:"payment_ml", message_text:"", buttons:[{key:"pay",label:"💳 പേയ് ചെയ്യുക ({{price}})",next_step:"waiting",is_enabled:true},{key:"cancel",label:"❌ പേയ് റദ്ദാക്കുക ({{price}})",next_step:"",is_enabled:true}], display_order:3, trigger_type:"button_click", trigger_value:"details", language:"ml"},
    {...base, step_key:"payment_ur", message_text:"", buttons:[{key:"pay",label:"💳 ادائیگی کریں ({{price}})",next_step:"waiting",is_enabled:true},{key:"cancel",label:"❌ ادائیگی منسوخ کریں ({{price}})",next_step:"",is_enabled:true}], display_order:3, trigger_type:"button_click", trigger_value:"details", language:"ur"},
    {...base, step_key:"payment_ar", message_text:"", buttons:[{key:"pay",label:"💳 ادفع ({{price}})",next_step:"waiting",is_enabled:true},{key:"cancel",label:"❌ إلغاء ({{price}})",next_step:"",is_enabled:true}], display_order:3, trigger_type:"button_click", trigger_value:"details", language:"ar"},

    // offline
    {...base, step_key:"offline_message_en", message_text:"⏳ All our agents are currently busy assisting other customers.\n\nKindly try again after some time.\nWe appreciate your understanding. 🙏", buttons:[], display_order:4, trigger_type:"button_click", trigger_value:"payment", language:"en"},
    {...base, step_key:"offline_message_hi", message_text:"⏳ हमारे सभी एजेंट वर्तमान में व्यस्त हैं।\n\nकृपया कुछ समय बाद पुनः प्रयास करें। 🙏", buttons:[], display_order:4, trigger_type:"button_click", trigger_value:"payment", language:"hi"},
    {...base, step_key:"offline_message_ml", message_text:"⏳ ഞങ്ങളുടെ എല്ലാ ഏജന്റുമാരും ഇപ്പോൾ തിരക്കിലാണ്.\n\nദയവായി കുറച്ച് സമയത്തിന് ശേഷം ശ്രമിക്കുക. 🙏", buttons:[], display_order:4, trigger_type:"button_click", trigger_value:"payment", language:"ml"},
    {...base, step_key:"offline_message_ur", message_text:"⏳ ہمارے تمام ایجنٹ مصروف ہیں۔\n\nبراہ کرم بعد میں کوشش کریں۔ 🙏", buttons:[], display_order:4, trigger_type:"button_click", trigger_value:"payment", language:"ur"},
    {...base, step_key:"offline_message_ar", message_text:"⏳ جميع وكلائنا مشغولون حالياً.\n\nيرجى المحاولة لاحقاً. 🙏", buttons:[], display_order:4, trigger_type:"button_click", trigger_value:"payment", language:"ar"},

    // appointment_intro
    {...base, step_key:"appointment_intro_en", message_text:"📅 Would you like to book an appointment with our team?\n\nPlease select a preferred day below:", buttons:[], display_order:5, trigger_type:"button_click", trigger_value:"offline_message", language:"en"},
    {...base, step_key:"appointment_intro_hi", message_text:"📅 क्या आप हमारी टीम के साथ अपॉइंटमेंट बुक करना चाहेंगे?\n\nकृपया नीचे एक दिन चुनें:", buttons:[], display_order:5, trigger_type:"button_click", trigger_value:"offline_message", language:"hi"},
    {...base, step_key:"appointment_intro_ml", message_text:"📅 ഞങ്ങളുടെ ടീമുമായി ഒരു അപ്പോയിന്റ്‌മെന്റ് ബുക്ക് ചെയ്യാൻ ആഗ്രഹിക്കുന്നുണ്ടോ?", buttons:[], display_order:5, trigger_type:"button_click", trigger_value:"offline_message", language:"ml"},
    {...base, step_key:"appointment_intro_ur", message_text:"📅 کیا آپ ہماری ٹیم کے ساتھ ملاقات بک کرنا چاہیں گے؟", buttons:[], display_order:5, trigger_type:"button_click", trigger_value:"offline_message", language:"ur"},
    {...base, step_key:"appointment_intro_ar", message_text:"📅 هل تود حجز موعد مع فريقنا؟", buttons:[], display_order:5, trigger_type:"button_click", trigger_value:"offline_message", language:"ar"},

    // select_time
    {...base, step_key:"select_time_en", message_text:"Please select a preferred time slot:", buttons:[], display_order:6, trigger_type:"button_click", trigger_value:"appointment_intro", language:"en"},
    {...base, step_key:"select_time_hi", message_text:"कृपया एक समय स्लॉट चुनें:", buttons:[], display_order:6, trigger_type:"button_click", trigger_value:"appointment_intro", language:"hi"},
    {...base, step_key:"select_time_ml", message_text:"ദയവായി ഒരു സമയ സ്ലോട്ട് തിരഞ്ഞെടുക്കുക:", buttons:[], display_order:6, trigger_type:"button_click", trigger_value:"appointment_intro", language:"ml"},
    {...base, step_key:"select_time_ur", message_text:"براہ کرم ایک وقت منتخب کریں:", buttons:[], display_order:6, trigger_type:"button_click", trigger_value:"appointment_intro", language:"ur"},
    {...base, step_key:"select_time_ar", message_text:"يرجى اختيار وقت:", buttons:[], display_order:6, trigger_type:"button_click", trigger_value:"appointment_intro", language:"ar"},

    // booking_confirmed
    {...base, step_key:"booking_confirmed_en", message_text:"✅ Your appointment has been booked successfully.\n\n📋 Booking Details:\n📅 Day: {{day}}\n📆 Date: {{date}}\n🕐 Time: {{time}}\n\nPlease be available at the scheduled time.\nThank you for your cooperation. 🙏", buttons:[], display_order:7, trigger_type:"button_click", trigger_value:"select_time", language:"en"},
    {...base, step_key:"booking_confirmed_hi", message_text:"✅ आपका अपॉइंटमेंट सफलतापूर्वक बुक हो गया।\n\n📋 बुकिंग विवरण:\n📅 दिन: {{day}}\n📆 तारीख: {{date}}\n🕐 समय: {{time}}\n\nकृपया निर्धारित समय पर उपलब्ध रहें। 🙏", buttons:[], display_order:7, trigger_type:"button_click", trigger_value:"select_time", language:"hi"},
    {...base, step_key:"booking_confirmed_ml", message_text:"✅ നിങ്ങളുടെ അപ്പോയിന്റ്‌മെന്റ് ബുക്ക് ചെയ്തു.\n\n📅 ദിവസം: {{day}}\n📆 തീയതി: {{date}}\n🕐 സമയം: {{time}}\n\nനിർദ്ദിഷ്ട സമയത്ത് ലഭ്യമായിരിക്കുക. 🙏", buttons:[], display_order:7, trigger_type:"button_click", trigger_value:"select_time", language:"ml"},
    {...base, step_key:"booking_confirmed_ur", message_text:"✅ آپ کی ملاقات بک ہو گئی۔\n\n📅 دن: {{day}}\n📆 تاریخ: {{date}}\n🕐 وقت: {{time}}\n\nمقررہ وقت پر دستیاب رہیں۔ 🙏", buttons:[], display_order:7, trigger_type:"button_click", trigger_value:"select_time", language:"ur"},
    {...base, step_key:"booking_confirmed_ar", message_text:"✅ تم حجز موعدك بنجاح.\n\n📅 اليوم: {{day}}\n📆 التاريخ: {{date}}\n🕐 الوقت: {{time}}\n\nيرجى التواجد في الوقت المحدد. 🙏", buttons:[], display_order:7, trigger_type:"button_click", trigger_value:"select_time", language:"ar"},

    // booking_cancelled
    {...base, step_key:"booking_cancelled_en", message_text:"❌ Your booking process has been cancelled successfully.", buttons:[], display_order:8, trigger_type:"button_click", trigger_value:null, language:"en"},
    {...base, step_key:"booking_cancelled_hi", message_text:"❌ आपकी बुकिंग प्रक्रिया रद्द कर दी गई।", buttons:[], display_order:8, trigger_type:"button_click", trigger_value:null, language:"hi"},
    {...base, step_key:"booking_cancelled_ml", message_text:"❌ നിങ്ങളുടെ ബുക്കിംഗ് റദ്ദാക്കി.", buttons:[], display_order:8, trigger_type:"button_click", trigger_value:null, language:"ml"},
    {...base, step_key:"booking_cancelled_ur", message_text:"❌ آپ کی بکنگ منسوخ ہو گئی۔", buttons:[], display_order:8, trigger_type:"button_click", trigger_value:null, language:"ur"},
    {...base, step_key:"booking_cancelled_ar", message_text:"❌ تم إلغاء عملية الحجز.", buttons:[], display_order:8, trigger_type:"button_click", trigger_value:null, language:"ar"},

    // appointment_reminder
    {...base, step_key:"appointment_reminder_en", message_text:"🔔 You have successfully booked an appointment.\nYour appointment time has started.\n\nTo keep your appointment active, please send a message such as 'Hi' or 'Hello' within the next 5 minutes.\n\nIf no message is received within 5 minutes, your appointment will be automatically cancelled.", buttons:[], display_order:9, trigger_type:"time_based", trigger_value:null, language:"en"},
    {...base, step_key:"appointment_reminder_hi", message_text:"🔔 आपका अपॉइंटमेंट शुरू हो गया है।\n\nकृपया 5 मिनट के भीतर 'Hi' या 'Hello' भेजें।", buttons:[], display_order:9, trigger_type:"time_based", trigger_value:null, language:"hi"},
    {...base, step_key:"appointment_reminder_ml", message_text:"🔔 നിങ്ങളുടെ അപ്പോയിന്റ്‌മെന്റ് സമയം ആരംഭിച്ചു.\n\n5 മിനിറ്റിനുള്ളിൽ 'Hi' അയക്കുക.", buttons:[], display_order:9, trigger_type:"time_based", trigger_value:null, language:"ml"},
    {...base, step_key:"appointment_reminder_ur", message_text:"🔔 آپ کی ملاقات کا وقت شروع ہو گیا۔\n\n5 منٹ میں 'Hi' بھیجیں۔", buttons:[], display_order:9, trigger_type:"time_based", trigger_value:null, language:"ur"},
    {...base, step_key:"appointment_reminder_ar", message_text:"🔔 بدأ وقت موعدك.\n\nأرسل 'Hi' خلال 5 دقائق.", buttons:[], display_order:9, trigger_type:"time_based", trigger_value:null, language:"ar"},

    // appointment_auto_cancel
    {...base, step_key:"appointment_auto_cancel_en", message_text:"⏰ Your appointment has been automatically cancelled due to no response.\n\nYou may book a new appointment at any time.", buttons:[], display_order:10, trigger_type:"time_based", trigger_value:null, language:"en"},
    {...base, step_key:"appointment_auto_cancel_hi", message_text:"⏰ कोई प्रतिक्रिया न मिलने के कारण अपॉइंटमेंट रद्द हो गया।", buttons:[], display_order:10, trigger_type:"time_based", trigger_value:null, language:"hi"},
    {...base, step_key:"appointment_auto_cancel_ml", message_text:"⏰ പ്രതികരണമില്ലാത്തതിനാൽ അപ്പോയിന്റ്‌മെന്റ് റദ്ദാക്കി.", buttons:[], display_order:10, trigger_type:"time_based", trigger_value:null, language:"ml"},
    {...base, step_key:"appointment_auto_cancel_ur", message_text:"⏰ جواب نہ ملنے کی وجہ سے ملاقات منسوخ ہو گئی۔", buttons:[], display_order:10, trigger_type:"time_based", trigger_value:null, language:"ur"},
    {...base, step_key:"appointment_auto_cancel_ar", message_text:"⏰ تم إلغاء الموعد تلقائياً لعدم الاستجابة.", buttons:[], display_order:10, trigger_type:"time_based", trigger_value:null, language:"ar"},

    // appointment_confirmed
    {...base, step_key:"appointment_confirmed_en", message_text:"✅ Your appointment has been confirmed successfully.\nPlease stay available for your scheduled session.", buttons:[], display_order:11, trigger_type:"keyword", trigger_value:null, language:"en"},
    {...base, step_key:"appointment_confirmed_hi", message_text:"✅ आपका अपॉइंटमेंट सफलतापूर्वक पुष्टि हो गया।", buttons:[], display_order:11, trigger_type:"keyword", trigger_value:null, language:"hi"},
    {...base, step_key:"appointment_confirmed_ml", message_text:"✅ നിങ്ങളുടെ അപ്പോയിന്റ്‌മെന്റ് സ്ഥിരീകരിച്ചു.", buttons:[], display_order:11, trigger_type:"keyword", trigger_value:null, language:"ml"},
    {...base, step_key:"appointment_confirmed_ur", message_text:"✅ آپ کی ملاقات کی تصدیق ہو گئی۔", buttons:[], display_order:11, trigger_type:"keyword", trigger_value:null, language:"ur"},
    {...base, step_key:"appointment_confirmed_ar", message_text:"✅ تم تأكيد موعدك بنجاح.", buttons:[], display_order:11, trigger_type:"keyword", trigger_value:null, language:"ar"},
  ];

  try {
    const { data, error } = await supabase
      .from("upgrade_auto_responses")
      .insert(rows);
    
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, count: rows.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
