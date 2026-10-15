'use client';

import React, { useState } from 'react';
import { SpotItem } from '@/types/travel';
import { getGoogleMapsSearchUrl } from '@/lib/maps';
import { 
  MapPin, 
  ThumbsUp, 
  MessageSquare, 
  Clock, 
  Trash2, 
  Utensils, 
  Camera, 
  ShoppingBag, 
  Bus, 
  Send 
} from 'lucide-react';

interface SpotCardProps {
  spot: SpotItem;
  currentMember: string;
  onVote: (spotId: string) => void;
  onAddComment: (spotId: string, content: string) => void;
  onDeleteSpot: (spotId: string) => void;
}

export function SpotCard({
  spot,
  currentMember,
  onVote,
  onAddComment,
  onDeleteSpot,
}: SpotCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  const votesCount = spot.votes?.filter((v) => v.vote_type === 'UP').length || 0;
  const hasVoted = spot.votes?.some((v) => v.member_name === currentMember && v.vote_type === 'UP');
  const commentsCount = spot.comments?.length || 0;

  const getCategoryMeta = (cat: string) => {
    switch (cat) {
      case 'FOOD':
        return { label: '美食', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Utensils };
      case 'SHOPPING':
        return { label: '購物', color: 'bg-pink-100 text-pink-800 border-pink-200', icon: ShoppingBag };
      case 'TRANSPORT':
        return { label: '交通', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: Bus };
      case 'ATTRACTION':
      default:
        return { label: '景點', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: Camera };
    }
  };

  const meta = getCategoryMeta(spot.category);
  const CategoryIcon = meta.icon;
  const mapsUrl = spot.google_map_url || getGoogleMapsSearchUrl(`${spot.title} ${spot.address || ''}`);

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddComment(spot.id, newComment.trim());
    setNewComment('');
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 mb-3 transition-shadow hover:shadow-md">
      {/* 頂部標籤列 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${meta.color}`}>
            <CategoryIcon className="w-3 h-3" />
            {meta.label}
          </span>
          {spot.time_slot && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              <Clock className="w-3 h-3" />
              {spot.time_slot}
            </span>
          )}
        </div>
        <button
          onClick={() => onDeleteSpot(spot.id)}
          className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition-colors"
          title="刪除景點"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* 景點主標題與推薦人 */}
      <div className="mb-2">
        <h3 className="text-base font-bold text-slate-800 leading-snug">{spot.title}</h3>
        {spot.address && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{spot.address}</p>
        )}
        {spot.created_by && (
          <p className="text-[11px] text-slate-400 mt-1">由 @{spot.created_by} 推薦</p>
        )}
      </div>

      {/* 功能快捷列 */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
        {/* Google Maps 原生 App Deep Link 導航按鈕 */}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 active:scale-95 px-3 py-1.5 rounded-xl transition-all"
        >
          <MapPin className="w-3.5 h-3.5 text-blue-600" />
          <span>Google 導航</span>
        </a>

        {/* 投票與留言操作 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onVote(spot.id)}
            className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl transition-all ${
              hasVoted
                ? 'bg-rose-50 text-rose-600 font-bold border border-rose-200'
                : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-rose-500 stroke-rose-500' : ''}`} />
            <span>{votesCount}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{commentsCount}</span>
          </button>
        </div>
      </div>

      {/* 留言討論收合區塊 */}
      {showComments && (
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs">
          <div className="space-y-2 mb-3 max-h-40 overflow-y-auto pr-1">
            {spot.comments && spot.comments.length > 0 ? (
              spot.comments.map((c) => (
                <div key={c.id} className="bg-slate-50 p-2 rounded-lg">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-semibold text-slate-700">{c.member_name}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 break-words">{c.content}</p>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-2">目前尚無留言，歡迎大家提供建議！</p>
            )}
          </div>

          <form onSubmit={handleSendComment} className="flex gap-1.5">
            <input
              type="text"
              placeholder={`以 ${currentMember || '旅伴'} 留言...`}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 bg-slate-100 px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-3 py-1.5 rounded-xl flex items-center justify-center transition-opacity"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
