'use client';

import React, { useState } from 'react';
import { ShieldCheck, X, AlertCircle, CheckCircle2, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { verifyTripPin } from '@/lib/supabase';

interface AdminPinModalProps {
  isOpen: boolean;
  pinHash: string;
  actionTitle: string;
  onSuccess: () => Promise<void> | void;
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
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) return;

    setStatus('verifying');
    setErrorMessage('');

    try {
      const isValid = await verifyTripPin(pinHash, pin.trim());
      if (isValid) {
        setStatus('success');
        // 等待執行成功後再關閉
        try {
          await onSuccess();
          onClose();
        } catch (actionErr: any) {
          setStatus('error');
          setErrorMessage(actionErr?.message || '執行操作失敗，請稍後重試');
        }
      } else {
        setStatus('error');
        setErrorMessage('PIN 密碼不正確，請重新輸入');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err?.message || '驗證過程發生異常');
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
            disabled={status === 'verifying' || status === 'success'}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-xl font-black text-slate-900 tracking-tight">主辦人安全驗證</h3>
        <p className="text-xs text-slate-500 mt-1.5 mb-5 leading-relaxed">
          執行「<span className="font-bold text-slate-800">{actionTitle}</span>」需要輸入建立旅程時設定的 4 位數 PIN 碼
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              maxLength={8}
              required
              autoFocus
              placeholder="輸入 4 位數 PIN 碼"
              value={pin}
              disabled={status === 'verifying' || status === 'success'}
              onChange={(e) => {
                setPin(e.target.value);
                if (status === 'error') setStatus('idle');
              }}
              className={`w-full text-center tracking-widest text-2xl font-mono font-black px-10 py-3 bg-slate-50 border rounded-2xl focus:outline-none transition-all ${
                status === 'error'
                  ? 'border-rose-400 focus:ring-2 focus:ring-rose-400 text-rose-600'
                  : status === 'success'
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200/90 focus:ring-2 focus:ring-amber-500 text-slate-900'
              }`}
            />
            
            {/* 密碼可見性切換按鈕 */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title={showPassword ? '隱藏密碼' : '顯示密碼'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* 密碼驗證狀態回饋 */}
          {status === 'error' && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 bg-rose-50 py-2.5 px-3 rounded-xl border border-rose-200/70 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-bold">{errorMessage || 'PIN 碼錯誤，請重新確認'}</span>
            </div>
          )}

          {status === 'success' && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 py-2.5 px-3 rounded-xl border border-emerald-200/70 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-bold">密碼正確！正在執行操作...</span>
            </div>
          )}

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={status === 'verifying' || status === 'success'}
              className="flex-1 py-3 border border-slate-200 rounded-2xl font-bold text-slate-600 text-xs hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-40"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={status === 'verifying' || status === 'success' || pin.length < 4}
              className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {status === 'verifying' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>驗證中...</span>
                </>
              ) : status === 'success' ? (
                <span>處理中...</span>
              ) : (
                <span>驗證並確認</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
