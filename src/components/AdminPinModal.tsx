'use client';

import React, { useState } from 'react';
import { ShieldCheck, X, AlertCircle } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl text-center">
        <div className="flex justify-between items-start mb-2">
          <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center mx-auto">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-base font-bold text-slate-800">主辦人防呆驗證</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          「{actionTitle}」需要輸入建立旅程時設定的 4 位數管理密碼
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            maxLength={6}
            required
            autoFocus
            placeholder="請輸入管理 PIN"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(false);
            }}
            className="w-full text-center tracking-widest text-xl font-mono px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
          />

          {error && (
            <div className="flex items-center justify-center gap-1 text-xs text-rose-500">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>PIN 碼錯誤，請重新確認</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 text-xs"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-xs"
            >
              {loading ? '驗證中...' : '確認執行'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
