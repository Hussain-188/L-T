import { useState, useEffect } from 'react';
import { HiSave, HiBookmark, HiX } from 'react-icons/hi';
import api from '../api/axios';
import toast from 'react-hot-toast';

const CATEGORY_ICONS = {
  Science: '🔬', Technology: '💻', Sports: '⚽', Art: '🎨',
  Music: '🎵', Entertainment: '🎬', 'Personal Stories': '📖',
  'Social Causes': '🌍', Education: '📚', Gaming: '🎮',
  Food: '🍕', Travel: '✈️',
};

export default function InterestSelector({ profile, onUpdate, onClose }) {
  const [interests, setInterests] = useState([]);
  const [presetName, setPresetName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.interests?.length > 0) {
      setInterests(profile.interests);
    } else {
      setInterests(
        Object.keys(CATEGORY_ICONS).map((cat) => ({ category: cat, weight: 50 }))
      );
    }
  }, [profile]);

  const updateWeight = (category, weight) => {
    setInterests((prev) =>
      prev.map((i) => (i.category === category ? { ...i, weight: parseInt(weight) } : i))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/interests/my', { interests });
      toast.success('Interests updated!');
      if (onUpdate) onUpdate();
    } catch {
      toast.error('Failed to save interests');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) return toast.error('Enter a preset name');
    try {
      await api.post('/interests/presets', { name: presetName, interests });
      setPresetName('');
      toast.success('Preset saved!');
      if (onUpdate) onUpdate();
    } catch {
      toast.error('Failed to save preset');
    }
  };

  const handleActivatePreset = async (presetId) => {
    try {
      await api.put(`/interests/presets/${presetId}/activate`);
      toast.success('Preset activated!');
      if (onUpdate) onUpdate();
    } catch {
      toast.error('Failed to activate preset');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Your Interests</h2>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <HiX className="w-5 h-5" />
          </button>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-5">Adjust the sliders to control how much of each topic appears in your feed.</p>

      <div className="space-y-3 mb-6">
        {interests.map((item) => (
          <div key={item.category} className="flex items-center gap-3">
            <span className="text-lg w-7 text-center">{CATEGORY_ICONS[item.category]}</span>
            <span className="text-sm font-medium text-gray-700 w-32 shrink-0">{item.category}</span>
            <input
              type="range"
              min="0"
              max="100"
              value={item.weight}
              onChange={(e) => updateWeight(item.category, e.target.value)}
              className="flex-1 h-2 accent-indigo-600 cursor-pointer"
            />
            <span className="text-xs font-mono text-gray-500 w-8 text-right">{item.weight}</span>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm disabled:opacity-50 cursor-pointer mb-4"
      >
        <HiSave className="w-4 h-4" />
        {saving ? 'Saving...' : 'Save Interests'}
      </button>

      <div className="border-t border-gray-100 pt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Presets</h3>

        {profile?.presets?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {profile.presets.map((p) => (
              <button
                key={p._id}
                onClick={() => handleActivatePreset(p._id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  profile.activePresetId?.toString() === p._id?.toString()
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <HiBookmark className="w-3 h-3 inline mr-1" />
                {p.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Preset name..."
            className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleSavePreset}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
