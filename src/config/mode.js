const MODES = {
  'ПРОДУКТИВНОСТЬ': { color: 'var(--emerald)', cssVar: '--emerald', hsl: '138 65% 66%' },
  'СТАБИЛЬНО':              { color: 'var(--amber)',   cssVar: '--amber',   hsl: '40 100% 83%' },
  'ВОССТАНОВЛЕНИЕ':         { color: 'var(--coral)',   cssVar: '--coral',   hsl: '18 100% 83%' },
};

const modeColors = {
  'ПРОДУКТИВНОСТЬ':   'var(--emerald)',
  'СТАБИЛЬНО':       'var(--amber)',
  'ВОССТАНОВЛЕНИЕ':  'var(--coral)',
};

const modeLabelsShort = {
  'ПРОДУКТИВНОСТЬ':   'Продуктивность',
  'СТАБИЛЬНО':       'Стабильно',
  'ВОССТАНОВЛЕНИЕ':  'Восстановление',
};

const modeLabels = {
  'ПРОДУКТИВНОСТЬ': { title: 'Изумрудное состояние', risk: 'Риск выгорания: Низкий', capacity: '92%' },
  'СТАБИЛЬНО':              { title: 'Стабильный режим',     risk: 'Риск выгорания: Умеренный', capacity: '70%' },
  'ВОССТАНОВЛЕНИЕ':         { title: 'Режим восстановления', risk: 'Риск выгорания: Высокий', capacity: '45%' },
};

const states = [
  { label: 'ПРОДУКТИВНОСТЬ' },
  { label: 'СТАБИЛЬНО' },
  { label: 'ВОССТАНОВЛЕНИЕ' },
];

export { 
    MODES,
    modeColors,
    modeLabelsShort,
    modeLabels,
    states
}