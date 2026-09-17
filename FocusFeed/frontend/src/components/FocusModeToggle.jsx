import { HiAcademicCap, HiGlobe, HiPencilAlt } from 'react-icons/hi';
import api from '../api/axios';
import toast from 'react-hot-toast';

const MODES = [
  { key: 'learning', label: 'Learn', icon: HiAcademicCap, desc: 'Educational & in-depth content' },
  { key: 'discovery', label: 'Discover', icon: HiGlobe, desc: 'Explore outside your interests' },
  { key: 'creation', label: 'Create', icon: HiPencilAlt, desc: 'Collaborative workspaces' },
];

export default function FocusModeToggle({ activeMode, onModeChange }) {
  const handleChange = async (mode) => {
    try {
      await api.put('/interests/focus-mode', { mode });
      if (onModeChange) onModeChange(mode);
    } catch {
      toast.error('Failed to switch mode');
    }
  };

  return (
    <div className="flex gap-2">
      {MODES.map(({ key, label, icon: Icon, desc }) => (
        <button
          key={key}
          onClick={() => handleChange(key)}
          title={desc}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            activeMode === key
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
          }`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
