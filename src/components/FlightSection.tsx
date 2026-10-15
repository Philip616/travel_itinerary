'use client';

import React, { useState } from 'react';
import { Flight } from '@/types/travel';
import { PlaneTakeoff, PlaneLanding, Plus, Trash2, Clock, MapPin, User } from 'lucide-react';

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

  const renderFlightCard = (f: Flight) => {
    const depDateStr = f.departure_time ? new Date(f.departure_time).toLocaleString([], { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
    const arrDateStr = f.arrival_time ? new Date(f.arrival_time).toLocaleString([], { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';

    return (
      <div key={f.id} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs mb-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-sm font-bold text-slate-800">{f.member_name}</h4>
              <span className="text-xs text-blue-600 font-semibold">{f.flight_number || '未填航班號'}</span>
            </div>
          </div>
          <button
            onClick={() => onDeleteFlight(f.id)}
            className="text-slate-400 hover:text-red-500 p-1 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-xs my-2">
          <div>
            <span className="text-[10px] text-slate-400 block">起飛</span>
            <span className="font-semibold text-slate-700 block">{f.departure_airport || '出發地'}</span>
            <span className="text-slate-500">{depDateStr || '--:--'}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">抵達</span>
            <span className="font-semibold text-slate-700 block">{f.arrival_airport || '目的地'}</span>
            <span className="text-slate-500">{arrDateStr || '--:--'}</span>
          </div>
        </div>

        {(f.terminal || f.note) && (
          <div className="text-xs text-slate-500 space-y-0.5 mt-1">
            {f.terminal && <p>航廈：{f.terminal}</p>}
            {f.note && <p>備註：{f.note}</p>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800">各成員航班對照表</h2>
          <p className="text-xs text-slate-500">掌握全員出發與抵達時間，方便接送與集合</p>
        </div>
        <button
          onClick={() => {
            setMemberName(currentMember || '');
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          登記機票
        </button>
      </div>

      {/* 去程區塊 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <PlaneTakeoff className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-700">去程班機 (Departure)</h3>
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
            {departureFlights.length} 人
          </span>
        </div>
        {departureFlights.length > 0 ? (
          departureFlights.map(renderFlightCard)
        ) : (
          <div className="text-center py-6 bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
            尚無成員登記去程航班
          </div>
        )}
      </div>

      {/* 回程區塊 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <PlaneLanding className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-700">回程班機 (Return)</h3>
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
            {returnFlights.length} 人
          </span>
        </div>
        {returnFlights.length > 0 ? (
          returnFlights.map(renderFlightCard)
        ) : (
          <div className="text-center py-6 bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
            尚無成員登記回程航班
          </div>
        )}
      </div>

      {/* 登記機票彈窗 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-4">登記個人航班</h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">班機類型</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFlightType('DEPARTURE')}
                    className={`flex-1 py-2 rounded-xl font-bold border transition-colors ${
                      flightType === 'DEPARTURE'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    去程
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlightType('RETURN')}
                    className={`flex-1 py-2 rounded-xl font-bold border transition-colors ${
                      flightType === 'RETURN'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    回程
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">搭乘成員暱稱</label>
                <input
                  type="text"
                  required
                  placeholder="例如：Alex"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">航班編號 (選填)</label>
                <input
                  type="text"
                  placeholder="例如：JX800 或 BR198"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">出發機場</label>
                  <input
                    type="text"
                    placeholder="TPE 桃園"
                    value={depAirport}
                    onChange={(e) => setDepAirport(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">抵達機場</label>
                  <input
                    type="text"
                    placeholder="NRT 成田"
                    value={arrAirport}
                    onChange={(e) => setArrAirport(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">起飛時間</label>
                  <input
                    type="datetime-local"
                    value={depTime}
                    onChange={(e) => setDepTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">抵達時間</label>
                  <input
                    type="datetime-local"
                    value={arrTime}
                    onChange={(e) => setArrTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">航廈 / 備註</label>
                <input
                  type="text"
                  placeholder="第 1 航廈 / 包含 23kg 托運行李"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
                >
                  儲存航班
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
