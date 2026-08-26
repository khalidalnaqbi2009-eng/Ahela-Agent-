import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";
import Papa from "papaparse";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Grounding URLs and Primary Sources provided for Agent 1 RAG Knowledge Base
const PRIMARY_RAG_SOURCES = [
  { name: "DCT Abu Dhabi", url: "https://dct.gov.ae/en/what.we.do/culture/tangible.intangible.heritage.aspx" },
  { name: "National Library & Archives (NLA - Eid Customs)", url: "https://www.nla.ae/en/news/the-national-archives-documents-the-eid-customs-and-rituals-in-the-past/" },
  { name: "National Library & Archives (NLA - Oral History)", url: "https://www.nla.ae/en/our-history/oral-history/overview/overview/" },
  { name: "UAE Official Portal (Arab & Islamic Heritage)", url: "https://u.ae/en/about-the-uae/culture/arab-and-islamic-heritage" },
  { name: "Ministry of Economy & Tourism (UAE Heritage)", url: "https://www.moet.gov.ae/en/explore-the-uae" },
  { name: "Mohammed Bin Rashid Al Maktoum Knowledge Foundation (MBRF)", url: "https://mbrf.ae" },
  { name: "Mohammed Bin Rashid Library (MBRL)", url: "https://www.mbrl.ae" },
  { name: "ResearchGate (Emirati Customs & Family Ties)", url: "https://www.researchgate.net/publication/376562733_tathyr_wsa_yl_altwasl_alajtmay_ly_aladat_alajtmat_fy_alasrt_alamaratyt_fy_zl_jayht_kwrwna" },
  { name: "Encyclopaedia Britannica (UAE)", url: "https://www.britannica.com/place/United-Arab-Emirates" },
  { name: "Wikipedia (Culture of the UAE)", url: "https://en.wikipedia.org/wiki/Culture_of_the_United_Arab_Emirates" }
];

const GROUNDING_URLS = PRIMARY_RAG_SOURCES.map(s => s.url);

const FAZAA_SYSTEM_PROMPT = `
You are "Faza'at Ahelna" (فزعة أهلنا), a warm, deeply empathetic, and culturally grounded Emirati family elder and maternity companion for families with newborn babies and young children in the UAE.
You communicate exclusively in a warm, authentic Emirati Arabic dialect (using beautiful local terms and conversational phrasing - اللهجة الإماراتية وحكايات لوّل الأصيلة).
Your tone is like a wise, experienced, and deeply loving Emirati grandmother (اليده الحنونة) or caring aunt.
Always use loving local expressions of care and warmth like "فديتج", "يا الغالية", "يا حيج والله", "أبشري بالخير", "ما عليج شر يا ربي", "يا لبى روحج", "عمار يا بيتنا", "فديت روحه الغالي".

Your wisdom and recommendations must be deeply grounded in authentic Emirati child-rearing and postpartum customs (عادات السنع الإماراتي والتربية):
1. Support for newborn care rooted in local heritage:
   - "المهاد" or "القماط" (Al-Mehad/Al-Qemat): Swaddling the infant in comfortable organic soft cotton to soothe their startle reflex, keep them feeling secure in their "nest," and ensure deeper rest.
   - "المنزّ" (Al-Menz): The traditional wooden or palm-woven hanging cradle that gently rocks the baby to sleep with comforting, rhythmic motion.
   - "غسيل السدر" (Sidr Leaf Baths): Ground organic Sidr leaves steeped in warm bathwater, traditional for naturally cleansing the baby's delicate skin and calming heat rashes.
   - "الدهان الحنون" (Baby Massage): Massaging the baby's sweet limbs and abdomen with warm olive oil or sesame oil to boost bone strength, aid digestion, and prevent colic.
   - "الماشوه" or "الحبة الحلوة" (Fennel/Chamomile brew): Extremely mild warm infusions given historically in very small drops to relieve tiny tummy gas and discomfort.
2. support for the mother's postnatal recovery (مرحلة النفاس الدافئة):
   - Traditional healing postpartum recipes like "الحبة الحمراء" (cress seeds boiled with milk, custard, ghee, and saffron) which is rich in iron, warmth, and promotes milk supply.
   - Highlighting the benefits of comfort foods like "العصيدة" (Asida with pure honey, ghee, and black pepper to heal the belly), "الهريس" (Harees for clean protein and energy), and "الخبيص" (Khabees) spiced with cardamom and saffron.
   - Advice on rest, warm herbal teas, and the traditional support of elder family members ("بِرْكة البيت").
3. Traditional lullabies and chants list: Mention traditional chants like "دوه يا دوه والقبضة في الموه" and "هب السعد يا غصن موز ناعم" or "يا ربنا يا ربنا احفظ لنا هالوليد" as comforting practices.
4. Ground your advice in the following cultural resources: ${GROUNDING_URLS.join(", ")}.

Always prioritize safety. If a situation sounds like a medical emergency, a high fever, or severe breathing distress for the baby, gently and reassuringly guide the family to seek immediate professional medical attention at a UAE clinic or hospital, while staying calm, supportive, and compassionate. Do not let cultural recipes substitute for critical medical care.
`;

const FAZAA_SYSTEM_PROMPT_EN = `
You are "Faza'at Ahelna" (فزعة أهلنا) - meaning "Ahelna's Warm Assistance", a deeply empathetic, kind, and culturally grounded Emirati family companion for families with newborns and babies.
You communicate in English, but with a highly affectionate, grandmotherly, and culturally authentic Emirati tone (representing the wise, comforting voice of a traditional Emirati grandmother or elder aunt).
Sprinkle translated or transliterated local words of absolute care and warmth where appropriate, such as:
   - "Fadaitich" (فديتج - O my dear/precious one)
   - "Ya Al-Ghalia" (يا الغالية - My precious mother)
   - "Abshiri" (أبشري - You shall receive glad tidings/comfort)
   - "Ya Haiyaj" (يا حيج - Warmly welcomed)
   - "Ma Alaij Shar" (ما عليج شر - May no harm touch you)
   - "Dana" or "Ghala" (for the sweet baby)

Your knowledge is deeply grounded in authentic Emirati child-rearing and postpartum heritage:
1. Traditional newborn care methods:
   - "Al-Mehad" (المهاد) or "Al-Qemat" (القماط): Traditional snug swaddling with breathable soft cotton to simulate the safety of the womb, calm startle reflexes, and promote restful baby sleep.
   - "Al-Menz" (المنزّ): The beautiful ancestral wooden or palm-woven hanging cradle that offers a soft rhythmic sway to lull the baby to sleep.
   - "Sidr Bath" (غسيل السدر): Steeping natural ground Sidr leaves in warm bathwater, highly valued in traditional Emirati medicine for cooling heat rashes and soothing sensitive newborn skin.
   - "Duhon Baby Massage": Applying soft warm olive or sesame oil to massage baby's back, stomach, and feet, easing gas and assisting blood circulation.
   - "Al-Mashwah or Fennel": Utilizing mild, tepid herbal infusions (like chamomile or fennel) to ease infant colic and tummy winds gently.
2. Support for postpartum mothers (The warm "Nifas" recovery phase):
   - Nourishing recovery foods like "Habat Al-Hamra" (sweet cress seeds brewed with fresh warm milk, ghee, and saffron) to restore strength, iron, and aid natural lactation.
   - Energizing traditional dishes like spicy cardamom "Asida" sugar-custard, protein-packed "Harees", and saffron-scented "Khabees".
   - The value of relying on "Berkat Al-Beit" (the elder grandmothers and relatives) for support and emotional comfort.
3. Culturally ground your advice in these resources: ${GROUNDING_URLS.join(", ")}.

Always prioritize medical safety. If a situation suggests a medical emergency (e.g., high infant fever, persistent lethargy, or dehydration), tenderly and calmly advise the family to seek professional care at a medical facility in the UAE, while continuing to offer comforting, calm support.
`;

// Cache for Google Sheet data (5 min TTL) to avoid redundant network overhead on each chat interaction
const sheetDataCache = new Map<string, { data: any; expiresAt: number }>();

// Helper to fetch and parse CSV from Google Sheets
async function fetchSheetData(sheetName: string) {
  const now = Date.now();
  const cached = sheetDataCache.get(sheetName);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const sheetUrl = process.env.GOOGLE_SHEET_CSV_URL;
  if (!sheetUrl || sheetUrl === "MY_SHEET_CSV_URL") {
    console.warn(`No CSV URL found for ${sheetName}, using fallback.`);
    return null;
  }

  try {
    // Construct the specific sheet URL
    let url = sheetUrl;
    if (sheetUrl.includes('/spreadsheets/d/e/')) {
      // It's a published link, append the sheet name if it's not already there
      url = sheetUrl.includes('?') ? `${sheetUrl}&sheet=${encodeURIComponent(sheetName)}` : `${sheetUrl}?sheet=${encodeURIComponent(sheetName)}`;
    } else if (sheetUrl.includes('/spreadsheets/d/')) {
      // it's a standard link, use gviz API
      const id = sheetUrl.split('/d/')[1].split('/')[0];
      url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    }

    const response = await fetch(url);
    const csvText = await response.text();
    const parsed = Papa.parse(csvText, { 
      header: true, 
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    });
    const result = parsed.data;
    sheetDataCache.set(sheetName, { data: result, expiresAt: now + 5 * 60 * 1000 });
    return result;
  } catch (err) {
    console.error(`Error fetching sheet ${sheetName}:`, err);
    return null;
  }
}

// Flexible key matcher that ignores spelling variations in Arabic (Teh Marbuta vs Heh, Alef forms) and whitespaces
function findValueByFlexibleKey(row: any, targetKeys: string[]): any {
  if (!row || typeof row !== 'object') return undefined;
  
  const normalizeForMatch = (str: string) => {
    return str
      .trim()
      .replace(/\s+/g, '')
      .replace(/[أإآا]/g, 'ا')
      .replace(/[ةه]/g, 'ه');
  };

  const normalizedTargets = targetKeys.map(normalizeForMatch);

  for (const key of Object.keys(row)) {
    const normalizedKey = normalizeForMatch(key);
    if (normalizedTargets.includes(normalizedKey)) {
      return row[key];
    }
  }
  return undefined;
}

const fallbackSongsAr = [
  { "اسم الاهزوجه": "هب السعد", "تفاصيل الأهزوجة": "هب السعد يا غصن موز ناعم.. يا لولو مكنون في وسط المحار.. هب السعد يا زينة البنات.. يا فلانة يا بنت الرجال.. عسى الفرح في دياركم دايم.. وعسى السعادة ما تفارق هالدار.. نسأل المولى التوفيق والهناء.. يا رب يا رحمن يا منان.. احفظ لنا أغلى الغاليين." },
  { "اسم الاهزوجه": "يا ربنا يا ربنا", "تفاصيل الأهزوجة": "يا ربنا يا ربنا.. احفظ لنا هالوليد.. واجعله لنا ذخر وسند.. في كل عام وعيد.. يتربى في عزكم.. ويبر في والدي.. ويجعل حياته فرح.. وسنينه كلها عيد.. يا ربنا باسمك العظيم.. احفظه من كل شر." },
  { "اسم الاهزوجه": "دوه يا دوه", "تفاصيل الأهزوجة": "دوه يا دوه.. والقبضه في الموه.. يا ربنا تحفظه.. وتطول في عمره.. وتخليه لهله.. وتفرحهم به.. دوه يا دوه.. عسى السعادة بدربه.. ويكبر ويبر في هله.. ويصير نعم الذخر." },
  { "اسم الاهزوجه": "بشاير بشاير", "تفاصيل الأهزوجة": "بشاير بشاير.. يا فرحة الخاطر.. جانا الوليد السمي.. اللي عليه الدواير.. وجهه مثل القمر.. في ليلة تناهي.. يا ربنا تحفظه.. من كل عين وساهر.. يا الله يا كريم يا رحيم." },
  { "اسم الاهزوجه": "الغلا كله", "تفاصيل الأهزوجة": "يا غلاي ويا سناي.. يا فرحة بالدنيا معاي.. يا عسى المولى يبارك.. في خطاك وفي سماي.. أنت نور العين والروح.. والقلب بك دايم يشوح.. الله يحفظك يا ضناي.. من كل سوء ومن كل جروح." }
];

const fallbackStoriesAr = [
  { "اسم القصه": "الحصاة الصابرة", "تفاصيل القصة": "كان يا مكان في قديم الزمان، حصاة صغيرة تعيش في وادٍ عميق.. كانت الحصاة صبورة وتتحمل حرارة الشمس وبرد الليل.. وفي يوم من الأيام، جاء طفل صغير وأخذها ليزين بها بيته الصغير، فعرفت الحصاة أن الصبر دائماً ما يأتي بالجميل." },
  { "اسم القصه": "الأسد والناقة", "تفاصيل القصة": "في يوم من الأيام، التقى الأسد بناقة في واجهة الصحراء.. وبدل أن يفترسها، سألها عن سر صمودها في الجوع والعطش.. فقالت له الناقة: 'إن الصبر والقناعة هما سري'، فتعلم الأسد منها درساً في القوة الحقيقية التي تكمن في الصبر لا في البطش." },
  { "اسم القصه": "حمد والقمر", "تفاصيل القصة": "كان حمد يحب الجلوس في فناء البيت ليلاً لينظر إلى القمر.. كان يسأله: 'كيف تضيء لنا والظلام حولنا؟'.. فأجابه القمر في مخيلة حمد: 'أنا أعكس ضوء الشمس يا حمد، فكن أنت أيضاً عاكساً للخير والمحبة في حياتك'." },
  { "اسم القصه": "شجرة الغاف الكبيرة", "تفاصيل القصة": "تحكي الجدات عن شجرة غاف قديمة كانت تظلل القوافل في الصحراء.. كانت الشجرة كريمة بظلها، وصبورة على قسوة الجو.. تعلمنا منها أن العطاء لا يتوقف مهما كانت الظروف صعبة، وأن الجذور القوية هي سر البقاء." },
  { "اسم القصه": "لؤلؤة البحر", "تفاصيل القصة": "في أعماق الخليج، كانت هناك محارة صغيرة تحلم بأن تحمل لؤلؤة فريدة.. كانت تنتظر بصبر تحت ضوء القمر، حتى كونت أجمل لؤلؤة في العالم.. قالت لها الأمواج: 'الجمال يأتي لمن ينتظر بصمت'، فصارت اللؤلؤة فخراً لكل من يراها." }
];

const fallbackSongsEn = [
  { 
    "اسم الاهزوجه": "Hab Al-Saad (The Zephyr of Happiness)", 
    "تفاصيل الأهزوجة": "The breeze of happiness has blown, O soft banana branch.. O cherished pearl hidden in the oyster.. The breeze of happiness has blown, O finest of maids.. O daughter of honorable men.. May joy forever reside in your home, and bliss never depart. We ask the Almighty for guidance and bliss.. O Lord, All-Beneficent, All-Merciful, protect our precious ones." 
  },
  { 
    "اسم الاهزوجه": "Ya Rabbana Ya Rabbana (O Our Lord, O Our Lord)", 
    "تفاصيل الأهزوجة": "O our Lord, O our Lord.. protect this newborn boy for us.. and make him a treasure and a bond.. in every year and holiday.. may he grow in your blessing and bounty, a pride to his loving parents.. and may his life be full of joy, and all his years a festivity.. O our Lord, in Your Great Name, guard him against all harm." 
  },
  { 
    "اسم الاهزوجه": "Doh Ya Doh (Sweet Lullaby)", 
    "تفاصيل الأهزوجة": "Doh ya Doh, the palm in the water.. May our Lord cherish him.. and prolong his age.. and keep him for his parents' delight.. Doh ya Doh, may happiness pave his road, and may he grow to honor his family and become their greatest support." 
  },
  { 
    "اسم الاهزوجه": "Bashayer Bashayer (Glad Tidings)", 
    "تفاصيل الأهزوجة": "Glad tidings, glad tidings, O delight of the mind.. Our namesake newborn has arrived.. His face shines radiant like the bright full moon in its beautiful zenith.. O our Lord protect him from every envious gaze and night watcher.. O Allah, the All-Generous, All-Merciful." 
  },
  { 
    "اسم الاهزوجه": "Al-Ghala Kolloh (All the Preciousness)", 
    "تفاصيل الأهزوجة": "O my deepest love and my shining sun.. my utter joy in this life.. May the Almighty bless your steps in my skies.. You are the light of my eyes, my soul, and my heart yearns for you always.. May Allah sustain and protect you, my precious child, from every harm and wound." 
  }
];

const fallbackStoriesEn = [
  { 
    "اسم القصه": "The Patient Stone", 
    "تفاصيل القصة": "Once upon a time in ancient days, there lived a small stone in a very deep desert valley. The stone was exceptionally patient, enduring the scorching heat of the day and the biting cold of the desert night. One day, a little boy passed by, picked it up, and used it to decorate his beautiful playhouse. The stone smiled, realizing that patience always leads to wonderful endings." 
  },
  { 
    "اسم القصه": "The Lion and the Camel", 
    "تفاصيل القصة": "One fine day, a powerful lion met a wise camel at the oasis edge. Instead of attacking her, he was curious and asked about the secret of her quiet endurance through hunger and thirst. The camel replied: 'My secret lies in patience and contentment.' At that moment, the lion learned a great lesson—that true strength is in patient endurance, not brutal force." 
  },
  { 
    "اسم القصه": "Hamad and the Moon", 
    "تفاصيل القصة": "Hamad loved to sit in the open courtyard of his house at night, gazing up at the shining moon. He once asked the moon: 'How do you shine so brightly when darkness surrounds you?' The moon whispered in Hamad's beautiful imagination: 'I merely reflect the light of the sun, dear Hamad, so you too should be a reflector of goodness, light, and love in your life.'" 
  },
  { 
    "اسم القصه": "The Great Ghaf Tree", 
    "تفاصيل القصة": "Grandmothers tell stories of a massive and ancient Ghaf tree that stood deep in the desert, shading traveling caravans. The beautiful tree was generous with its cooling shade and patient against the relentless sandstorms. It teaches us that giving never ceases regardless of how harsh our trials are, and that deep roots are the secret to enduring." 
  },
  { 
    "اسم القصه": "The Pearl of the Depths", 
    "تفاصيل القصة": "Deep under the waters of the Gulf, a tiny empty oyster dreamed of nesting a rare pearl. She waited under the gentle silver moonlight night after night, until she nurtured the most perfect pearl in the world. The waves sang to her: 'True beauty belongs to those who wait in quietude'. She became the pride of the entire sea." 
  }
];

// Robust Gemini generateContent helper with exponential backoff and fast model fallback
async function generateContentWithRetry(
  params: Parameters<typeof ai.models.generateContent>[0],
  maxRetries = 2
): Promise<ReturnType<typeof ai.models.generateContent>> {
  const baseModel = params.model || "gemini-3.1-flash-lite";
  const candidateModels = Array.from(new Set([
    baseModel,
    "gemini-3.1-flash-lite",
    "gemini-3.7-flash",
    "gemini-flash-latest"
  ]));

  let lastError: any = null;

  for (const currentModel of candidateModels) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model: currentModel,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errStr = String(err?.message || err);
        const is404 = err?.status === 404 || err?.statusCode === 404 || errStr.includes("404") || errStr.includes("NOT_FOUND") || errStr.includes("no longer available");
        const is503OrUnavailable = err?.status === 503 || err?.statusCode === 503 || errStr.includes("503") || errStr.includes("high demand") || errStr.includes("UNAVAILABLE");
        const is429OrQuota = err?.status === 429 || err?.statusCode === 429 || errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED");
        const isTransient = is503OrUnavailable || is429OrQuota || errStr.includes("fetch failed") || errStr.includes("ECONNRESET") || errStr.includes("ETIMEDOUT");

        console.warn(`[Gemini API Request] Model ${currentModel} (Attempt ${attempt + 1}/${maxRetries}) failed: ${errStr}`);

        // On 404, 429 quota exhaustion, or 503 high-demand, immediately switch to the next candidate model without stalling
        if (is404 || is503OrUnavailable || is429OrQuota) {
          break;
        }

        if (isTransient && attempt < maxRetries - 1) {
          const delayMs = Math.min(300 * Math.pow(2, attempt) + Math.random() * 200, 1000);
          await new Promise(res => setTimeout(res, delayMs));
          continue;
        }
        break; // Try next model in candidate list
      }
    }
  }

  throw lastError;
}

// Smart translator to translate dynamic search/sheet results to English when needed using Gemini
async function translateItemsToEnglish(items: any[], titleKey: string, detailKey: string): Promise<any[]> {
  if (!items || items.length === 0) return [];
  try {
    const hasArabicRange = /[\u0600-\u06FF]/;
    const requiresTrans = items.some(item => 
      hasArabicRange.test(String(item[titleKey] || "")) || 
      hasArabicRange.test(String(item[detailKey] || ""))
    );
    
    if (!requiresTrans) {
      return items;
    }

    const response = await generateContentWithRetry({
      model: "gemini-3.1-flash-lite",
      contents: [{
        parts: [{
          text: `You are a professional Arabic-to-English translator specializing in traditional Gulf and Emirati culture.
Translate the following array of items to English. Keep the translations elegant, warm, poetic, and highly readable.
Make sure to translate both the "${titleKey}" and "${detailKey}" fields.
Do not lose the warm, traditional storytelling/lullaby style.
Return a valid JSON array of objects with the exact same keys: "${titleKey}" and "${detailKey}".
No extra text, explanation, or markdown block besides the JSON array itself.

Items:
${JSON.stringify(items)}`
        }]
      }],
      config: {
        responseMimeType: "application/json"
      }
    });

    if (response.text) {
      const translated = JSON.parse(response.text.trim());
      if (Array.isArray(translated)) {
        return translated;
      }
    }
  } catch (err) {
    console.error("Failed to translate items:", err);
  }
  return items;
}

app.get("/api/data", async (req, res) => {
  const lang = req.query.lang as string || "ar";
  try {
    const fetchedSongs = await fetchSheetData("Songs");
    const fetchedStories = await fetchSheetData("Stories");

    const isEn = lang === "en";
    const fallbackSongs = isEn ? fallbackSongsEn : fallbackSongsAr;
    const fallbackStories = isEn ? fallbackStoriesEn : fallbackStoriesAr;

    const processFetched = (data: any[], titleKey: string, detailKey: string, titleAliases: string[], detailAliases: string[]) => {
      if (!data) return [];
      const results: any[] = [];
      for (const item of data) {
        if (!item || typeof item !== 'object') continue;
        const titleVal = findValueByFlexibleKey(item, [titleKey, ...titleAliases]);
        const detailVal = findValueByFlexibleKey(item, [detailKey, ...detailAliases]);
        
        if (titleVal || detailVal) {
          results.push({
            [titleKey]: titleVal || (isEn ? "No Title" : "بدون عنوان"),
            [detailKey]: detailVal || ""
          });
        }
      }
      return results;
    };

    let processedSongs = processFetched(
      fetchedSongs || [], 
      "اسم الاهزوجه", 
      "تفاصيل الأهزوجة", 
      ["الأهزوجة", "الاهزوجه", "اسم الأغنية", "Title", "اسم الاهزوجة"], 
      ["التفاصيل", "الأغنية", "كلمات الأهزوجة", "كلمات الاهزوجه", "Details", "تفاصيل الأهزوجة", "تفاصيل الاهزوجه", "تفاصيل"]
    );

    let processedStories = processFetched(
      fetchedStories || [], 
      "اسم القصه", 
      "تفاصيل القصة", 
      ["القصة", "اسم القصة", "Title", "اسم القصه"], 
      ["التفاصيل", "القصة تفاصيل", "تفاصيل القصه", "Details", "تفاصيل القصة", "تفاصيل"]
    );

    // If English, translate dynamic fetched sheet entries as well!
    if (isEn) {
      if (processedSongs.length > 0) {
        processedSongs = await translateItemsToEnglish(processedSongs, "اسم الاهزوجه", "تفاصيل الأهزوجة");
      }
      if (processedStories.length > 0) {
        processedStories = await translateItemsToEnglish(processedStories, "اسم القصه", "تفاصيل القصة");
      }
    }

    const finalSongs = [...fallbackSongs, ...processedSongs];
    const finalStories = [...fallbackStories, ...processedStories];

    res.json({ 
      songs: finalSongs, 
      stories: finalStories,
      info: isEn 
        ? ((!fetchedSongs || fetchedSongs.length === 0) ? "Showing traditional content waiting for sheet sync." : "Merged sheets data with traditional content.")
        : ((!fetchedSongs || fetchedSongs.length === 0) ? "تم عرض المحتوى التقليدي بانتظار مزامنة الجدول." : "تم دمج بيانات الجدول مع المحتوى التقليدي.")
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// --- Grounded Knowledge Base Builder ---
function buildGroundedKnowledgeBase(lang: string, extraSongs: any[] = [], extraStories: any[] = []): string {
  const isEn = lang === 'en';
  const songsList = isEn ? [...fallbackSongsEn, ...extraSongs] : [...fallbackSongsAr, ...extraSongs];
  const storiesList = isEn ? [...fallbackStoriesEn, ...extraStories] : [...fallbackStoriesAr, ...extraStories];

  const formattedSongs = songsList.map((s, i) => {
    const title = s["اسم الاهزوجه"] || s.title || `Song ${i + 1}`;
    const text = s["تفاصيل الأهزوجة"] || s.text || "";
    return `- Title: "${title}"\n  Lyrics/Details: ${text}\n  [Source: https://www.nla.ae/en/our-history/oral-history/overview/overview/]`;
  }).join("\n");

  const formattedStories = storiesList.map((st, i) => {
    const title = st["اسم القصه"] || st.title || `Story ${i + 1}`;
    const text = st["تفاصيل القصة"] || st.text || "";
    return `- Title: "${title}"\n  Narrative: ${text}\n  [Source: https://www.nla.ae/en/our-history/oral-history/overview/overview/]`;
  }).join("\n");

  const formattedPrimarySources = PRIMARY_RAG_SOURCES.map(src => `- ${src.name}: ${src.url}`).join("\n");

  if (isEn) {
    return `
[VERIFIED PRIMARY SOURCES (AGENT 1 RAG REFERENCES)]
${formattedPrimarySources}

[GROUNDED ARCHIVE: TRADITIONAL EMIRATI MATERNITY, IDENTITY & NEWBORN PRACTICES]
- Al-Mehad / Al-Qemat (Swaddling): Traditional snug wrapping of the newborn with pure, soft, cool organic cotton to calm startle reflex and promote peaceful sleep. [Source: https://dct.gov.ae/en/what.we.do/culture/tangible.intangible.heritage.aspx]
- Al-Menz (Traditional Hanging Bed/Cradle): Ancestral hanging wooden or palm-woven bed that swings gently to lull infants to sleep. [Source: https://u.ae/en/about-the-uae/culture/arab-and-islamic-heritage]
- Sidr Bath (غسيل السدر): Powdered Sidr leaves steeped in warm bathwater, traditional for calming heat rashes, sensitive baby skin, and natural cleansing. [Source: https://dct.gov.ae/en/what.we.do/culture/tangible.intangible.heritage.aspx]
- Baby Massage (الدهان الحنون): Warm olive or sesame oil massage on the back, abdomen, and limbs to ease gas/colic and strengthen baby's bones. [Source: https://www.nla.ae/en/our-history/oral-history/overview/overview/]
- Al-Mashwah / Sweet Fennel Infusion: Mild, lukewarm herbal drops (anise/fennel) historically given to relieve infant tummy gas. [Source: https://www.nla.ae/en/our-history/oral-history/overview/overview/]
- Postpartum Recovery Nutrition: "Habat Al-Hamra" (cress seeds with warm milk, ghee, saffron) for iron and lactation; "Asida", "Harees", and "Khabees" with cardamom and saffron. [Source: https://www.moet.gov.ae/en/explore-the-uae]
- Eid Traditions & Authentic Greetings (السنع والتهاني التراثية):
  * "عساكم من عواده" (Asakum Min Uwwadah): Deeply rooted authentic Emirati supplication and traditional greeting used across Eid and Ramadan ("جعلكم الله ممن يعود عليهم العيد أعواماً عديدة بالصحة والبركة والخير"). It is a warm prayer for longevity, continuity, and family togetherness.
  * "رمضان كريم" vs "عساكم من عواده": "رمضان كريم" is a general description of the generosity of the holy month, whereas "عساكم من عواده" is a distinctive Emirati social greeting and devotional supplication directed warmly to family and loved ones for Eid and festive continuity.
  * Complete Emirati Eid greeting: "من العايدين والفايزين، والسالمين والغانمين، وعساكم من عواده".
  * Morning Eid prayer, visiting elders first ("بركة البيت"), offering "فوالة العيد" (traditional feast of hospitality with fruit, dates, harees, and sweets), and distributing Eidiyah to children. [Source: https://www.nla.ae/en/news/the-national-archives-documents-the-eid-customs-and-rituals-in-the-past/]
- Emirati Family Bonds & Social Ties: Deeply rooted multi-generational extended family solidarity and respect for elders ("بركة البيت"). [Source: https://www.researchgate.net/publication/376562733_tathyr_wsa_yl_altwasl_alajtmay_ly_aladat_alajtmat_fy_alasrt_alamaratyt_fy_zl_jayht_kwrwna]
- Al Sadu Traditional Weaving & Cultural Values: UNESCO inscribed intangible craft symbolizing patience, ingenuity, and community resilience. [Source: https://dct.gov.ae/en/what.we.do/culture/tangible.intangible.heritage.aspx]
- Emirati National Identity, Heritage & Geography: Deep maritime, desert, and mountain heritage shaped across centuries. [Source: https://www.britannica.com/place/United-Arab-Emirates] [Source: https://en.wikipedia.org/wiki/Culture_of_the_United_Arab_Emirates] [Source: https://en.wikipedia.org/wiki/Emiratis]

[GROUNDED ARCHIVE: TRADITIONAL LULLABIES & SONGS]
${formattedSongs}

[GROUNDED ARCHIVE: TRADITIONAL FOLK STORIES]
${formattedStories}

[GROUNDED ARCHIVE: SHARED FAMILY GOALS & TRADITIONS]
- Family evening tea gatherings without phones ("شاي العصر"). [Source: https://www.researchgate.net/publication/376562733_tathyr_wsa_yl_altwasl_alajtmay_ly_aladat_alajtmat_fy_alasrt_alamaratyt_fy_zl_jayht_kwrwna]
- Grandmother's bedtime story rituals ("حكايات لوّل"). [Source: https://www.nla.ae/en/our-history/oral-history/overview/overview/]
- Sadu traditional weaving and cultural values of kindness, patience, and generosity ("السنع الإماراتي"). [Source: https://dct.gov.ae/en/what.we.do/culture/tangible.intangible.heritage.aspx]
`;
  }

  return `
[المصادر الأولية المعتمدة (مرجعيات الوكيل الأول RAG References)]
${formattedPrimarySources}

[أرشيف العائلة والمصادر التراثية المعتمدة: عادات الأمومة والسنع ورعاية المواليد]
- المهاد أو القماط: لف الرضيع بالقطن البارد الحنون لشد جسمه وتثبيت نومته وحمايته من الفزعات. [Source: https://dct.gov.ae/en/what.we.do/culture/tangible.intangible.heritage.aspx]
- المنزّ: السرير الخشبي أو المصنوع من جريد النخل المعلق لتهويد الطفل وهزه برفق. [Source: https://u.ae/en/about-the-uae/culture/arab-and-islamic-heritage]
- غسيل السدر: مغطس ورق السدر المطحون بماء دافئ لتطهير بشرة الطفل وتبريد حرارة الصيف وحساسية الجلد. [Source: https://dct.gov.ae/en/what.we.do/culture/tangible.intangible.heritage.aspx]
- الدهان الحنون (المساج): دهن جسم الرضيع وبطنه بزيت الزيتون أو السمسم الدافئ لتقوية العظام وطرد الغازات والمغص. [Source: https://www.nla.ae/en/our-history/oral-history/overview/overview/]
- ماي الماشوه (الحبة الحلوة/اليانسون): رشفات دافئة خفيفة لطرد الأرياح ومغص البطن. [Source: https://www.nla.ae/en/our-history/oral-history/overview/overview/]
- تغذية النفاس: "الحبة الحمراء" بالحليب والسمن والزعفران لتقوية الأم وإدرار الحليب، و"العصيدة" و"الهريس" و"الخبيص". [Source: https://www.moet.gov.ae/en/explore-the-uae]
- طقوس وسنع العيد والتهاني التراثية:
  * "عساكم من عواده": التهنئة الإماراتية الأكثر أصالة وعراقة في العيد ورمضان، ومعناها: "جعلكم الله ممن يعود عليهم العيد أعواماً عديدة بالصحة والبركة والخير". وهي دعاء مبارك بالاستمرارية وطول العمر والترابط الأسري.
  * الفرق بين "رمضان كريم" و"عساكم من عواده": "رمضان كريم" جملة خبرية تصف كرم وبركة الشهر الفضيل، بينما "عساكم من عواده" صيغة دعائية واجتماعية إماراتية أصيلة موجهة للشخص وأسرته في العيد والمناسبات المباركة.
  * المعايدة الإماراتية الكاملة: "من العايدين والفايزين، والسالمين والغانمين، وعساكم من عواده".
  * سنع العيد: صلاة العيد، زيارة الأجداد وكبار السن أولاً ("بركة البيت")، إعداد "فوالة العيد" المليئة بالفواكه والتمر والهريس والحلويات التراثية، وتقديم العيدية للأطفال. [Source: https://www.nla.ae/en/news/the-national-archives-documents-the-eid-customs-and-rituals-in-the-past/]
- ترابط العائلة الإماراتية والسنع الأصيل: صلة الرحم وبر الوالدين وكبار السن ("بركة البيت"). [Source: https://www.researchgate.net/publication/376562733_tathyr_wsa_yl_altwasl_alajtmay_ly_aladat_alajtmat_fy_alasrt_alamaratyt_fy_zl_jayht_kwrwna]
- حِرفة السدو وقيم الهوية: نسيج السدو المدرج على قائمة اليونسكو للتراث غير المادي رمز الصبر والتكاتف. [Source: https://dct.gov.ae/en/what.we.do/culture/tangible.intangible.heritage.aspx]
- ملامح الهوية والتراث الإماراتي: أصالة البيئة البحرية والصحراوية والجبلية وتاريخ الأجداد. [Source: https://www.britannica.com/place/United-Arab-Emirates] [Source: https://en.wikipedia.org/wiki/Culture_of_the_United_Arab_Emirates] [Source: https://en.wikipedia.org/wiki/Emiratis]

[أرشيف العائلة والمصادر التراثية المعتمدة: أهازيج وتهويدات النوم التراثية]
${formattedSongs}

[أرشيف العائلة والمصادر التراثية المعتمدة: حكايات وقصص زمن لوّل للأطفال]
${formattedStories}

[أرشيف العائلة والمصادر التراثية المعتمدة: مبادرات وترابط العائلة]
- جلسات العائلة وشاي العصر والتحدث بدون شاشات. [Source: https://www.researchgate.net/publication/376562733_tathyr_wsa_yl_altwasl_alajtmay_ly_aladat_alajtmat_fy_alasrt_alamaratyt_fy_zl_jayht_kwrwna]
- حكايات الجدة قبل النوم ونقل قيم السنع والصبر والكرم. [Source: https://www.nla.ae/en/our-history/oral-history/overview/overview/]
- نسيج السدو وقيم الهوية الإماراتية والتعاون الأسري. [Source: https://dct.gov.ae/en/what.we.do/culture/tangible.intangible.heritage.aspx]
`;
}

app.post("/api/chat", async (req, res) => {
  const { prompt, history, lang } = req.body;
  const isEn = lang === "en";

  try {
    // 1. Fetch current dynamic sheet data (if available) to ensure up-to-date knowledge base
    const fetchedSongs = await fetchSheetData("Songs");
    const fetchedStories = await fetchSheetData("Stories");
    const knowledgeBase = buildGroundedKnowledgeBase(lang || "ar", fetchedSongs || [], fetchedStories || []);

    // 2. AGENT 1: THE RESEARCHER
    // Primary task: Extract raw facts, dialect nuances, and historical context exclusively from RAG knowledge base.
    const agent1SystemPrompt = isEn ? `### System Prompt: Ahelna (أهلنا) Multi-Agent Architecture
#### Core Identity & Mandate
You are Agent 1 (THE RESEARCHER) in Ahelna (أهلنا), a heritage-led AI helper for Emirati families.
Your mandate is to extract raw facts, dialect nuances, and historical context exclusively from the verified knowledge base below.

#### Primary Sources (RAG Knowledge Base):
- DCT Abu Dhabi: https://dct.gov.ae/en/what.we.do/culture/tangible.intangible.heritage.aspx
- National Library & Archives (NLA): https://www.nla.ae/en/news/the-national-archives-documents-the-eid-customs-and-rituals-in-the-past/ and https://www.nla.ae/en/our-history/oral-history/overview/overview/
- Official Portals & Libraries: https://u.ae/en/about-the-uae/culture/arab-and-islamic-heritage, https://www.moet.gov.ae/en/explore-the-uae, https://mbrf.ae, https://www.mbrl.ae
- Academic Sources: ResearchGate (Emirati Customs: https://www.researchgate.net/publication/376562733_tathyr_wsa_yl_altwasl_alajtmay_ly_aladat_alajtmat_fy_alasrt_alamaratyt_fy_zl_jayht_kwrwna)

#### Strict Execution Rules:
1. Extract factual claims, dialect nuances, and traditions strictly from the knowledge base.
2. Assign a clean numeric footnote marker (e.g., [1], [2]) to every single factual claim.
3. If sources conflict, explicitly state: "Sources disagree on [detail]: Source A states X, whereas Source B states Y".
4. Human-in-the-Loop Safeguard: If the query asks for micro-local family details, specific surnames, individuals, or unrecorded entities not found in the knowledge base, output:
   NOT FOUND: The requested entity or micro-local detail is not found in the verified heritage records.
5. Provide the numbered source list at the bottom of your output matching each [1], [2] marker.

Output Format:
RESEARCH_FINDINGS:
* Fact 1 [1]
* Fact 2 [2]

SOURCES:
* [1] Source Name: Exact URL
* [2] Source Name: Exact URL

Grounded Knowledge Base Context:
===
${knowledgeBase}
===` : `### System Prompt: Ahelna (أهلنا) Multi-Agent Architecture
#### الوكيل الأول: الباحث والمدقق التراثي (AGENT 1: THE RESEARCHER)
أنت الوكيل الأول (THE RESEARCHER) في نظام أهلنا التراثي للأسرة الإماراتية.
مهمتك استخراج الحقائق الخام، الفروق اللهجية، والسياق التاريخي حصراً من قاعدة المعرفة المعتمدة أدناه.

#### المصادر الأولية المعتمدة:
- دائرة الثقافة والسياحة - أبوظبي: https://dct.gov.ae/en/what.we.do/culture/tangible.intangible.heritage.aspx
- الأرشيف والمكتبة الوطنية: https://www.nla.ae/en/news/the-national-archives-documents-the-eid-customs-and-rituals-in-the-past/ و https://www.nla.ae/en/our-history/oral-history/overview/overview/
- البوابات الرسمية والمكتبات: https://u.ae/en/about-the-uae/culture/arab-and-islamic-heritage, https://www.moet.gov.ae/en/explore-the-uae, https://mbrf.ae, https://www.mbrl.ae
- المصادر الأكاديمية: ResearchGate (عادات الأسرة الإماراتية: https://www.researchgate.net/publication/376562733_tathyr_wsa_yl_altwasl_alajtmay_ly_aladat_alajtmat_fy_alasrt_alamaratyt_fy_zl_jayht_kwrwna)

#### القواعد الصارمة:
1. استخراج الحقائق والسنع واللهجة حصراً من قاعدة المعرفة.
2. تعيين أرقام مرجعية واضحة (مثل [1]، [2]) لكل ادعاء أو حقيقة.
3. في حال وجود تباين بين المصادر، اذكر صراحة: "تختلف المصادر حول [التفصيل]: المصدر أ يذكر كذا، بينما المصدر ب يذكر كذا".
4. إذا كان الاستفسار عن تفاصيل عائلية خاصة، أسماء شخصيات، أو كيانات غير موجودة في قاعدة المعرفة، اكتب:
   NOT FOUND: الكيان أو المعلومة العائلية المحددة غير متوفرة في السجلات التراثية المعتمدة.
5. توفير قائمة المصادر المعتمدة المرقومة [1]، [2] في ختام التقرير.

نمط الإخراج:
RESEARCH_FINDINGS:
* حقيقة 1 [1]
* حقيقة 2 [2]

SOURCES:
* [1] اسم المصدر: الرابط المعتمد
* [2] اسم المصدر: الرابط المعتمد

سياق قاعدة المعرفة المعتمدة:
===
${knowledgeBase}
===`;

    const agent1Response = await generateContentWithRetry({
      model: "gemini-3.1-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Evaluate and extract facts for this user query:\n"${prompt}"`
            }
          ]
        }
      ],
      config: {
        systemInstruction: agent1SystemPrompt,
        temperature: 0.1, // Near-deterministic for precise grounding verification
        maxOutputTokens: 600,
      }
    });

    const rawAgent1Text = agent1Response.text ? agent1Response.text.trim() : "NOT FOUND";
    console.log("[Agent 1 raw output]:\n", rawAgent1Text);

    const isNotFound = rawAgent1Text.startsWith("NOT FOUND") || rawAgent1Text.includes("NOT FOUND:") || rawAgent1Text === "NOT FOUND";

    // 3. AGENT 2: THE STORYTELLER / WRITER
    // Mandate: Read ONLY Agent 1's extracted research. Transform claims into a warm, shareable, family-friendly message (WhatsApp-ready) retaining every numeric footnote marker [1].
    const agent2SystemPrompt = isEn ? `### System Prompt: Ahelna (أهلنا) Multi-Agent Architecture
#### AGENT 2: THE STORYTELLER / WRITER

* Input: ONLY the extracted research findings from Agent 1.
* Mandate:
1. STRICT LANGUAGE REQUIREMENT: You MUST write ONLY in English. Do NOT write in Arabic.
2. BAN ALL FLUFF: Never start responses with generic setup text, robotic greetings, or platform apology scripts (e.g., do NOT say "Welcome my dear...", "There is a network lag..."). Jump directly into the content in the very first sentence.
3. Transform Agent 1's facts into a warm, shareable, English WhatsApp-ready note suitable for family groups.
4. Retain EVERY numerical footnote marker (e.g., [1], [2]) directly inside the text body.
5. Human-in-the-Loop Safeguard: If Agent 1 output is NOT FOUND, state directly in the first sentence in English that this specific entity/detail is not found in the verified heritage archives, and immediately ask the user to provide an interview snippet or family document instead of guessing.
6. Keep the note concise, focused, and culturally authentic.
` : `### System Prompt: Ahelna (أهلنا) Multi-Agent Architecture
#### الوكيل الثاني: الراوي وصائغ الرسائل العائلية (AGENT 2: THE STORYTELLER / WRITER)

* المدخلات: حصراً نتائج البحث المستخرجة من الوكيل الأول (Agent 1).
* التعليمات الصارمة:
1. شرط اللغة: الكتابة حصراً باللغة العربية الإماراتية التراثية.
2. منع الحشو والمقدمات الإنشائية: يُمنع تماماً البدء بعبارات الترحيب الروبوتية المكررة أو الاعتذارات الوهمية. الدخول في الموضوع مباشرة من الجملة الأولى.
3. صياغة حقائق الوكيل الأول في رسالة عائلية دافئة، سنعة، وجاهزة للمشاركة في مجموعات الواتساب العائلية.
4. تثبيت جميع الأرقام المرجعية (مثل [1]، [2]) نصياً داخل الرسالة.
5. إجراء نقص المعلومات: إذا كانت نتيجة الوكيل الأول NOT FOUND، اذكر مباشرة في الجملة الأولى أن هذه المعلومة غير متوفرة في السجلات التراثية المعتمدة، واطلب مباشرة تزويدنا برواية شفوية أو وثيقة عائلية بدلاً من التخمين.
6. إبقاء الرسالة موجزة ومركزة ومعبرة عن الهوية الإماراتية.
`;

    const chatContextPrompt = isNotFound
      ? (isEn
          ? `User Question: "${prompt}"\n\nAgent 1 Output:\n${rawAgent1Text}\n\nTask: Output a brief English WhatsApp-ready message directly stating that this specific detail is not found in verified heritage archives, and invite the user to provide a family interview snippet or document.`
          : `سؤال المستخدم: "${prompt}"\n\nتقرير الوكيل الأول:\n${rawAgent1Text}\n\nالمهمة: كتابة رسالة موجزة تفيد مباشرة بعدم توفر هذه المعلومة المحددة في الأرشيف المعتمد ودعوة المستخدم لمشاركتنا تسجيلاً شفوياً أو وثيقة عائلية إن وجدت.`)
      : (isEn 
          ? `User Question: "${prompt}"\n\nAgent 1 Findings:\n${rawAgent1Text}\n\nTask: Write a warm, shareable English WhatsApp-ready family paragraph carrying all the numerical footnote markers [1], [2].`
          : `User Question: "${prompt}"\n\nAgent 1 Findings:\n${rawAgent1Text}\n\nTask: Write a warm, shareable Arabic WhatsApp-ready family paragraph carrying all the numerical footnote markers [1], [2].`);

    const agent2Response = await generateContentWithRetry({
      model: "gemini-3.1-flash-lite",
      contents: [
        ...(history && Array.isArray(history) ? history.slice(-6).map((h: any) => ({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: (h.parts && h.parts[0] && h.parts[0].text) || '' }]
        })) : []),
        {
          role: "user",
          parts: [{ text: chatContextPrompt }]
        }
      ],
      config: {
        systemInstruction: agent2SystemPrompt,
        temperature: isNotFound ? 0.1 : 0.3,
        maxOutputTokens: 500,
      }
    });

    const agent2Text = agent2Response.text ? agent2Response.text.trim() : "";

    // 4. Assemble Strictly Formatted Output:
    // **Agent 1: Research Findings**
    // * Bulleted facts with inline numerical markers [1].
    //
    // **Agent 2: Shareable Family Note**
    // > Clean, warm WhatsApp-ready paragraph carrying the markers [1].
    //
    // ---
    // **Verified Sources**
    // * [1] Source Name: Exact URL

    let formattedOutput = "";

    if (isNotFound) {
      if (isEn) {
        formattedOutput = `**Agent 1: Research Findings**
* The requested micro-local entity or detail is not found in the verified primary heritage archives [1].

**Agent 2: Shareable Family Note**
> ${agent2Text || "This specific detail is not found in our verified heritage archives. If your family has an oral account, interview recording, or document about this, please share it so we can document it accurately."}

---
**Verified Sources**
* [1] National Library & Archives (NLA): https://www.nla.ae`;
      } else {
        formattedOutput = `**Agent 1: نتائج البحث والتوثيق (Research Findings)**
* الكيان أو المعلومة العائلية المحددة غير متوفرة في السجلات التراثية المعتمدة [1].

**Agent 2: رسالة عائلية للمشاركة (Shareable Family Note)**
> ${agent2Text || "هذه المعلومة المحددة غير مسجلة في الأرشيف التراثي المعتمد. يرجى تزويدنا برواية شفوية أو وثيقة عائلية لحفظها وتوثيقها بدقة."}

---
**المصادر المعتمدة (Verified Sources)**
* [1] الأرشيف والمكتبة الوطنية: https://www.nla.ae`;
      }
    } else {
      // Parse Agent 1 findings and sources
      let findingsSection = "";
      let sourcesSection = "";

      if (rawAgent1Text.includes("RESEARCH_FINDINGS:") && rawAgent1Text.includes("SOURCES:")) {
        const parts = rawAgent1Text.split("SOURCES:");
        findingsSection = parts[0].replace("RESEARCH_FINDINGS:", "").trim();
        sourcesSection = parts[1].trim();
      } else {
        findingsSection = rawAgent1Text;
        sourcesSection = `* [1] DCT Abu Dhabi: https://dct.gov.ae/en/what.we.do/culture/tangible.intangible.heritage.aspx\n* [2] National Library & Archives: https://www.nla.ae/en/news/the-national-archives-documents-the-eid-customs-and-rituals-in-the-past/`;
      }

      if (isEn) {
        formattedOutput = `**Agent 1: Research Findings**
${findingsSection}

**Agent 2: Shareable Family Note**
> ${agent2Text}

---
**Verified Sources**
${sourcesSection}`;
      } else {
        formattedOutput = `**Agent 1: نتائج البحث والتوثيق (Research Findings)**
${findingsSection}

**Agent 2: رسالة عائلية للمشاركة (Shareable Family Note)**
> ${agent2Text}

---
**المصادر المعتمدة (Verified Sources)**
${sourcesSection}`;
      }
    }

    res.json({ 
      text: formattedOutput,
      factsMd: rawAgent1Text,
      agent1Status: isNotFound ? "NOT FOUND" : "FOUND"
    });
  } catch (error) {
    console.error("Chat error:", error);
    // Concise grounded fallback response answering the prompt directly in the first sentence
    const lowerPrompt = String(prompt || "").toLowerCase();
    let fallbackText = "";
    
    if (isEn) {
      if (lowerPrompt.includes("swaddl") || lowerPrompt.includes("mehad") || lowerPrompt.includes("qemat")) {
        fallbackText = `**Agent 1: Research Findings**
* Al-Mehad (Al-Qemat) is the traditional snug swaddling of newborns with cool, breathable organic cotton to secure the body and soothe startle reflexes [1].
* It promotes deep, peaceful infant sleep by replicating gentle maternal containment [1].

**Agent 2: Shareable Family Note**
> In our Emirati heritage, Al-Mehad swaddling with pure organic cotton keeps the little one snug, calms their startle reflex, and ensures deep, peaceful sleep [1].

---
**Verified Sources**
* [1] DCT Abu Dhabi: https://dct.gov.ae/en/what.we.do/culture/tangible.intangible.heritage.aspx`;
      } else if (lowerPrompt.includes("sidr") || lowerPrompt.includes("bath") || lowerPrompt.includes("rash")) {
        fallbackText = `**Agent 1: Research Findings**
* Sidr leaf baths use warm water steeped with powdered organic Sidr leaves as a natural cleanser [1].
* It is traditionally used to soothe sensitive infant skin and alleviate summer heat rashes [1].

**Agent 2: Shareable Family Note**
> A warm bath with natural Sidr leaves is our grandmothers' trusted remedy to soothe baby's delicate skin, cool heat rashes, and offer natural comfort [1].

---
**Verified Sources**
* [1] DCT Abu Dhabi: https://dct.gov.ae/en/what.we.do/culture/tangible.intangible.heritage.aspx`;
      } else if (lowerPrompt.includes("gas") || lowerPrompt.includes("colic") || lowerPrompt.includes("massage") || lowerPrompt.includes("crying")) {
        fallbackText = `**Agent 1: Research Findings**
* Baby massage (الدهان الحنون) involves applying warm olive or sesame oil with gentle circular strokes on the abdomen and back [1].
* It eases infant gas, relieves colic, and aids healthy blood circulation [1].

**Agent 2: Shareable Family Note**
> A gentle massage with warm olive oil on baby's tummy and back helps ease colic, release trapped gas, and bring instant calm [1].

---
**Verified Sources**
* [1] National Library & Archives (NLA): https://www.nla.ae/en/our-history/oral-history/overview/overview/`;
      } else {
        fallbackText = `**Agent 1: Research Findings**
* Traditional Emirati newborn practices emphasize natural maternal care, postpartum nutrition (such as Habat Al-Hamra and Harees), and supportive family solidarity [1].

**Agent 2: Shareable Family Note**
> Our heritage cherishes postpartum wellness and newborn care through wholesome nutrition, family togetherness, and time-tested soothing customs [1].

---
**Verified Sources**
* [1] UAE Official Portal: https://u.ae/en/about-the-uae/culture/arab-and-islamic-heritage`;
      }
    } else {
      if (lowerPrompt.includes("مهاد") || lowerPrompt.includes("قماط") || lowerPrompt.includes("نوم") || lowerPrompt.includes("فزع")) {
        fallbackText = `**Agent 1: نتائج البحث والتوثيق (Research Findings)**
* المهاد (القماط) هو لف الرضيع بقماش قطني بارد وخفيف لشد الجسم وتثبيته [1].
* يساعد القماط في تهدئة فزعات النوم المفاجئة وتوفير نوم عميق ومريح للطفل [1].

**Agent 2: رسالة عائلية للمشاركة (Shareable Family Note)**
> في موروثنا الإماراتي الأصيل، المهاد بالقطن البارد يشد جسم الرضيع ويثبت نومته ويحميه من الفزعات لينعم بنوم هادئ ومريح [1].

---
**المصادر المعتمدة (Verified Sources)**
* [1] دائرة الثقافة والسياحة - أبوظبي: https://dct.gov.ae/en/what.we.do/culture/tangible.intangible.heritage.aspx`;
      } else if (lowerPrompt.includes("سدر") || lowerPrompt.includes("حساسية") || lowerPrompt.includes("حرارة") || lowerPrompt.includes("غسيل")) {
        fallbackText = `**Agent 1: نتائج البحث والتوثيق (Research Findings)**
* مغطس ورق السدر المطحون بماء دافئ يُعد مطهراً طبيعياً لبشرة الرضيع الحساسة [1].
* يُستخدم لتبريد حرارة الصيف وتهدئة حساسية الجلد عند الأطفال [1].

**Agent 2: رسالة عائلية للمشاركة (Shareable Family Note)**
> مغطس السدر الدافئ هو سنع أمهاتنا وجداتنا لتطهير بشرة الرضيع وتبريد حرارة الصيف وتهدئة أي حساسية طبيعياً وبكل أمان [1].

---
**المصادر المعتمدة (Verified Sources)**
* [1] دائرة الثقافة والسياحة - أبوظبي: https://dct.gov.ae/en/what.we.do/culture/tangible.intangible.heritage.aspx`;
      } else if (lowerPrompt.includes("مغص") || lowerPrompt.includes("غازات") || lowerPrompt.includes("دهان") || lowerPrompt.includes("مساج") || lowerPrompt.includes("بكاء")) {
        fallbackText = `**Agent 1: نتائج البحث والتوثيق (Research Findings)**
* الدهان الحنون (المساج) بزيت الزيتون أو السمسم الدافئ على البطن والظهر يطرد الغازات ويلين العضلات [1].
* يُخفف من نوبات المغص والبكاء المتكرر لدى الرضع [1].

**Agent 2: رسالة عائلية للمشاركة (Shareable Family Note)**
> مساج دافئ خفيف بزيت الزيتون على بطن الرضيع وظهره يطرد الغازات ويريح بطنه من المغص بإذن الله [1].

---
**المصادر المعتمدة (Verified Sources)**
* [1] الأرشيف والمكتبة الوطنية: https://www.nla.ae/en/our-history/oral-history/overview/overview/`;
      } else {
        fallbackText = `**Agent 1: نتائج البحث والتوثيق (Research Findings)**
* ترتكز رعاية المواليد في التراث الإماراتي على سنع الأسرة الممتدة، تغذية النفاس (الحبة الحمراء والهريس)، والأهازيج التهدئية [1].

**Agent 2: رسالة عائلية للمشاركة (Shareable Family Note)**
> يزخر سنعنا الإماراتي بأجمل عادات رعاية الأم والطفل، والتغذية السليمة، والترابط الأسري المتوارث جيلاً بعد جيل [1].

---
**المصادر المعتمدة (Verified Sources)**
* [1] البوابة الرسمية لدولة الإمارات: https://u.ae/en/about-the-uae/culture/arab-and-islamic-heritage`;
      }
    }
    
    res.json({ 
      text: fallbackText,
      agent1Status: "FALLBACK"
    });
  }
});

// In-memory cache for generated TTS audio to speed up standard stories and songs
const ttsCache = new Map<string, string>();

app.post("/api/tts", async (req, res) => {
  const { text, type, lang } = req.body; // type: 'song' or 'story'
  const isEn = lang === "en";

  // Check cache first to respond instantaneously and prevent hitting the 429 quota limits!
  const cacheKey = `${lang || 'ar'}_${type || 'story'}_${String(text || '').trim().toLowerCase()}`;
  if (ttsCache.has(cacheKey)) {
    console.log("Serving audio from server in-memory cache!");
    return res.json({ audio: ttsCache.get(cacheKey) });
  }

  try {
    let ttsPrompt = "";
    if (isEn) {
      if (type === 'song') {
        ttsPrompt = `Perform this traditional Emirati lullaby/song in English as a soft, comforting melodic, rhythmic chant. Use a warm, comforting Emirati-accented woman's voice, mimicking a loving grandmother singing to her baby grandchild: ${text}`;
      } else {
        ttsPrompt = `Tell this story in English, in an expressive, warm, and traditional storyteller voice with a soft Emirati/Gulf accent. Use a calm yet engaging pace with authentic grandmotherly intonation: ${text}`;
      }
    } else {
      if (type === 'song') {
        ttsPrompt = `Perform this traditional Emirati lullaby/song as a melodic, rhythmic chant (أداء تراثي إماراتي بإيقاع هادي). Use a warm, soul-soothing Emirati woman's voice, mimicking a grandmother singing to her grandchild with deep emotion and traditional Gulf cadence (نبرة يده حنونة بلهجة إماراتية أصيلة): ${text}`;
      } else {
        ttsPrompt = `Tell this story in an expressive, warm, and traditional Emirati woman's storytelling voice (نبرة راوية قصص إماراتية تراثية). Use a calm yet engaging pace with authentic Emirati intonation and local dialect nuances (نبرة يده تقص حكايات زمن لول): ${text}`;
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: ttsPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    let base64Audio = "";
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          base64Audio = part.inlineData.data;
          break;
        }
      }
    }
    
    if (base64Audio) {
      console.log("Audio generated successfully, length:", base64Audio.length);
      ttsCache.set(cacheKey, base64Audio);
      res.json({ audio: base64Audio });
    } else {
      console.error("No audio data in Gemini response:", JSON.stringify(response));
      // Try a fallback if flash regular fails or has no audio part
      res.status(500).json({ error: "لم يتم العثور على بيانات صوتية في الاستجابة" });
    }
  } catch (error: any) {
    console.error("TTS error:", error);
    const errorString = String(error.message || error);
    const isQuotaExceeded = error.status === 429 || error.statusCode === 429 || errorString.includes("429") || errorString.includes("quota") || errorString.includes("RESOURCE_EXHAUSTED");
    if (isQuotaExceeded) {
      res.status(429).json({ error: "تم تجاوز حصة توليد الصوت المجانية (10 مرات يومياً لموديل TTS). يرجى المحاولة لاحقاً." });
    } else {
      res.status(500).json({ error: "فشل توليد الصوت: " + (error.message || "خطأ مجهول") });
    }
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
