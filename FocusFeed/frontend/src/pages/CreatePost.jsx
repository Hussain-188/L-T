import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiPhotograph, HiX } from 'react-icons/hi';
import api from '../api/axios';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Science', 'Technology', 'Sports', 'Art', 'Music',
  'Entertainment', 'Personal Stories', 'Social Causes',
  'Education', 'Gaming', 'Food', 'Travel', 'Other',
];

const FOCUS_TYPES = [
  { value: 'educational', label: 'Educational' },
  { value: 'story', label: 'Story' },
  { value: 'discussion', label: 'Discussion' },
  { value: 'creative', label: 'Creative' },
  { value: 'meme', label: 'Meme' },
  { value: 'news', label: 'News' },
];

export default function CreatePost() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [focusType, setFocusType] = useState('discussion');
  const [visibility, setVisibility] = useState('public');
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 4) {
      return toast.error('Maximum 4 images allowed');
    }
    setImages(prev => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviews(prev => [...prev, ev.target.result]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return toast.error('Please write something');
    if (!category) return toast.error('Please select a category');

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('category', category);
      formData.append('focusType', focusType);
      formData.append('visibility', visibility);
      images.forEach((img) => formData.append('images', img));

      await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Post created!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">Create Post</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="relative">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={5000}
                  rows={5}
                  placeholder="What's on your mind?"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-800"
                />
                <span className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {content.length}/5000
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={focusType}
                  onChange={(e) => setFocusType(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {FOCUS_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
              <div className="flex gap-4">
                {['public', 'followers', 'private'].map((v) => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      value={v}
                      checked={visibility === v}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="accent-indigo-600"
                    />
                    <span className="text-sm text-gray-700 capitalize">{v}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Images (max 4)</label>
              {previews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {previews.map((src, i) => (
                    <div key={i} className="relative group">
                      <img src={src} alt="" className="w-full h-20 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <HiX className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {images.length < 4 && (
                <button
                  type="button"
                  onClick={() => fileRef.current.click()}
                  className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 border border-dashed border-indigo-300 rounded-lg px-4 py-3 w-full justify-center hover:bg-indigo-50 transition-colors cursor-pointer"
                >
                  <HiPhotograph className="w-5 h-5" />
                  Add Images
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
