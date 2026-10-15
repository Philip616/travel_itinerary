'use client';

import React, { useState } from 'react';
import { ShieldCheck, X, AlertCircle, Lock } from 'lucide-react';
import { verifyTripPin } from '@/lib/supabase';

interface AdminPinModalProps {
  isOpen: boolean;
  pinHash: string;
  actionTitle: string;
  onSuccess: () => void;
  onClose: () => void;
}

export function AdminPinModal({
  isOpen,
  pinHash,
  actionTitle,
  onSuccess,
  onClose,
}: AdminPinModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      const isValid = await verifyTripPin(pinHash, pin);
      if (isValid) {
        onSuccess();
        onClose();
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 shadow-2xl text-center animate-in zoom-in-95 duration-200 border border-slate-100">
        <div className="flex justify-between items-start mb-3">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-rose-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-amber-500/20">
            <Lock className="w-7 h-7" />
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-xl font-black text-slate-900 tracking-tight">主辦人防呆驗證</h3>
        <p className="text-xs text-slate-500 mt-1.5 mb-5 leading-relaxed">
          執行「<span className="font-bold text-slate-800">{actionTitle}</span>」需要輸入建立旅程時設定的 4 位數管理安全碼
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            maxLength={6}
            required
            autoFocus
            placeholder="請輸入 4 位數 PIN"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(false);
            }}
            className="w-full text-center tracking-widest text-2xl font-mono font-bold px-4 py-3 bg-slate-50 border border-slate-200/90 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
          />

          {error && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 bg-rose-50 py-2 rounded-xl border border-rose-200/60">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="font-bold">PIN 碼不正確，請重新輸入</span>
            </div>
          )}

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 rounded-2xl font-bold text-slate-600 text-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              {loading ? '驗證中...' : '確認執行'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
