import React from 'react';
import { DocumentCategory } from '../types';
import { Sparkles, HeartPulse, Calendar, Shield, DollarSign, GraduationCap } from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const CATEGORIES: Array<{ id: string; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'All', label: 'All HR Policies', icon: Sparkles },
  { id: 'Time Off', label: 'Time Off & Leave', icon: Calendar },
  { id: 'Benefits', label: 'Health & 401(k)', icon: HeartPulse },
  { id: 'General Policies', label: 'Remote & Conduct', icon: Shield },
  { id: 'Expenses', label: 'Travel & Expenses', icon: DollarSign },
  { id: 'Career & Learning', label: 'Learning & Tuition', icon: GraduationCap },
];

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isSelected = selectedCategory === cat.id;
        return (
          <button
            key={cat.id}
            id={`category-pill-${cat.id.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={() => onSelectCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              isSelected
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80 hover:text-slate-900'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
};
