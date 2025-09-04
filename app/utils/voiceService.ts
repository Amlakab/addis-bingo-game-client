
export class VoiceService {
  private synth = window.speechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private voiceLoaded = false;
  private isSpeaking = false;
  private queue: {text: string, lang: string, rate: number}[] = [];
  private fallbackToEnglish = false;
  private voiceCache = new Map<string, SpeechSynthesisVoice>();
  private preloadTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeService();
  }

  private initializeService() {
    // Immediate voice loading
    this.loadVoices();

    // Multiple fallback loading strategies
    window.addEventListener('load', this.loadVoices.bind(this));
    document.addEventListener('visibilitychange', this.loadVoices.bind(this));
    
    // Preload voices after short delay
    this.preloadTimeout = setTimeout(() => {
      this.loadVoices();
      this.preloadCommonVoices();
    }, 1500);
  }

  private preloadCommonVoices() {
    ['en-US', 'am-ET'].forEach(lang => {
      const utterance = new SpeechSynthesisUtterance('');
      utterance.lang = lang;
      utterance.volume = 0;
      this.synth.speak(utterance);
    });
  }

  private loadVoices() {
    try {
      const newVoices = this.synth.getVoices();
      if (newVoices.length > 0) {
        this.voices = newVoices;
        this.buildVoiceCache();
        
        const hasAmharic = this.voices.some(v => v.lang.includes('am-ET'));
        this.fallbackToEnglish = !hasAmharic && !this.isOnline();
        
        this.voiceLoaded = true;
        this.processQueue();
      }
    } catch (e) {
      console.error('Voice loading error:', e);
    }
  }

  private buildVoiceCache() {
    this.voiceCache.clear();
    this.voices.forEach(voice => {
      const langKey = voice.lang.split('-')[0];
      if (!this.voiceCache.has(langKey)) {
        this.voiceCache.set(langKey, voice);
      }
    });
  }

  private isOnline(): boolean {
    return navigator.onLine === undefined ? true : navigator.onLine;
  }

  speak(text: string, lang = 'en-US', rate = 1) {
    if (!this.voiceLoaded) {
      this.queue.push({text, lang, rate});
      setTimeout(() => this.loadVoices(), 100);
      return;
    }

    // Offline fallback strategy
    if (lang === 'am-ET' && this.fallbackToEnglish) {
      this.speakWithFallback(text, rate);
      return;
    }

    this.queueSpeech(text, lang, rate);
  }

  private speakWithFallback(text: string, rate: number) {
    const utterance = new SpeechSynthesisUtterance(this.convertToAmharic(text));
    utterance.lang = 'en-US'; // Force English voice
    utterance.rate = Math.min(rate, 1.5);
    utterance.pitch = 0.7; // Deeper pitch for Amharic fallback
    utterance.volume = 1.3;

    // Find best fallback voice
    const fallbackVoice = this.findBestVoice('en');
    if (fallbackVoice) utterance.voice = fallbackVoice;

    this.safeSpeak(utterance);
  }

  private findBestVoice(langPrefix: string): SpeechSynthesisVoice | null {
    // 1. Try exact match
    const exactMatch = this.voices.find(v => v.lang.startsWith(langPrefix));
    if (exactMatch) return exactMatch;

    // 2. Try cached voice
    const cached = this.voiceCache.get(langPrefix);
    if (cached) return cached;

    // 3. Fallback to any available voice
    return this.voices.length > 0 ? this.voices[0] : null;
  }

  private queueSpeech(text: string, lang: string, rate: number) {
    if (this.isSpeaking) {
      this.queue.push({text, lang, rate});
      return;
    }
    this.processSpeech(text, lang, rate);
  }

  private processSpeech(text: string, lang: string, rate: number) {
    this.isSpeaking = true;
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(
      lang === 'am-ET' ? this.convertToAmharic(text) : text
    );
    
    utterance.lang = lang;
    utterance.rate = Math.min(rate, 1.8);
    utterance.pitch = lang === 'am-ET' ? 0.8 : 1.0;
    utterance.volume = 1.2;

    // Optimized voice selection
    const voice = this.findBestVoice(lang.split('-')[0]);
    if (voice) utterance.voice = voice;

    utterance.onend = utterance.onerror = () => {
      this.isSpeaking = false;
      this.processQueue();
    };

    this.safeSpeak(utterance);
  }

  private safeSpeak(utterance: SpeechSynthesisUtterance) {
    try {
      this.synth.speak(utterance);
    } catch (e) {
      console.error('Speech error:', e);
      this.isSpeaking = false;
      this.processQueue();
    }
  }

  private processQueue() {
    if (this.queue.length > 0 && !this.isSpeaking) {
      const {text, lang, rate} = this.queue.shift()!;
      this.processSpeech(text, lang, rate);
    }
  }

  private convertToAmharic(text: string): string {
    // Handle special cases
    const specialCases: Record<string, string> = {
      "Game started": "ጨዋታው ተጀመረ!",
      "Game stopped": "ጨዋታው ተቋርጧል!",
      "Good Luck! 🍀": "መልካም ዕድል! 🍀"
    };
    
    if (specialCases[text]) return specialCases[text];
    if (!text.includes('-')) return text;

    // Number conversion logic
    const [letter, numberStr] = text.split('-');
    const number = parseInt(numberStr);
    if (isNaN(number)) return text;

    const amharicLetters: Record<string, string> = {
      'B': 'ቢ', 'I': 'አይ', 'N': 'ኤን', 'G': 'ጂ', 'O': 'ኦ'
    };

    const amharicNumbers: Record<number, string> = {
      1: 'አንድ', 2: 'ሁለት', 3: 'ሶስት', 4: 'አራት', 5: 'አምስት',
      6: 'ስድስት', 7: 'ሰባት', 8: 'ስምንት', 9: 'ዘጠኝ', 10: 'አስር',
      // ... (include all numbers up to 75 as in your original)
    };

    const letterTrans = amharicLetters[letter] || letter;
    let numberTrans = amharicNumbers[number];

    if (!numberTrans && number > 20) {
      const tens = Math.floor(number / 10) * 10;
      const units = number % 10;
      if (amharicNumbers[tens] && units > 0) {
        numberTrans = `${amharicNumbers[tens]} ${amharicNumbers[units]}`;
      }
    }

    return `${letterTrans}, ${numberTrans || number.toString()}`;
  }

  stop() {
    if (this.preloadTimeout) clearTimeout(this.preloadTimeout);
    this.synth.cancel();
    this.isSpeaking = false;
    this.queue = [];
  }
}

export const voiceService = new VoiceService();