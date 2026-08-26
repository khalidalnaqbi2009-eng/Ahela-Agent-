import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import SharedFamilyGoals from './components/SharedFamilyGoals';
import { 
  MessageCircle, 
  BookOpen, 
  Music, 
  Send, 
  Play, 
  Pause,
  ChevronRight, 
  ChevronUp,
  ChevronDown,
  Heart,
  Volume2,
  VolumeX,
  X,
  Loader2,
  SkipBack,
  SkipForward
} from 'lucide-react';

// --- Types ---
interface ContentItem {
  title: string;
  text: string;
}

interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

// --- Translation Dictionary ---
const T = {
  ar: {
    home: "الرئيسية",
    maternityGuide: "دليل الأمومة",
    aboutApp: "حول التطبيق",
    welcome: "مرحباً بكِ",
    userDefault: "أم راشد",
    mainSections: "الأقسام الرئيسية",
    chatTab: "فزعة أهلنا",
    storiesTab: "حدواتنا (قصص)",
    songsTab: "يولوز (أهازيج)",
    goalsTab: "أهداف العائلة المشتركة",
    adviceTitle: "نصيحة اليوم",
    adviceText: "النوم الهادئ يبدأ بحمام دافئ وكلمات حنونة.. جربي أهزوجة 'هب السعد' الليلة.",
    onlineStatus: "متصل الآن",
    chatSubtext: "استشارات موثقة حول التراث الإماراتي ورعاية المواليد",
    chatWelcomeTitle: "أهلاً بك في أهلنا",
    chatWelcomeText: "اطرح استفسارك حول السنع الإماراتي، رعاية المواليد، أو الأهازيج والقصص التراثية.",
    chatPlaceholder: "اكتب استفسارك هنا مباشرة...",
    storiesTitle: "حدواتنا التراثية",
    songsTitle: "أهازيجنا الجميلة",
    storiesSubtext: "حكايات تراثية دافئة للأطفال والرضع تغرس قيم الهوية وحب الوطن من الصغر.",
    songsSubtext: "تهويدات وأهازيج الآباء والأجداد لتهدئة الصغار ونوم هادئ ومريح.",
    storyListSubtitle: "✨ حكاية لولوة للأطفال",
    songListSubtitle: "🎶 تهويدة تراثية دافئة",
    grandmotherVoice: "👵 بصوت الجدة الحنون (راوية حكايات لول)",
    grandfatherVoice: "🎤 بأداء إنشادي تراثي إماراتي دافئ",
    folkloreSongs: "موروث شعبي إماراتي • تهويدات الأطفال والرضع",
    folkloreStories: "حكاية من التراث • تربية الصغار على الهوية",
    unselectedStoriesTitle: "حكايات زمان لول للأطفال",
    unselectedSongsTitle: "تهويدات الأجداد ونوم الصغار",
    unselectedStoriesText: "اختاري حكاية شعبية من الفهرس لتستمعي إليها بلهجة إماراتية أصيلة تروي للأطفال قصصاً مليئة بالعبر والراحة ونغمة الأمان.",
    unselectedSongsText: "اختاري تهويدة أو أهزوجة من الأهازيج التراثية لتشنفي مسامع طفلكِ بنبض الأصالة والهدوء ونغمة دافئة تهدهده للنوم هنيئاً.",
    todayTip: "نصيحة اليوم",
    errorAlert: "عذراً، تعذر جلب البيانات من المصدر.",
    audioError: "تعذر تشغيل الصوت",
    loading: "تحميل...",
    userInitial: "أ",
  },
  en: {
    home: "Home",
    maternityGuide: "Maternity Guide",
    aboutApp: "About App",
    welcome: "Welcome",
    userDefault: "Um Rashid",
    mainSections: "Main Sections",
    chatTab: "Faza'at Ahelna",
    storiesTab: "Our Stories",
    songsTab: "Our Lullabies",
    goalsTab: "Shared Family Goals",
    adviceTitle: "Tip of the Day",
    adviceText: "A peaceful sleep starts with a warm bath and gentle words.. try the 'Hab Al-Saad' lullaby tonight.",
    onlineStatus: "Online",
    chatSubtext: "Grounded Emirati heritage & maternal care guidance",
    chatWelcomeTitle: "Welcome to Ahelna",
    chatWelcomeText: "Ask directly about Emirati traditions, newborn care practices, lullabies, or oral history.",
    chatPlaceholder: "Type your query here directly...",
    storiesTitle: "Heritage Stories",
    songsTitle: "Beautiful Lullabies",
    storiesSubtext: "Warm traditional stories for children and infants that instill values of heritage and love from an early age.",
    songsSubtext: "Lullabies and chants of parents and grandparents to soothe little ones into a peaceful, cozy sleep.",
    storyListSubtitle: "✨ Traditional fold story",
    songListSubtitle: "🎶 Warm heritage lullaby",
    grandmotherVoice: "👵 In the warm voice of the Grandmother (Storyteller)",
    grandfatherVoice: "🎤 Performed as a warm traditional Emirati melodic chant",
    folkloreSongs: "Emirati Folklore • Lullabies for Babies & Infants",
    folkloreStories: "Heritage Story • Raising Children with Identity",
    unselectedStoriesTitle: "Traditional Tales for Kids",
    unselectedSongsTitle: "Ancestors' Lullabies & Baby Sleep",
    unselectedStoriesText: "Select a folk story from the list to listen to it in an authentic voice, telling kids stories filled with morals, comfort, and security.",
    unselectedSongsText: "Select a traditional lullaby or song from the list to soothe your child's ears with the rhythm of heritage, calm, and a warm tone.",
    todayTip: "Tip of the Day",
    errorAlert: "Apologies, we could not retrieve data from the source.",
    audioError: "Audio playback failed",
    loading: "Loading...",
    userInitial: "U",
  }
};

// --- WAV Encoder Helper for PCM Bytes ---
function pcmToWav(pcmBytes: Uint8Array, sampleRate = 24000): Blob {
  const buffer = new ArrayBuffer(44 + pcmBytes.length);
  const view = new DataView(buffer);

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcmBytes.length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);   // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true);    // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true);    // NumChannels (1 for Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true);    // BlockAlign
  view.setUint16(34, 16, true);   // BitsPerSample (16)
  writeString(view, 36, 'data');
  view.setUint32(40, pcmBytes.length, true);

  const pcmOutput = new Uint8Array(buffer, 44);
  pcmOutput.set(pcmBytes);

  return new Blob([buffer], { type: 'audio/wav' });
}

// --- High-Fidelity Bedtime Procedural Lullaby Synth using Web Audio API ---
class AmbientLullabySynth {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private intervalId: any = null;
  private activeNotes: OscillatorNode[] = [];

  constructor() {}

  public unlock() {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (e) {
      console.log("Failed to pre-unlock lullaby synth AudioContext:", e);
    }
  }

  public start(volume: number = 0.05) {
    if (this.isPlaying) return;
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(volume * 0.15, this.ctx.currentTime);
      
      this.gainNode.connect(this.ctx.destination);
      this.isPlaying = true;
      
      const melody = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // Comfortable and relaxing pentatonic sequence
      let index = 0;

      const playNextNote = () => {
        if (!this.ctx || !this.gainNode || !this.isPlaying) return;
        
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }

        const noteFreq = melody[index++ % melody.length];
        
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(noteFreq, this.ctx.currentTime);
        
        const noteGain = this.ctx.createGain();
        noteGain.gain.setValueAtTime(0, this.ctx.currentTime);
        noteGain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 1.2);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 4.5);
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, this.ctx.currentTime);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.gainNode);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 5.0);
        
        this.activeNotes.push(osc);
        if (this.activeNotes.length > 15) {
          const finishedOsc = this.activeNotes.shift();
          try { finishedOsc?.stop(); } catch(e) {}
        }
      };

      playNextNote();
      this.intervalId = setInterval(playNextNote, 2800);
    } catch (e) {
      console.error("Lullaby synth failed to start:", e);
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.activeNotes.forEach(osc => {
      try { osc.stop(); } catch(e) {}
    });
    this.activeNotes = [];
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }

  public setVolume(vol: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(vol * 0.15, this.ctx.currentTime);
    }
  }
}

const TRADITIONAL_TIPS = {
  ar: [
    {
      title: "مهاد الرضيع البارد 👶🏼",
      text: "تمهيد الطفل بالقطن البارد يشد جسمه الصغير، ويرتّب نومته ويحميه من الفزعات والأصوات المفاجئة بالليل مثل ما سوّن يديداتنا."
    },
    {
      title: "شراب الماشوه الحنون 🌾",
      text: "رشفة صغيرة جداً من ماي الماشوه (اليانسون والحبة الحلوة الدافئة) تريح بطن الضنا من المغص والارياح الزائدة قبل نومه."
    },
    {
      title: "حمام السدر الطبيعي 🍃",
      text: "حمام دافئ بخلطة ورق السدر المطحون يطهّر بشرة الطفل الرقيقة ويبرّد عليها حرارة الصيف وحمّم الجو وحساسية الجلد التناسلية."
    },
    {
      title: "سرير المنزّ التراثي 🪜",
      text: "هزّ المنزّ (سرير الخشب المعلّق) برفق مع همس تهويدة تراثية دافئة مثل 'دوه يا دوه' يمنح طفلكِ طمأنينة نوم ونغمة مريحة."
    },
    {
      title: "الحبة الحمراء لحيويتكِ 🥣",
      text: "شرب كوب ساخن من الحبة الحمراء بالحليب والسمن والزعفران يعيد للأم بعد الولادة (النفاس) كامل النشاط ويدر الحليب الطبيعي."
    },
    {
      title: "دهان زيت السمسم الدافئ 🧴",
      text: "مساج لطيف وجذاب لظهر الطفل وبطنه بزيت سمسم أو زيت زيتون دافئ يقوي المفاصل ويساعده على التخلص من المغص والغازات."
    }
  ],
  en: [
    {
      title: "Al-Mehad (Pure Swaddle) 👶🏼",
      text: "Swaddling your infant snuggly in cool, pure cotton aligns their delicate frame, simulates womb safety, and protects them from sudden startle reflex."
    },
    {
      title: "Mild Al-Mashwah Herbs 🌾",
      text: "A tiny sip of warm Al-Mashwah (fennel/sweet anise infusion) acts as a natural remedy for your child's painful colic, relieving tummy distress."
    },
    {
      title: "Natural Sidr Wash 🍃",
      text: "A gentle bath steeped with powdered Sidr leaves naturally purifies your newborn’s sensitive skin, cooling baby down from heat rashes."
    },
    {
      title: "The Hanging Al-Menz Cradle 🪜",
      text: "Rocking the traditional wood/palm-woven 'Menz' hanging bed gently with a soft whisper cradles the baby in absolute comfort, reflecting mother's heartbeat."
    },
    {
      title: "Habat Al-Hamra Recovery 🥣",
      text: "Enjoying a warm morning cup of Habat Al-Hamra cress seeds brewed with pure milk, ghee, and saffron boosts postnatal blood supply and supports rich lactation."
    },
    {
      title: "Warm Sesame Massage 🧴",
      text: "Slightly massaging your child's hands, feet, and tummy with warm sesame or olive oil strengthens their soft bones and promotes deep, comforting digestion."
    }
  ]
};

const HeritageStarters = {
  ar: [
    { label: "قماط الرضيع والمهاد 👶🏼", query: "كيف طريقة المهاد أو القماط التراثي السليم لتهدئة الرضيع وتعديل نومته؟", icon: "👶🏼" },
    { label: "حمام السدر الهادئ 🍃", query: "كيف أسوي خلطة حمام السدر المطهر لبشرة طفلي الرقيقة وتبريد حر الجو؟", icon: "🍃" },
    { label: "سرير المنزّ التراثي 🪵", query: "دلوّني على طريقة تهويد الطفل وسرير المنزّ الخشبي المعلق وأغاني النوم القديمة والمحببة.", icon: "🪵" }
  ],
  en: [
    { label: "Cotton Swaddling (Al-Mehad) 👶🏼", query: "How is the traditional Emirati Mehad/swasdle prepared to calm the baby and align their sleep?", icon: "👶🏼" },
    { label: "Cooling Sidr Bath 🍃", query: "How can I brew the traditional natural Sidr leaf bath to purify baby's skin and prevent heat rashes?", icon: "🍃" },
    { label: "The Al-Menz Cradle 🪵", query: "Tell me about lulling the baby in the traditional wooden Menz hanging cradle with old lullabies.", icon: "🪵" }
  ]
};

// --- App Component ---

export default function App() {
  const [lang, setLang] = useState<'ar' | 'en'>(() => {
    return (localStorage.getItem('ahelna_lang') as 'ar' | 'en') || 'ar';
  });
  const [showSplash, setShowSplash] = useState(true);

  // Welcome Splash Screen timer (exactly 8 seconds / 8000ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);
  const [activeTab, setActiveTab] = useState<'chat' | 'stories' | 'songs' | 'goals'>('chat');
  const [tipIndex, setTipIndex] = useState(0);
  const [isAdviceExpanded, setIsAdviceExpanded] = useState(true);
  const [stories, setStories] = useState<ContentItem[]>([]);
  const [songs, setSongs] = useState<ContentItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const bgMusicSynthRef = useRef<AmbientLullabySynth | null>(null);

  // Audio Playback State for Story and Songs
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioVolume, setAudioVolume] = useState(1.0);
  const [audioMuted, setAudioMuted] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState(1.0);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [isSpeechFallback, setIsSpeechFallback] = useState(false);
  const speechTimerRef = useRef<any>(null);
  const [ttsMode, setTtsMode] = useState<'ai' | 'browser'>(() => {
    return (localStorage.getItem('ahelna_tts_mode') as 'ai' | 'browser') || 'ai';
  });
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  const handleTtsModeChange = (mode: 'ai' | 'browser') => {
    setTtsMode(mode);
    localStorage.setItem('ahelna_tts_mode', mode);
    
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setAudioPlaying(false);
    setAudioUrl(null);
  };
  
  // Cache of blob URLs to prevent re-fetching/generating the same audio during the user session
  const clientAudioCacheRef = useRef<{ [key: string]: { url: string; duration: number; isSpeech: boolean } }>({});

  useEffect(() => {
    fetchData(lang);
  }, [lang]);

  useEffect(() => {
    // Initialize procedural background lullaby synthesizer
    bgMusicSynthRef.current = new AmbientLullabySynth();
    return () => {
      if (bgMusicSynthRef.current) {
        bgMusicSynthRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    // Initialize narrative audio player
    audioPlayerRef.current = new Audio();
    
    const player = audioPlayerRef.current;
    
    const onPlay = () => setAudioPlaying(true);
    const onPause = () => setAudioPlaying(false);
    const onTimeUpdate = () => setAudioCurrentTime(player.currentTime);
    const onLoadedMetadata = () => setAudioDuration(player.duration || 0);
    const onEnded = () => {
      setAudioPlaying(false);
      setAudioCurrentTime(0);
      
      // Stop background lullaby synthesizer
      if (bgMusicSynthRef.current) {
        bgMusicSynthRef.current.stop();
      }
    };

    player.addEventListener('play', onPlay);
    player.addEventListener('pause', onPause);
    player.addEventListener('timeupdate', onTimeUpdate);
    player.addEventListener('loadedmetadata', onLoadedMetadata);
    player.addEventListener('ended', onEnded);

    return () => {
      player.removeEventListener('play', onPlay);
      player.removeEventListener('pause', onPause);
      player.removeEventListener('timeupdate', onTimeUpdate);
      player.removeEventListener('loadedmetadata', onLoadedMetadata);
      player.removeEventListener('ended', onEnded);
      player.pause();
    };
  }, []);

  // When activeTab or selectedItem changes, stop audio playback or load from client-side cache
  useEffect(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (speechTimerRef.current) {
      clearInterval(speechTimerRef.current);
      speechTimerRef.current = null;
    }

    setAudioPlaying(false);
    setAudioCurrentTime(0);

    if (selectedItem) {
      const type = activeTab === 'songs' ? 'song' : 'story';
      const key = `${lang}_${type}_${selectedItem.title}`;
      const cached = clientAudioCacheRef.current[key];
      if (cached) {
        console.log("Serving audio from client-side session cache!", cached);
        setIsSpeechFallback(cached.isSpeech);
        setAudioUrl(cached.url);
        setAudioDuration(cached.duration);
        if (audioPlayerRef.current && !cached.isSpeech) {
          audioPlayerRef.current.src = cached.url;
          audioPlayerRef.current.volume = audioVolume;
          audioPlayerRef.current.muted = audioMuted;
          audioPlayerRef.current.playbackRate = audioSpeed;
        }
      } else {
        setIsSpeechFallback(false);
        setAudioUrl(null);
        setAudioDuration(0);
        if (audioPlayerRef.current) {
          audioPlayerRef.current.src = '';
        }
      }
    } else {
      setIsSpeechFallback(false);
      setAudioUrl(null);
      setAudioDuration(0);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = '';
      }
    }
  }, [selectedItem, activeTab]);

  const startSpeechTimer = (duration: number) => {
    if (speechTimerRef.current) {
      clearInterval(speechTimerRef.current);
    }
    speechTimerRef.current = setInterval(() => {
      setAudioCurrentTime(prev => {
        if (prev >= duration - 1) {
          clearInterval(speechTimerRef.current);
          speechTimerRef.current = null;
          setAudioPlaying(false);
          if (bgMusicSynthRef.current) {
            bgMusicSynthRef.current.stop();
          }
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const togglePlayPause = () => {
    if (isSpeechFallback) {
      if (audioPlaying) {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.pause();
        }
        if (bgMusicSynthRef.current) bgMusicSynthRef.current.stop();
        setAudioPlaying(false);
        if (speechTimerRef.current) {
          clearInterval(speechTimerRef.current);
          speechTimerRef.current = null;
        }
      } else {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.resume();
        }
        if (bgMusicSynthRef.current) {
          bgMusicSynthRef.current.start(audioMuted ? 0 : audioVolume);
        }
        setAudioPlaying(true);
        startSpeechTimer(audioDuration);
      }
      return;
    }

    if (!audioPlayerRef.current) return;
    if (audioPlaying) {
      audioPlayerRef.current.pause();
    } else {
      audioPlayerRef.current.play().catch(err => console.error("Play failed", err));
    }
  };

  const skipTime = (amount: number) => {
    if (isSpeechFallback) {
      let newTime = audioCurrentTime + amount;
      if (newTime < 0) newTime = 0;
      if (newTime > audioDuration) newTime = audioDuration;
      setAudioCurrentTime(newTime);
      return;
    }

    if (!audioPlayerRef.current) return;
    let newTime = audioPlayerRef.current.currentTime + amount;
    if (newTime < 0) newTime = 0;
    if (newTime > audioDuration) newTime = audioDuration;
    audioPlayerRef.current.currentTime = newTime;
    setAudioCurrentTime(newTime);
  };

  const handleSeek = (newTime: number) => {
    if (isSpeechFallback) {
      setAudioCurrentTime(newTime);
      return;
    }

    if (!audioPlayerRef.current) return;
    audioPlayerRef.current.currentTime = newTime;
    setAudioCurrentTime(newTime);
  };

  const handleVolumeChange = (newVol: number) => {
    setAudioVolume(newVol);
    if (isSpeechFallback) {
      if (bgMusicSynthRef.current) bgMusicSynthRef.current.setVolume(audioMuted ? 0 : newVol);
      return;
    }
    if (!audioPlayerRef.current) return;
    audioPlayerRef.current.volume = newVol;
    if (newVol > 0 && audioMuted) {
      audioPlayerRef.current.muted = false;
      setAudioMuted(false);
    }
  };

  const toggleMute = () => {
    const nextMuted = !audioMuted;
    setAudioMuted(nextMuted);
    if (isSpeechFallback) {
      if (bgMusicSynthRef.current) {
        bgMusicSynthRef.current.setVolume(nextMuted ? 0 : audioVolume);
      }
      return;
    }
    if (!audioPlayerRef.current) return;
    audioPlayerRef.current.muted = nextMuted;
    if (bgMusicSynthRef.current) {
      bgMusicSynthRef.current.setVolume(nextMuted ? 0 : audioVolume);
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setAudioSpeed(newSpeed);
    if (isSpeechFallback) {
      return;
    }
    if (!audioPlayerRef.current) return;
    audioPlayerRef.current.playbackRate = newSpeed;
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const handleLanguageChange = (newLang: 'ar' | 'en') => {
    setLang(newLang);
    localStorage.setItem('ahelna_lang', newLang);
    setSelectedItem(null); // Clear selected item to avoid mixed language screen views
  };

  const fetchData = async (langChoice = lang) => {
    try {
      const res = await fetch(`/api/data?lang=${langChoice}`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      
      if (data.error) {
        setDataError(data.error);
      }

      // Flexible mapper for column names
      const mapItem = (item: any, titleKeys: string[], textKeys: string[]) => {
        if (!item || typeof item !== 'object') return { title: langChoice === 'en' ? 'Unknown Content' : 'محتوى غير معروف', text: '' };
        
        const findKeyFuzzy = (obj: any, candidates: string[]) => {
          const normalizeStr = (s: string) => s.trim().replace(/\s+/g, '').replace(/[أإآا]/g, 'ا').replace(/[ةه]/g, 'ه');
          const normalizedCandidates = candidates.map(normalizeStr);
          return Object.keys(obj).find(k => normalizedCandidates.includes(normalizeStr(k)));
        };

        const titleKey = findKeyFuzzy(item, titleKeys);
        const textKey = findKeyFuzzy(item, textKeys);
        
        const title = titleKey ? item[titleKey] : (Object.values(item)[0] as string || (langChoice === 'en' ? 'No Title' : 'بدون عنوان'));
        const text = textKey ? item[textKey] : (Object.values(item)[1] as string || '');
        
        return { title, text };
      };

      if (Array.isArray(data.songs)) {
        setSongs(data.songs.map((s: any) => mapItem(s, ['اسم الاهزوجه', 'الأهزوجة', 'اسم الأغنية', 'Title'], ['تفاصيل الأهزوجة', 'التفاصيل', 'الأغنية', 'Details'])));
      }
      
      if (Array.isArray(data.stories)) {
        setStories(data.stories.map((s: any) => mapItem(s, ['اسم القصه', 'القصة', 'اسم الحكاية', 'Title'], ['تفاصيل القصة', 'التفاصيل', 'القصة', 'Details'])));
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
      setDataError(langChoice === 'en' ? "Apologies, we failed to sync heritage data." : "عذراً، تعذر جلب البيانات من المصدر.");
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    const userPrompt = userInput.trim();
    const newHistory = [...chatHistory, { role: 'user', parts: [{ text: userPrompt }] }] as ChatMessage[];
    setChatHistory(newHistory);
    setUserInput('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt, history: chatHistory, lang }),
      });
      const data = await res.json();
      const replyText = data.text || (lang === 'en' 
        ? "No response received. Please try submitting your query again."
        : "لم يتم تلقي استجابة. يرجى إعادة إرسال السؤال.");
      setChatHistory([...newHistory, { role: 'model', parts: [{ text: replyText }] }]);
    } catch (err) {
      console.error("Chat error", err);
      const fallbackMsg = lang === 'en'
        ? "Unable to reach the server. Please check your connection and retry."
        : "تعذر الاتصال بالخادم. يرجى التحقق من الاتصال وإعادة المحاولة.";
      setChatHistory([...newHistory, { role: 'model', parts: [{ text: fallbackMsg }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  const playSpeechSynthesisFallback = (text: string, type: 'song' | 'story') => {
    try {
      console.log("Playing fallback voice synthesis...");
      setIsSpeechFallback(true);
      setAudioUrl('speech-fallback');
      setAudioPlaying(true);
      
      const wordsCount = text.split(/\s+/).filter(Boolean).length;
      // Soft, paced traditional Emirati/Gulf-style storytelling is slower (~90 words per minute / 1.5 words per second)
      const duration = Math.max(12, Math.ceil(wordsCount * 0.9));
      setAudioDuration(duration);
      setAudioCurrentTime(0);

      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === 'ar' ? 'ar-AE' : 'en-US';
        utterance.rate = 0.85; // comforting, slow and deep pacing for kids/babies bedtime
        
        // Dynamic volume based on app UI volume control
        utterance.volume = audioMuted ? 0 : audioVolume;

        const voices = window.speechSynthesis.getVoices();
        const arabicVoice = voices.find(v => v.lang.startsWith('ar-AE')) || 
                            voices.find(v => v.lang.startsWith('ar-')) ||
                            voices.find(v => v.lang.startsWith('ar'));
        const englishVoice = voices.find(v => v.lang.startsWith('en-US')) || 
                             voices.find(v => v.lang.startsWith('en-GB')) ||
                             voices.find(v => v.lang.startsWith('en'));
                             
        if (lang === 'ar' && arabicVoice) {
          utterance.voice = arabicVoice;
        } else if (lang === 'en' && englishVoice) {
          utterance.voice = englishVoice;
        }

        utterance.onend = () => {
          console.log("Speech synthesis playback completed naturally");
          setIsSpeechFallback(false);
          setAudioPlaying(false);
          setAudioCurrentTime(0);
          if (speechTimerRef.current) {
            clearInterval(speechTimerRef.current);
            speechTimerRef.current = null;
          }
          if (bgMusicSynthRef.current) {
            bgMusicSynthRef.current.stop();
          }
        };

        utterance.onerror = (e) => {
          console.error("Speech synthesis execution error:", e);
        };

        // Play the wonderful calming nature background music procedurally
        if (bgMusicSynthRef.current) {
          bgMusicSynthRef.current.start(audioMuted ? 0 : audioVolume);
        }

        window.speechSynthesis.speak(utterance);
        
        // Cache this fallback too!
        const curType = type;
        const curTitle = selectedItem?.title || '';
        const cacheKey = `${lang}_${curType}_${curTitle}`;
        clientAudioCacheRef.current[cacheKey] = {
          url: 'speech-fallback',
          duration: duration,
          isSpeech: true
        };

        // Start simulated timeline tracker
        startSpeechTimer(duration);
      }
    } catch (e) {
      console.error("Critical fallback route failed:", e);
      setDataError(lang === 'en' ? "Apologies, audio narration is currently busy. Please try again." : "عذراً، نظام المحادثة الصوتية مشغول حالياً. يرجى إعادة المحاولة.");
    }
  };

  const playAudio = async (text: string, type: 'song' | 'story') => {
    setIsAudioLoading(true);
    setDataError(null); // Clear previous errors

    if (ttsMode === 'browser' || isQuotaExceeded) {
      setIsAudioLoading(false);
      playSpeechSynthesisFallback(text, type);
      return;
    }

    // Synchronously pre-unlock browser speech synthesis to ensure asynchronous fallbacks are allowed by sandboxed browsers
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        const silentUtterance = new SpeechSynthesisUtterance("");
        silentUtterance.volume = 0;
        window.speechSynthesis.speak(silentUtterance);
      } catch (e) {
        console.log("Speech synthesis pre-unlock (ignored):", e);
      }
    }

    // Synchronously pre-unlock the lullaby audio synthesizer context
    if (bgMusicSynthRef.current) {
      bgMusicSynthRef.current.unlock();
    }

    // Synchronously unlock the audio player inside the user-initiated click stack before any fetch
    if (audioPlayerRef.current) {
      try {
        if (!audioPlayerRef.current.src) {
          audioPlayerRef.current.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==\n";
        }
        const dummyPromise = audioPlayerRef.current.play();
        if (dummyPromise !== undefined) {
          dummyPromise.then(() => {
            audioPlayerRef.current?.pause();
          }).catch(err => {
            console.log("Audio player pre-unlocked (safe ignore):", err);
          });
        }
      } catch (err) {
        console.log("Audio player pre-unlock exception (ignored):", err);
      }
    }

    try {
      console.log(`Requesting TTS for ${type}...`);
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, type, lang }),
      });
      
      if (!res.ok) {
        let errorMessage = `Server error: ${res.status}`;
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errData = await res.json();
            errorMessage = errData.error || errorMessage;
          } else {
            const textContent = await res.text();
            console.error("Non-JSON error response:", textContent.substring(0, 200));
          }
        } catch (e) {
          console.error("Error parsing error response", e);
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      console.log("TTS Response received", data.audio ? "Audio present" : "No audio");
      
      if (data.audio) {
        const binaryString = atob(data.audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Detect if it's a WAV container (RIFF) or raw PCM
        const isWav = binaryString.startsWith('RIFF');
        console.log(`Audio detected: ${isWav ? 'WAV' : 'Raw PCM'}, Bytes: ${len}`);

        let blob: Blob;
        if (isWav) {
          blob = new Blob([bytes], { type: 'audio/wav' });
        } else {
          blob = pcmToWav(bytes, 24000);
        }

        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        if (audioPlayerRef.current) {
          audioPlayerRef.current.src = url;
          // Apply current control parameters to the new media stream
          audioPlayerRef.current.volume = audioMuted ? 0 : audioVolume;
          audioPlayerRef.current.muted = audioMuted;
          audioPlayerRef.current.playbackRate = audioSpeed;
          
          const curType = type;
          const curTitle = selectedItem?.title || '';
          audioPlayerRef.current.onloadedmetadata = () => {
            const dur = audioPlayerRef.current?.duration || 0;
            setAudioDuration(dur);
            const cacheKey = `${lang}_${curType}_${curTitle}`;
            clientAudioCacheRef.current[cacheKey] = {
              url,
              duration: dur,
              isSpeech: false
            };
            console.log("Cached newly generated TTS audio metadata with duration:", dur);
          };
          
          // Start soft procedural background music
          if (bgMusicSynthRef.current) {
            bgMusicSynthRef.current.start(audioMuted ? 0 : audioVolume);
          }

          try {
            await audioPlayerRef.current.play();
            console.log("Audio started playing successfully via HTML5 elements");
          } catch (playErr) {
            console.error("Audio player failed playing after source change:", playErr);
            throw playErr;
          }
        }
      } else {
        throw new Error(data.error || "No audio data received from server");
      }
    } catch (err: any) {
      console.error("Audio error - deploying smart browser TTS voice-over with local lullabies", err);
      const errMsg = err.message || "";
      const isQuota = errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("حصة");
      
      if (isQuota) {
        setIsQuotaExceeded(true);
        setDataError(lang === 'en' 
          ? "The free AI voice quota has been exceeded (10 times daily limit). Seamlessly switched to standard local narrator for your comfort!" 
          : "تم تجاوز حصة الذكاء الاصطناعي المجانية لتوليد الصوت (10 مرات يومياً). جاري التحويل التلقائي للقارئ الصوتي المحلي لراحتك!"
        );
      }
      playSpeechSynthesisFallback(text, type);
    } finally {
      setIsAudioLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed inset-0 z-[9999] bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden"
          >
            {/* Elegant Background Patterns representing UAE Identity */}
            <div className="absolute inset-0 bg-sadu-light opacity-60" />
            
            {/* UAE Flag displayed in a refined and respectful way */}
            <div className="relative z-10 flex items-center gap-1.5 mb-8 bg-white/40 backdrop-blur-sm px-4 py-2 rounded-full border border-pattern">
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#0D4F38] font-mono flex items-center gap-2">
                <div className="w-6 h-4 flex rounded-sm overflow-hidden border border-black/5 flex-shrink-0">
                  <div className="w-2 bg-uae-red h-full" />
                  <div className="flex-1 flex flex-col h-full">
                    <div className="flex-1 bg-uae-green" />
                    <div className="flex-1 bg-white" />
                    <div className="flex-1 bg-uae-charcoal" />
                  </div>
                </div>
                دولة الإمارات العربية المتحدة
              </span>
            </div>

            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.7, ease: "easeOut" }}
              className="relative z-10 flex flex-col items-center max-w-lg w-full"
            >
              {/* Respectful, highly-polished portrait of the Founding Father Sheikh Zayed */}
              <div className="relative w-44 h-56 rounded-3xl overflow-hidden border-2 border-uae-gold p-1 shadow-lg bg-white mb-6">
                <img
                  src="/sheikh_zayed_classic.png"
                  alt="مؤسس الدولة المغفور له الشيخ زايد بن سلطان آل نهيان"
                  className="w-full h-full object-cover rounded-[20px]"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Homage text */}
              <h1 className="serif-ar text-2xl md:text-3xl font-bold text-uae-green tracking-wide mb-1 leading-tight">
                المغفور له الشيخ زايد بن سلطان آل نهيان
              </h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-uae-gold mb-4 font-sans text-center">
                The Late Sheikh Zayed bin Sultan Al Nahyan • Founding Father of the UAE
              </p>

              {/* Soft decorative divider line */}
              <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-uae-gold to-transparent mx-auto my-3" />
              
              {/* Quote from Sheikh Zayed */}
              <div className="bg-white/75 backdrop-blur-sm border border-pattern rounded-2xl p-5 shadow-sm max-w-md w-full my-1">
                <p className="serif-ar text-sm leading-relaxed text-text-main font-bold mb-2">
                  "إن رعاية الأطفال والاهتمام بهم وتنشئتهم النشأة السليمة هي أساس بناء مجتمع قوي ومستعد للمستقبل."
                </p>
                <p className="text-[10px] leading-relaxed text-olive-muted font-semibold font-sans italic">
                  "The proper nurturing and care of children is the foundation of building a solid society prepared for the future."
                </p>
              </div>

              {/* Bottom Decorative Sadu Accent */}
              <div className="mt-8 flex items-center justify-center gap-2 text-uae-gold/50">
                <span className="w-8 h-[1px] bg-gradient-to-r from-transparent to-uae-gold" />
                <span className="text-[10px] tracking-widest uppercase font-bold font-mono">أهلاً بكم في أهلنا</span>
                <span className="w-8 h-[1px] bg-gradient-to-l from-transparent to-uae-gold" />
              </div>
            </motion.div>

            {/* Smooth Respectful Loading Indicator */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-32 h-[3px] bg-uae-green-light rounded-full overflow-hidden">
              <motion.div
                initial={{ left: "-100%" }}
                animate={{ left: "100%" }}
                transition={{ duration: 1.8, ease: "easeInOut", repeat: 0 }}
                className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-uae-gold to-transparent"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className={`h-screen grid grid-cols-1 md:grid-cols-[320px_1fr] grid-rows-[80px_1fr] bg-sand-light overflow-hidden ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
      {/* Header with authentic Sadu running top trim & elegant UAE Flag background */}
      <header className="col-span-1 md:col-span-2 flex items-center justify-between px-4 md:px-10 bg-white/95 backdrop-blur-md relative overflow-hidden border-b border-pattern shadow-sm z-50 sadu-border-top pt-1 animate-fadeIn">
        {/* Modern Stylized UAE Flag Background Layer */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none flex">
          {/* Vertical Red Mast Stripe */}
          <motion.div 
            initial={{ opacity: 0.05 }}
            animate={{ opacity: [0.05, 0.09, 0.05] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className={`w-[18px] md:w-[32px] h-full bg-[#B22727] relative ${lang === 'ar' ? 'order-last border-s' : 'order-first border-e'} border-uae-gold/15`} 
          />
          
          {/* Horizontal fly stripes */}
          <div className="flex-1 h-full flex flex-col relative">
            {/* Top Green Stripe */}
            <div className="flex-1 bg-gradient-to-r from-uae-green/[0.05] via-uae-green/[0.08] to-uae-green/[0.04]" />
            
            {/* Soft gold sand line */}
            <div className="h-[0.5px] bg-gradient-to-r from-uae-gold/20 via-uae-gold/5 to-transparent" />
            
            {/* Middle White/Sand-Light Stripe */}
            <div className="flex-1 bg-gradient-to-r from-sand-light/40 to-sand-light/10" />
            
            {/* Soft gold sand line */}
            <div className="h-[0.5px] bg-gradient-to-r from-uae-gold/15 via-uae-gold/5 to-transparent" />
            
            {/* Bottom Charcoal/Black Stripe */}
            <div className="flex-1 bg-gradient-to-r from-[#1C201C]/[0.04] via-[#1C201C]/[0.08] to-[#1C201C]/[0.03]" />
            
            {/* Gentle ambient wave light animation effect */}
            <motion.div
              animate={{ 
                x: ["-100%", "100%"] 
              }}
              transition={{ 
                duration: 9, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="absolute top-0 bottom-0 w-1/4 bg-gradient-to-r from-transparent via-white/[0.09] to-transparent pointer-events-none"
            />
          </div>
          
          {/* Subtle gold-tinted lighting transition */}
          <div className="absolute inset-0 bg-gradient-to-tr from-uae-gold/[0.02] via-transparent to-white/[0.06]" />
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-11 h-11 bg-gradient-to-br from-[#0D4F38] to-[#1C201C] rounded-2xl flex items-center justify-center shadow-md border-b-2 border-uae-gold/40 relative overflow-hidden">
            {/* Subtle glow layer */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10" />
            <span className="text-2xl pb-0.5 select-none text-uae-gold">🌴</span>
          </div>
          <h1 className="serif-ar text-2xl md:text-3xl font-bold tracking-tight text-uae-green flex items-baseline gap-2">
            أهلنا <span className="text-xs md:text-sm font-normal font-sans opacity-60">Ahelna</span>
          </h1>
        </div>
        <nav className="hidden md:flex gap-8 relative z-10">
          <button className="text-sm font-semibold border-b-2 border-uae-green pb-1 cursor-default">{T[lang].home}</button>
          <button className="text-sm font-medium opacity-60 hover:opacity-100 transition-opacity">{T[lang].maternityGuide}</button>
          <button className="text-sm font-medium opacity-60 hover:opacity-100 transition-opacity">{T[lang].aboutApp}</button>
        </nav>
        
        <div className="flex items-center gap-3 md:gap-4 relative z-10">
          {/* Premium Language Switcher */}
          <div className="flex items-center gap-0.5 bg-sand-light p-1 rounded-full border border-pattern text-[10px] md:text-[11px] font-semibold">
            <button 
              onClick={() => handleLanguageChange('ar')}
              className={`px-2 md:px-3 py-1 md:py-1.5 rounded-full transition-all ${lang === 'ar' ? 'bg-[#0D4F38] text-white shadow-sm font-bold' : 'text-text-main opacity-70 hover:opacity-100'}`}
            >
              العربية
            </button>
            <button 
              onClick={() => handleLanguageChange('en')}
              className={`px-2 md:px-3 py-1 md:py-1.5 rounded-full transition-all ${lang === 'en' ? 'bg-[#0D4F38] text-white shadow-sm font-bold' : 'text-text-main opacity-70 hover:opacity-100'}`}
            >
              English
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-3 border-s border-pattern ps-3 md:ps-4">
            <div className={`hidden sm:block ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
              <p className="text-[10px] opacity-65 leading-none mb-1">{T[lang].welcome}</p>
              <p className="text-xs font-extrabold leading-none">{T[lang].userDefault}</p>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-uae-gold to-white border border-pattern overflow-hidden flex items-center justify-center text-lg md:text-xl shadow-sm select-none" title={lang === 'ar' ? "أصالة الدار" : "Emirati Heritage"}>
              🦅
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`hidden md:flex border-pattern bg-[#F9F7F3] p-6 flex-col gap-6 overflow-y-auto ${lang === 'ar' ? 'border-l' : 'border-r'}`}>
        <div className="flex flex-col gap-3">
          <p className="text-[10px] uppercase tracking-widest font-bold text-olive-muted mb-2">{T[lang].mainSections}</p>
          <SidebarButton 
            active={activeTab === 'chat'} 
            onClick={() => setActiveTab('chat')} 
            icon="💬" 
            label={T[lang].chatTab}
            lang={lang}
          />
          <SidebarButton 
            active={activeTab === 'stories'} 
            onClick={() => { setActiveTab('stories'); setSelectedItem(null); }} 
            icon="📖" 
            label={T[lang].storiesTab}
            lang={lang}
          />
          <SidebarButton 
            active={activeTab === 'songs'} 
            onClick={() => { setActiveTab('songs'); setSelectedItem(null); }} 
            icon="🎵" 
            label={T[lang].songsTab}
            lang={lang}
          />
          <SidebarButton 
            active={activeTab === 'goals'} 
            onClick={() => { setActiveTab('goals'); setSelectedItem(null); }} 
            icon="🏡" 
            label={T[lang].goalsTab}
            lang={lang}
          />
        </div>

        {dataError && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 flex flex-col gap-2">
            <p className="font-bold flex items-center gap-1">⚠️ {lang === 'en' ? 'Notice:' : 'ملاحظة:'}</p>
            <p>{dataError}</p>
          </div>
        )}
        
        <div className="mt-auto py-8 md:py-10 px-6 min-h-[280px] bg-sadu-light rounded-2xl border-2 border-uae-gold/45 relative overflow-hidden shadow-md flex flex-col justify-between gap-6">
          {/* Traditional Sadu color ribbon accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-uae-green via-uae-gold to-uae-red" />
          
          <div className="flex items-center justify-between border-b border-pattern/50 pb-3">
            <span className="serif-ar text-lg md:text-xl font-bold text-uae-green flex items-center gap-2">
              ✨ {T[lang].adviceTitle}
            </span>
            <button 
              onClick={() => setTipIndex((prev) => (prev + 1) % TRADITIONAL_TIPS[lang].length)}
              className="p-1.5 bg-white/85 hover:bg-white rounded-xl text-uae-gold hover:text-uae-green transition-all text-xs flex items-center justify-center cursor-pointer border border-pattern shadow-sm hover:scale-105 active:scale-95 font-bold"
              title={lang === 'ar' ? "النصيحة التالية" : "Next traditional advice"}
            >
              🔄 <span className="text-[10px] font-extrabold ms-1">{lang === 'ar' ? "التالي" : "Next"}</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tipIndex}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="space-y-3 flex-1 flex flex-col justify-center relative z-10"
            >
              <p className="font-extrabold text-sm md:text-base text-uae-green leading-snug">{TRADITIONAL_TIPS[lang][tipIndex].title}</p>
              <p className={`text-xs leading-relaxed text-text-main font-semibold opacity-90 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                {TRADITIONAL_TIPS[lang][tipIndex].text}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Majestic stylized faint watermark symbol to enrich vertical density and look crafted */}
          <div className={`absolute bottom-3 ${lang === 'ar' ? 'left-4' : 'right-4'} text-4xl opacity-[0.06] select-none pointer-events-none z-0`}>
            🏺
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="relative bg-white flex flex-col overflow-hidden flex-grow flex-1 min-h-0">
        {/* Persistent Error Banner */}
        <AnimatePresence>
          {dataError && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-50 border-b border-red-100 overflow-hidden"
            >
              <div className="px-10 py-3 flex items-center justify-between text-red-600 text-sm font-medium">
                <div className="flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{dataError}</span>
                </div>
                <button onClick={() => setDataError(null)} className="p-1 hover:bg-red-100 rounded">
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Today's Advice - Sleek Collapsible Sticky Widget */}
        <div className="md:hidden block bg-[#FAF8F5] border-b border-pattern shadow-[0_3px_12px_rgba(0,0,0,0.04)] flex-shrink-0 relative z-40 transition-all duration-300">
          {/* UAE Traditional Sadu Stripe Accent */}
          <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-uae-green via-uae-gold to-uae-red" />
          
          <div className="px-4.5 py-3 flex items-center justify-between gap-3 mt-0.5">
            <div 
              onClick={() => setIsAdviceExpanded(!isAdviceExpanded)}
              className="flex-1 flex items-center gap-2 cursor-pointer select-none min-w-0"
            >
              <span className="text-lg flex-shrink-0">✨</span>
              <span className="text-xs font-extrabold text-uae-green whitespace-nowrap flex-shrink-0">
                {T[lang].adviceTitle}:
              </span>
              <span className="text-xs font-extrabold text-uae-gold truncate">
                {TRADITIONAL_TIPS[lang][tipIndex].title}
              </span>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setTipIndex((prev) => (prev + 1) % TRADITIONAL_TIPS[lang].length)}
                className="p-1.5 px-2.5 hover:bg-uae-gold/15 rounded-xl text-uae-gold transition-colors text-[10px] md:text-xs flex items-center gap-1 font-extrabold border border-pattern bg-white cursor-pointer shadow-sm active:scale-95"
                title={lang === 'ar' ? "النصيحة التالية" : "Next traditional advice"}
              >
                🔄 {lang === 'ar' ? "التالي" : "Next"}
              </button>
              <button
                onClick={() => setIsAdviceExpanded(!isAdviceExpanded)}
                className="p-1.5 text-uae-green hover:bg-uae-green-light rounded-xl transition-colors cursor-pointer"
                aria-label="Toggle Advice Detail"
              >
                {isAdviceExpanded ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isAdviceExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-4.5 pb-4 pt-1 flex flex-col gap-2 bg-[#FAF8F5] border-t border-dashed border-pattern">
                  <div className="bg-white/95 backdrop-blur-sm py-6 px-5 rounded-xl border-2 border-pattern/60 relative overflow-hidden shadow-sm min-h-[140px] flex flex-col justify-between">
                    <div className="absolute top-0 bottom-0 left-0 w-1 bg-uae-gold" />
                    <div>
                      <h5 className="font-extrabold text-xs md:text-sm text-uae-green mb-2 text-right">
                        {TRADITIONAL_TIPS[lang][tipIndex].title}
                      </h5>
                      <p className={`text-[11px] md:text-xs leading-relaxed text-text-main font-semibold opacity-95 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                        {TRADITIONAL_TIPS[lang][tipIndex].text}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'chat' && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col p-4 md:p-8 pb-20 md:pb-8 relative overflow-hidden bg-[#FCFAF5] min-h-0"
            >
              {/* Soft Newborn Baby Watercolor Background Overlay */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.07] bg-center bg-no-repeat bg-contain mix-blend-multiply transition-opacity duration-500"
                style={{ 
                  backgroundImage: 'url(/sleeping_newborn_bg.png)',
                  backgroundSize: 'min(450px, 60%)',
                  backgroundPosition: 'center 45%'
                }}
              />

              <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#fcf8f2] border-2 border-gold-accent flex items-center justify-center text-2xl md:text-3xl shadow-inner flex-shrink-0">👵</div>
                  <div>
                    <h2 className="serif-ar text-xl md:text-2xl font-bold text-olive-deep">{T[lang].chatTab}</h2>
                    <p className="text-[10px] md:text-xs text-olive-muted font-medium italic">"{T[lang].chatSubtext}"</p>
                  </div>
                </div>
                <div className="flex gap-2 self-start sm:self-auto">
                  <div className="px-3 py-1.5 md:px-4 md:py-2 bg-white/80 backdrop-blur-md border border-pattern rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1.5 md:gap-2 shadow-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> {T[lang].onlineStatus}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-hide relative z-10">
                {chatHistory.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 max-w-3xl mx-auto py-8">
                    {/* Beautiful UAE Heritage Graphic Badge */}
                    <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
                      {/* Pulse concentric Sadu Rings */}
                      <span className="absolute inset-0 rounded-full bg-uae-gold/10 animate-ping duration-[3000ms]" />
                      <span className="absolute inset-2 rounded-full bg-uae-green/5 animate-pulse duration-[2000ms]" />
                      
                      {/* Stylized Modern Emblem of Emirati Home */}
                      <div className="relative w-24 h-24 rounded-full bg-gradient-to-b from-white to-[#FAF8F5] border-2 border-uae-gold flex items-center justify-center text-5xl shadow-md select-none">
                        🌴
                      </div>
                      
                      {/* Tiny overlay Falcon/Heart badge */}
                      <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-uae-red text-white flex items-center justify-center text-sm shadow border border-white select-none">
                        ❤️
                      </div>
                    </div>

                    {/* App welcome header */}
                    <h2 className="serif-ar text-3xl font-bold text-[#0D4F38] mb-3 leading-tight tracking-wide">
                      {T[lang].chatWelcomeTitle}
                    </h2>
                    
                    <p className="text-xs max-w-lg leading-relaxed text-olive-muted font-medium mb-8">
                      {T[lang].chatWelcomeText}
                    </p>

                    {/* Quick Topics Grid representing UAE Hospitality & Sadu Weaving */}
                    <div className="w-full max-w-xl space-y-3">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-uae-gold mb-1">
                        {lang === 'ar' ? "💡 مباحث السنع ورعاية الرضيع في تراثنا المتوارث:" : "💡 Childcare and Heritage Topics:"}
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {HeritageStarters[lang].map((starter, valIx) => (
                          <button
                            key={valIx}
                            type="button"
                            onClick={() => setUserInput(starter.query)}
                            className="bg-white hover:bg-uae-green-light border border-pattern hover:border-uae-green/45 p-3 rounded-2xl text-start flex items-start gap-3 transition-all cursor-pointer hover:shadow-sm text-xs text-text-main font-semibold group"
                          >
                            <span className="text-lg p-1.5 bg-sand-light rounded-xl border border-pattern group-hover:bg-white transition-colors flex-shrink-0 select-none">{starter.icon}</span>
                            <div className="flex-1 min-w-0">
                              <span className="block text-[11px] text-uae-green font-bold mb-0.5 group-hover:text-uae-red transition-colors text-start">
                                {starter.label}
                              </span>
                              <span className="block text-[10px] text-olive-muted font-normal truncate leading-snug text-start">
                                {starter.query}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse self-end' : 'self-start'} max-w-[80%]`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm text-sm ${
                      msg.role === 'user' ? 'bg-olive-deep text-white' : 'bg-sand-med'
                    }`}>
                      {msg.role === 'user' ? T[lang].userInitial : '👵'}
                    </div>
                    <div className={`p-4 rounded-2xl shadow-soft border border-pattern ${
                      msg.role === 'user' 
                        ? 'bg-olive-deep text-white rounded-se-none border-none' 
                        : 'bg-white/90 backdrop-blur-sm text-text-main rounded-ss-none'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.parts[0].text}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 self-start max-w-[80%]">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sand-med flex items-center justify-center text-sm">👵</div>
                    <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl rounded-ss-none border border-pattern animate-pulse">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-olive-muted rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-olive-muted rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-1.5 h-1.5 bg-olive-muted rounded-full animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="mt-4 md:mt-6 p-3 md:p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-pattern flex items-center gap-3 md:gap-4 relative z-10 shadow-sm">
                <button className="w-12 h-12 rounded-full bg-olive-deep text-white flex items-center justify-center text-xl shadow-lg hover:scale-105 transition-transform disabled:opacity-50">
                  🎙️
                </button>
                <input 
                  type="text" 
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={T[lang].chatPlaceholder} 
                  className="flex-1 bg-transparent border-none outline-none text-sm placeholder:opacity-40"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isLoading || !userInput.trim()}
                  className="p-2 text-olive-deep hover:bg-olive-deep/10 rounded-full transition-colors disabled:opacity-20 flex items-center justify-center"
                >
                  <Send size={24} className={lang === 'en' ? '' : 'rotate-180'} />
                </button>
              </div>
            </motion.div>
          )}

          {(activeTab === 'stories' || activeTab === 'songs') && (
            <motion.div 
              key="content-list"
              initial={{ opacity: 0, x: lang === 'ar' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: lang === 'ar' ? -20 : 20 }}
              className="flex-1 flex overflow-hidden h-full"
            >
              <div className={`w-80 border-pattern bg-[#F9F7F3]/50 overflow-y-auto p-6 space-y-3 ${lang === 'ar' ? 'border-l' : 'border-r'}`}>
                <div className="mb-6">
                  <h2 className="serif-ar text-2xl font-bold text-olive-deep">
                    {activeTab === 'stories' ? T[lang].storiesTitle : T[lang].songsTitle}
                  </h2>
                  <p className="text-[10px] text-olive-muted font-medium mt-1 leading-relaxed">
                    {activeTab === 'stories' ? T[lang].storiesSubtext : T[lang].songsSubtext}
                  </p>
                </div>
                
                {(activeTab === 'stories' ? stories : songs).map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedItem(item)}
                    className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between group shadow-sm ${lang === 'ar' ? 'text-right shadow-sm' : 'text-left'} ${
                      selectedItem?.title === item.title 
                        ? 'bg-olive-deep border-olive-deep text-white shadow-md' 
                        : 'bg-white border-pattern hover:shadow-md text-text-main hover:border-gold-accent/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {activeTab === 'stories' ? '🌙' : '🧸'}
                      </span>
                      <div>
                        <span className="font-semibold text-sm block leading-tight">{item.title}</span>
                        <span className={`text-[10px] block mt-1 ${
                          selectedItem?.title === item.title ? 'text-gold-accent/90 font-bold' : 'text-olive-muted'
                        }`}>
                          {activeTab === 'stories' ? T[lang].storyListSubtitle : T[lang].songListSubtitle}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className={`transition-transform duration-200 ${lang === 'ar' ? 'rotate-180' : ''} ${selectedItem?.title === item.title ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                  </button>
                ))}
              </div>
 
              <div className="flex-grow flex-1 bg-[#FCFAF5] flex flex-col h-full overflow-hidden relative">
                {/* Traditional Cultural Theme Background Overlay for Kids and Babies */}
                <div 
                  className="absolute inset-0 pointer-events-none opacity-[0.065] bg-center bg-no-repeat bg-contain mix-blend-multiply transition-opacity duration-500"
                  style={{ 
                    backgroundImage: activeTab === 'stories' ? 'url(/stories_tab_bg.png)' : 'url(/songs_tab_bg.png)',
                    backgroundSize: 'min(480px, 65%)',
                    backgroundPosition: 'center 45%'
                  }}
                />

                <div className="relative z-10 flex-1 flex flex-col h-full overflow-hidden">
                  <AnimatePresence mode="wait">
                    {selectedItem ? (
                      <motion.div
                        key={selectedItem.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col h-full justify-between overflow-hidden"
                      >
                        {/* Independent Reading Area */}
                        <div className="flex-1 overflow-y-auto p-8 md:p-12">
                          <div className="max-w-2xl mx-auto pb-10">
                            <div className="flex justify-between items-center mb-10 border-b border-pattern pb-6">
                              <div>
                                <h3 className="serif-ar text-4xl font-bold text-olive-deep">{selectedItem.title}</h3>
                                <p className="text-xs text-olive-muted mt-2">
                                  {activeTab === 'stories' ? T[lang].grandmotherVoice : T[lang].grandfatherVoice}
                                </p>
                              </div>
                            </div>
                            
                            <div className={`prose prose-olive max-w-none ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                              <p className="text-xl leading-[1.8] text-text-main/90 whitespace-pre-wrap font-serif serif-ar">
                                {selectedItem.text}
                              </p>
                            </div>

                            <div className="mt-12 pt-8 border-t border-pattern flex items-center gap-4 text-gold-accent font-bold serif-ar">
                              <div className="w-8 h-px bg-gold-accent"></div>
                              {activeTab === 'songs' ? T[lang].folkloreSongs : T[lang].folkloreStories}
                            </div>
                          </div>
                        </div>

                        {/* Persistent Bottom multimedia Player Cockpit with full controls */}
                        <div className="flex-shrink-0 bg-white border-t border-pattern px-8 py-4 shadow-[0_-8px_20px_rgba(0,0,0,0.03)] relative z-20 w-full transition-all duration-300">
                          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                            
                            {/* Left Side: Thumbnail metadata info */}
                            <div className="flex items-center gap-3 w-full md:w-auto min-w-[200px]">
                              <div className="w-10 h-10 rounded-xl bg-sand-med flex items-center justify-center text-xl shadow-inner border border-pattern flex-shrink-0">
                                {activeTab === 'stories' ? '🌙' : '🧸'}
                              </div>
                              <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
                                <p className="font-semibold text-xs leading-tight text-text-main line-clamp-1">{selectedItem.title}</p>
                                {isSpeechFallback ? (
                                  <p className="text-[9px] text-uae-gold font-bold mt-0.5 animate-pulse">
                                    {lang === 'ar' 
                                      ? "✨ معزوفة هادئة مع قارئ تراثي تلقائي" 
                                      : "✨ Sleep melody with natural voice reader"}
                                  </p>
                                ) : (
                                  <p className="text-[9px] uppercase tracking-wider text-olive-muted font-bold mt-0.5">
                                    {activeTab === 'stories' ? T[lang].grandmotherVoice : T[lang].grandfatherVoice}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Center Section: Core Actions & Timeline Drag Seeker */}
                            <div className="flex-grow flex-1 w-full flex flex-col items-center gap-2">
                              {/* Main Actions: Skip Back, Play/Pause, Skip Forward */}
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => skipTime(-10)}
                                  disabled={!audioUrl || isAudioLoading}
                                  className="p-1.5 text-olive-deep hover:bg-olive-deep/10 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  title={lang === 'en' ? "Skip Back 10s" : "رجوع ١٠ ثوانٍ"}
                                >
                                  <SkipBack size={18} />
                                </button>

                                <button
                                  onClick={audioUrl ? togglePlayPause : () => playAudio(selectedItem.text, activeTab === 'songs' ? 'song' : 'story')}
                                  disabled={isAudioLoading}
                                  className="w-11 h-11 bg-olive-deep hover:bg-olive-muted text-white rounded-full shadow-md flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
                                >
                                  {isAudioLoading ? (
                                    <Loader2 className="animate-spin" size={18} />
                                  ) : audioPlaying ? (
                                    <Pause fill="currentColor" size={16} />
                                  ) : (
                                    <Play fill="currentColor" size={16} className={lang === 'en' ? "ml-0.5" : "mr-0.5"} />
                                  )}
                                </button>

                                <button
                                  onClick={() => skipTime(10)}
                                  disabled={!audioUrl || isAudioLoading}
                                  className="p-1.5 text-olive-deep hover:bg-olive-deep/10 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  title={lang === 'en' ? "Skip Forward 10s" : "تقدم ١٠ ثوانٍ"}
                                >
                                  <SkipForward size={18} />
                                </button>
                              </div>

                              {/* Interactive range bar scrub controls / Drag Back and Front */}
                              <div className="w-full flex items-center gap-3 text-[11px] font-semibold text-olive-muted leading-none">
                                <span className="font-mono min-w-[32px] text-center">{formatTime(audioCurrentTime)}</span>
                                <input
                                  type="range"
                                  min="0"
                                  max={audioDuration || 100}
                                  value={audioCurrentTime}
                                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                                  disabled={!audioUrl}
                                  className="flex-1 accent-olive-deep h-1 bg-transparent border-none cursor-pointer disabled:opacity-30"
                                  style={{
                                    background: `linear-gradient(to right, #0D4F38 0%, #0D4F38 ${audioDuration ? (audioCurrentTime / audioDuration) * 100 : 0}%, #EAE5DE ${audioDuration ? (audioCurrentTime / audioDuration) * 100 : 0}%, #EAE5DE 100%)`,
                                    WebkitAppearance: 'none',
                                    borderRadius: '2px'
                                  }}
                                />
                                <span className="font-mono min-w-[32px] text-center">{formatTime(audioDuration)}</span>
                              </div>
                            </div>

                            {/* Right Section / RTL Side Actions: Speed, Volume Mute controls */}
                            <div className="flex flex-wrap items-center justify-center md:justify-end gap-5 w-full md:w-auto">
                              
                              {/* Voice selection controls */}
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] uppercase font-bold text-olive-muted tracking-wider">
                                  {lang === 'en' ? "Voice:" : "الراوي:"}
                                </span>
                                <div className="flex bg-sand-light border border-pattern rounded-lg p-0.5 text-[10px] font-semibold">
                                  <button
                                    onClick={() => handleTtsModeChange('ai')}
                                    className={`px-2 py-0.5 rounded-md transition-all ${
                                      ttsMode === 'ai'
                                        ? 'bg-olive-deep text-white font-bold'
                                        : 'text-text-main opacity-60 hover:opacity-100'
                                    }`}
                                    title={lang === 'en' ? "Grandma / Grandpa's voice via Gemini AI" : "صوت يده / يده بالذكاء الاصطناعي"}
                                  >
                                    {lang === 'en' ? "AI" : "الذكاء الاصطناعي"}
                                  </button>
                                  <button
                                    onClick={() => handleTtsModeChange('browser')}
                                    className={`px-2 py-0.5 rounded-md transition-all ${
                                      ttsMode === 'browser'
                                        ? 'bg-olive-deep text-white font-bold'
                                        : 'text-text-main opacity-60 hover:opacity-100'
                                    }`}
                                    title={lang === 'en' ? "Standard responsive local narrator" : "راوٍ محلي فوري ومتوافق"}
                                  >
                                    {lang === 'en' ? "Local" : "محلي"}
                                  </button>
                                </div>
                              </div>

                              {/* Vertical division divider line */}
                              <div className="hidden sm:block w-px h-6 bg-pattern" />

                              {/* Audio speed controls */}
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] uppercase font-bold text-olive-muted tracking-wider">
                                  {lang === 'en' ? "Speed:" : "السرعة:"}
                                </span>
                                <div className="flex bg-sand-light border border-pattern rounded-lg p-0.5 text-[10px] font-semibold">
                                  {[1.0, 1.25, 1.5].map((speedValue) => (
                                    <button
                                      key={speedValue}
                                      onClick={() => handleSpeedChange(speedValue)}
                                      disabled={!audioUrl}
                                      className={`px-1.5 py-0.5 rounded-md transition-all disabled:opacity-30 ${
                                        audioSpeed === speedValue && audioUrl
                                          ? 'bg-olive-deep text-white font-bold'
                                          : 'text-text-main opacity-60 hover:opacity-100'
                                      }`}
                                    >
                                      {speedValue}x
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Vertical division divider line */}
                              <div className="hidden sm:block w-px h-6 bg-pattern" />

                              {/* Volume audio controllers */}
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={toggleMute}
                                  disabled={!audioUrl}
                                  className="p-1.5 text-olive-deep hover:bg-olive-deep/10 rounded-full transition-colors disabled:opacity-30"
                                  title={lang === 'en' ? "Mute/Unmute" : "كتم/تشغيل الصوت"}
                                >
                                  {audioMuted || audioVolume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                </button>
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.05"
                                  value={audioMuted ? 0 : audioVolume}
                                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                  disabled={!audioUrl}
                                  className="w-16 md:w-20 accent-olive-deep h-1 bg-sand-med rounded-lg cursor-pointer disabled:opacity-30"
                                />
                              </div>

                            </div>

                          </div>
                        </div>

                      </motion.div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-lg mx-auto py-12">
                        <div className="relative w-36 h-36 mb-8 flex items-center justify-center">
                          {/* Pulsing Concentric Golden Rings */}
                          <span className="absolute inset-0 rounded-full bg-uae-gold/10 animate-ping duration-[3000ms]" />
                          <span className="absolute inset-3 rounded-full bg-uae-green/5 animate-pulse duration-[2000ms]" />
                          <div className="relative w-26 h-26 rounded-full bg-white border border-pattern flex items-center justify-center text-5xl shadow-md select-none">
                            {activeTab === 'stories' ? '📖' : '🎶'}
                          </div>
                          {/* Mini UAE decorative tag */}
                          <div className="absolute top-2 right-2 w-7 h-7 bg-uae-green rounded-full text-white flex items-center justify-center text-[10px] font-bold shadow-sm select-none border border-white">
                            ✨
                          </div>
                        </div>
                        
                        <p className="serif-ar text-2xl font-bold text-uae-green mb-3">
                          {activeTab === 'stories' ? T[lang].unselectedStoriesTitle : T[lang].unselectedSongsTitle}
                        </p>
                        
                        <p className="text-xs max-w-sm leading-relaxed text-olive-muted font-medium bg-white/70 backdrop-blur-sm p-4 rounded-2xl border border-pattern shadow-sm">
                          {activeTab === 'stories' ? T[lang].unselectedStoriesText : T[lang].unselectedSongsText}
                        </p>
                        
                        {/* Decorative architecture pattern line */}
                        <div className="mt-8 flex items-center gap-2 text-uae-gold opacity-60">
                          <span className="w-12 h-[1px] bg-gradient-to-r from-transparent to-uae-gold" />
                          <span className="text-xs">🕊️</span>
                          <span className="w-12 h-[1px] bg-gradient-to-l from-transparent to-uae-gold" />
                        </div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'goals' && (
            <motion.div
              key="goals"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex overflow-hidden h-full"
            >
              <SharedFamilyGoals lang={lang} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation Bar styled in pristine UAE Theme */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-pattern flex justify-around items-center px-4 z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.03)] pb-safe">
        <MobileTabButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon="💬" label={T[lang].chatTab} />
        <MobileTabButton active={activeTab === 'stories'} onClick={() => { setActiveTab('stories'); setSelectedItem(null); }} icon="📖" label={T[lang].storiesTab} />
        <MobileTabButton active={activeTab === 'songs'} onClick={() => { setActiveTab('songs'); setSelectedItem(null); }} icon="🎵" label={T[lang].songsTab} />
        <MobileTabButton active={activeTab === 'goals'} onClick={() => { setActiveTab('goals'); setSelectedItem(null); }} icon="🏡" label={T[lang].goalsTab} />
      </div>
    </div>
    </>
  );
}

function SidebarButton({ active, onClick, icon, label, lang }: { active: boolean, onClick: () => void, icon: string, label: string, lang: 'ar' | 'en' }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-3 w-full p-4 rounded-xl transition-all shadow-sm border ${lang === 'ar' ? 'text-right' : 'text-left'} overflow-hidden ${
        active 
          ? 'bg-gradient-to-r from-uae-green to-[#073624] text-white border-uae-green shadow-soft' 
          : 'bg-white border-pattern text-text-main hover:shadow-md hover:border-uae-green/20'
      }`}
    >
      {/* Dynamic elegant UAE-flag inspired visual stripe on the active sidebar tab */}
      {active && (
        <div className={`absolute top-0 bottom-0 w-1 flex flex-col ${lang === 'ar' ? 'right-0' : 'left-0'}`}>
          <div className="flex-1 bg-uae-red" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-uae-green" />
        </div>
      )}
      <span className={`text-xl transition-transform group-hover:scale-110 ${active && (lang === 'ar' ? 'mr-2' : 'ml-2')}`}>{icon}</span>
      <span className={`text-xs font-bold ${active ? 'text-white' : 'text-text-main'}`}>{label}</span>
      {active && <div className="ms-auto w-1.5 h-1.5 bg-uae-gold rounded-full" />}
    </button>
  );
}

function MobileTabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: string, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all relative ${
        active ? 'text-uae-green' : 'text-text-main/50 hover:text-text-main'
      }`}
    >
      <span className={`text-xl transition-transform ${active ? 'scale-110' : 'scale-100'}`}>{icon}</span>
      <span className={`text-[9px] font-extrabold mt-0.5 tracking-tight ${active ? 'text-uae-green' : 'text-text-main/60'}`}>
        {label}
      </span>
      {active && (
        <span className="absolute bottom-1 w-5 h-1 bg-uae-gold rounded-full" />
      )}
    </button>
  );
}
