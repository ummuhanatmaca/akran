import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { SupportSession } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Video,
  CheckCircle,
  Star,
  X,
  ExternalLink,
  Loader2
} from 'lucide-react';

export const SupportSessions: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SupportSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Review Modal State
  const [reviewModalSession, setReviewModalSession] = useState<SupportSession | null>(null);
  const [ratingClarity, setRatingClarity] = useState(5);
  const [ratingHelpfulness, setRatingHelpfulness] = useState(5);
  const [ratingPunctuality, setRatingPunctuality] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<SupportSession[]>('/support/sessions');
      setSessions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCompleteSession = async (sessionId: number) => {
    try {
      await apiClient.put(`/support/sessions/${sessionId}/status?new_status=completed`);
      await fetchSessions();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Oturum tamamlanamadı.');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalSession) return;

    setReviewSubmitting(true);
    setReviewError(null);
    try {
      await apiClient.post(`/support/sessions/${reviewModalSession.id}/reviews`, {
        rating_clarity: ratingClarity,
        rating_helpfulness: ratingHelpfulness,
        rating_punctuality: ratingPunctuality,
        comment: comment,
      });
      alert('Geri bildiriminiz başarıyla kaydedildi! Teşekkür ederiz.');
      setReviewModalSession(null);
      setComment('');
    } catch (err: any) {
      setReviewError(err.response?.data?.detail || 'Değerlendirme kaydedilemedi.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 block mb-1">
          Planlanan & Tamamlanan Dersler
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Ders Oturumlarım</h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Kabul edilen akran desteği oturumları, görüşme bağlantıları ve değerlendirmeler.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-6 h-6 text-sky-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Oturumlar yükleniyor...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200 p-8 space-y-2">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Henüz planlanmış veya tamamlanmış bir oturumunuz yok.</p>
          <p className="text-xs text-slate-500">
            Gelen talepleri kabul ettiğinizde veya gönderdiğiniz talep kabul edildiğinde oturumlar burada listelenir.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const isTutor = user?.id === session.tutor_id;
            const otherParty = isTutor ? session.student_name : session.tutor_name;

            return (
              <div
                key={session.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {session.course?.code}
                    </span>
                    <h3 className="font-semibold text-slate-900 text-sm">{session.topic_name}</h3>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        session.status === 'scheduled'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : session.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {session.status === 'scheduled' ? 'Planlandı' : 'Tamamlandı'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>
                      {isTutor ? 'Öğrenciniz:' : 'Eğitmeniniz:'} <strong className="text-slate-700 font-medium">{otherParty}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Tarih: <strong className="text-slate-700 font-medium">{new Date(session.scheduled_at).toLocaleDateString('tr-TR')}</strong>
                    </span>
                    <span>•</span>
                    <span>Süre: <strong className="text-slate-700 font-medium">{session.duration_minutes} Dakika</strong></span>
                    <span>•</span>
                    <span>Biçim: <strong className="text-slate-700 font-medium">{session.mode === 'online' ? 'Çevrim İçi' : 'Yüz Yüze'}</strong></span>
                  </div>

                  {session.meeting_link && session.mode === 'online' && (
                    <div className="pt-1">
                      <a
                        href={session.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-md border border-emerald-200 transition-colors"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Görüşme Bağlantısı: {session.meeting_link} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                  {session.status === 'scheduled' && (
                    <button
                      onClick={() => handleCompleteSession(session.id)}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      Oturumu Tamamla
                    </button>
                  )}

                  {session.status === 'completed' && (
                    <button
                      onClick={() => {
                        setReviewModalSession(session);
                        setReviewError(null);
                      }}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Star className="w-3.5 h-3.5 fill-slate-950" />
                      Geri Bildirim Bırak
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewModalSession && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 relative animate-in fade-in">
            <button
              onClick={() => setReviewModalSession(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900">Oturum Geri Bildirimi</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {reviewModalSession.course?.code} — {reviewModalSession.topic_name}
              </p>
            </div>

            {reviewError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
                {reviewError}
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Anlatım Netliği ve Anlaşılırlık (1-5)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setRatingClarity(val)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        ratingClarity >= val
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Faydalılık ve Destek Düzeyi (1-5)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setRatingHelpfulness(val)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        ratingHelpfulness >= val
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Zaman Uyumu ve Dakiklik (1-5)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setRatingPunctuality(val)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        ratingPunctuality >= val
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Yorum ve Teşekkür Notunuz
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Akranınıza destek için bir teşekkür veya gelişim notu bırakın..."
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 resize-none text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewModalSession(null)}
                  className="px-3.5 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {reviewSubmitting ? 'Kaydediliyor...' : 'Değerlendirmeyi Gönder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
