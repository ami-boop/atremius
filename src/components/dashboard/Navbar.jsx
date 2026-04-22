import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { DAY_LABELS, MONTH_NAMES } from '../../constants';
import { DAY_LABELS as dayNames, MONTH_NAMES as monthNames } from '../../constants';

export default function Navbar() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-[var(--surface)]/80 backdrop-blur-xl sticky top-0 z-50">
      <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-[var(--surface-container)] transition-all">
        <Settings className="w-4 h-4" />
      </button>
      <div className="text-right">
        <p className="text-[10px] font-inter text-muted-foreground tracking-widest uppercase">
          {dayNames[currentTime.getDay()]}, {currentTime.getDate()} {monthNames[currentTime.getMonth()]}
        </p>
        <p className="text-sm font-manrope font-semibold tracking-tight text-foreground">
          {currentTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false })}
        </p>
      </div>
    </nav>
  );
}