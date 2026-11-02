import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import {
  SupportSession,
  SupportRequest,
  OpportunityTracking,
  LearningGoal,
  StudyMaterial
} from '../types';
import {
  Calendar,
  Compass,
  FileText,
  Sparkles,
  Target,
  ArrowRight,
  Video,
  Clock,
  CheckCircle,
  PlusCircle,
  Users,
  AlertCircle
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SupportSession[]>([]);
  const [sentRequests, setSentRequests] = useState<SupportRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<SupportRequest[]>([]);
  const [trackings, setTrackings] = useState<OpportunityTracking[]>([]);
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get<SupportSession[]>('/support/sessions'),
      apiClient.get<SupportRequest[]>('/support/requests/sent'),
      apiClient.get<SupportRequest[]>('/support/requests/received'),
      apiClient.get<OpportunityTracking[]>('/opportunities/user/tracking'),
      apiClient.get<LearningGoal[]>('/goals'),
    ])
      .then(([sRes, sentRes, recRes, trRes, gRes]) => {
        setSessions(sRes.data);
        setSentRequests(sentRes.data);
        setReceivedRequests(recRes.data);
        setTrackings(trRes.data);
        setGoals(gRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const upcomingSessions = sessions.filter((s) => s.status === 'scheduled');
  const pendingReceived = receivedRequests.filter((r) => r.status === 'pending');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. WELCOME BANNER */}
      <div className="bg-slate-900 rounded-xl p-6 sm:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs border border-slate-800">
        <div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
            Öğrenci Kontrol Paneli
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-2 tracking-tight">
            Hoş geldin, {user?.profile?.full_name || user?.email}!
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            {user?.profile?.university} — {user?.profile?.department} ({user?.profile?.grade})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/tutors"
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Compass className="w-4 h-4 text-slate-950" />
            Ders Desteği Bul
          </Link>
          <Link
            to="/materials/upload"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg text-xs border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-sky-400" />
            Not Paylaş
          </Link>
        </div>
      </div>

      {/* PENDING NOTIFICATION BANNER */}
      {pendingReceived.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-amber-900 text-xs sm:text-sm font-medium">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Bekleyen <strong>{pendingReceived.length} adet</strong> ders desteği talebiniz var.
            </span>
          </div>
          <Link
            to="/support-requests"
            className="text-xs font-semibold px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
          >
            Talepleri İncele
          </Link>
        </div>
      )}

      {/* 2. STATS OVERVIEW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{upcomingSessions.length}</div>
            <div className="text-xs text-slate-500 font-medium">Planlanan Oturum</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{sentRequests.length}</div>
            <div className="text-xs text-slate-500 font-medium">Gönderilen Talep</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{goals.length}</div>
            <div className="text-xs text-slate-500 font-medium">Öğrenme Hedefi</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{trackings.length}</div>
            <div className="text-xs text-slate-500 font-medium">Takip Edilen Fırsat</div>
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Upcoming Sessions & Active Requests */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Sessions Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-600" />
                Yaklaşan Ders Oturumları
              </h2>
              <Link to="/sessions" className="text-xs font-semibold text-sky-600 hover:text-sky-700">
                Tümünü Gör
              </Link>
            </div>

            {upcomingSessions.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200 space-y-2">
                <Calendar className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-600 font-medium">Henüz planlanmış bir oturumunuz yok.</p>
                <Link
                  to="/tutors"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
                >
                  Ders Anlatıcısı Bul <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.slice(0, 3).map((session) => (
                  <div
                    key={session.id}
                    className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-900 text-sm">
                          {session.course?.code} — {session.topic_name}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {session.mode === 'online' ? 'Çevrim İçi' : 'Yüz Yüze'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>Eğitmen: <strong className="text-slate-700 font-medium">{session.tutor_name}</strong></span>
                        <span>•</span>
                        <span>Öğrenci: <strong className="text-slate-700 font-medium">{session.student_name}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {session.meeting_link && session.mode === 'online' && (
                        <a
                          href={session.meeting_link}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <Video className="w-3.5 h-3.5" />
                          Görüşmeye Katıl
                        </a>
                      )}
                      <Link
                        to="/sessions"
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs transition-colors"
                      >
                        Detay
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Learning Goals */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                Öğrenme Hedeflerim
              </h2>
              <Link to="/goals" className="text-xs font-semibold text-sky-600 hover:text-sky-700">
                Hedef Yönetimi
              </Link>
            </div>

            {goals.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <p className="text-xs text-slate-500">Henüz bir öğrenme hedefi belirlemediniz.</p>
                <Link
                  to="/goals"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Yeni Hedef Ekle
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {goals.slice(0, 4).map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          g.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      <div>
                        <div
                          className={`text-xs font-semibold ${
                            g.status === 'completed'
                              ? 'line-through text-slate-400'
                              : 'text-slate-800'
                          }`}
                        >
                          {g.topic}
                        </div>
                        <div className="text-[11px] text-slate-500">{g.course?.name}</div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                        g.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {g.status === 'completed' ? 'Tamamlandı' : 'Devam Ediyor'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Actions & Personal Tracking */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Hızlı İşlemler</h3>
            <div className="space-y-2 text-xs">
              <Link
                to="/tutors"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors border border-slate-200"
              >
                <span className="font-medium flex items-center gap-2">
                  <Compass className="w-4 h-4 text-sky-600" />
                  Ders Desteği Talep Et
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                to="/materials/upload"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors border border-slate-200"
              >
                <span className="font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-600" />
                  Ders Notu Yükle
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                to="/study-groups"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors border border-slate-200"
              >
                <span className="font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Çalışma Grubu Kur
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                to="/team-finder"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors border border-slate-200"
              >
                <span className="font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Takım Arkadaşı İlanı Aç
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Tracked Opportunities Mini Pipeline */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm">Fırsat Takip Listem</h3>
              <Link to="/opportunities" className="text-xs text-sky-600 hover:underline">
                Keşfet
              </Link>
            </div>

            {trackings.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                Henüz takip listesine eklenmiş bir fırsatınız yok.
              </p>
            ) : (
              <div className="space-y-2">
                {trackings.slice(0, 4).map((t) => (
                  <div key={t.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-xs font-semibold text-slate-900 line-clamp-1">
                      {t.opportunity?.title}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">{t.opportunity?.organization}</span>
                      <span className="font-medium text-sky-700">
                        {t.status === 'examining' && 'İnceleniyor'}
                        {t.status === 'preparing' && 'Hazırlanıyor'}
                        {t.status === 'applied' && 'Başvuruldu'}
                        {t.status === 'completed' && 'Tamamlandı'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
