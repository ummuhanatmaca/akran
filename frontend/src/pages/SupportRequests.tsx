import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { SupportRequest } from '../types';
import {
  Compass,
  CheckCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';

export const SupportRequests: React.FC = () => {
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [received, setReceived] = useState<SupportRequest[]>([]);
  const [sent, setSent] = useState<SupportRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const [recRes, sentRes] = await Promise.all([
        apiClient.get<SupportRequest[]>('/support/requests/received'),
        apiClient.get<SupportRequest[]>('/support/requests/sent'),
      ]);
      setReceived(recRes.data);
      setSent(sentRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (requestId: number, action: 'accept' | 'reject' | 'cancel') => {
    setActionLoadingId(requestId);
    try {
      await apiClient.put(`/support/requests/${requestId}/status?status_action=${action}`);
      await fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'İşlem gerçekleştirilemedi.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const currentList = tab === 'received' ? received : sent;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 block mb-1">
            Akademik Dayanışma Akışı
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Ders Desteği Talepleri</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Gelen ve giden ders taleplerini yönetin, kabul ederek canlı ders oturumu planlayın.
          </p>
        </div>

        <Link
          to="/support/create"
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
        >
          + Yeni Destek Talebi
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setTab('received')}
          className={`py-2.5 px-5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            tab === 'received'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Bana Gelen & Açık Destek Havuzu
          {received.filter((r) => r.status === 'pending').length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
              {received.filter((r) => r.status === 'pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab('sent')}
          className={`py-2.5 px-5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            tab === 'sent'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Gönderdiğim Talepler ({sent.length})
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-6 h-6 text-sky-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Talepler yükleniyor...</p>
        </div>
      ) : currentList.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200 p-8 space-y-2">
          <Compass className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">
            {tab === 'received' ? 'Henüz size gelen veya açık havuzda bekleyen bir ders desteği talebi yok.' : 'Henüz bir talep göndermediniz.'}
          </p>
          <p className="text-xs text-slate-500">
            {tab === 'received'
              ? 'Diğer öğrencilerin açtığı talepler burada listelenir. Siz de akranlarınıza destek vererek oturum planlayabilirsiniz.'
              : 'Zorlandığınız dersler için anlatıcıları keşfedin veya doğrudan genel destek talebi oluşturun.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentList.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {req.course?.code}
                  </span>
                  <h3 className="font-semibold text-slate-900 text-sm">{req.topic_name}</h3>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      req.status === 'pending'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : req.status === 'accepted'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : req.status === 'rejected'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {req.status === 'pending' && 'Beklemede'}
                    {req.status === 'accepted' && 'Kabul Edildi'}
                    {req.status === 'rejected' && 'Reddedildi'}
                    {req.status === 'cancelled' && 'İptal Edildi'}
                  </span>
                  {!req.helper_id && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                      Genel Destek Havuzu
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {req.description || 'Ek bir açıklama belirtilmedi.'}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                  <span>
                    {tab === 'received' ? (
                      <>Talep Eden: <strong className="text-slate-700 font-medium">{req.requester_name}</strong></>
                    ) : (
                      <>Eğitmen: <strong className="text-slate-700 font-medium">{req.helper_name || 'Açık Talep (Havuz)'}</strong></>
                    )}
                  </span>
                  <span>•</span>
                  <span>Görüşme: <strong>{req.mode === 'online' ? 'Çevrim İçi' : 'Yüz Yüze'}</strong></span>
                  {req.preferred_schedule && (
                    <>
                      <span>•</span>
                      <span>Tercih: <strong>{req.preferred_schedule}</strong></span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                {tab === 'received' && req.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAction(req.id, 'accept')}
                      disabled={actionLoadingId === req.id}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Kabul Et
                    </button>
                    <button
                      onClick={() => handleAction(req.id, 'reject')}
                      disabled={actionLoadingId === req.id}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-medium rounded-lg text-xs transition-colors"
                    >
                      Reddet
                    </button>
                  </>
                )}

                {tab === 'sent' && req.status === 'pending' && (
                  <button
                    onClick={() => handleAction(req.id, 'cancel')}
                    disabled={actionLoadingId === req.id}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-medium rounded-lg text-xs transition-colors"
                  >
                    Talebi İptal Et
                  </button>
                )}

                {req.status === 'accepted' && (
                  <Link
                    to="/sessions"
                    className="px-3.5 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 font-medium rounded-lg text-xs flex items-center gap-1 transition-colors border border-sky-200"
                  >
                    Oturuma Git <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
