export function getThemeStyles(theme: 'dark' | 'neon' | 'retro' | 'minimal' | 'pride') {
  const themes = {
    dark: {
      alertContainer: {
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(20, 20, 20, 0.9) 100%)',
      },
      alertBox: {
        background: 'rgba(30, 30, 30, 0.95)',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
      },
      confettiColors: ['#FFFFFF', '#FFD700', '#FF6B6B', '#4ECDC4'],
    },
    neon: {
      alertContainer: {
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 0, 40, 0.95) 100%)',
      },
      alertBox: {
        background: 'rgba(10, 0, 30, 0.95)',
        border: '2px solid #00FFFF',
        boxShadow: '0 8px 32px rgba(0, 255, 255, 0.5), 0 0 20px rgba(0, 255, 255, 0.3)',
      },
      confettiColors: ['#00FFFF', '#FF00FF', '#00FF00', '#FFFF00'],
    },
    retro: {
      alertContainer: {
        background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.9) 0%, rgba(101, 67, 33, 0.9) 100%)',
      },
      alertBox: {
        background: 'rgba(139, 69, 19, 0.95)',
        border: '3px solid #FFD700',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(255, 215, 0, 0.2)',
      },
      confettiColors: ['#FFD700', '#FF8C00', '#FF4500', '#8B4513'],
    },
    minimal: {
      alertContainer: {
        background: 'transparent',
      },
      alertBox: {
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
      },
      confettiColors: ['#FFFFFF', '#E0E0E0', '#B0B0B0'],
    },
    pride: {
      alertContainer: {
        background: 'linear-gradient(135deg, rgba(255, 0, 0, 0.2) 0%, rgba(255, 165, 0, 0.2) 25%, rgba(255, 255, 0, 0.2) 50%, rgba(0, 128, 0, 0.2) 75%, rgba(0, 0, 255, 0.2) 100%)',
      },
      alertBox: {
        background: 'rgba(255, 255, 255, 0.95)',
        border: '3px solid transparent',
        borderImage: 'linear-gradient(45deg, #FF0000, #FF8C00, #FFD700, #008000, #0000FF, #4B0082) 1',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
      confettiColors: ['#FF0000', '#FF8C00', '#FFD700', '#008000', '#0000FF', '#4B0082'],
    },
  };

  return themes[theme];
}

