import { useState } from 'react';
import { HiHeart, HiOutlineHeart, HiChat, HiShare } from 'react-icons/hi';
import api from '../api/axios';
import toast from 'react-hot-toast';
import WhyThisPost from './WhyThisPost';

const CATEGORY_COLORS = {
  Science: 'bg-blue-100 text-blue-700',
  Technology: 'bg-purple-100 text-purple-700',
  Sports: 'bg-green-100 text-green-700',
  Art: 'bg-pink-100 text-pink-700',
  Music: 'bg-yellow-100 text-yellow-700',
  Entertainment: 'bg-orange-100 text-orange-700',
  'Personal Stories': 'bg-rose-100 text-rose-700',
  'Social Causes': 'bg-teal-100 text-teal-700',
  Education: 'bg-indigo-100 text-indigo-700',
  Gaming: 'bg-red-100 text-red-700',
  Food: 'bg-amber-100 text-amber-700',
  Travel: 'bg-cyan-100 text-cyan-700',
  Other: 'bg-gray-100 text-gray-700',
};

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function PostCard({ post, currentUserId, onUpdate, showExplain }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [liked, setLiked] = useState(post.likes?.includes(currentUserId));
  const [submitting, setSubmitting] = useState(false);

  const handleLike = async () => {
    try {
      const res = await api.post(`/posts/${post._id}/like`);
      setLiked(res.data.liked);
      setLikeCount(res.data.likeCount);
    } catch {
      toast.error('Failed to like post');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/posts/${post._id}/comment`, { text: commentText });
      setCommentText('');
      if (onUpdate) onUpdate();
      toast.success('Comment added');
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const author = post.author || {};
  const initial = (author.displayName || author.username || 'U')[0].toUpperCase();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">
              {author.displayName || author.username}
            </p>
            <p className="text-xs text-gray-500">
              @{author.username} · {timeAgo(post.createdAt)}
            </p>
          </div>
          <span className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${CATEGORY_COLORS[post.category] || CATEGORY_COLORS.Other}`}>
            {post.category}
          </span>
        </div>

        <p className="text-gray-800 text-sm leading-relaxed mb-3 whitespace-pre-wrap">{post.content}</p>

        {post.images?.length > 0 && (
          <div className={`grid gap-2 mb-3 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {post.images.map((img, i) => (
              <img
                key={i}
                src={`http://localhost:5000/${img}`}
                alt=""
                className="rounded-lg w-full h-48 object-cover"
              />
            ))}
          </div>
        )}

        {post.isAIGenerated && (
          <div className="mb-3 inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-full">
            <span>🤖</span> AI-Generated Content
          </div>
        )}

        <div className="flex items-center gap-6 pt-2 border-t border-gray-50">
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 text-sm transition-colors cursor-pointer hover:text-red-500"
            style={{ color: liked ? '#ef4444' : '#6b7280' }}
          >
            {liked ? <HiHeart className="w-5 h-5" /> : <HiOutlineHeart className="w-5 h-5" />}
            {likeCount}
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-500 transition-colors cursor-pointer"
          >
            <HiChat className="w-5 h-5" />
            {post.comments?.length || 0}
          </button>
          <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-500 transition-colors cursor-pointer">
            <HiShare className="w-5 h-5" />
          </button>
          {showExplain && (
            <div className="ml-auto">
              <WhyThisPost postId={post._id} breakdown={post._breakdown} />
            </div>
          )}
        </div>
      </div>

      {showComments && (
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
          {post.comments?.slice(-3).map((c, i) => (
            <div key={i} className="flex gap-2 mb-2 last:mb-0">
              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0 mt-0.5">
                {(c.user?.displayName || c.user?.username || 'U')[0].toUpperCase()}
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-700">
                  {c.user?.displayName || c.user?.username || 'User'}
                </span>
                <p className="text-xs text-gray-600">{c.text}</p>
              </div>
            </div>
          ))}
          <form onSubmit={handleComment} className="flex gap-2 mt-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={submitting || !commentText.trim()}
              className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer transition-colors"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
