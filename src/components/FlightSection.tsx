'use client';

import React, { useState } from 'react';
import { Flight } from '@/types/travel';
import { PlaneTakeoff, PlaneLanding, Plus, Trash2, Clock, MapPin, User, ArrowRight, Luggage, Building, Calendar } from 'lucide-react';

interface FlightSectionProps {
  flights: Flight[];
  currentMember: string;
  onAddFlight: (flight: Partial<Flight>) => void;
  onDeleteFlight: (flightId: string) => void;
}

export function FlightSection({
  flights,
  currentMember,
  onAddFlight,
  onDeleteFlight,
}: FlightSectionProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [flightType, setFlightType] = useState<'DEPARTURE' | 'RETURN'>('DEPARTURE');
  const [memberName, setMemberName] = useState(currentMember || '');
  const [flightNumber, setFlightNumber] = useState('');
  const [depAirport, setDepAirport] = useState('');
  const [arrAirport, setArrAirport] = useState('');
  const [depTime, setDepTime] = useState('');
  const [arrTime, setArrTime] = useState('');
  const [terminal, setTerminal] = useState('');
  const [note, setNote] = useState('');

  const departureFlights = flights.filter((f) => f.flight_type === 'DEPARTURE');
  const returnFlights = flights.filter((f) => f.flight_type === 'RETURN');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim()) return;

    onAddFlight({
      member_name: memberName.trim(),
      flight_type: flightType,
      flight_number: flightNumber.trim() || undefined,
      departure_airport: depAirport.trim() || undefined,
      arrival_airport: arrAirport.trim() || undefined,
      departure_time: depTime ? new Date(depTime).toISOString() : undefined,
      arrival_time: arrTime ? new Date(arrTime).toISOString() : undefined,
      terminal: terminal.trim() || undefined,
      note: note.trim() || undefined,
    });

    setFlightNumber('');
    setDepAirport('');
    setArrAirport('');
    setDepTime('');
    setArrTime('');
    setTerminal('');
    setNote('');
    setShowAddModal(false);
  };

  const renderFlightTicket = (f: Flight) => {
    const depDateStr = f.departure_time 
      ? new Date(f.departure_time).toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' })
      : '';
    const depTimeStr = f.departure_time 
      ? new Date(f.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '--:--';
    const arrTimeStr = f.arrival_time 
      ? new Date(f.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '--:--';

    const isDeparture = f.flight_type === 'DEPARTURE';

    return (
      <div 
        key={f.id} 
        className="relative bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden mb-4 group"
      >
        {/* 機票頂部裝飾條 */}
        <div className={`h-2.5 w-full ${isDeparture ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`} />

        <div className="p-5">
          {/* 機票乘客與航班標題 */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <span className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                isDeparture ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
              }`}>
                <User className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-black text-slate-900 tracking-tight">{f.member_name}</h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {isDeparture ? '去程機票' : '回程機票'}
                  </span>
                </div>
                <p className="text-xs font-mono font-bold text-blue-600 mt-0.5">
                  {f.flight_number ? f.flight_number : '未填班機編號'}
                </p>
              </div>
            </div>

            <button
              onClick={() => onDeleteFlight(f.id)}
              className="text-slate-300 hover:text-rose-500 p-1.5 rounded-xl transition-colors hover:bg-rose-50 cursor-pointer"
              title="刪除航班記錄"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* 機票主體：出發地 ➔ 目的地 航線圖 */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 my-3">
            <div className="flex items-center justify-between">
              {/* 出發地 */}
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">出發機場</span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight block">
                  {f.departure_airport || 'TPE'}
                </span>
                <span className="text-sm font-bold text-blue-600 font-mono block mt-0.5">
                  {depTimeStr}
                </span>
                {depDateStr && (
                  <span className="text-[10px] text-slate-400 font-medium block">
                    {depDateStr}
                  </span>
                )}
              </div>

              {/* 航線動態圖標 */}
              <div className="flex flex-col items-center px-4 flex-1 max-w-[160px]">
                <div className="w-full flex items-center justify-center relative">
                  <div className="w-full h-0.5 bg-dashed border-b-2 border-dashed border-slate-300" />
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center absolute shadow-xs ${
                    isDeparture ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {isDeparture ? <PlaneTakeoff className="w-4 h-4" /> : <PlaneLanding className="w-4 h-4" />}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold mt-2.5">
                  直飛航班
                </span>
              </div>

              {/* 目的地 */}
              <div className="text-right min-w-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">抵達機場</span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight block">
                  {f.arrival_airport || 'NRT'}
                </span>
                <span className="text-sm font-bold text-slate-700 font-mono block mt-0.5">
                  {arrTimeStr}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  預計抵達
                </span>
              </div>
            </div>
          </div>

          {/* 機票附加資訊列 */}
          {(f.terminal || f.note) && (
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
              {f.terminal && (
                <span className="inline-flex items-center gap-1.5 bg-slate-100/90 text-slate-700 font-medium px-3 py-1 rounded-xl">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>航廈：{f.terminal}</span>
                </span>
              )}
              {f.note && (
                <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200/60 font-medium px-3 py-1 rounded-xl">
                  <Luggage className="w-3.5 h-3.5 text-amber-600" />
                  <span>{f.note}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="py-4 space-y-6">
      {/* 頁面頂部卡片 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px] tracking-wider uppercase">
              Flight Companion
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">各成員航班對照看板</h2>
          <p className="text-xs text-slate-500 mt-1">即時掌握全員起飛與抵達機場航廈，方便安排行前接送與入境會合</p>
        </div>

        <button
          onClick={() => {
            setMemberName(currentMember || '');
            setShowAddModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-black shadow-md shadow-blue-500/25 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          登記個人機票
        </button>
      </div>

      {/* 去程與回程雙欄展示 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 去程區塊 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <PlaneTakeoff className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-black text-slate-800">去程出發班機 (Departure)</h3>
            </div>
            <span className="text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-3 py-0.5 rounded-full">
              {departureFlights.length} 位旅伴
            </span>
          </div>

          {departureFlights.length > 0 ? (
            departureFlights.map(renderFlightTicket)
          ) : (
            <div className="text-center py-12 bg-white/60 rounded-3xl border border-dashed border-slate-200 text-xs text-slate-400">
              尚無成員登記去程機票，點擊上方按鈕立即新增
            </div>
          )}
        </div>

        {/* 回程區塊 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <PlaneLanding className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-black text-slate-800">回程歸途班機 (Return)</h3>
            </div>
            <span className="text-xs font-black bg-blue-50 text-blue-700 border border-blue-200/60 px-3 py-0.5 rounded-full">
              {returnFlights.length} 位旅伴
            </span>
          </div>

          {returnFlights.length > 0 ? (
            returnFlights.map(renderFlightTicket)
          ) : (
            <div className="text-center py-12 bg-white/60 rounded-3xl border border-dashed border-slate-200 text-xs text-slate-400">
              尚無成員登記回程機票，點擊上方按鈕立即新增
            </div>
          )}
        </div>
      </div>

      {/* 登記機票彈窗 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-slate-900 mb-4 tracking-tight">登記個人航班行程</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">班機類型</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFlightType('DEPARTURE')}
                    className={`py-3 rounded-2xl font-black border transition-all cursor-pointer ${
                      flightType === 'DEPARTURE'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    去程出發 (Departure)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlightType('RETURN')}
                    className={`py-3 rounded-2xl font-black border transition-all cursor-pointer ${
                      flightType === 'RETURN'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    回程歸途 (Return)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">搭乘成員暱稱</label>
                <input
                  type="text"
                  required
                  placeholder="例如：Alex、小華"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">航班編號 (選填)</label>
                <input
                  type="text"
                  placeholder="例如：JX800、BR198、CI100"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">出發機場代碼</label>
                  <input
                    type="text"
                    placeholder="如 TPE 桃園"
                    value={depAirport}
                    onChange={(e) => setDepAirport(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">抵達機場代碼</label>
                  <input
                    type="text"
                    placeholder="如 NRT 成田"
                    value={arrAirport}
                    onChange={(e) => setArrAirport(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">起飛時間</label>
                  <input
                    type="datetime-local"
                    value={depTime}
                    onChange={(e) => setDepTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">預計抵達時間</label>
                  <input
                    type="datetime-local"
                    value={arrTime}
                    onChange={(e) => setArrTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">航廈 / 托運行李等備註</label>
                <input
                  type="text"
                  placeholder="第 1 航廈 / 包含 23kg 托運行李"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
                >
                  確認儲存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
