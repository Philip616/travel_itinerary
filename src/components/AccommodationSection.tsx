'use client';

import React, { useState } from 'react';
import { Accommodation } from '@/types/travel';
import { 
  Building2, 
  Plus, 
  Trash2, 
  MapPin, 
  Phone, 
  Calendar, 
  ExternalLink, 
  Moon, 
  Copy, 
  Check, 
  Pencil, 
  MessageSquare, 
  Send 
} from 'lucide-react';
import { getGoogleMapsSearchUrl } from '@/lib/maps';

function calculateNights(start: string, end: string) {
  if (!start || !end) return 0;
  const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

interface AccommodationCardProps {
  acc: Accommodation;
  currentMember: string;
  onEdit: (acc: Accommodation) => void;
  onDelete: (accId: string) => void;
  onAddComment?: (accId: string, content: string) => void;
  onEditComment?: (accId: string, commentId: string, newContent: string) => void;
  onDeleteComment?: (accId: string, commentId: string) => void;
}

function AccommodationCard({
  acc,
  currentMember,
  onEdit,
  onDelete,
  onAddComment,
  onEditComment,
  onDeleteComment,
}: AccommodationCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [copied, setCopied] = useState(false);

  const mapsUrl = acc.google_map_url || getGoogleMapsSearchUrl(`${acc.name} ${acc.address || ''}`);
  const nights = calculateNights(acc.check_in, acc.check_out);
  const commentsCount = acc.comments?.length || 0;

  const handleCopyBooking = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !onAddComment) return;
    onAddComment(acc.id, commentText.trim());
    setCommentText('');
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3.5">
            <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20 shrink-0">
              <Building2 className="w-6 h-6" />
            </span>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">{acc.name}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                <span className="inline-flex items-center gap-1.5 font-bold text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  {acc.check_in} ~ {acc.check_out}
                </span>
                {nights > 0 && (
                  <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2.5 py-0.5 rounded-full text-xs font-black">
                    <Moon className="w-3 h-3" />
                    {nights} 晚住宿
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(acc)}
              className="text-slate-300 hover:text-blue-600 p-1.5 rounded-xl transition-colors hover:bg-blue-50 cursor-pointer"
              title="編輯住宿資訊"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(acc.id)}
              className="text-slate-300 hover:text-rose-500 p-1.5 rounded-xl transition-colors hover:bg-rose-50 cursor-pointer"
              title="刪除住宿"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {acc.address && (
          <div className="bg-slate-50/90 p-3 rounded-2xl border border-slate-100 my-3 flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed font-medium">{acc.address}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-3 text-xs">
          {acc.booking_ref && (
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">訂房代號</span>
                <span className="font-mono font-black text-slate-800 text-xs truncate block">{acc.booking_ref}</span>
              </div>
              <button
                onClick={() => handleCopyBooking(acc.booking_ref!)}
                className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                title="複製訂房代號"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          )}

          {acc.phone && (
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">飯店電話</span>
              <a href={`tel:${acc.phone}`} className="font-bold text-blue-600 hover:underline text-xs block">
                {acc.phone}
              </a>
            </div>
          )}
        </div>

        {acc.note && (
          <div className="text-xs text-amber-900 bg-amber-50/80 border border-amber-200/70 p-3 rounded-2xl mt-2 leading-relaxed">
            <span className="font-bold text-amber-800">入住備忘：</span>
            {acc.note}
          </div>
        )}
      </div>

      <div>
        {/* 底部功能與操作列 */}
        <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between gap-2">
          {/* 留言討論切換按鈕 */}
          <button
            onClick={() => setShowComments(!showComments)}
            className={`inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              showComments 
                ? 'bg-slate-800 text-white font-bold shadow-xs' 
                : commentsCount > 0
                ? 'bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 border border-indigo-200/60'
                : 'text-slate-600 bg-slate-100/80 hover:bg-slate-200/80 font-medium'
            }`}
            title="討論此住宿與心得分享"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>討論留言</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              showComments
                ? 'bg-white/20 text-white'
                : commentsCount > 0
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-200 text-slate-600'
            }`}>
              {commentsCount}
            </span>
          </button>

          {/* 地圖導航 */}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50/80 hover:bg-blue-100 px-3.5 py-1.5 rounded-xl transition-all shadow-2xs"
          >
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>地圖導航</span>
            <ExternalLink className="w-3 h-3 text-blue-400" />
          </a>
        </div>

        {/* 留言討論收合抽屜 */}
        {showComments && (
          <div className="mt-3.5 pt-3.5 border-t border-slate-100 text-xs animate-in fade-in duration-200">
            <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
              {acc.comments && acc.comments.length > 0 ? (
                acc.comments.map((c) => (
                  editingCommentId === c.id ? (
                    <div key={c.id} className="bg-white p-3 rounded-2xl border border-indigo-300 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-800">修改留言</span>
                        <span className="text-[10px] text-slate-400 font-medium">{c.member_name}</span>
                      </div>
                      <input
                        type="text"
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
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
                            onEditComment(acc.id, c.id, editingCommentText.trim());
                            setEditingCommentId(null);
                            setEditingCommentText('');
                          }}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
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
                            <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.2 rounded-md">
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
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="修改留言"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (onDeleteComment) onDeleteComment(acc.id, c.id);
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
                  <p>尚無討論留言，分享這間住宿的優缺點或詢問旅伴意見吧！</p>
                </div>
              )}
            </div>

            <form onSubmit={handleSendComment} className="flex gap-2">
              <input
                type="text"
                placeholder={`以「${currentMember || '旅伴'}」的身分發表討論...`}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200/90 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl flex items-center justify-center transition-opacity shadow-xs cursor-pointer font-bold"
                title="送出留言"
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

interface AccommodationSectionProps {
  accommodations: Accommodation[];
  currentMember: string;
  onAddAccommodation: (acc: Partial<Accommodation>) => void;
  onUpdateAccommodation: (accId: string, acc: Partial<Accommodation>) => void;
  onDeleteAccommodation: (accId: string) => void;
  onAddComment?: (accId: string, content: string) => void;
  onEditComment?: (accId: string, commentId: string, newContent: string) => void;
  onDeleteComment?: (accId: string, commentId: string) => void;
}

export function AccommodationSection({
  accommodations,
  currentMember,
  onAddAccommodation,
  onUpdateAccommodation,
  onDeleteAccommodation,
  onAddComment,
  onEditComment,
  onDeleteComment,
}: AccommodationSectionProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingAcc, setEditingAcc] = useState<Accommodation | null>(null);

  const [name, setName] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [address, setAddress] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');

  const openAddModal = () => {
    setEditingAcc(null);
    setName('');
    setCheckIn('');
    setCheckOut('');
    setAddress('');
    setBookingRef('');
    setPhone('');
    setNote('');
    setShowModal(true);
  };

  const openEditModal = (acc: Accommodation) => {
    setEditingAcc(acc);
    setName(acc.name || '');
    setCheckIn(acc.check_in || '');
    setCheckOut(acc.check_out || '');
    setAddress(acc.address || '');
    setBookingRef(acc.booking_ref || '');
    setPhone(acc.phone || '');
    setNote(acc.note || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !checkIn || !checkOut) return;

    const mapsUrl = getGoogleMapsSearchUrl(`${name.trim()} ${address.trim()}`);

    if (editingAcc) {
      onUpdateAccommodation(editingAcc.id, {
        name: name.trim(),
        check_in: checkIn,
        check_out: checkOut,
        address: address.trim() || undefined,
        google_map_url: mapsUrl,
        booking_ref: bookingRef.trim() || undefined,
        phone: phone.trim() || undefined,
        note: note.trim() || undefined,
      });
    } else {
      onAddAccommodation({
        name: name.trim(),
        check_in: checkIn,
        check_out: checkOut,
        address: address.trim() || undefined,
        google_map_url: mapsUrl,
        booking_ref: bookingRef.trim() || undefined,
        phone: phone.trim() || undefined,
        note: note.trim() || undefined,
      });
    }

    setShowModal(false);
  };

  return (
    <div className="py-4 space-y-6">
      {/* 頂部介紹列 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[11px] tracking-wider uppercase">
              Stay & Lodging
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">旅程住宿推薦與預訂管理</h2>
          <p className="text-xs text-slate-500 mt-1">登記候選旅店或已預訂飯店，與旅伴留言討論、記錄房價、代號與一鍵導航</p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-2xl text-xs font-black shadow-md shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          登記住宿資訊
        </button>
      </div>

      {/* 飯店卡片網格 */}
      {accommodations.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {accommodations.map((acc) => (
            <AccommodationCard
              key={acc.id}
              acc={acc}
              currentMember={currentMember}
              onEdit={openEditModal}
              onDelete={onDeleteAccommodation}
              onAddComment={onAddComment}
              onEditComment={onEditComment}
              onDeleteComment={onDeleteComment}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white/60 rounded-3xl border border-dashed border-slate-200 text-slate-400 text-xs">
          目前尚未登記任何住宿飯店或候選清單，點擊上方按鈕立即新增並與旅伴討論！
        </div>
      )}

      {/* 新增/編輯住宿彈窗 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-slate-900 mb-4 tracking-tight">
              {editingAcc ? '編輯住宿資訊' : '新增住宿資訊'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  飯店 / 民宿名稱 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如：東京新宿燦路都廣場大飯店"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">入住日期 (Check-in)</label>
                  <input
                    type="date"
                    required
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">退房日期 (Check-out)</label>
                  <input
                    type="date"
                    required
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">飯店地址</label>
                <input
                  type="text"
                  placeholder="例如：東京都渋谷区代々木2-3-1"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">訂房代號 (選填)</label>
                  <input
                    type="text"
                    placeholder="Agoda / Booking ID"
                    value={bookingRef}
                    onChange={(e) => setBookingRef(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">飯店電話</label>
                  <input
                    type="tel"
                    placeholder="+81 3-3375-3211"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">備註資訊 (門禁、行李寄放等)</label>
                <input
                  type="text"
                  placeholder="例如：下午兩點後可寄放行李、附免費早餐"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-md shadow-blue-500/25 cursor-pointer"
                >
                  {editingAcc ? '儲存修改' : '儲存住宿'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
