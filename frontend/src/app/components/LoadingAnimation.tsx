import React, { useEffect, useState } from 'react';

interface LoadingAnimationProps {
  text?: string;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ text = "Loading..." }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('velocis-theme-mode');
    if (stored !== null) {
      setIsDarkMode(stored === 'true');
    } else {
      // Default to dark mode (same as ThemeProvider)
      setIsDarkMode(true);
    }
  }, []);

  return (
    <div 
      className="w-full min-h-screen flex flex-col items-center justify-center gap-4"
      style={{
        backgroundColor: isDarkMode ? '#0A0A0E' : '#f6f7fb'
      }}
    >
      <style>{`
        .loader {
          width: 120px;
          height: 20px;
          -webkit-mask: linear-gradient(90deg, #000 70%, #0000 0) 0/20%;
          mask: linear-gradient(90deg, #000 70%, #0000 0) 0/20%;
          animation: l4 2s infinite steps(6);
        }

        .loader.light-mode {
          background:
            linear-gradient(#000 0 0) 0/0% no-repeat
            #ddd;
        }

        .loader.dark-mode {
          background:
            linear-gradient(#fff 0 0) 0/0% no-repeat
            #2a2a2a;
        }

        @keyframes l4 {
          100% {
            background-size: 120%;
          }
        }
      `}</style>
      
      <div className={`loader ${isDarkMode ? 'dark-mode' : 'light-mode'}`}></div>
      <span 
        className="text-sm font-medium"
        style={{
          color: isDarkMode ? '#6b7280' : '#9ca3af'
        }}
      >
        {text}
      </span>
    </div>
  );
};

export default LoadingAnimation;
