import { useState, useEffect } from 'react';

const SplashScreen = ({ onComplete }: {onComplete: () => void;}) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onComplete();
    }, 1600);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background text-center">
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full border-2 border-primary/30 animate-rotate-ring absolute inset-0" />
        <div className="w-24 h-24 flex items-center justify-center">
          <img
            src="/gvplogo.jpg"
            alt="GVP Logo"
            className="w-20 h-20 rounded-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-4xl text-primary animate-pulse-gold rounded-full p-2">⚜</span>';
            }}
          />
        </div>
      </div>
      <h1 className="font-cinzel text-3xl md:text-4xl font-bold text-primary mb-2 tracking-widest text-center">
        Gayatri Vidya Parishad  
      </h1>
      <p className="text-muted-foreground text-sm tracking-[0.3em] mb-8 font-cormorant text-center">
        ATTENDANCE MANAGEMENT SYSTEM
      </p>
      <div className="w-64 h-1 bg-secondary rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-gold-dark via-primary to-gold-light animate-progress rounded-full" />
      </div>
    </div>);

};

export default SplashScreen;