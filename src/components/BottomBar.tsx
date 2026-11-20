import React from 'react';
import {
  Monitor,
  Code,
  RotateCcw,
  Radio,
  Tag,
  Layers,
  Flag,
  Bug,
  Binary
} from 'lucide-react';

export type BottomTabType = 'dual' | 'screen' | 'source' | 'aux' | 'vars' | 'debug' | 'stack' | 'flags';

interface BottomBarProps {
  activeTab: BottomTabType;
  onTabSelect: (tab: BottomTabType) => void;
  onReset: () => void;
  showFlags: boolean;
  onToggleFlags: () => void;
  onOpenCalculator?: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  activeTab,
  onTabSelect,
  onReset,
  showFlags,
  onToggleFlags,
  onOpenCalculator
}) => {
  const buttons: Array<{
    id: BottomTabType;
    label: string;
    icon: React.ReactNode;
    action?: () => void;
    isActive?: boolean;
    className?: string;
  }> = [
    {
      id: 'screen',
      label: 'screen',
      icon: <Monitor className="w-3.5 h-3.5" />,
      action: () => onTabSelect(activeTab === 'screen' ? 'dual' : 'screen'),
      isActive: activeTab === 'screen'
    },
    {
      id: 'source',
      label: 'source',
      icon: <Code className="w-3.5 h-3.5" />,
      action: () => onTabSelect(activeTab === 'source' ? 'dual' : 'source'),
      isActive: activeTab === 'source'
    },
    {
      id: 'dual',
      label: 'reset',
      icon: <RotateCcw className="w-3.5 h-3.5" />,
      action: onReset,
      isActive: false
    },
    {
      id: 'aux',
      label: 'aux',
      icon: <Radio className="w-3.5 h-3.5" />,
      action: () => onTabSelect(activeTab === 'aux' ? 'dual' : 'aux'),
      isActive: activeTab === 'aux'
    },
    {
      id: 'vars',
      label: 'vars',
      icon: <Tag className="w-3.5 h-3.5" />,
      action: () => onTabSelect(activeTab === 'vars' ? 'dual' : 'vars'),
      isActive: activeTab === 'vars'
    },
    {
      id: 'debug',
      label: 'debug',
      icon: <Bug className="w-3.5 h-3.5" />,
      action: () => onTabSelect('dual'),
      isActive: activeTab === 'dual'
    },
    {
      id: 'stack',
      label: 'stack',
      icon: <Layers className="w-3.5 h-3.5" />,
      action: () => onTabSelect(activeTab === 'stack' ? 'dual' : 'stack'),
      isActive: activeTab === 'stack'
    },
    {
      id: 'flags',
      label: 'flags',
      icon: <Flag className="w-3.5 h-3.5" />,
      action: onToggleFlags,
      isActive: showFlags
    }
  ];

  return (
    <footer className="h-12 shrink-0 bg-slate-200/80 dark:bg-slate-900/80 border-t border-slate-300 dark:border-slate-800 px-3 flex items-center justify-between gap-2 select-none z-40 backdrop-blur-xl shadow-lg">
      <div className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 overflow-x-auto py-1 max-w-full">
        {buttons.map((btn) => (
          <button
            key={btn.label}
            onClick={btn.action}
            title={`Emu8086 [${btn.label}]`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition active:scale-95 border ${
              btn.isActive
                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/30'
                : 'glass-btn border-slate-300 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            {btn.icon}
            <span>{btn.label}</span>
          </button>
        ))}

        {/* Quick Calc Button */}
        {onOpenCalculator && (
          <button
            onClick={onOpenCalculator}
            title="Open 8086 Hex Calculator & Bitwise Verifier"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border border-purple-400/50 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 transition active:scale-95 ml-1"
          >
            <Binary className="w-3.5 h-3.5 text-purple-500" />
            <span>calc</span>
          </button>
        )}
      </div>
    </footer>
  );
};
