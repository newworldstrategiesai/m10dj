// Text-to-speech using Web Speech API
let speechSynthesis: SpeechSynthesis | null = null;

if (typeof window !== 'undefined') {
  speechSynthesis = window.speechSynthesis;
}

export function speakText(text: string, voice?: string) {
  if (!speechSynthesis) {
    console.warn('Speech synthesis not available');
    return;
  }

  // Cancel any ongoing speech
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 0.8;

  // Try to find a specific voice if requested
  if (voice && voice !== 'default') {
    const voices = speechSynthesis.getVoices();
    const selectedVoice = voices.find(v => 
      v.name.toLowerCase().includes(voice.toLowerCase()) ||
      v.lang.toLowerCase().includes(voice.toLowerCase())
    );
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
  }

  speechSynthesis.speak(utterance);
}

// Load voices when available
if (typeof window !== 'undefined') {
  if (speechSynthesis) {
    // Chrome loads voices asynchronously
    if (speechSynthesis.getVoices().length === 0) {
      speechSynthesis.addEventListener('voiceschanged', () => {
        // Voices loaded
      });
    }
  }
}

