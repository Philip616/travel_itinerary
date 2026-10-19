import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, Sparkles, AlertCircle, Smartphone, Monitor, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  title = '登入或建立帳號',
  description = '使用 Google 或 Facebook 第三方登入，跨手機與電腦同步所有旅程！',
}: AuthModalProps) {
  const { signInWithGoogle, signInWithFacebook, isConfigured } = useAuth();
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'facebook' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 監聽頁面恢復 (pageshow / bfcache) 與視窗聚焦 (focus)，當使用者在第三方頁面失敗按「上一頁」回到頁面時，自動解除轉圈鎖定
  useEffect(() => {
    const handleResetLoading = () => {
      setLoadingProvider(null);
    };

    window.addEventListener('pageshow', handleResetLoading);
    window.addEventListener('focus', handleResetLoading);
    document.addEventListener('visibilitychange', handleResetLoading);

    return () => {
      window.removeEventListener('pageshow', handleResetLoading);
      window.removeEventListener('focus', handleResetLoading);
      document.removeEventListener('visibilitychange', handleResetLoading);
    };
  }, []);

  // 當彈窗關閉或重新打開時重設狀態
  useEffect(() => {
    if (!isOpen) {
      setLoadingProvider(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoadingProvider('google');
    setErrorMessage(null);
    try {
      // 設置 4 秒安全保護定時器，避免第三方跳轉失敗時按鈕永久轉圈卡死
      const safetyTimer = setTimeout(() => {
        setLoadingProvider(null);
      }, 4000);

      const { error } = await signInWithGoogle();
      if (error) {
        clearTimeout(safetyTimer);
        setErrorMessage(error);
        setLoadingProvider(null);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Google 登入連線失敗');
      setLoadingProvider(null);
    }
  };

  const handleFacebookLogin = async () => {
    setLoadingProvider('facebook');
    setErrorMessage(null);
    try {
      const safetyTimer = setTimeout(() => {
        setLoadingProvider(null);
      }, 4000);

      const { error } = await signInWithFacebook();
      if (error) {
        clearTimeout(safetyTimer);
        setErrorMessage(error);
        setLoadingProvider(null);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Facebook 登入連線失敗');
      setLoadingProvider(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
        {/* 關閉按鈕 */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 頂部圖標與標題 */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/25">
            <Sparkles className="w-7 h-7 text-amber-300" />
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{description}</p>
        </div>

        {/* 錯誤提示 */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start justify-between gap-2 animate-in fade-in duration-150">
            <div className="flex items-start gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-tight font-medium break-words">{errorMessage}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setLoadingProvider(null);
              }}
              className="text-[11px] text-rose-600 font-bold hover:underline shrink-0 cursor-pointer ml-1.5"
            >
              關閉
            </button>
          </div>
        )}

        {/* 尚未配置 Supabase 警示 */}
        {!isConfigured && (
          <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>尚未連線至 Supabase 雲端資料庫</span>
            </div>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              目前專案為本機快取模式。若要啟用第三方登入，請於 <code className="bg-amber-100/70 px-1 py-0.5 rounded font-mono">.env.local</code> 設定真實的 Supabase 專案 URL 與金鑰，並在 Supabase 後台啟用 Google / Facebook OAuth Provider。
            </p>
          </div>
        )}

        {/* 登入按鈕群 */}
        <div className="space-y-3">
          {/* Google 登入按鈕 */}
          <button
            onClick={handleGoogleLogin}
            disabled={loadingProvider !== null || !isConfigured}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 active:scale-[0.99] text-slate-800 font-bold rounded-2xl text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingProvider === 'google' ? (
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>使用 Google 帳號登入</span>
          </button>

          {/* Facebook 登入按鈕 */}
          <button
            onClick={handleFacebookLogin}
            disabled={loadingProvider !== null || !isConfigured}
            className="w-full py-3.5 px-4 bg-[#1877F2] hover:bg-[#166fe5] active:scale-[0.99] text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingProvider === 'facebook' ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            )}
            <span>使用 Facebook 帳號登入</span>
          </button>
        </div>

        {/* 特色亮點清單 */}
        <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5">
          <div className="flex items-start gap-2.5 text-[11px] text-slate-600">
            <Monitor className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              <strong>跨設備即時同步：</strong> 手機出遊查行程、電腦大螢幕排細節，換裝置不再遺失連結。
            </span>
          </div>
          <div className="flex items-start gap-2.5 text-[11px] text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>每個旅程自訂暱稱：</strong> 同一個帳號可在公司員工旅遊叫「主管」，好友出遊叫「小明」。
            </span>
          </div>
          <div className="flex items-start gap-2.5 text-[11px] text-slate-600">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>
              <strong>個人隱私保障：</strong> 僅用於識別身分與同步房間，不主動收集多餘個人資訊。
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
