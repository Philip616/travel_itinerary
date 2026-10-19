import React, { useState, useEffect } from 'react';
import { User, Sparkles, Check } from 'lucide-react';
import { setStoredNickname } from '@/lib/storage';
import { useAuth } from '@/context/AuthContext';

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
  const { user, userName } = useAuth();
  const [nickname, setNickname] = useState(initialNickname || userName || '');

  useEffect(() => {
    if (initialNickname) {
      setNickname(initialNickname);
    } else if (userName) {
      setNickname(userName);
    }
  }, [initialNickname, userName]);

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
        <h3 className="text-xl font-black text-slate-900 tracking-tight">設定此旅程的暱稱</h3>
        <p className="text-xs text-slate-500 mt-1.5 mb-4 leading-relaxed">
          輸入你的專屬名字或暱稱，旅伴就能在景點推薦、票選與機票清單上認出你
        </p>

        {user && (
          <div className="mb-4 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100/80 text-[11px] text-blue-800 flex items-center justify-center gap-1.5 font-bold">
            <Check className="w-3.5 h-3.5 text-blue-600" />
            <span>已連結 {user.app_metadata?.provider || '第三方'} 帳號（跨裝置同步）</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              required
              autoFocus
              placeholder="例如：小明、Alice、阿瑋"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full text-center px-4 py-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] text-slate-400 mt-1.5">
              提示：不同旅程可以設定不同暱稱，彼此互不影響。
            </p>
          </div>

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
              <span>儲存並同步</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
