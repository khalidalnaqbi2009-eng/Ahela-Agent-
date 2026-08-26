import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Sparkles, 
  Plus, 
  PlusCircle, 
  Trash2, 
  MessageSquare, 
  Smile, 
  Users, 
  ChevronDown, 
  CheckCircle2,
  BookOpen,
  Calendar,
  Layers,
  Award,
  X
} from 'lucide-react';

// --- Types ---
export interface GoalContribution {
  id: string;
  member: string;
  note: string;
  timestamp: string;
}

export interface FamilyGoal {
  id: string;
  title: string;
  description: string;
  type: string; //Suggested or custom
  emoji: string;
  targetCount: number;
  currentCount: number;
  contributions: GoalContribution[];
  completed: boolean;
}

export interface FamilyReflection {
  id: string;
  date: string;
  wentWell: string;
  challenges: string;
  supportPlan: string;
}

interface SharedFamilyGoalsProps {
  lang: 'ar' | 'en';
}

// --- Multi-language copy dict for Goals ---
const TG = {
  ar: {
    sectionTitle: "أهداف العائلة المشتركة",
    sectionSubtitle: "نتعاون معاً بروح الفريق لنبني بيتاً يملؤه الحب والترابط والدفء التراثي.",
    createGoalBtn: "إضافة هدف عائلي جديد",
    selectSuggested: "اختر من أهدافنا المقترحة:",
    customGoal: "كتابة هدف مخصص للعائلة",
    goalTitlePlaceholder: "مثلاً: شرب شاي العصر معاً دون هواتف",
    goalTargetLabel: "هدف التكرار (مثلاً: 4 مرات بأسبوع):",
    btnCancel: "إلغاء",
    btnSave: "حفظ الهدف",
    contributeTitle: "سجل مشاركة عائلية الآن",
    memberPlaceholder: "من شارك بالجهد؟ (مثلاً: بابا وماما، لطيفة الصغيره)",
    congratsTitle: "كِفيتوا ووفيتوا يا أهلنا! 🎉",
    congratsMsg: "بفضل تعاونكم ومحبتكم، حققت العائلة هدفها! هنيئاً لكم هذا الترابط الدافئ.",
    noGoalsText: "لا توجد أهداف نشطة حالياً. اختاروا هدفاً عائلياً جميلاً لنبدأ السعي إليه معاً بحب!",
    addContributionBtn: "إضافة مشاركة +",
    deleteGoalConfirm: "هل تريد حذف هذا الهدف العائلي؟",
    contributionsHeader: "سجل المساهمات العائلية لليوم:",
    recentReflections: "سجل المراجعات العائلية الأسبوعية",
    writeReflectionTitle: "جلسة المراجعة والترابط الأسبوعي 📝",
    writeReflectionIntro: "اجلسوا معاً كعائلة نهاية الأسبوع لتنسجوا معاً خيوط المودة والترابط والمراجعة الحنونة للفترة الماضية.",
    fieldWentWell: "ما الذي سار بشكل رائع هذا الأسبوع؟",
    fieldWentWellHint: "مثال: تحدثنا بهدوء أكثر وكان نوم الرضيع أفضل بفضل أهازيج الجدة.",
    fieldChallenges: "ما هي التحديات التي واجهتنا؟",
    fieldChallengesHint: "مثال: انشغلنا بالعمل والهواتف في منتصف الأسبوع وقلّت جلستنا معاً.",
    fieldSupport: "كيف يمكننا دعم بعضنا البعض في الأيام القادمة؟",
    fieldSupportHint: "مثال: سنوزع مهام البيت ليرتاح الجميع، ونخصص وقتاً للحديث الدافئ.",
    saveReflectionBtn: "حفظ المراجعة السنوية الأسبوعية",
    reflectionSavedToast: "تم حفظ مراجعتكم العائلية الدافئة بنجاح! طاب بيتكم بالود والتعاضد.",
    noReflectionsYet: "لم يتم كتابة مراجعة أسبوعية عائلية بعد. اجلسوا نهاية الأسبوع ودونوا رحلتكم الجميلة معاً لتبقى ذكرى عطرة.",
    byMember: "بواسطة:",
    goalProgress: "التقدم العائلي:",
    goalCompleted: "تم الإنجاز بحمد الله! 🌟",
    suggestedGoalsHeader: "مشاريع المودة والترابط المقترحة:",
    customGoalTitle: "اصنع هويتك العائلية الخاصة:",
    activeGoalsTab: "أهدافنا النشطة",
    reflectionsTab: "مراجعاتنا ومودة العائلة",
    teamworkTitle: "تعاون عائلي",
    motivationQuote: "قال الأولين: 'البيت اللي تأسس على الودّ والتعاون تظلله بركة الرحمن وعمره ما يضيق بأهله'.",
    contributeMemory: "اكتب ذكرى أو تفاصيل لطيفة (اختياري):",
    contributeMemoryPlaceholder: "مثلاً: جلسنا معاً ولعبنا لعبة الألغاز القديمة وضحكنا كثيراً."
  },
  en: {
    sectionTitle: "Shared Family Goals",
    sectionSubtitle: "Working hand in hand to foster warmth, deep connection, and cherished traditional bonding.",
    createGoalBtn: "Create New Family Goal",
    selectSuggested: "Select from our suggested bonding goals:",
    customGoal: "Create a custom family goal",
    goalTitlePlaceholder: "e.g., Afternoon tea together with zero screen-time",
    goalTargetLabel: "Target times (e.g., 4 times per week):",
    btnCancel: "Cancel",
    btnSave: "Save Goal",
    contributeTitle: "Log a Family Contribution",
    memberPlaceholder: "Who contributed? (e.g., Baba & Mama, Little Latifa)",
    congratsTitle: "Superb Teamwork, Ahelna! 🎉",
    congratsMsg: "Through love and cooperation, you have reached your goal! Cherish this beautiful harmony.",
    noGoalsText: "No active family goals at the moment. Pick or create a cooperative goal to steer towards together!",
    addContributionBtn: "Log Progress +",
    deleteGoalConfirm: "Are you sure you want to delete this family goal?",
    contributionsHeader: "Family Contribution Memories:",
    recentReflections: "Weekly Family Reflection Archives",
    writeReflectionTitle: "Weekly Family Bonding & Reflection Board 📝",
    writeReflectionIntro: "Gather around as a family at the end of the week for a cozy reflection to share appreciations, support, and goals.",
    fieldWentWell: "What went wonderfully well this week?",
    fieldWentWellHint: "e.g., We spoke gently to each other and got better baby sleep with grandma's lullabies.",
    fieldChallenges: "What felt challenging for us?",
    fieldChallengesHint: "e.g., We got busy with work and devices during mid-week with less time to talk.",
    fieldSupport: "How can we support each other even better next week?",
    fieldSupportHint: "e.g., Share the washing and care tasks so parents can rest, and play a board game together.",
    saveReflectionBtn: "Save Weekly Reflection Log",
    reflectionSavedToast: "Your beautiful family reflection, saved successfully! May your home thrive in deep affection.",
    noReflectionsYet: "No weekly reflections written yet. Sit down together this weekend to document your family's warm journey.",
    byMember: "By:",
    goalProgress: "Family Progress:",
    goalCompleted: "Cooperatively Accomplished! 🌟",
    suggestedGoalsHeader: "Suggested Harmony & Connection Projects:",
    customGoalTitle: "Design Your Unique Family Goal:",
    activeGoalsTab: "Active Shared Goals",
    reflectionsTab: "Family Reflection Journal",
    teamworkTitle: "Team Effort",
    motivationQuote: "Traditional proverb: 'The home built on affection and cooperation is forever sheltered in divine blessings.'",
    contributeMemory: "Write a short sweet memory (optional):",
    contributeMemoryPlaceholder: "e.g., We sat down, drank tea, and told stories until sunset."
  }
};

const SUGGESTED_GOALS_DATA = {
  ar: [
    { title: "تجهيز منزّ الرضيع وحمام السدر 🍃", description: "التعاون المشترك بين بابا وماما في إعداد السرير الخشبي المعلق (المنزّ التراثي) وتجهيز حمام السدر المطهر لتهدئة بشرة المولود وتغذيته بحب ورأفة.", emoji: "🍃", targetCount: 4 },
    { title: "وجبة النفاس والغذاء للحبة الحمراء 🍲", description: "إعداد وجبة تراثية مغذية وصحية للأم النفساء مثل (الحبة الحمراء بالسمن البلدي والزعفران، أو العصيدة الدافئة) لمساعدتها على التعافي وإدرار الحليب.", emoji: "🍲", targetCount: 5 },
    { title: "تمهيد الضنا والمساج الحنون 👶🏼", description: "التشارك كزوجين في لفّ الرضيع (القماط أو المهاد القطني البارد) وتدليك جسمه بالزيت الدافئ برفق لتقوية عظامه الغضة وتخفيف رياح غازات البطن.", emoji: "👶🏼", targetCount: 7 },
    { title: "تهويدة 'دوه يا دوه' وصوت الأمان 🎶", description: "التناوب على ترديد الأهازيج التراثية المشهورة مثل 'دوه يا دوه' أو 'هب السعد' للطفل قبل نومه لضمان راحة البال والسكينة.", emoji: "🎶", targetCount: 6 },
    { title: "بركة البيت وإرشادات يديداتنا 👵🏼", description: "إجراء زيارة أو جلسة تشنف بها مسامعنا بنصائح كبار العائلة والجدّات في طرق رعاية المولود التراثية وتحسين جودة نومه وهدوء طباعه.", emoji: "👵🏼", targetCount: 2 },
    { title: "مجلس العائلة وشرب فنجان قهوة 🌴", description: "الاجتماع في فناء البيت أو مجلس العائلة مع الدّلة والتمر وسوالف لوّل الراقية بلا شاشات ولا هواتف، لبث الراحة ونبرة العاطفة بالبيت.", emoji: "🌴", targetCount: 5 }
  ],
  en: [
    { title: "Preparing Al-Menz & Sidr Bath 🍃", description: "Working together to prepare the hanging wooden baby cradle (Al-Menz) and brew refreshing Sidr leaf bathwater to soothe and cleanse the newborn naturally.", emoji: "🍃", targetCount: 4 },
    { title: "Nourishing Postpartums & Saffron 🍲", description: "Cooperating to prepare traditional Emirati postpartum meals like 'Asida' or 'Habat Al-Hamra' cress seed warm milk for maternal blood healing and rich lactation.", emoji: "🍲", targetCount: 5 },
    { title: "Al-Mehad Swaddle & Warm Massage 👶🏼", description: "Sharing the diaper-change, swaddling the baby snuggly in breathable cotton (Al-Mehad), and giving a comforting sesame oil massage to ease gas pains.", emoji: "👶🏼", targetCount: 7 },
    { title: "Humming Heritage Lullabies 🎶", description: "Taking turns singing lovely Emirati lullabies ('Doh Ya Doh' or 'Hab Al-Saad') to lull the little one into a beautiful, secure deep sleep.", emoji: "🎶", targetCount: 6 },
    { title: "Connecting with the Eldest Elders 👵🏼", description: "Visiting or calling grandmothers ('Berkat Al-Beit') to seek their traditional baby care expertise, maternal postpartum guidance, and sweet prayers.", emoji: "👵🏼", targetCount: 2 },
    { title: "Family Majlis Off-Screen Hour 🌴", description: "Gathering in the home garden or formal Majlis over Arabic coffee, cardamoms, and dates, with zero electronic distractions to nurture home tranquility.", emoji: "🌴", targetCount: 5 }
  ]
};

const FAMILY_MEMBERS_DEFAULT = [
  { name: "بابا (Father)", icon: "👨🏽" },
  { name: "ماما (Mother)", icon: "👩🏽" },
  { name: "راشد (Rashid)", icon: "👦🏽" },
  { name: "لطيفة (Latifa)", icon: "👧🏽" },
  { name: "جميع العائلة (All Family)", icon: "🏡" }
];

export default function SharedFamilyGoals({ lang }: SharedFamilyGoalsProps) {
  // --- States ---
  const [goals, setGoals] = useState<FamilyGoal[]>([]);
  const [reflections, setReflections] = useState<FamilyReflection[]>([]);
  const [currentTab, setCurrentTab] = useState<'goals' | 'reflections'>('goals');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Custom Create Goal Form
  const [customTitle, setCustomTitle] = useState('');
  const [customEmoji, setCustomEmoji] = useState('🌟');
  const [customTarget, setCustomTarget] = useState(4);
  
  // Contribution State Form
  const [activeContributeGoalId, setActiveContributeGoalId] = useState<string | null>(null);
  const [selectedFamilyMember, setSelectedFamilyMember] = useState('جميع العائلة (All Family)');
  const [contributionComment, setContributionComment] = useState('');

  // Reflection States
  const [refWentWell, setRefWentWell] = useState('');
  const [refChallenges, setRefChallenges] = useState('');
  const [refSupportPlan, setRefSupportPlan] = useState('');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Confetti trigger for specific completed goals
  const [celebratedGoalId, setCelebratedGoalId] = useState<string | null>(null);

  // --- Initialize mock/first time goals if none in localStorage ---
  useEffect(() => {
    const storedGoals = localStorage.getItem('ahelna_family_goals');
    const storedReflections = localStorage.getItem('ahelna_family_reflections');
    
    if (storedGoals) {
      setGoals(JSON.parse(storedGoals));
    } else {
      // Load standard default starting goals
      const dGoals: FamilyGoal[] = [
        {
          id: 'def-1',
          title: lang === 'ar' ? "تجهيز منزّ الرضيع وحمام السدر 🍃" : "Preparing Al-Menz & Sidr Bath 🍃",
          description: lang === 'ar' ? "التعاون المشترك في إعداد السرير الخشبي المعلق (المنزّ التراثي) وتجهيز حمام السدر المطهر لتهدئة بشرة المولود وتغذيته بحب ورأفة." : "Working together to prepare the hanging wooden baby cradle (Al-Menz) and brew refreshing Sidr leaf bathwater to soothe the newborn.",
          emoji: "🍃",
          type: "suggested",
          targetCount: 4,
          currentCount: 3,
          completed: false,
          contributions: [
            { id: 'c-1', member: lang === 'ar' ? "ماما" : "Mother", note: lang === 'ar' ? "تنظيف المنزّ الخشبي وتعليق شاش الناموسية برفق" : "Polished the wooden Menz cradle and hung the pure safety mesh", timestamp: "2026-05-18" },
            { id: 'c-2', member: lang === 'ar' ? "بابا" : "Father", note: lang === 'ar' ? "غلي ورق السدر لتجهيز حمام مريح للبشرة لتخفيف الحر" : "Brewed the organic Sidr leaves into warm soothing bath water for the baby", timestamp: "2026-05-19" },
            { id: 'c-3', member: lang === 'ar' ? "جميع العائلة (All Family)" : "All Family", note: lang === 'ar' ? "تحميم الضنا الرضيع ورقاده هادئاً بعد التهويدة التراثية" : "Bathed the little one safely and hummed them to sleep inside Al-Menz", timestamp: "2026-05-20" }
          ]
        },
        {
          id: 'def-2',
          title: lang === 'ar' ? "وجبة النفاس والغذاء للحبة الحمراء 🍲" : "Nourishing Postpartums & Saffron 🍲",
          description: lang === 'ar' ? "إعداد وجبة تراثية مغذية وصحية للأم النفساء مثل (الحبة الحمراء بالسمن البلدي والزعفران، أو العصيدة الدافئة) لمساعدتها على التعافي وإدرار الحليب." : "Cooperating to prepare traditional Emirati postpartum meals like 'Asida' or 'Habat Al-Hamra' cress seed milk for maternal recovery.",
          emoji: "🍲",
          type: "suggested",
          targetCount: 5,
          currentCount: 2,
          completed: false,
          contributions: [
            { id: 'c-4', member: lang === 'ar' ? "جميع العائلة (All Family)" : "All Family", note: lang === 'ar' ? "طبخنا دلة الحبة الحمراء بحب وقدمناها للأم دافئة مطلع الصباح" : "Brewed a warm pot of sweet Habat Al-Hamra seeds milk for mama's postpartum recovery", timestamp: "2026-05-17" },
            { id: 'c-5', member: lang === 'ar' ? "جميع العائلة (All Family)" : "All Family", note: lang === 'ar' ? "إعداد عصيدة التمر والهل الساخنة وسط ضحكات الصغار" : "Shared aromatic cardamom-spiced Asida with dates over joyful morning smiles", timestamp: "2026-05-19" }
          ]
        }
      ];
      setGoals(dGoals);
      localStorage.setItem('ahelna_family_goals', JSON.stringify(dGoals));
    }

    if (storedReflections) {
      setReflections(JSON.parse(storedReflections));
    } else {
      const dReflections: FamilyReflection[] = [
        {
          id: 'ref-default-1',
          date: "2026-05-15",
          wentWell: lang === 'ar' ? "قضينا ليلة الجمعة نستمع لأهازيج الجدة، وكانت الروح إيجابية ومحبة جداً." : "We spent Friday listening to heritage lullabies together. The atmosphere was incredibly loving.",
          challenges: lang === 'ar' ? "شعر البابا بالتعب مطلع الأسبوع بسبب قلة نوم الرضيع، مما دعانا جميعاً للمساعدة." : "Baba was really sleep-deprived around Monday, which made things slightly stressful.",
          supportPlan: lang === 'ar' ? "اتفقنا على تنظيم نوبات النوم، بحيث تريح الأم الأب، وترتاح هي في الصباح بمساندة الجدة." : "We agreed to swap baby shifts so mama rests in the evening, and granny covers the morning hours."
        }
      ];
      setReflections(dReflections);
      localStorage.setItem('ahelna_family_reflections', JSON.stringify(dReflections));
    }
  }, [lang]);

  // Save changes helper
  const saveGoalsToStorage = (updatedGoals: FamilyGoal[]) => {
    setGoals(updatedGoals);
    localStorage.setItem('ahelna_family_goals', JSON.stringify(updatedGoals));
  };

  const saveReflectionsToStorage = (updatedRefs: FamilyReflection[]) => {
    setReflections(updatedRefs);
    localStorage.setItem('ahelna_family_reflections', JSON.stringify(updatedRefs));
  };

  // --- Core Handlers ---

  // Create Suggested Goal
  const handleSelectSuggestedGoal = (suggested: { title: string; description: string; emoji: string; targetCount: number }) => {
    const isAlreadyChosen = goals.some(g => g.title === suggested.title);
    if (isAlreadyChosen) {
      triggerToast(lang === 'en' ? "This goal is already active for your family!" : "هذا الهدف نشط ونعمل عليه بالفعل كعائلة!");
      return;
    }

    const newGoal: FamilyGoal = {
      id: 'g-' + Date.now(),
      title: suggested.title,
      description: suggested.description,
      emoji: suggested.emoji,
      type: 'suggested',
      targetCount: suggested.targetCount,
      currentCount: 0,
      completed: false,
      contributions: []
    };

    const nextGoals = [...goals, newGoal];
    saveGoalsToStorage(nextGoals);
    triggerToast(lang === 'en' ? "Goal added to family active board!" : "تمت إضافة الهدف العائلي بنجاح!");
  };

  // Create Custom Goal
  const handleSaveCustomGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const newGoal: FamilyGoal = {
      id: 'g-' + Date.now(),
      title: customTitle,
      description: lang === 'en' ? "Custom family bonding goal" : "هدف عائلي مخصص للمودة والتقارب العائلي الدافئ",
      emoji: customEmoji,
      type: 'custom',
      targetCount: customTarget,
      currentCount: 0,
      completed: false,
      contributions: []
    };

    const nextGoals = [...goals, newGoal];
    saveGoalsToStorage(nextGoals);
    setCustomTitle('');
    setCustomEmoji('🌟');
    setCustomTarget(4);
    setShowAddModal(false);
    triggerToast(lang === 'en' ? "Custom goal saved!" : "تم حفظ هدفكم المخصص بنجاح!");
  };

  // Log Contribution
  const handleAddContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContributeGoalId) return;

    const targetGoal = goals.find(g => g.id === activeContributeGoalId);
    if (!targetGoal) return;

    const newCont: GoalContribution = {
      id: 'c-' + Date.now(),
      member: selectedFamilyMember,
      note: contributionComment.trim() || (lang === 'en' ? "Accomplished nicely!" : "تم الإنجاز والتعاون بنجاح!"),
      timestamp: new Date().toISOString().split('T')[0]
    };

    const nextCount = targetGoal.currentCount + 1;
    const isNowCompleted = nextCount >= targetGoal.targetCount;

    const updatedGoals = goals.map(g => {
      if (g.id === activeContributeGoalId) {
        return {
          ...g,
          currentCount: nextCount > g.targetCount ? g.targetCount : nextCount,
          completed: isNowCompleted,
          contributions: [newCont, ...g.contributions]
        };
      }
      return g;
    });

    saveGoalsToStorage(updatedGoals);
    
    if (isNowCompleted && !targetGoal.completed) {
      setCelebratedGoalId(activeContributeGoalId);
    } else {
      triggerToast(lang === 'en' ? "Progress logged! Thank you for helping your family." : "تم تسجيل مساهمة عائلية دافئة! شكراً لعطائكم.");
    }

    // Reset contribution form
    setActiveContributeGoalId(null);
    setContributionComment('');
  };

  // Delete Goal
  const handleDeleteGoal = (id: string) => {
    if (window.confirm(TG[lang].deleteGoalConfirm)) {
      const nextGoals = goals.filter(g => g.id !== id);
      saveGoalsToStorage(nextGoals);
      triggerToast(lang === 'en' ? "Goal deleted." : "تم حذف الهدف.");
    }
  };

  // Weekly Reflection Save
  const handleSaveReflection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refWentWell.trim() && !refChallenges.trim() && !refSupportPlan.trim()) return;

    const newRef: FamilyReflection = {
      id: 'r-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      wentWell: refWentWell.trim() || (lang === 'en' ? "We connected nicely." : "سارت الأمور بهدوء ومحبة."),
      challenges: refChallenges.trim() || (lang === 'en' ? "None, a very standard peaceful week." : "لا توجد تحديات تذكر، أسبوع هانئ."),
      supportPlan: refSupportPlan.trim() || (lang === 'en' ? "Carry on with the same values and teamwork!" : "مستمرون بذات الدعم والترابط.")
    };

    const nextRefs = [newRef, ...reflections];
    saveReflectionsToStorage(nextRefs);

    // Reset reflection form fields
    setRefWentWell('');
    setRefChallenges('');
    setRefSupportPlan('');
    
    // Toast callback
    triggerToast(TG[lang].reflectionSavedToast);
  };

  // Helper trigger feedback toast
  const triggerToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4500);
  };

  return (
    <div className="flex flex-col h-full bg-[#FCFAF5] overflow-y-auto p-6 md:p-8 relative z-10 w-full">
      {/* Toast Alert popup */}
      <AnimatePresence>
        {feedbackToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 bg-olive-deep text-white border-2 border-gold-accent px-6 py-3 rounded-full flex items-center gap-3 shadow-xl z-50 text-sm font-bold max-w-md text-center"
          >
            <Sparkles size={16} className="text-gold-accent flex-shrink-0 animate-spin" />
            <span>{feedbackToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goal Celebration pop-over Modal */}
      <AnimatePresence>
        {celebratedGoalId && (() => {
          const completedGoal = goals.find(g => g.id === celebratedGoalId);
          if (!completedGoal) return null;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white border-2 border-gold-accent rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative"
              >
                <div className="text-6xl mb-4 animate-bounce">{completedGoal.emoji}</div>
                <h3 className="serif-ar text-2xl font-bold text-olive-deep mb-2">
                  {TG[lang].congratsTitle}
                </h3>
                <p className="text-sm text-olive-muted mb-4 font-bold">
                  "{completedGoal.title}"
                </p>
                <p className="text-sm leading-relaxed text-text-main/90 mb-6 bg-sand-light p-4 rounded-xl border border-pattern">
                  {TG[lang].congratsMsg}
                </p>

                <div className="flex justify-center gap-1.5 mb-6 text-2xl text-gold-accent">
                  <span>✨</span><span>✨</span><span>✨</span><span>✨</span><span>✨</span>
                </div>

                <button
                  onClick={() => setCelebratedGoalId(null)}
                  className="bg-olive-deep text-white hover:bg-olive-muted font-bold py-2.5 px-6 rounded-full text-sm shadow-md transition-all active:scale-95"
                >
                  {lang === 'en' ? "Thank God, continuing together!" : "الحمد لله، عمار يا بيتنا الدافئ!"}
                </button>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Main Header of features */}
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="serif-ar text-3xl font-bold text-olive-deep tracking-tight flex items-center gap-3">
            <span className="p-2.5 bg-gold-accent/15 rounded-2xl">🏡</span>
            {TG[lang].sectionTitle}
          </h2>
          <p className="text-xs text-olive-muted font-medium mt-1 leading-relaxed">
            {TG[lang].sectionSubtitle}
          </p>
        </div>

        {/* Action switch tab options */}
        <div className="flex bg-white border border-pattern p-1 rounded-xl shadow-sm text-xs font-bold gap-1">
          <button
            onClick={() => setCurrentTab('goals')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              currentTab === 'goals'
                ? 'bg-olive-deep text-white shadow-sm'
                : 'text-text-main opacity-70 hover:opacity-100'
            }`}
          >
            <Layers size={14} />
            {TG[lang].activeGoalsTab}
          </button>
          <button
            onClick={() => setCurrentTab('reflections')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              currentTab === 'reflections'
                ? 'bg-olive-deep text-white shadow-sm'
                : 'text-text-main opacity-70 hover:opacity-100'
            }`}
          >
            <MessageSquare size={14} />
            {TG[lang].reflectionsTab}
          </button>
        </div>
      </div>

      {/* Core Body switcher views */}
      <AnimatePresence mode="wait">
        {currentTab === 'goals' ? (
          <motion.div
            key="goals-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 h-full"
          >
            {/* Left side: Active family goals dashboard */}
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-pattern shadow-sm">
                <span className="text-xs font-bold text-olive-deep flex items-center gap-1.5">
                  <Award size={16} className="text-gold-accent" />
                  {lang === 'en' ? `Active Shared Projects (${goals.length})` : `مشروعات التعاون العائلي الشغالة (${goals.length})`}
                </span>
                
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-gold-accent hover:bg-gold-accent/90 text-text-main font-bold py-1.5 px-4 rounded-xl text-xs flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                >
                  <Plus size={14} />
                  {TG[lang].createGoalBtn}
                </button>
              </div>

              {goals.length === 0 ? (
                <div className="bg-white border border-pattern rounded-3xl p-12 text-center shadow-sm flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-sand-light rounded-full flex items-center justify-center text-4xl mb-4 border border-pattern animate-pulse">
                    ✨
                  </div>
                  <p className="font-bold text-lg text-olive-deep serif-ar mb-1">
                    {TG[lang].teamworkTitle}
                  </p>
                  <p className="text-xs text-olive-muted max-w-sm leading-relaxed mb-6">
                    {TG[lang].noGoalsText}
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-olive-deep text-white hover:bg-olive-muted font-bold py-2 px-5 rounded-full text-xs shadow-md"
                  >
                    + {TG[lang].createGoalBtn}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {goals.map((goal) => {
                    const pct = Math.min(100, Math.round((goal.currentCount / goal.targetCount) * 100));
                    return (
                      <div
                        key={goal.id}
                        className={`bg-white border border-pattern rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between ${
                          goal.completed ? 'border-2 border-gold-accent/60' : ''
                        }`}
                      >
                        {/* Completion Badge */}
                        {goal.completed && (
                          <div className="absolute top-0 right-0 lg:left-0 bg-gold-accent text-text-main text-[9px] font-extrabold uppercase py-1 px-3 rounded-bl-xl rounded-tr-xl flex items-center gap-1">
                            <CheckCircle2 size={10} />
                            {TG[lang].goalCompleted}
                          </div>
                        )}

                        <div>
                          {/* Goal Header */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <span className="text-2xl p-2 bg-sand-light rounded-xl border border-pattern">
                              {goal.emoji}
                            </span>
                            <button
                              onClick={() => handleDeleteGoal(goal.id)}
                              className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg transition-colors"
                              title={lang === 'en' ? "Remove goal" : "حذف الهدف"}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <h4 className="font-bold text-sm text-olive-deep block leading-snug mb-1">
                            {goal.title}
                          </h4>
                          <p className="text-[11px] text-olive-muted leading-relaxed mb-4 line-clamp-2">
                            {goal.description}
                          </p>
                        </div>

                        <div>
                          {/* Progress bar info */}
                          <div className="mb-4">
                            <div className="flex justify-between items-center text-[10px] font-bold text-text-main mb-1.5">
                              <span>{TG[lang].goalProgress}</span>
                              <span className="font-mono">{pct}% ({goal.currentCount}/{goal.targetCount})</span>
                            </div>
                            <div className="w-full bg-sand-light h-2.5 rounded-full border border-pattern p-0.5 overflow-hidden">
                              <div
                                className="bg-uae-green h-full rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>

                          {/* Trigger check-in buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setActiveContributeGoalId(goal.id)}
                              disabled={goal.completed}
                              className={`flex-1 font-bold py-2 p-3 rounded-lg text-xs flex items-center justify-center gap-1 shadow-sm transition-all text-white ${
                                goal.completed 
                                  ? 'bg-olive-muted/20 text-olive-muted/60' 
                                  : 'bg-olive-deep hover:bg-olive-muted'
                              }`}
                            >
                              <PlusCircle size={13} />
                              {TG[lang].addContributionBtn}
                            </button>
                          </div>
                        </div>

                        {/* Expandable active check-in logging prompt */}
                        {activeContributeGoalId === goal.id && (
                          <motion.form
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            onSubmit={handleAddContribution}
                            className="mt-4 pt-4 border-t border-pattern flex flex-col gap-3 bg-sand-light/50 -mx-5 -mb-5 p-5 border-b"
                          >
                            <div className="text-[11px] font-bold text-olive-deep block">
                              {TG[lang].contributeTitle}
                            </div>

                            {/* Family member bubble selectors */}
                            <div className="flex flex-wrap gap-1">
                              {FAMILY_MEMBERS_DEFAULT.map((mem) => (
                                <button
                                  type="button"
                                  key={mem.name}
                                  onClick={() => setSelectedFamilyMember(mem.name)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold border flex items-center gap-1 transition-all ${
                                    selectedFamilyMember === mem.name
                                      ? 'bg-gold-accent border-gold-accent text-text-main font-bold'
                                      : 'bg-white border-pattern text-text-main hover:bg-white/80'
                                  }`}
                                >
                                  <span>{mem.icon}</span>
                                  <span>{lang === 'en' ? mem.name.split(' (')[1].replace(')', '') : mem.name.split(' (')[0]}</span>
                                </button>
                              ))}
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] text-olive-muted font-bold">
                                {TG[lang].contributeMemory}
                              </label>
                              <input
                                type="text"
                                required
                                value={contributionComment}
                                onChange={(e) => setContributionComment(e.target.value)}
                                placeholder={TG[lang].contributeMemoryPlaceholder}
                                className="bg-white border border-pattern rounded-lg p-2 text-xs focus:ring-1 focus:ring-olive-deep outline-none placeholder:opacity-40"
                              />
                            </div>

                            <div className="flex justify-end gap-2 mt-1">
                              <button
                                type="button"
                                onClick={() => setActiveContributeGoalId(null)}
                                className="px-3 py-1.5 text-[10px] font-bold hover:bg-sand-med border border-pattern rounded-lg transition-colors text-text-main"
                              >
                                {TG[lang].btnCancel}
                              </button>
                              <button
                                type="submit"
                                className="px-3.5 py-1.5 text-[10px] font-bold bg-olive-deep hover:bg-olive-muted text-white rounded-lg shadow-sm"
                              >
                                {lang === 'en' ? "Log +1" : "مشاركة +١"}
                              </button>
                            </div>
                          </motion.form>
                        )}

                        {/* List of past logged contributions */}
                        {goal.contributions.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-pattern">
                            <p className="text-[9px] font-bold text-olive-muted uppercase mb-1">{TG[lang].contributionsHeader}</p>
                            <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1 divide-y divide-pattern/50">
                              {goal.contributions.map((c) => (
                                <div key={c.id} className="pt-1.5 text-[10px] text-text-main leading-relaxed flex items-start gap-1 pb-1">
                                  <span className="text-[11px] font-bold text-gold-accent flex-shrink-0">●</span>
                                  <div>
                                    <span className="font-bold text-olive-deep">{c.member}: </span>
                                    <span className="opacity-90">{c.note}</span>
                                    <span className="text-[8px] opacity-40 block mt-0.5">{c.timestamp}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right side: Suggested collaborative goals picker & Traditional Quote */}
            <div className="space-y-6">
              
              {/* Custom Add Goal Quick Button if clicked */}
              <div className="bg-[#FAF5ED] border border-[#ECD9BD] rounded-2xl p-5 shadow-sm">
                <p className="text-[11px] uppercase tracking-wider font-extrabold text-gold-accent mb-2">{lang === 'en' ? 'Create Custom' : 'الابتكار العائلي الخاص'}</p>
                <h4 className="serif-ar text-base font-bold text-olive-deep mb-3 leading-tight">{TG[lang].customGoalTitle}</h4>
                <p className="text-[10px] leading-relaxed text-olive-muted mb-4">
                  {lang === 'en' ? 'Want to work on a specialized routine or family dream? Create a custom collaborative goal.' : 'عندكم روتين عائلي مميز تبون تلتزمون فيه معاً؟ تفضلوا بصنع هدفكم الخاص.'}
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="w-full bg-white hover:bg-sand-light text-olive-deep border border-pattern shadow-sm py-2 px-4 rounded-xl text-xs font-bold transition-all active:scale-95"
                >
                  ✨ {TG[lang].createGoalBtn}
                </button>
              </div>

              {/* Suggestions Panel */}
              <div className="bg-white border border-pattern rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-bold text-olive-deep flex items-center gap-1.5 border-b border-pattern pb-3 mb-4">
                  <Users size={16} className="text-gold-accent" />
                  {TG[lang].suggestedGoalsHeader}
                </span>

                <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                  {SUGGESTED_GOALS_DATA[lang].map((suggested, index) => {
                    const isAdded = goals.some(g => g.title === suggested.title);
                    return (
                      <div
                        key={index}
                        className="p-3.5 bg-sand-light/40 border border-pattern rounded-xl flex gap-3 group relative items-start hover:border-gold-accent/45 transition-colors"
                      >
                        <span className="text-xl p-1 bg-white rounded-lg shadow-sm border border-pattern flex-shrink-0">
                          {suggested.emoji}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs text-text-main leading-tight line-clamp-1 group-hover:text-olive-deep">
                            {suggested.title}
                          </p>
                          <p className="text-[10px] leading-relaxed text-olive-muted mt-1">
                            {suggested.description}
                          </p>
                          <div className="flex justify-between items-center mt-3">
                            <span className="text-[9px] text-olive-muted font-bold font-mono">
                              {lang === 'en' ? `Target: ${suggested.targetCount} times` : `الهدف المحدد: ${suggested.targetCount} مرّات`}
                            </span>
                            <button
                              onClick={() => handleSelectSuggestedGoal(suggested)}
                              className={`py-1 px-3.5 rounded-lg text-[9px] font-extrabold transition-all ${
                                isAdded 
                                  ? 'bg-transparent text-gray-400 cursor-not-allowed border-none font-bold' 
                                  : 'bg-olive-deep hover:bg-olive-muted text-white shadow-sm'
                              }`}
                              disabled={isAdded}
                            >
                              {isAdded ? (lang === 'en' ? "Added" : "مضاف") : (lang === 'en' ? "Add Goal" : "+ تفعيل")}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cultural Quote Card */}
              <div className="p-5 rounded-2xl border-2 border-dashed border-pattern bg-transparent relative flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-extrabold text-[#9A7D42] tracking-wider uppercase mb-2">🌿 {lang === 'en' ? 'Old Wise Words' : 'من كلام لوّل'} 🌿</p>
                <p className="font-serif leading-relaxed text-xs italic text-olive-deep/90">
                  {TG[lang].motivationQuote}
                </p>
              </div>

            </div>
          </motion.div>
        ) : (
          <motion.div
            key="reflections-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-8 h-full"
          >
            {/* Left side: Periodic Reflection writing board */}
            <form
              onSubmit={handleSaveReflection}
              className="bg-white border border-pattern rounded-2xl p-6 shadow-sm h-fit space-y-5"
            >
              <div className="border-b border-pattern pb-4">
                <h4 className="serif-ar text-lg font-bold text-olive-deep flex items-center gap-1.5">
                  <BookOpen size={18} className="text-gold-accent" />
                  {TG[lang].writeReflectionTitle}
                </h4>
                <p className="text-[10px] leading-relaxed text-olive-muted mt-1.5">
                  {TG[lang].writeReflectionIntro}
                </p>
              </div>

              {/* Questions 1 */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-main flex items-center gap-1">
                  <span>✨</span>
                  <span>{TG[lang].fieldWentWell}</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={refWentWell}
                  onChange={(e) => setRefWentWell(e.target.value)}
                  placeholder={TG[lang].fieldWentWellHint}
                  className="bg-sand-light/50 border border-pattern p-3 rounded-xl text-xs outline-none focus:ring-1 focus:ring-olive-deep placeholder:opacity-40"
                />
              </div>

              {/* Questions 2 */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-main flex items-center gap-1">
                  <span>🌪️</span>
                  <span>{TG[lang].fieldChallenges}</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={refChallenges}
                  onChange={(e) => setRefChallenges(e.target.value)}
                  placeholder={TG[lang].fieldChallengesHint}
                  className="bg-sand-light/50 border border-pattern p-3 rounded-xl text-xs outline-none focus:ring-1 focus:ring-olive-deep placeholder:opacity-40"
                />
              </div>

              {/* Questions 3 */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-main flex items-center gap-1">
                  <span>🤝🏼</span>
                  <span>{TG[lang].fieldSupport}</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={refSupportPlan}
                  onChange={(e) => setRefSupportPlan(e.target.value)}
                  placeholder={TG[lang].fieldSupportHint}
                  className="bg-sand-light/50 border border-pattern p-3 rounded-xl text-xs outline-none focus:ring-1 focus:ring-olive-deep placeholder:opacity-40"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-olive-deep hover:bg-olive-muted text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md transition-all active:scale-95"
              >
                💾 {TG[lang].saveReflectionBtn}
              </button>
            </form>

            {/* Right side: reflection logs history logs grid */}
            <div className="space-y-5">
              <span className="text-xs font-bold text-olive-deep flex items-center gap-1.5 border-b border-pattern pb-3">
                <Calendar size={16} className="text-gold-accent" />
                {TG[lang].recentReflections}
              </span>

              {reflections.length === 0 ? (
                <div className="bg-white border border-pattern rounded-2xl p-10 text-center shadow-sm flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-sand-light rounded-full flex items-center justify-center text-3xl mb-3 border border-pattern">
                    📜
                  </div>
                  <p className="text-xs text-olive-muted max-w-sm leading-relaxed">
                    {TG[lang].noReflectionsYet}
                  </p>
                </div>
              ) : (
                <div className="space-y-5 max-h-[580px] overflow-y-auto pr-1">
                  {reflections.map((ref, i) => (
                    <div key={ref.id} className="bg-white border border-pattern rounded-2xl p-5 shadow-sm relative">
                      {/* Reflection Date Ribbon */}
                      <div className="absolute top-4 right-5 lg:left-5 text-[9px] font-bold text-gold-accent bg-gold-accent/15 px-3 py-1 rounded-full uppercase leading-none font-mono">
                        📅 {ref.date}
                      </div>

                      <div className="space-y-4">
                        <div className="border-b border-pattern/30 pb-3">
                          <p className="text-xs font-extrabold text-olive-deep">
                            {lang === 'en' ? `Family Reflection #${reflections.length - i}` : `دردشة ومراجعة عائلية #${reflections.length - i}`}
                          </p>
                        </div>

                        {/* Went well */}
                        <div className="flex gap-2 items-start text-xs text-text-main leading-relaxed">
                          <span className="p-1 bg-green-50 rounded-lg text-[13px] border border-green-100 flex-shrink-0">✨</span>
                          <div>
                            <p className="font-bold text-olive-deep text-[11px] mb-0.5">{TG[lang].fieldWentWell}</p>
                            <p className="opacity-95">{ref.wentWell}</p>
                          </div>
                        </div>

                        {/* Challenges */}
                        <div className="flex gap-2 items-start text-xs text-text-main leading-relaxed">
                          <span className="p-1 bg-red-50 rounded-lg text-[13px] border border-red-100 flex-shrink-0">🌪️</span>
                          <div>
                            <p className="font-bold text-olive-deep text-[11px] mb-0.5">{TG[lang].fieldChallenges}</p>
                            <p className="opacity-95">{ref.challenges}</p>
                          </div>
                        </div>

                        {/* Support plan */}
                        <div className="flex gap-2 items-start text-xs text-text-main leading-relaxed bg-[#FDFBF7] p-3 rounded-lg border border-pattern/60">
                          <span className="p-1 bg-yellow-50 rounded-lg text-[13px] border border-yellow-100 flex-shrink-0">🤝🏼</span>
                          <div>
                            <p className="font-bold text-olive-deep text-[11px] mb-0.5">{TG[lang].fieldSupport}</p>
                            <p className="opacity-95 text-xs italic font-medium">{ref.supportPlan}</p>
                          </div>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick popup modal for creating custom goals */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border-2 border-pattern rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 text-olive-muted hover:text-text-main hover:bg-sand-light p-1 rounded-full transition-colors"
                title={lang === 'en' ? "Close" : "إغلاق"}
              >
                <X size={18} />
              </button>

              <h4 className="serif-ar text-xl font-bold text-olive-deep mb-2">
                {TG[lang].createGoalBtn}
              </h4>
              <p className="text-[10px] text-olive-muted mb-6">
                {TG[lang].sectionSubtitle}
              </p>

              <form onSubmit={handleSaveCustomGoal} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-main">{TG[lang].customGoal}</label>
                  <input
                    type="text"
                    required
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder={TG[lang].goalTitlePlaceholder}
                    className="bg-sand-light/50 border border-pattern p-2.5 rounded-xl text-xs outline-none focus:ring-1 focus:ring-olive-deep placeholder:opacity-40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-main">{lang === 'en' ? "Goal Emoji:" : "رمز تعبيري للهف:"}</label>
                    <select
                      value={customEmoji}
                      onChange={(e) => setCustomEmoji(e.target.value)}
                      className="bg-sand-light/50 border border-pattern p-2.5 rounded-xl text-xs outline-none focus:ring-1 focus:ring-olive-deep cursor-pointer"
                    >
                      <option value="🌟">🌟 Star</option>
                      <option value="❤️">❤️ Heart</option>
                      <option value="🥘">🥘 Food</option>
                      <option value="🧸">🧸 Toy</option>
                      <option value="📱❌">📱 No Phone</option>
                      <option value="🌳">🌳 Nature</option>
                      <option value="🤝">🤝 Help</option>
                      <option value="☀️">☀️ Sun</option>
                      <option value="🕊️">🕊️ Peace</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-main">{TG[lang].goalTargetLabel}</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      required
                      value={customTarget}
                      onChange={(e) => setCustomTarget(parseInt(e.target.value) || 4)}
                      className="bg-sand-light/50 border border-pattern p-2.5 rounded-xl text-xs outline-none focus:ring-1 focus:ring-olive-deep font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-pattern">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-bold hover:bg-sand-light border border-pattern rounded-xl transition-colors text-text-main"
                  >
                    {TG[lang].btnCancel}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-olive-deep hover:bg-olive-muted text-white rounded-xl shadow-md"
                  >
                    {TG[lang].btnSave}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
