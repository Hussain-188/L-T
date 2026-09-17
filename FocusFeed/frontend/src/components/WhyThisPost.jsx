import { useState } from 'react';
import { HiInformationCircle, HiX } from 'react-icons/hi';
import api from '../api/axios';

export default function WhyThisPost({ postId, breakdown }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(breakdown || null);
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    if (data) {
      setOpen(true);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/feed/explain/${postId}`);
      setData(res.data.breakdown);
      setOpen(true);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleOpen}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-500 transition-colors cursor-pointer"
      >
        <HiInformationCircle className="w-3.5 h-3.5" />
        {loading ? 'Loading...' : 'Why this post?'}
      </button>

      {open && data && (
        <div className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-800">Ranking Breakdown</h4>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
              <HiX className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {data.interest && (
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Interest: <span className="font-medium">{data.interest.category}</span> (weight: {data.interest.weight})
                </span>
                <span className={`font-mono ${data.interest.score > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  +{data.interest.score}
                </span>
              </div>
            )}

            {data.focusMode && (
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Focus: <span className="font-medium capitalize">{data.focusMode.mode}</span>
                </span>
                <span className={`font-mono ${data.focusMode.boost > 0 ? 'text-green-600' : data.focusMode.boost < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {data.focusMode.boost > 0 ? '+' : ''}{data.focusMode.boost}
                </span>
              </div>
            )}

            {data.discovery && (
              <div className="flex justify-between">
                <span className="text-gray-600">Discovery bonus</span>
                <span className="font-mono text-green-600">+{data.discovery.boost}</span>
              </div>
            )}

            {data.recency && (
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Recency ({data.recency.hoursAgo}h ago)
                </span>
                <span className="font-mono text-green-600">+{data.recency.score}</span>
              </div>
            )}

            {data.engagement && (
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Engagement ({data.engagement.likes} likes)
                </span>
                <span className="font-mono text-green-600">+{data.engagement.boost}</span>
              </div>
            )}

            <div className="border-t border-gray-100 pt-2 flex justify-between font-semibold">
              <span className="text-gray-800">Total Score</span>
              <span className="text-indigo-600 font-mono">{data.total}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
