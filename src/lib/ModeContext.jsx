import { createContext, useContext, useState } from 'react';
import { MODES } from '@/config/mode';

const ModeContext = createContext(null);

const modes = MODES

export function ModeProvider({ children }) {
  const [mode, setMode] = useState('ПРОДУКТИВНОСТЬ');
  return (
    <ModeContext.Provider value={{ mode, setMode, modeColor: modes[mode].color }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  return useContext(ModeContext);
}