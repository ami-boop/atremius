import React from 'react';
import { motion } from 'framer-motion';
import { tabs } from '@/config'

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="flex items-center gap-1 bg-[var(--surface-container-high)]/90 backdrop-blur-2xl rounded-2xl p-1.5 shadow-2xl shadow-black/40">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex flex-col items-center gap-1 px-8 py-2.5 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-[var(--surface-container-highest)]/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[9px] font-inter font-semibold tracking-[0.1em]">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}