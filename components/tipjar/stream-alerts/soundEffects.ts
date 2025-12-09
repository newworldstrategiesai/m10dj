// Sound effects for alerts
const soundCache: Map<string, HTMLAudioElement> = new Map();

const builtInSounds: Record<string, string> = {
  default: '/sounds/alert-default.mp3',
  cash: '/sounds/alert-cash.mp3',
  coin: '/sounds/alert-coin.mp3',
  success: '/sounds/alert-success.mp3',
  celebration: '/sounds/alert-celebration.mp3',
};

export function playSound(sound: string, volume: number = 0.7) {
  try {
    let audio: HTMLAudioElement;

    // Check if it's a built-in sound or custom URL
    if (builtInSounds[sound]) {
      const soundPath = builtInSounds[sound];
      
      // Check cache first
      if (soundCache.has(soundPath)) {
        audio = soundCache.get(soundPath)!;
      } else {
        audio = new Audio(soundPath);
        soundCache.set(soundPath, audio);
      }
    } else {
      // Custom sound URL
      if (soundCache.has(sound)) {
        audio = soundCache.get(sound)!;
      } else {
        audio = new Audio(sound);
        soundCache.set(sound, audio);
      }
    }

    // Clone and play to allow overlapping sounds
    const audioClone = audio.cloneNode() as HTMLAudioElement;
    audioClone.volume = Math.max(0, Math.min(1, volume));
    audioClone.play().catch(err => {
      console.warn('Failed to play sound:', err);
    });
  } catch (err) {
    console.warn('Error playing sound:', err);
  }
}

// Preload sounds for better performance
export function preloadSounds() {
  Object.values(builtInSounds).forEach(soundPath => {
    if (!soundCache.has(soundPath)) {
      const audio = new Audio(soundPath);
      audio.preload = 'auto';
      soundCache.set(soundPath, audio);
    }
  });
}

