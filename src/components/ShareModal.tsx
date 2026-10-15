'use client';

import React, { useState } from 'react';
import { Share2, Copy, Check, X, Smartphone } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-center">
        <div className="flex justify-between items-start mb-2">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <Share2 className="w-6 h-6" />
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-base font-bold text-slate-800">邀請朋友共同編輯</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          將專屬連結傳至 LINE 群組，好友點擊後無需註冊即可一起安排行程與票選景點！
        </p>

        {/* 連結預覽與複製 */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2 mb-4">
          <span className="text-xs text-slate-600 truncate text-left select-all font-mono">
            {shareUrl}
          </span>
          <button
            onClick={handleCopy}
            className="shrink-0 p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-200 transition-colors"
            title="複製連結"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleNativeShare}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Smartphone className="w-4 h-4" />
            傳送給 LINE 或社群好友
          </button>
          <button
            onClick={handleCopy}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">已複製連結！</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>複製專屬房間網址</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
