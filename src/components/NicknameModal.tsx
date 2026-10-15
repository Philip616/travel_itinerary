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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-center">
        <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <User className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">歡迎加入旅程！</h3>
        <p className="text-xs text-slate-500 mt-1 mb-5">
          請輸入你的暱稱，方便旅伴知道是誰推薦景點、按讚與登記機票
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            required
            autoFocus
            placeholder="例如：小明、Alice、阿瑋"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full text-center px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex gap-2 pt-2">
            {!isMandatory && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 text-xs"
              >
                稍後再說
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              開始協同規劃
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
