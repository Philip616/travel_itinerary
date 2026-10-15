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
  Send,
  ExternalLink,
  DollarSign,
  Compass,
  Sparkles,
  Pencil
} from 'lucide-react';

interface SpotCardProps {
  spot: SpotItem;
  index: number;
  currentMember: string;
  isSelected?: boolean;
  onSelectSpot?: (spotId: string) => void;
  onVote: (spotId: string) => void;
  onAddComment: (spotId: string, content: string) => void;
  onEditComment?: (spotId: string, commentId: string, newContent: string) => void;
  onDeleteComment?: (spotId: string, commentId: string) => void;
  onEditSpot: (spot: SpotItem) => void;
  onDeleteSpot: (spotId: string) => void;
}

export function SpotCard({
  spot,
  index,
  currentMember,
  isSelected,
  onSelectSpot,
  onVote,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onEditSpot,
  onDeleteSpot,
}: SpotCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const votesCount = spot.votes?.filter((v) => v.vote_type === 'UP').length || 0;
  const hasVoted = spot.votes?.some((v) => v.member_name === currentMember && v.vote_type === 'UP');
  const commentsCount = spot.comments?.length || 0;

  const getCategoryMeta = (cat: string) => {
    switch (cat) {
      case 'FOOD':
        return { 
          label: '美食饕客', 
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80 ring-amber-500/10', 
          dotClass: 'bg-amber-500',
          icon: Utensils 
        };
      case 'SHOPPING':
        return { 
          label: '精選購物', 
          badgeClass: 'bg-pink-50 text-pink-700 border-pink-200/80 ring-pink-500/10', 
          dotClass: 'bg-pink-500',
          icon: ShoppingBag 
        };
      case 'TRANSPORT':
        return { 
          label: '交通轉運', 
          badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/80 ring-indigo-500/10', 
          dotClass: 'bg-indigo-500',
          icon: Bus 
        };
      case 'ATTRACTION':
      default:
        return { 
          label: '熱門景點', 
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 ring-emerald-500/10', 
          dotClass: 'bg-emerald-500',
          icon: Camera 
        };
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
    <div className="relative pl-6 sm:pl-8 group">
      {/* 垂直時間軸連線 (Timeline Connector Line) */}
      <div className="absolute left-[11px] sm:left-[15px] top-6 bottom-0 w-0.5 bg-slate-200 group-last:hidden" />

      {/* 時間軸節點徽章 (Timeline Step Badge) */}
      <div 
        className={`absolute left-0 top-3.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-black shadow-xs transition-all z-10 ${
          isSelected
            ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white ring-4 ring-blue-100 scale-110 shadow-md shadow-blue-500/20'
            : 'bg-white text-slate-700 border-2 border-slate-300 group-hover:border-blue-500 group-hover:text-blue-600'
        }`}
      >
        <span>{index + 1}</span>
      </div>

      {/* 景點主卡片主體 */}
      <div 
        onClick={() => onSelectSpot && onSelectSpot(spot.id)}
        className={`relative bg-white rounded-3xl p-5 transition-all duration-200 border cursor-pointer ${
          isSelected 
            ? 'border-blue-500/80 shadow-lg shadow-blue-500/5 ring-2 ring-blue-500/15 translate-x-1 bg-gradient-to-br from-white to-blue-50/20' 
            : 'border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5'
        } mb-4`}
      >
        {/* 頂部標籤與管理操作 */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ring-1 ${meta.badgeClass}`}>
              <CategoryIcon className="w-3.5 h-3.5" />
              {meta.label}
            </span>

            {spot.time_slot && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded-full font-medium">
                <Clock className="w-3 h-3 text-slate-400" />
                {spot.time_slot}
              </span>
            )}

            {spot.cost_estimate && (
              <span className="inline-flex items-center gap-0.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60 font-bold">
                <DollarSign className="w-3 h-3" />
                {spot.cost_estimate}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditSpot(spot);
              }}
              className="text-slate-300 hover:text-blue-600 p-1.5 rounded-xl transition-colors hover:bg-blue-50 cursor-pointer"
              title="編輯地點"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSpot(spot.id);
              }}
              className="text-slate-300 hover:text-rose-500 p-1.5 rounded-xl transition-colors hover:bg-rose-50 cursor-pointer"
              title="刪除景點"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 景點標題與詳細資訊 */}
        <div className="mb-3">
          <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug tracking-tight hover:text-blue-600 transition-colors">
            {spot.title}
          </h3>

          {spot.address && (
            <p className="text-xs text-slate-500 mt-1.5 flex items-start gap-1.5 leading-relaxed">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{spot.address}</span>
            </p>
          )}

          {spot.created_by && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-500 text-[9px] font-bold flex items-center justify-center">
                @
              </span>
              <p className="text-[11px] text-slate-400 font-medium">
                推薦者：<span className="text-slate-600 font-semibold">{spot.created_by}</span>
              </p>
            </div>
          )}
        </div>

        {/* 底部操作快捷列 */}
        <div 
          className="flex items-center justify-between pt-3 border-t border-slate-100/90 mt-3"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 地圖導航連結 */}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50/80 hover:bg-blue-100 hover:text-blue-700 px-3.5 py-1.5 rounded-xl transition-all active:scale-95 shadow-2xs"
          >
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            <span>Google 導航</span>
            <ExternalLink className="w-3 h-3 text-blue-400" />
          </a>

          {/* 按讚票選與留言抽屜 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onVote(spot.id)}
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                hasVoted
                  ? 'bg-rose-50 text-rose-600 font-bold border border-rose-200/90 shadow-2xs'
                  : 'text-slate-600 bg-slate-100/80 hover:bg-slate-200/80'
              }`}
              title={hasVoted ? '取消投票' : '推薦/按讚'}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-rose-500 stroke-rose-500' : ''}`} />
              <span className="font-bold">{votesCount}</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                showComments 
                  ? 'bg-slate-800 text-white font-bold' 
                  : 'text-slate-600 bg-slate-100/80 hover:bg-slate-200/80 font-medium'
              }`}
              title="查看留言討論"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{commentsCount}</span>
            </button>
          </div>
        </div>

        {/* 留言討論收合區塊 */}
        {showComments && (
          <div 
            className="mt-3.5 pt-3.5 border-t border-slate-100 text-xs animate-in fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
              {spot.comments && spot.comments.length > 0 ? (
                spot.comments.map((c) => (
                  editingCommentId === c.id ? (
                    <div key={c.id} className="bg-white p-3 rounded-2xl border border-blue-300 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-800">修改留言</span>
                        <span className="text-[10px] text-slate-400 font-medium">{c.member_name}</span>
                      </div>
                      <input
                        type="text"
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                        autoFocus
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditingCommentText('');
                          }}
                          className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          取消
                        </button>
                        <button
                          type="button"
                          disabled={!editingCommentText.trim()}
                          onClick={() => {
                            if (!editingCommentText.trim() || !onEditComment) return;
                            onEditComment(spot.id, c.id, editingCommentText.trim());
                            setEditingCommentId(null);
                            setEditingCommentText('');
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                        >
                          儲存
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div key={c.id} className="bg-slate-50/90 p-3 rounded-2xl border border-slate-100 group/comment">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">{c.member_name}</span>
                          {c.member_name === currentMember && (
                            <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.2 rounded-md">
                              你
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400 mr-1">
                            {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(c.id);
                              setEditingCommentText(c.content);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="修改留言"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (onDeleteComment) onDeleteComment(spot.id, c.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="刪除留言"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-600 break-words leading-relaxed">{c.content}</p>
                    </div>
                  )
                ))
              ) : (
                <div className="text-center py-4 text-slate-400 bg-slate-50/50 rounded-2xl">
                  <p>尚無討論留言，分享心得或特別提醒吧！</p>
                </div>
              )}
            </div>

            <form onSubmit={handleSendComment} className="flex gap-2">
              <input
                type="text"
                placeholder={`以「${currentMember || '旅伴'}」的身分留言...`}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200/90 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl flex items-center justify-center transition-opacity shadow-xs cursor-pointer font-bold"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
