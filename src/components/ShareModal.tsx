import React, { useState } from 'react';
import { Share2, Copy, Check, X, Smartphone, QrCode } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripTitle: string;
  slug: string;
}

export function ShareModal({ isOpen, onClose, tripTitle, slug }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/trip/${slug}` 
    : `https://your-domain.vercel.app/trip/${slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${tripTitle} - 行程協同規劃`,
          text: `一起來規劃「${tripTitle}」的行程吧！點擊連結即可直接加入：`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 shadow-2xl text-center animate-in zoom-in-95 duration-200 border border-slate-100">
        <div className="flex justify-between items-start mb-3">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
            <Share2 className="w-7 h-7" />
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-xl font-black text-slate-900 tracking-tight">邀請好友共同編輯</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
          將專屬房間短網址分享到 LINE 群組，好友免註冊點開即可共同編排景點、按讚與登記機票！
        </p>

        {!isSupabaseConfigured && (
          <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-3 mb-4 text-left">
            <p className="text-xs font-bold text-amber-900 mb-1">
              ⚠️ 雲端資料庫未配置（單機離線模式）
            </p>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              此房間目前僅存在於您當前這台裝置的瀏覽器快取中。若傳給好友，對方的裝置將無法查詢到此房間。請先在專案環境變數設定 Supabase 連線資訊。
            </p>
          </div>
        )}

        {/* 連結預覽與複製卡片 */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/90 flex items-center justify-between gap-2 mb-4">
          <span className="text-xs text-slate-700 truncate text-left select-all font-mono font-medium">
            {shareUrl}
          </span>
          <button
            onClick={handleCopy}
            className="shrink-0 p-2 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-slate-200/70 transition-colors cursor-pointer"
            title="複製連結"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={handleNativeShare}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            <span>傳送給 LINE 或社群群組</span>
          </button>

          <button
            onClick={handleCopy}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">已複製專屬房間連結！</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>一鍵複製房間網址</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
