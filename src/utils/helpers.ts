import QRCode from 'qrcode';

// Generate QR Code Data URL string
export async function generateQRCodeDataUrl(text: string): Promise<string> {
  try {
    const url = await QRCode.toDataURL(text, {
      width: 240,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
    return url;
  } catch (err) {
    console.error('Failed to generate QR code:', err);
    return '';
  }
}

// Speak Voice Announcement in Tamil or English using Web Speech API
export function speakAnnouncement(text: string, lang: 'ta-IN' | 'en-US' = 'en-US') {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }

  window.speechSynthesis.cancel(); // Stop any ongoing speech

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.9; // Slightly calm speed for announcements
  utterance.pitch = 1.0;

  // Find best matching voice if available
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang === lang || v.lang.startsWith(lang.substring(0, 2)));
  if (voice) {
    utterance.voice = voice;
  }

  window.speechSynthesis.speak(utterance);
}

// Format arrival time window
export function calculateRecommendedArrivalTime(slotTime: string, bufferMins: number = 15): string {
  try {
    // Basic slot string parser e.g. "10:30 AM"
    const [timeStr, period] = slotTime.split(' ');
    let [hours, minutes] = timeStr.split(':').map(Number);
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    date.setMinutes(date.getMinutes() - bufferMins);

    let arrHours = date.getHours();
    const arrMins = date.getMinutes().toString().padStart(2, '0');
    const arrPeriod = arrHours >= 12 ? 'PM' : 'AM';
    arrHours = arrHours % 12 || 12;

    return `${arrHours}:${arrMins} ${arrPeriod}`;
  } catch (e) {
    return '15 mins before slot';
  }
}

// Calculate progress percentage for token queue
export function calculateQueueProgress(currentSeq: number, patientSeq: number, totalTokens: number): number {
  if (patientSeq <= currentSeq) return 100;
  if (totalTokens === 0) return 0;
  const remaining = patientSeq - currentSeq;
  const progress = Math.max(5, Math.min(95, 100 - (remaining * 15)));
  return progress;
}

// LocalStorage Persistence Key
const APP_STORAGE_KEY = 'smartcare_ai_queue_state_v1';

export function saveToLocalStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(`${APP_STORAGE_KEY}_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error('LocalStorage write failed', e);
  }
}

export function loadFromLocalStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(`${APP_STORAGE_KEY}_${key}`);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error('LocalStorage read failed', e);
    return fallback;
  }
}
