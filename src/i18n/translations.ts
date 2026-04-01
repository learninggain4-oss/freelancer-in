export type LangCode = "en" | "hi" | "ur" | "ar" | "ml" | "es" | "de" | "ta";

export const RTL_LANGS: LangCode[] = ["ur", "ar"];

export const LANG_LABELS: Record<LangCode, string> = {
  en: "English",
  hi: "हिन्दी",
  ur: "اردو",
  ar: "العربية",
  ml: "മലയാളം",
  es: "Español",
  de: "Deutsch",
  ta: "தமிழ்",
};

export type Translations = {
  nav: {
    register: string;
    login: string;
    install: string;
  };
  hero: {
    line1: string;
    line2: string;
    line3: string;
    subtitle: string;
    joinFreelancer: string;
    joinEmployer: string;
    trustBadge: string;
  };
  features: {
    heading: string;
    subheading: string;
    items: { title: string; desc: string }[];
  };
  howItWorks: {
    heading: string;
    sub: string;
    steps: { title: string; desc: string }[];
  };
  services: {
    heading: string;
    sub: string;
  };
  stats: {
    heading: string;
    sub: string;
    labels: { freelancers: string; projects: string; clients: string; paid: string };
  };
  cta: {
    heading: string;
    sub: string;
    joinFreelancer: string;
    joinEmployer: string;
  };
  faq: {
    heading: string;
    sub: string;
    items: { q: string; a: string }[];
  };
  registerModal: {
    heading: string;
    sub: string;
    freelancer: string;
    freelancerDesc: string;
    employer: string;
    employerDesc: string;
    haveAccount: string;
    loginLink: string;
  };
  footer: {
    tagline: string;
    platform: string;
    company: string;
    legal: string;
    links: {
      findWork: string;
      postJob: string;
      howItWorks: string;
      pricing: string;
      about: string;
      blog: string;
      careers: string;
      contact: string;
      privacy: string;
      terms: string;
      cookie: string;
    };
    copyright: string;
  };
};

export const translations: Record<LangCode, Translations> = {
  en: {
    nav: { register: "Register", login: "Login", install: "Install" },
    hero: {
      line1: "Connect.", line2: "Collaborate.", line3: "Get Paid.",
      subtitle: "The all-in-one platform connecting skilled freelancers with clients in India. Manage projects, chat in real-time, and receive payments securely.",
      joinFreelancer: "Join as Freelancer", joinEmployer: "Join as Employer",
      trustBadge: "Trusted by 500+ professionals across India",
    },
    features: {
      heading: "Everything you need",
      subheading: "The tools & features that make Freelancer-in the best platform for Indian freelancers and clients.",
      items: [
        { title: "Smart Matching", desc: "AI-powered job matching connects you with the perfect opportunities based on your skills and experience." },
        { title: "Secure Payments", desc: "Escrow-based payment system ensures you get paid on time, every time. No more payment disputes." },
        { title: "Real-time Chat", desc: "Built-in messaging with file sharing, video calls, and project management tools." },
        { title: "Portfolio Builder", desc: "Showcase your work with our beautiful portfolio builder. Attract more clients with stunning profiles." },
        { title: "Analytics Dashboard", desc: "Track your earnings, project success rates, and client satisfaction with detailed analytics." },
        { title: "Mobile First", desc: "Work from anywhere with our feature-rich mobile app. Manage projects on the go." },
        { title: "Verified Badges", desc: "Build trust with clients through our verification system. Stand out from the competition." },
        { title: "24/7 Support", desc: "Our dedicated support team is available around the clock to help you with any issues." },
      ],
    },
    howItWorks: {
      heading: "How it works",
      sub: "Get started in minutes",
      steps: [
        { title: "Create your profile", desc: "Sign up and showcase your skills, portfolio, and experience to attract the right clients." },
        { title: "Find or post work", desc: "Browse thousands of projects or post your job requirements and receive proposals." },
        { title: "Collaborate & deliver", desc: "Work seamlessly with built-in tools, milestones, and real-time communication." },
        { title: "Get paid securely", desc: "Receive payments directly to your bank account through our secure escrow system." },
      ],
    },
    services: { heading: "Top Service Categories", sub: "Explore thousands of opportunities across every industry" },
    stats: {
      heading: "Numbers that speak",
      sub: "Trusted by India's top professionals",
      labels: { freelancers: "Active Freelancers", projects: "Projects Completed", clients: "Happy Clients", paid: "Total Paid Out" },
    },
    cta: {
      heading: "Ready to get started?", sub: "Join thousands of professionals already using Freelancer-in.",
      joinFreelancer: "Join as Freelancer", joinEmployer: "Hire Talent",
    },
    faq: {
      heading: "Frequently Asked Questions", sub: "Everything you need to know",
      items: [
        { q: "Is Freelancer-in free to use?", a: "Yes, basic registration is free. We take a small commission only on successful projects." },
        { q: "How do payments work?", a: "Payments are held in escrow until work is approved. Both parties are protected at all times." },
        { q: "Can I work with clients outside India?", a: "Absolutely! While focused on India, our platform supports global collaboration." },
        { q: "How is my data protected?", a: "We use industry-standard encryption and never sell your personal data to third parties." },
        { q: "What skills can I offer?", a: "Any digital or professional skill — from web development and design to writing, marketing, and beyond." },
      ],
    },
    registerModal: {
      heading: "How would you like to get started?",
      sub: "Choose your role to create the right account",
      freelancer: "Join as Freelancer", freelancerDesc: "Find projects & earn money",
      employer: "Join as Employer", employerDesc: "Post jobs & hire talent",
      haveAccount: "Already have an account?", loginLink: "Login",
    },
    footer: {
      tagline: "Connecting India's best talent with great opportunities.",
      platform: "Platform", company: "Company", legal: "Legal",
      links: { findWork: "Find Work", postJob: "Post a Job", howItWorks: "How it Works", pricing: "Pricing", about: "About Us", blog: "Blog", careers: "Careers", contact: "Contact", privacy: "Privacy Policy", terms: "Terms of Service", cookie: "Cookie Policy" },
      copyright: "© 2024 Freelancer-in. All rights reserved.",
    },
  },

  hi: {
    nav: { register: "रजिस्टर करें", login: "लॉगिन", install: "इंस्टॉल करें" },
    hero: {
      line1: "जुड़ें।", line2: "सहयोग करें।", line3: "कमाई करें।",
      subtitle: "भारत में कुशल फ्रीलांसरों और क्लाइंट्स को जोड़ने वाला एकमात्र प्लेटफॉर्म। प्रोजेक्ट प्रबंधित करें, रियल-टाइम चैट करें और सुरक्षित भुगतान पाएं।",
      joinFreelancer: "फ्रीलांसर के रूप में जुड़ें", joinEmployer: "नियोक्ता के रूप में जुड़ें",
      trustBadge: "भारत भर में 500+ पेशेवरों द्वारा भरोसेमंद",
    },
    features: {
      heading: "वह सब कुछ जो आपको चाहिए",
      subheading: "वे टूल्स और फीचर्स जो Freelancer-in को भारतीय फ्रीलांसरों और क्लाइंट्स के लिए सर्वश्रेष्ठ प्लेटफॉर्म बनाते हैं।",
      items: [
        { title: "स्मार्ट मैचिंग", desc: "AI-संचालित जॉब मैचिंग आपको आपके कौशल और अनुभव के आधार पर सही अवसरों से जोड़ती है।" },
        { title: "सुरक्षित भुगतान", desc: "एस्क्रो-आधारित भुगतान प्रणाली सुनिश्चित करती है कि आपको समय पर भुगतान मिले।" },
        { title: "रियल-टाइम चैट", desc: "फाइल शेयरिंग, वीडियो कॉल और प्रोजेक्ट मैनेजमेंट टूल्स के साथ बिल्ट-इन मैसेजिंग।" },
        { title: "पोर्टफोलियो बिल्डर", desc: "हमारे सुंदर पोर्टफोलियो बिल्डर से अपना काम दिखाएं। अधिक क्लाइंट्स आकर्षित करें।" },
        { title: "एनालिटिक्स डैशबोर्ड", desc: "विस्तृत एनालिटिक्स से अपनी कमाई, प्रोजेक्ट सफलता और क्लाइंट संतुष्टि ट्रैक करें।" },
        { title: "मोबाइल फर्स्ट", desc: "हमारे फीचर-रिच मोबाइल ऐप से कहीं से भी काम करें।" },
        { title: "सत्यापित बैज", desc: "हमारी वेरिफिकेशन प्रणाली से क्लाइंट्स के साथ विश्वास बनाएं।" },
        { title: "24/7 सहायता", desc: "हमारी समर्पित सपोर्ट टीम किसी भी समस्या में आपकी मदद के लिए हमेशा उपलब्ध है।" },
      ],
    },
    howItWorks: {
      heading: "यह कैसे काम करता है", sub: "मिनटों में शुरू करें",
      steps: [
        { title: "अपना प्रोफाइल बनाएं", desc: "साइन अप करें और सही क्लाइंट्स को आकर्षित करने के लिए अपने कौशल और अनुभव दिखाएं।" },
        { title: "काम खोजें या पोस्ट करें", desc: "हजारों प्रोजेक्ट्स ब्राउज़ करें या अपनी जॉब आवश्यकताएं पोस्ट करें।" },
        { title: "सहयोग और डिलीवरी", desc: "बिल्ट-इन टूल्स, माइलस्टोन और रियल-टाइम संचार से काम करें।" },
        { title: "सुरक्षित भुगतान पाएं", desc: "हमारे सुरक्षित एस्क्रो सिस्टम के माध्यम से सीधे अपने बैंक खाते में भुगतान पाएं।" },
      ],
    },
    services: { heading: "शीर्ष सेवा श्रेणियां", sub: "हर उद्योग में हजारों अवसर खोजें" },
    stats: {
      heading: "बोलते हैं ये आंकड़े", sub: "भारत के शीर्ष पेशेवरों का भरोसा",
      labels: { freelancers: "सक्रिय फ्रीलांसर", projects: "पूर्ण प्रोजेक्ट", clients: "संतुष्ट क्लाइंट", paid: "कुल भुगतान" },
    },
    cta: {
      heading: "शुरू करने के लिए तैयार हैं?", sub: "हजारों पेशेवरों के साथ जुड़ें जो पहले से Freelancer-in उपयोग कर रहे हैं।",
      joinFreelancer: "फ्रीलांसर के रूप में जुड़ें", joinEmployer: "प्रतिभा नियुक्त करें",
    },
    faq: {
      heading: "अक्सर पूछे जाने वाले प्रश्न", sub: "वह सब जो आपको जानना चाहिए",
      items: [
        { q: "क्या Freelancer-in उपयोग के लिए मुफ्त है?", a: "हां, बेसिक रजिस्ट्रेशन मुफ्त है। हम केवल सफल प्रोजेक्ट्स पर एक छोटा कमीशन लेते हैं।" },
        { q: "भुगतान कैसे काम करता है?", a: "काम स्वीकृत होने तक भुगतान एस्क्रो में रखा जाता है। दोनों पक्ष हर समय सुरक्षित रहते हैं।" },
        { q: "क्या मैं भारत के बाहर क्लाइंट्स के साथ काम कर सकता हूं?", a: "बिल्कुल! हालांकि हमारा फोकस भारत पर है, हमारा प्लेटफॉर्म वैश्विक सहयोग का समर्थन करता है।" },
        { q: "मेरा डेटा कैसे सुरक्षित है?", a: "हम उद्योग-मानक एन्क्रिप्शन का उपयोग करते हैं और कभी भी आपका व्यक्तिगत डेटा तीसरे पक्ष को नहीं बेचते।" },
        { q: "मैं कौन से कौशल प्रदान कर सकता हूं?", a: "कोई भी डिजिटल या पेशेवर कौशल — वेब डेवलपमेंट और डिज़ाइन से लेखन, मार्केटिंग तक।" },
      ],
    },
    registerModal: {
      heading: "आप कैसे शुरू करना चाहते हैं?",
      sub: "सही खाता बनाने के लिए अपनी भूमिका चुनें",
      freelancer: "फ्रीलांसर के रूप में जुड़ें", freelancerDesc: "प्रोजेक्ट खोजें और पैसे कमाएं",
      employer: "नियोक्ता के रूप में जुड़ें", employerDesc: "जॉब पोस्ट करें और प्रतिभा नियुक्त करें",
      haveAccount: "पहले से खाता है?", loginLink: "लॉगिन करें",
    },
    footer: {
      tagline: "भारत की सर्वश्रेष्ठ प्रतिभा को शानदार अवसरों से जोड़ना।",
      platform: "प्लेटफॉर्म", company: "कंपनी", legal: "कानूनी",
      links: { findWork: "काम खोजें", postJob: "जॉब पोस्ट करें", howItWorks: "यह कैसे काम करता है", pricing: "मूल्य निर्धारण", about: "हमारे बारे में", blog: "ब्लॉग", careers: "करियर", contact: "संपर्क करें", privacy: "गोपनीयता नीति", terms: "सेवा की शर्तें", cookie: "कुकी नीति" },
      copyright: "© 2024 Freelancer-in. सर्वाधिकार सुरक्षित।",
    },
  },

  ur: {
    nav: { register: "رجسٹر کریں", login: "لاگ ان", install: "انسٹال کریں" },
    hero: {
      line1: "جڑیں۔", line2: "تعاون کریں۔", line3: "کمائیں۔",
      subtitle: "ہندوستان میں ہنرمند فری لانسرز اور کلائنٹس کو جوڑنے والا آل-ان-ون پلیٹ فارم۔ پراجیکٹس مینیج کریں، ریئل ٹائم چیٹ کریں اور محفوظ ادائیگی پائیں۔",
      joinFreelancer: "فری لانسر کے طور پر شامل ہوں", joinEmployer: "آجر کے طور پر شامل ہوں",
      trustBadge: "پورے ہندوستان میں 500+ پیشہ ور افراد کا اعتماد",
    },
    features: {
      heading: "وہ سب کچھ جو آپ کو چاہیے",
      subheading: "وہ ٹولز اور خصوصیات جو Freelancer-in کو ہندوستانی فری لانسرز اور کلائنٹس کے لیے بہترین پلیٹ فارم بناتی ہیں۔",
      items: [
        { title: "سمارٹ میچنگ", desc: "AI سے چلنے والی جاب میچنگ آپ کو آپ کی مہارتوں کی بنیاد پر بہترین مواقع سے جوڑتی ہے۔" },
        { title: "محفوظ ادائیگی", desc: "ایسکرو پر مبنی ادائیگی کا نظام یقینی بناتا ہے کہ آپ کو ہر بار وقت پر ادائیگی ملے۔" },
        { title: "ریئل ٹائم چیٹ", desc: "فائل شیئرنگ، ویڈیو کالز اور پراجیکٹ مینجمنٹ ٹولز کے ساتھ بلٹ-ان میسجنگ۔" },
        { title: "پورٹ فولیو بلڈر", desc: "ہمارے خوبصورت پورٹ فولیو بلڈر سے اپنا کام دکھائیں۔ زیادہ کلائنٹس کو راغب کریں۔" },
        { title: "اینالیٹکس ڈیش بورڈ", desc: "تفصیلی تجزیات سے اپنی کمائی، پراجیکٹ کی کامیابی اور کلائنٹ کی اطمینان ٹریک کریں۔" },
        { title: "موبائل فرسٹ", desc: "ہمارے فیچر سے بھرپور موبائل ایپ سے کہیں سے بھی کام کریں۔" },
        { title: "تصدیق شدہ بیجز", desc: "ہمارے تصدیقی نظام سے کلائنٹس کے ساتھ اعتماد بنائیں۔" },
        { title: "24/7 سپورٹ", desc: "ہماری سپورٹ ٹیم کسی بھی مسئلے میں آپ کی مدد کے لیے ہر وقت دستیاب ہے۔" },
      ],
    },
    howItWorks: {
      heading: "یہ کیسے کام کرتا ہے", sub: "منٹوں میں شروع کریں",
      steps: [
        { title: "اپنا پروفائل بنائیں", desc: "سائن اپ کریں اور صحیح کلائنٹس کو راغب کرنے کے لیے اپنی مہارتیں دکھائیں۔" },
        { title: "کام تلاش کریں یا پوسٹ کریں", desc: "ہزاروں پراجیکٹس براؤز کریں یا اپنی جاب کی ضروریات پوسٹ کریں۔" },
        { title: "تعاون اور ڈیلیوری", desc: "بلٹ-ان ٹولز، سنگ میل اور ریئل ٹائم مواصلات سے کام کریں۔" },
        { title: "محفوظ ادائیگی پائیں", desc: "ہمارے ایسکرو سسٹم کے ذریعے اپنے بینک اکاؤنٹ میں براہ راست ادائیگی پائیں۔" },
      ],
    },
    services: { heading: "اعلیٰ سروس کیٹیگریز", sub: "ہر صنعت میں ہزاروں مواقع دریافت کریں" },
    stats: {
      heading: "بولتے ہیں یہ اعداد و شمار", sub: "ہندوستان کے اعلیٰ پیشہ ور افراد کا اعتماد",
      labels: { freelancers: "فعال فری لانسرز", projects: "مکمل پراجیکٹس", clients: "خوش کلائنٹس", paid: "کل ادائیگی" },
    },
    cta: {
      heading: "شروع کرنے کے لیے تیار ہیں؟", sub: "ہزاروں پیشہ ور افراد کے ساتھ جڑیں جو پہلے سے Freelancer-in استعمال کر رہے ہیں۔",
      joinFreelancer: "فری لانسر کے طور پر شامل ہوں", joinEmployer: "ہنرمند لوگوں کو ملازم رکھیں",
    },
    faq: {
      heading: "اکثر پوچھے جانے والے سوالات", sub: "وہ سب کچھ جو آپ کو جاننا چاہیے",
      items: [
        { q: "کیا Freelancer-in استعمال کرنا مفت ہے؟", a: "جی ہاں، بنیادی رجسٹریشن مفت ہے۔ ہم صرف کامیاب پراجیکٹس پر چھوٹا کمیشن لیتے ہیں۔" },
        { q: "ادائیگی کیسے کام کرتی ہے؟", a: "کام منظور ہونے تک ادائیگی ایسکرو میں رکھی جاتی ہے۔ دونوں فریق ہر وقت محفوظ رہتے ہیں۔" },
        { q: "کیا میں ہندوستان سے باہر کلائنٹس کے ساتھ کام کر سکتا ہوں؟", a: "بالکل! اگرچہ ہمارا فوکس ہندوستان پر ہے، ہمارا پلیٹ فارم عالمی تعاون کی حمایت کرتا ہے۔" },
        { q: "میرا ڈیٹا کیسے محفوظ ہے؟", a: "ہم صنعتی معیار کی انکرپشن استعمال کرتے ہیں اور کبھی بھی آپ کا ذاتی ڈیٹا تیسرے فریق کو نہیں بیچتے۔" },
        { q: "میں کون سی مہارتیں پیش کر سکتا ہوں؟", a: "کوئی بھی ڈیجیٹل یا پیشہ ورانہ مہارت — ویب ڈویلپمنٹ سے لکھنے اور مارکیٹنگ تک۔" },
      ],
    },
    registerModal: {
      heading: "آپ کیسے شروع کرنا چاہتے ہیں؟",
      sub: "صحیح اکاؤنٹ بنانے کے لیے اپنا کردار منتخب کریں",
      freelancer: "فری لانسر کے طور پر شامل ہوں", freelancerDesc: "پراجیکٹس تلاش کریں اور پیسے کمائیں",
      employer: "آجر کے طور پر شامل ہوں", employerDesc: "جاب پوسٹ کریں اور ہنرمند لوگوں کو ملازم رکھیں",
      haveAccount: "پہلے سے اکاؤنٹ ہے؟", loginLink: "لاگ ان",
    },
    footer: {
      tagline: "ہندوستان کے بہترین ہنر کو شاندار مواقع سے جوڑنا۔",
      platform: "پلیٹ فارم", company: "کمپنی", legal: "قانونی",
      links: { findWork: "کام تلاش کریں", postJob: "جاب پوسٹ کریں", howItWorks: "یہ کیسے کام کرتا ہے", pricing: "قیمت", about: "ہمارے بارے میں", blog: "بلاگ", careers: "کیریئر", contact: "رابطہ کریں", privacy: "رازداری کی پالیسی", terms: "سروس کی شرائط", cookie: "کوکی پالیسی" },
      copyright: "© 2024 Freelancer-in. جملہ حقوق محفوظ ہیں۔",
    },
  },

  ar: {
    nav: { register: "التسجيل", login: "تسجيل الدخول", install: "تثبيت" },
    hero: {
      line1: "تواصل.", line2: "تعاون.", line3: "اكسب.",
      subtitle: "المنصة الشاملة التي تربط المستقلين المهرة بالعملاء في الهند. أدر المشاريع، وتحدث في الوقت الفعلي، واستلم المدفوعات بأمان.",
      joinFreelancer: "انضم كمستقل", joinEmployer: "انضم كصاحب عمل",
      trustBadge: "موثوق به من قبل أكثر من 500 محترف في جميع أنحاء الهند",
    },
    features: {
      heading: "كل ما تحتاجه",
      subheading: "الأدوات والميزات التي تجعل Freelancer-in أفضل منصة للمستقلين والعملاء في الهند.",
      items: [
        { title: "مطابقة ذكية", desc: "تربطك مطابقة الوظائف المدعومة بالذكاء الاصطناعي بأفضل الفرص بناءً على مهاراتك وخبرتك." },
        { title: "مدفوعات آمنة", desc: "يضمن نظام الدفع القائم على الضمان حصولك على المدفوعات في الوقت المناسب في كل مرة." },
        { title: "دردشة فورية", desc: "رسائل مدمجة مع مشاركة الملفات ومكالمات الفيديو وأدوات إدارة المشاريع." },
        { title: "منشئ المعرض", desc: "اعرض أعمالك بمنشئ المعرض الجميل. اجذب المزيد من العملاء." },
        { title: "لوحة التحليلات", desc: "تتبع أرباحك ومعدلات نجاح المشروع ورضا العملاء بتحليلات مفصلة." },
        { title: "الجوال أولاً", desc: "اعمل من أي مكان مع تطبيق الجوال الغني بالميزات." },
        { title: "شارات التحقق", desc: "بناء الثقة مع العملاء من خلال نظام التحقق لدينا." },
        { title: "دعم 24/7", desc: "فريق الدعم لدينا متاح على مدار الساعة للمساعدة في أي مشكلة." },
      ],
    },
    howItWorks: {
      heading: "كيف يعمل", sub: "ابدأ في دقائق",
      steps: [
        { title: "أنشئ ملفك الشخصي", desc: "سجل وأظهر مهاراتك وتجربتك لجذب العملاء المناسبين." },
        { title: "ابحث عن عمل أو انشره", desc: "تصفح آلاف المشاريع أو انشر متطلبات وظيفتك." },
        { title: "تعاون وسلّم", desc: "اعمل بسلاسة مع الأدوات المدمجة والمعالم والتواصل الفوري." },
        { title: "احصل على أجرك بأمان", desc: "استلم المدفوعات مباشرة إلى حسابك البنكي عبر نظام الضمان." },
      ],
    },
    services: { heading: "أهم فئات الخدمات", sub: "استكشف آلاف الفرص عبر كل الصناعات" },
    stats: {
      heading: "أرقام تتحدث", sub: "موثوق به من قبل أفضل المحترفين في الهند",
      labels: { freelancers: "مستقلون نشطون", projects: "مشاريع مكتملة", clients: "عملاء سعداء", paid: "إجمالي المدفوعات" },
    },
    cta: {
      heading: "هل أنت مستعد للبدء؟", sub: "انضم إلى آلاف المحترفين الذين يستخدمون Freelancer-in بالفعل.",
      joinFreelancer: "انضم كمستقل", joinEmployer: "استأجر مواهب",
    },
    faq: {
      heading: "الأسئلة الشائعة", sub: "كل ما تحتاج معرفته",
      items: [
        { q: "هل استخدام Freelancer-in مجاني؟", a: "نعم، التسجيل الأساسي مجاني. نأخذ عمولة صغيرة فقط على المشاريع الناجحة." },
        { q: "كيف تعمل المدفوعات؟", a: "تُحتجز المدفوعات في الضمان حتى الموافقة على العمل. كلا الطرفين محميان في جميع الأوقات." },
        { q: "هل يمكنني العمل مع عملاء خارج الهند؟", a: "بالطبع! رغم تركيزنا على الهند، تدعم منصتنا التعاون العالمي." },
        { q: "كيف تتم حماية بياناتي؟", a: "نستخدم تشفيراً وفق معايير الصناعة ولا نبيع بياناتك الشخصية لأطراف ثالثة أبداً." },
        { q: "ما المهارات التي يمكنني تقديمها؟", a: "أي مهارة رقمية أو مهنية — من تطوير الويب والتصميم إلى الكتابة والتسويق." },
      ],
    },
    registerModal: {
      heading: "كيف تريد البدء؟",
      sub: "اختر دورك لإنشاء الحساب المناسب",
      freelancer: "انضم كمستقل", freelancerDesc: "ابحث عن مشاريع واكسب المال",
      employer: "انضم كصاحب عمل", employerDesc: "انشر وظائف واستأجر مواهب",
      haveAccount: "لديك حساب بالفعل؟", loginLink: "تسجيل الدخول",
    },
    footer: {
      tagline: "ربط أفضل المواهب في الهند بفرص رائعة.",
      platform: "المنصة", company: "الشركة", legal: "قانوني",
      links: { findWork: "ابحث عن عمل", postJob: "انشر وظيفة", howItWorks: "كيف يعمل", pricing: "التسعير", about: "معلومات عنا", blog: "المدونة", careers: "وظائف", contact: "اتصل بنا", privacy: "سياسة الخصوصية", terms: "شروط الخدمة", cookie: "سياسة الكوكيز" },
      copyright: "© 2024 Freelancer-in. جميع الحقوق محفوظة.",
    },
  },

  ml: {
    nav: { register: "രജിസ്റ്റർ ചെയ്യുക", login: "ലോഗിൻ", install: "ഇൻസ്റ്റോൾ ചെയ്യുക" },
    hero: {
      line1: "ബന്ധപ്പെടുക.", line2: "സഹകരിക്കുക.", line3: "വരുമാനം നേടുക.",
      subtitle: "ഇന്ത്യയിൽ നൈപുണ്യമുള്ള ഫ്രീലാൻസർമാരെയും ക്ലയൻ്റുകളെയും ബന്ധിപ്പിക്കുന്ന ഓൾ-ഇൻ-വൺ പ്ലാറ്റ്ഫോം. പ്രോജക്ടുകൾ നിയന്ത്രിക്കുക, തത്സമയ ചാറ്റ് ചെയ്യുക, സുരക്ഷിതമായി പണം സ്വീകരിക്കുക.",
      joinFreelancer: "ഫ്രീലാൻസറായി ചേരുക", joinEmployer: "തൊഴിലുടമയായി ചേരുക",
      trustBadge: "ഇന്ത്യയിലുടനീളം 500+ പ്രൊഫഷണലുകൾ വിശ്വസിക്കുന്നു",
    },
    features: {
      heading: "നിങ്ങൾക്ക് ആവശ്യമായതെല്ലാം",
      subheading: "ഇന്ത്യൻ ഫ്രീലാൻസർമാർക്കും ക്ലയൻ്റുകൾക്കും Freelancer-in ഏറ്റവും മികച്ച പ്ലാറ്റ്ഫോം ആക്കുന്ന ടൂളുകളും ഫീച്ചറുകളും.",
      items: [
        { title: "സ്മാർട്ട് മാച്ചിംഗ്", desc: "AI-ശക്തിയിലുള്ള ജോബ് മാച്ചിംഗ് നിങ്ങളുടെ കഴിവുകൾക്ക് അനുസൃതമായ അവസരങ്ങൾ കണ്ടെത്തുന്നു." },
        { title: "സുരക്ഷിത പേയ്മൻ്റ്", desc: "എസ്ക്രോ അടിസ്ഥാനത്തിലുള്ള പേയ്മൻ്റ് സംവിധാനം നിങ്ങൾക്ക് സമയബദ്ധമായ പണം ഉറപ്പ് നൽകുന്നു." },
        { title: "തത്സമയ ചാറ്റ്", desc: "ഫയൽ ഷെയറിംഗ്, വീഡിയോ കോൾ, പ്രോജക്ട് മാനേജ്മൻ്റ് ടൂളുകൾ സഹിതം ബിൽറ്റ്-ഇൻ മെസേജിംഗ്." },
        { title: "പോർട്ട്ഫോളിയോ ബിൽഡർ", desc: "നിങ്ങളുടെ പ്രവൃത്തി മനോഹരമായ പോർട്ട്ഫോളിയോ ബിൽഡറിലൂടെ പ്രദർശിപ്പിക്കുക." },
        { title: "അനലിറ്റിക്സ് ഡാഷ്ബോർഡ്", desc: "നിങ്ങളുടെ വരുമാനം, പ്രോജക്ട് വിജയ നിരക്ക്, ക്ലയൻ്റ് സംതൃപ്തി എന്നിവ ട്രാക്ക് ചെയ്യുക." },
        { title: "മൊബൈൽ ഫസ്റ്റ്", desc: "ഫീച്ചർ-റിച്ച് മൊബൈൽ ആപ്പ് ഉപയോഗിച്ച് എവിടെ നിന്നും ജോലി ചെയ്യുക." },
        { title: "സ്ഥിരീകൃത ബാഡ്ജുകൾ", desc: "ഞങ്ങളുടെ സ്ഥിരീകരണ സംവിധാനത്തിലൂടെ ക്ലയൻ്റുകളുമായി വിശ്വാസം സ്ഥാപിക്കുക." },
        { title: "24/7 പിന്തുണ", desc: "ഞങ്ങളുടെ ടീം ഏത് പ്രശ്നത്തിലും സഹായിക്കാൻ എപ്പോഴും ലഭ്യമാണ്." },
      ],
    },
    howItWorks: {
      heading: "ഇത് എങ്ങനെ പ്രവർത്തിക്കുന്നു", sub: "മിനിറ്റുകൾക്കുള്ളിൽ ആരംഭിക്കുക",
      steps: [
        { title: "പ്രൊഫൈൽ സൃഷ്ടിക്കുക", desc: "സൈൻ അപ്പ് ചെയ്ത് ശരിയായ ക്ലയൻ്റുകളെ ആകർഷിക്കാൻ കഴിവുകളും അനുഭവവും പ്രദർശിപ്പിക്കുക." },
        { title: "ജോലി കണ്ടെത്തുക അല്ലെങ്കിൽ പോസ്റ്റ് ചെയ്യുക", desc: "ആയിരക്കണക്കിന് പ്രോജക്ടുകൾ ബ്രൗസ് ചെയ്യുക അല്ലെങ്കിൽ ജോബ് ആവശ്യകതകൾ പോസ്റ്റ് ചെയ്യുക." },
        { title: "സഹകരിക്കുകയും ഡെലിവർ ചെയ്യുകയും ചെയ്യുക", desc: "ബിൽറ്റ്-ഇൻ ടൂളുകൾ, മൈൽസ്റ്റോണുകൾ, തത്സമയ ആശയവിനിമയം എന്നിവ ഉപയോഗിച്ച് ജോലി ചെയ്യുക." },
        { title: "സുരക്ഷിതമായി പണം സ്വീകരിക്കുക", desc: "ഞങ്ങളുടെ എസ്ക്രോ സംവിധാനത്തിലൂടെ ബാങ്ക് അക്കൗണ്ടിലേക്ക് നേരിട്ട് പേയ്മൻ്റ് സ്വീകരിക്കുക." },
      ],
    },
    services: { heading: "മുൻനിര സേവന വിഭാഗങ്ങൾ", sub: "എല്ലാ വ്യവസായങ്ങളിലും ആയിരക്കണക്കിന് അവസരങ്ങൾ" },
    stats: {
      heading: "സംഖ്യകൾ സംസാരിക്കുന്നു", sub: "ഇന്ത്യയിലെ മികച്ച പ്രൊഫഷണലുകൾ വിശ്വസിക്കുന്നു",
      labels: { freelancers: "സജീവ ഫ്രീലാൻസർമാർ", projects: "പൂർത്തിയായ പ്രോജക്ടുകൾ", clients: "സന്തുഷ്ടരായ ക്ലയൻ്റുകൾ", paid: "ആകെ പേയ്മൻ്റ്" },
    },
    cta: {
      heading: "ആരംഭിക്കാൻ തയ്യാറോ?", sub: "ഇതിനകം Freelancer-in ഉപയോഗിക്കുന്ന ആയിരക്കണക്കിന് പ്രൊഫഷണലുകളോടൊപ്പം ചേരുക.",
      joinFreelancer: "ഫ്രീലാൻസറായി ചേരുക", joinEmployer: "പ്രതിഭകളെ നിയമിക്കുക",
    },
    faq: {
      heading: "പലരും ചോദിക്കുന്ന ചോദ്യങ്ങൾ", sub: "നിങ്ങൾ അറിയേണ്ടതെല്ലാം",
      items: [
        { q: "Freelancer-in ഉപയോഗിക്കാൻ സൗജന്യമാണോ?", a: "അതെ, അടിസ്ഥാന രജിസ്ട്രേഷൻ സൗജന്യമാണ്. വിജയകരമായ പ്രോജക്ടുകളിൽ മാത്രം ഒരു ചെറിയ കമ്മീഷൻ ഈടാക്കുന്നു." },
        { q: "പേയ്മൻ്റ് എങ്ങനെ പ്രവർത്തിക്കുന്നു?", a: "ജോലി അംഗീകരിക്കുന്നത് വരെ പേയ്മൻ്റ് എസ്ക്രോയിൽ സൂക്ഷിക്കുന്നു. ഇരു കക്ഷികളും സുരക്ഷിതരാണ്." },
        { q: "ഇന്ത്യക്ക് പുറത്തുള്ള ക്ലയൻ്റുകളുമായി ജോലി ചെയ്യാൻ കഴിയുമോ?", a: "തീർച്ചയായും! ഇന്ത്യയിൽ ശ്രദ്ധ കേന്ദ്രീകരിക്കുമ്പോഴും, ഞങ്ങളുടെ പ്ലാറ്റ്ഫോം ആഗോള സഹകരണത്തെ പിന്തുണയ്ക്കുന്നു." },
        { q: "എൻ്റെ ഡാറ്റ എങ്ങനെ സുരക്ഷിതമാക്കുന്നു?", a: "ഞങ്ങൾ ഇൻഡസ്ട്രി-സ്റ്റാൻഡേർഡ് എൻക്രിപ്ഷൻ ഉപയോഗിക്കുന്നു, ഒരിക്കലും നിങ്ങളുടെ ഡാറ്റ മൂന്നാം കക്ഷികൾക്ക് വിൽക്കില്ല." },
        { q: "ഞാൻ എന്ത് കഴിവുകൾ നൽകാൻ കഴിയും?", a: "ഏതൊരു ഡിജിറ്റൽ അല്ലെങ്കിൽ പ്രൊഫഷണൽ കഴിവും — വെബ് ഡെവലപ്മൻ്റ് മുതൽ ലേഖനം, മാർക്കറ്റിംഗ് വരെ." },
      ],
    },
    registerModal: {
      heading: "നിങ്ങൾ എങ്ങനെ ആരംഭിക്കണം?",
      sub: "ശരിയായ അക്കൗണ്ട് സൃഷ്ടിക്കാൻ നിങ്ങളുടെ റോൾ തിരഞ്ഞെടുക്കുക",
      freelancer: "ഫ്രീലാൻസറായി ചേരുക", freelancerDesc: "പ്രോജക്ടുകൾ കണ്ടെത്തി പണം സമ്പാദിക്കുക",
      employer: "തൊഴിലുടമയായി ചേരുക", employerDesc: "ജോബ് പോസ്റ്റ് ചെയ്ത് പ്രതിഭകളെ നിയമിക്കുക",
      haveAccount: "ഇതിനകം അക്കൗണ്ട് ഉണ്ടോ?", loginLink: "ലോഗിൻ",
    },
    footer: {
      tagline: "ഇന്ത്യയിലെ മികച്ച പ്രതിഭകളെ അവസരങ്ങളുമായി ബന്ധിപ്പിക്കുക.",
      platform: "പ്ലാറ്റ്ഫോം", company: "കമ്പനി", legal: "നിയമം",
      links: { findWork: "ജോലി കണ്ടെത്തുക", postJob: "ജോബ് പോസ്റ്റ് ചെയ്യുക", howItWorks: "ഇത് എങ്ങനെ പ്രവർത്തിക്കുന്നു", pricing: "വില", about: "ഞങ്ങളെ കുറിച്ച്", blog: "ബ്ലോഗ്", careers: "കരിയർ", contact: "ബന്ധപ്പെടുക", privacy: "സ്വകാര്യതാ നയം", terms: "സേവന നിബന്ധനകൾ", cookie: "കുക്കി നയം" },
      copyright: "© 2024 Freelancer-in. എല്ലാ അവകാശങ്ങളും നിക്ഷിപ്തം.",
    },
  },

  es: {
    nav: { register: "Registrarse", login: "Iniciar sesión", install: "Instalar" },
    hero: {
      line1: "Conecta.", line2: "Colabora.", line3: "Cobra.",
      subtitle: "La plataforma todo en uno que conecta freelancers con clientes en India. Gestiona proyectos, chatea en tiempo real y recibe pagos de forma segura.",
      joinFreelancer: "Únete como Freelancer", joinEmployer: "Únete como Empleador",
      trustBadge: "Confiado por más de 500 profesionales en toda India",
    },
    features: {
      heading: "Todo lo que necesitas",
      subheading: "Las herramientas y funciones que hacen de Freelancer-in la mejor plataforma para freelancers y clientes de India.",
      items: [
        { title: "Coincidencia inteligente", desc: "La coincidencia de empleos con IA te conecta con las mejores oportunidades según tus habilidades y experiencia." },
        { title: "Pagos seguros", desc: "El sistema de pago basado en depósito en garantía asegura que recibas el pago a tiempo, siempre." },
        { title: "Chat en tiempo real", desc: "Mensajería integrada con uso compartido de archivos, videollamadas y herramientas de gestión de proyectos." },
        { title: "Constructor de portafolio", desc: "Muestra tu trabajo con nuestro hermoso constructor de portafolio. Atrae más clientes." },
        { title: "Panel de análisis", desc: "Rastrea tus ganancias, tasas de éxito del proyecto y satisfacción del cliente con análisis detallados." },
        { title: "Mobile First", desc: "Trabaja desde cualquier lugar con nuestra aplicación móvil rica en funciones." },
        { title: "Insignias verificadas", desc: "Genera confianza con los clientes a través de nuestro sistema de verificación." },
        { title: "Soporte 24/7", desc: "Nuestro equipo dedicado está disponible las 24 horas del día para ayudarte con cualquier problema." },
      ],
    },
    howItWorks: {
      heading: "Cómo funciona", sub: "Empieza en minutos",
      steps: [
        { title: "Crea tu perfil", desc: "Regístrate y muestra tus habilidades, portafolio y experiencia para atraer a los clientes correctos." },
        { title: "Encuentra o publica trabajo", desc: "Explora miles de proyectos o publica tus requisitos de trabajo y recibe propuestas." },
        { title: "Colabora y entrega", desc: "Trabaja sin problemas con herramientas integradas, hitos y comunicación en tiempo real." },
        { title: "Cobra de forma segura", desc: "Recibe pagos directamente en tu cuenta bancaria a través de nuestro sistema de depósito en garantía." },
      ],
    },
    services: { heading: "Categorías de servicios principales", sub: "Explora miles de oportunidades en cada industria" },
    stats: {
      heading: "Números que hablan", sub: "Confiado por los mejores profesionales de India",
      labels: { freelancers: "Freelancers activos", projects: "Proyectos completados", clients: "Clientes satisfechos", paid: "Total pagado" },
    },
    cta: {
      heading: "¿Listo para empezar?", sub: "Únete a miles de profesionales que ya usan Freelancer-in.",
      joinFreelancer: "Únete como Freelancer", joinEmployer: "Contratar talento",
    },
    faq: {
      heading: "Preguntas frecuentes", sub: "Todo lo que necesitas saber",
      items: [
        { q: "¿Es gratuito usar Freelancer-in?", a: "Sí, el registro básico es gratuito. Solo cobramos una pequeña comisión en proyectos exitosos." },
        { q: "¿Cómo funcionan los pagos?", a: "Los pagos se retienen en depósito hasta que se aprueba el trabajo. Ambas partes están protegidas en todo momento." },
        { q: "¿Puedo trabajar con clientes fuera de India?", a: "¡Por supuesto! Aunque nos enfocamos en India, nuestra plataforma soporta la colaboración global." },
        { q: "¿Cómo están protegidos mis datos?", a: "Usamos cifrado estándar de la industria y nunca vendemos tus datos personales a terceros." },
        { q: "¿Qué habilidades puedo ofrecer?", a: "Cualquier habilidad digital o profesional: desde desarrollo web y diseño hasta escritura y marketing." },
      ],
    },
    registerModal: {
      heading: "¿Cómo te gustaría comenzar?",
      sub: "Elige tu rol para crear la cuenta correcta",
      freelancer: "Únete como Freelancer", freelancerDesc: "Encuentra proyectos y gana dinero",
      employer: "Únete como Empleador", employerDesc: "Publica trabajos y contrata talento",
      haveAccount: "¿Ya tienes una cuenta?", loginLink: "Iniciar sesión",
    },
    footer: {
      tagline: "Conectando el mejor talento de India con grandes oportunidades.",
      platform: "Plataforma", company: "Empresa", legal: "Legal",
      links: { findWork: "Buscar trabajo", postJob: "Publicar trabajo", howItWorks: "Cómo funciona", pricing: "Precios", about: "Sobre nosotros", blog: "Blog", careers: "Empleos", contact: "Contacto", privacy: "Política de privacidad", terms: "Términos de servicio", cookie: "Política de cookies" },
      copyright: "© 2024 Freelancer-in. Todos los derechos reservados.",
    },
  },

  de: {
    nav: { register: "Registrieren", login: "Anmelden", install: "Installieren" },
    hero: {
      line1: "Vernetzen.", line2: "Zusammenarbeiten.", line3: "Verdienen.",
      subtitle: "Die All-in-One-Plattform, die qualifizierte Freelancer mit Kunden in Indien verbindet. Projekte verwalten, in Echtzeit chatten und sicher bezahlt werden.",
      joinFreelancer: "Als Freelancer beitreten", joinEmployer: "Als Arbeitgeber beitreten",
      trustBadge: "Von mehr als 500 Fachleuten in ganz Indien vertraut",
    },
    features: {
      heading: "Alles was du brauchst",
      subheading: "Die Tools und Funktionen, die Freelancer-in zur besten Plattform für indische Freelancer und Kunden machen.",
      items: [
        { title: "Intelligentes Matching", desc: "KI-basiertes Job-Matching verbindet dich mit perfekten Möglichkeiten basierend auf deinen Fähigkeiten." },
        { title: "Sichere Zahlungen", desc: "Das Treuhand-Zahlungssystem stellt sicher, dass du jedes Mal pünktlich bezahlt wirst." },
        { title: "Echtzeit-Chat", desc: "Integriertes Messaging mit Dateifreigabe, Videoanrufen und Projektmanagement-Tools." },
        { title: "Portfolio-Builder", desc: "Zeige deine Arbeit mit unserem Portfolio-Builder. Attrahiere mehr Kunden." },
        { title: "Analyse-Dashboard", desc: "Verfolge deine Einnahmen, Projekterfolgsquoten und Kundenzufriedenheit." },
        { title: "Mobile First", desc: "Arbeite von überall mit unserer funktionsreichen mobilen App." },
        { title: "Verifizierte Abzeichen", desc: "Baue Vertrauen bei Kunden durch unser Verifizierungssystem auf." },
        { title: "24/7 Support", desc: "Unser engagiertes Support-Team ist rund um die Uhr erreichbar." },
      ],
    },
    howItWorks: {
      heading: "So funktioniert es", sub: "In Minuten loslegen",
      steps: [
        { title: "Profil erstellen", desc: "Registriere dich und präsentiere deine Fähigkeiten und Erfahrungen, um die richtigen Kunden anzuziehen." },
        { title: "Arbeit finden oder posten", desc: "Durchsuche Tausende von Projekten oder poste deine Jobanforderungen." },
        { title: "Zusammenarbeiten und liefern", desc: "Arbeite nahtlos mit integrierten Tools, Meilensteinen und Echtzeit-Kommunikation." },
        { title: "Sicher bezahlt werden", desc: "Erhalte Zahlungen direkt auf dein Bankkonto über unser Treuhand-System." },
      ],
    },
    services: { heading: "Top-Dienstleistungskategorien", sub: "Entdecke Tausende von Möglichkeiten in jeder Branche" },
    stats: {
      heading: "Zahlen, die sprechen", sub: "Vertraut von Indiens Top-Fachleuten",
      labels: { freelancers: "Aktive Freelancer", projects: "Abgeschlossene Projekte", clients: "Zufriedene Kunden", paid: "Gesamtauszahlung" },
    },
    cta: {
      heading: "Bereit loszulegen?", sub: "Schließe dich Tausenden von Fachleuten an, die Freelancer-in bereits nutzen.",
      joinFreelancer: "Als Freelancer beitreten", joinEmployer: "Talente einstellen",
    },
    faq: {
      heading: "Häufig gestellte Fragen", sub: "Alles, was du wissen musst",
      items: [
        { q: "Ist Freelancer-in kostenlos?", a: "Ja, die Grundregistrierung ist kostenlos. Wir nehmen nur eine kleine Provision bei erfolgreichen Projekten." },
        { q: "Wie funktionieren Zahlungen?", a: "Zahlungen werden im Treuhand gehalten, bis die Arbeit genehmigt wird. Beide Parteien sind jederzeit geschützt." },
        { q: "Kann ich mit Kunden außerhalb Indiens zusammenarbeiten?", a: "Absolut! Obwohl wir uns auf Indien konzentrieren, unterstützt unsere Plattform globale Zusammenarbeit." },
        { q: "Wie werden meine Daten geschützt?", a: "Wir verwenden branchenübliche Verschlüsselung und verkaufen deine Daten nie an Dritte." },
        { q: "Welche Fähigkeiten kann ich anbieten?", a: "Jede digitale oder professionelle Fähigkeit — von Webentwicklung und Design bis hin zu Schreiben und Marketing." },
      ],
    },
    registerModal: {
      heading: "Wie möchtest du loslegen?",
      sub: "Wähle deine Rolle, um das richtige Konto zu erstellen",
      freelancer: "Als Freelancer beitreten", freelancerDesc: "Projekte finden und Geld verdienen",
      employer: "Als Arbeitgeber beitreten", employerDesc: "Jobs posten und Talente einstellen",
      haveAccount: "Bereits ein Konto?", loginLink: "Anmelden",
    },
    footer: {
      tagline: "Indiens bestes Talent mit großartigen Möglichkeiten verbinden.",
      platform: "Plattform", company: "Unternehmen", legal: "Rechtliches",
      links: { findWork: "Arbeit finden", postJob: "Job posten", howItWorks: "So funktioniert es", pricing: "Preise", about: "Über uns", blog: "Blog", careers: "Karriere", contact: "Kontakt", privacy: "Datenschutzrichtlinie", terms: "Nutzungsbedingungen", cookie: "Cookie-Richtlinie" },
      copyright: "© 2024 Freelancer-in. Alle Rechte vorbehalten.",
    },
  },

  ta: {
    nav: { register: "பதிவு செய்யுங்கள்", login: "உள்நுழைவு", install: "நிறுவுங்கள்" },
    hero: {
      line1: "இணையுங்கள்.", line2: "ஒத்துழையுங்கள்.", line3: "சம்பாதியுங்கள்.",
      subtitle: "இந்தியாவில் திறமையான ஃப்ரீலான்சர்களையும் வாடிக்கையாளர்களையும் இணைக்கும் அனைத்தும் உள்ள தளம். திட்டங்களை நிர்வகிக்கவும், நேரடி அரட்டை அடிக்கவும், பாதுகாப்பாக பணம் பெறவும்.",
      joinFreelancer: "ஃப்ரீலான்சராக சேருங்கள்", joinEmployer: "முதலாளியாக சேருங்கள்",
      trustBadge: "இந்தியா முழுவதும் 500+ நிபுணர்களின் நம்பிக்கை",
    },
    features: {
      heading: "உங்களுக்கு தேவையான அனைத்தும்",
      subheading: "இந்திய ஃப்ரீலான்சர்கள் மற்றும் வாடிக்கையாளர்களுக்கான சிறந்த தளமாக Freelancer-in ஐ மாற்றும் கருவிகள் மற்றும் அம்சங்கள்.",
      items: [
        { title: "ஸ்மார்ட் மேட்சிங்", desc: "AI-இயக்கப்படும் வேலை பொருத்தல் உங்கள் திறன்களின் அடிப்படையில் சரியான வாய்ப்புகளை கண்டறியும்." },
        { title: "பாதுகாப்பான கட்டணம்", desc: "எஸ்க்ரோ அடிப்படையிலான கட்டண அமைப்பு உங்களுக்கு ஒவ்வொரு முறையும் சரியான நேரத்தில் பணம் கிடைப்பதை உறுதிசெய்கிறது." },
        { title: "நேரடி அரட்டை", desc: "கோப்பு பகிர்வு, வீடியோ அழைப்புகள் மற்றும் திட்ட மேலாண்மை கருவிகளுடன் உள்ளமைக்கப்பட்ட செய்தி பரிமாற்றம்." },
        { title: "போர்ட்ஃபோலியோ நிர்மாதா", desc: "அழகான போர்ட்ஃபோலியோ நிர்மாதா மூலம் உங்கள் வேலையை காட்டுங்கள்." },
        { title: "பகுப்பாய்வு டாஷ்போர்டு", desc: "விரிவான பகுப்பாய்வுகள் மூலம் உங்கள் வருவாய், திட்ட வெற்றி விகிதங்கள் கண்காணிக்கவும்." },
        { title: "மொபைல் ஃபர்ஸ்ட்", desc: "அம்சங்கள் நிறைந்த மொபைல் ஆப்பில் எங்கிருந்தும் பணிபுரியுங்கள்." },
        { title: "சரிபார்க்கப்பட்ட பேட்ஜுகள்", desc: "சரிபார்ப்பு அமைப்பு மூலம் வாடிக்கையாளர்களிடம் நம்பிக்கையை வளர்க்கவும்." },
        { title: "24/7 ஆதரவு", desc: "எங்கள் அர்ப்பணிப்பான ஆதரவு குழு எந்த நேரத்திலும் உதவ தயாராக உள்ளது." },
      ],
    },
    howItWorks: {
      heading: "இது எவ்வாறு செயல்படுகிறது", sub: "நிமிடங்களில் தொடங்குங்கள்",
      steps: [
        { title: "உங்கள் சுயவிவரம் உருவாக்குங்கள்", desc: "பதிவு செய்து சரியான வாடிக்கையாளர்களை ஈர்க்க உங்கள் திறன்கள் மற்றும் அனுபவத்தை காட்டுங்கள்." },
        { title: "வேலை கண்டறியுங்கள் அல்லது இடுங்கள்", desc: "ஆயிரக்கணக்கான திட்டங்களை உலாவுங்கள் அல்லது உங்கள் வேலை தேவைகளை இடுங்கள்." },
        { title: "ஒத்துழைத்து வழங்குங்கள்", desc: "உள்ளமைக்கப்பட்ட கருவிகள், மைல்கற்கள் மற்றும் நேரடி தொடர்பு மூலம் பணிபுரியுங்கள்." },
        { title: "பாதுகாப்பாக பணம் பெறுங்கள்", desc: "எஸ்க்ரோ அமைப்பு மூலம் நேரடியாக வங்கி கணக்கில் கட்டணம் பெறுங்கள்." },
      ],
    },
    services: { heading: "சிறந்த சேவை வகைகள்", sub: "ஒவ்வொரு தொழிலிலும் ஆயிரக்கணக்கான வாய்ப்புகளை ஆராயுங்கள்" },
    stats: {
      heading: "பேசும் எண்கள்", sub: "இந்தியாவின் சிறந்த நிபுணர்களின் நம்பிக்கை",
      labels: { freelancers: "செயலில் உள்ள ஃப்ரீலான்சர்கள்", projects: "முடிக்கப்பட்ட திட்டங்கள்", clients: "மகிழ்ச்சியான வாடிக்கையாளர்கள்", paid: "மொத்த கட்டணம்" },
    },
    cta: {
      heading: "தொடங்க தயாரா?", sub: "ஏற்கனவே Freelancer-in பயன்படுத்தும் ஆயிரக்கணக்கான நிபுணர்களுடன் சேருங்கள்.",
      joinFreelancer: "ஃப்ரீலான்சராக சேருங்கள்", joinEmployer: "திறமையானவர்களை நியமிக்கவும்",
    },
    faq: {
      heading: "அடிக்கடி கேட்கப்படும் கேள்விகள்", sub: "நீங்கள் அறிந்து கொள்ள வேண்டியதெல்லாம்",
      items: [
        { q: "Freelancer-in பயன்படுத்துவது இலவசமா?", a: "ஆம், அடிப்படை பதிவு இலவசம். வெற்றிகரமான திட்டங்களில் மட்டுமே சிறிய கமிஷன் வசூலிக்கிறோம்." },
        { q: "கட்டணங்கள் எவ்வாறு செயல்படுகின்றன?", a: "வேலை அங்கீகரிக்கப்படும் வரை கட்டணங்கள் எஸ்க்ரோவில் வைக்கப்படுகின்றன. இரு தரப்பினரும் எப்போதும் பாதுகாப்பாக இருக்கிறார்கள்." },
        { q: "இந்தியாவிற்கு வெளியே வாடிக்கையாளர்களுடன் பணிபுரிய முடியுமா?", a: "நிச்சயமாக! இந்தியாவில் கவனம் செலுத்தும்போதும், உலகளாவிய ஒத்துழைப்பை ஆதரிக்கிறோம்." },
        { q: "என் தரவு எவ்வாறு பாதுகாக்கப்படுகிறது?", a: "தொழில் தரத்திலான குறியாக்கம் பயன்படுத்துகிறோம், உங்கள் தரவை மூன்றாம் தரப்பினருக்கு விற்கமாட்டோம்." },
        { q: "எந்த திறன்களை வழங்கலாம்?", a: "எந்த டிஜிட்டல் அல்லது தொழில்முறை திறனும் — வலை மேம்பாட்டில் இருந்து எழுத்து மற்றும் சந்தைப்படுத்தல் வரை." },
      ],
    },
    registerModal: {
      heading: "நீங்கள் எவ்வாறு தொடங்க விரும்புகிறீர்கள்?",
      sub: "சரியான கணக்கை உருவாக்க உங்கள் பாத்திரத்தை தேர்வு செய்யுங்கள்",
      freelancer: "ஃப்ரீலான்சராக சேருங்கள்", freelancerDesc: "திட்டங்களை கண்டறிந்து பணம் சம்பாதியுங்கள்",
      employer: "முதலாளியாக சேருங்கள்", employerDesc: "வேலைகளை இடுங்கள் மற்றும் திறமையானவர்களை நியமிக்கவும்",
      haveAccount: "ஏற்கனவே கணக்கு உள்ளதா?", loginLink: "உள்நுழைவு",
    },
    footer: {
      tagline: "இந்தியாவின் சிறந்த திறமையை சிறந்த வாய்ப்புகளுடன் இணைக்கிறோம்.",
      platform: "தளம்", company: "நிறுவனம்", legal: "சட்டம்",
      links: { findWork: "வேலை கண்டறியுங்கள்", postJob: "வேலை இடுங்கள்", howItWorks: "இது எவ்வாறு செயல்படுகிறது", pricing: "விலை", about: "எங்களை பற்றி", blog: "வலைப்பதிவு", careers: "வாழ்க்கை", contact: "தொடர்பு கொள்ளுங்கள்", privacy: "தனியுரிமை கொள்கை", terms: "சேவை விதிமுறைகள்", cookie: "குக்கி கொள்கை" },
      copyright: "© 2024 Freelancer-in. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",
    },
  },
};
