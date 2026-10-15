'use client';

import React, { useState } from 'react';
import { User, Sparkles } from 'lucide-react';
import { setStoredNickname } from '@/lib/storage';

interface NicknameModalProps {
  isOpen: boolean;
  initialNickname?: string;
  onSave: (nickname: string) => void;
  onClose?: () => void;
  isMandatory?: boolean;
}

export function NicknameModal({
  isOpen,
  initialNickname = '',
  onSave,
  onClose,
  isMandatory = false,
}: NicknameModalProps) {
  const [nickname, setNickname] = useState(initialNickname);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    setStoredNickname(nickname.trim());
    onSave(nickname.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 shadow-2xl text-center animate-in zoom-in-95 duration-200 border border-slate-100">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
          <User className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight">歡迎加入旅程房間！</h3>
        <p className="text-xs text-slate-500 mt-1.5 mb-6 leading-relaxed">
          輸入你的名字或暱稱，旅伴就能在景點推薦、票選與機票清單上認出你
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            required
            autoFocus
            placeholder="例如：小明、Alice、阿瑋"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full text-center px-4 py-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex gap-2.5 pt-2">
            {!isMandatory && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-slate-200 rounded-2xl font-bold text-slate-600 text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                稍後設定
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>進入協同規劃</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
