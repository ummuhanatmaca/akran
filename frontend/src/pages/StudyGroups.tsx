import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { StudyGroup, Course } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Calendar,
  Video,
  PlusCircle,
  CheckCircle,
  LogOut,
  X,
  Loader2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

export const StudyGroups: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createData, setCreateData] = useState({
    course_id: '',
    title: '',
    topic: '',
    description: '',
    max_members: 5,
    mode: 'online',
    scheduled_at: '',
    meeting_link: '',
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const url = selectedCourseId ? `/study-groups?course_id=${selectedCourseId}` : '/study-groups';
      const [gRes, cRes] = await Promise.all([
        apiClient.get<StudyGroup[]>(url),
        apiClient.get<Course[]>('/courses'),
      ]);
      setGroups(gRes.data);
      setCourses(cRes.data);
      if (!createData.course_id && cRes.data.length > 0) {
        setCreateData(prev => ({ ...prev, course_id: cRes.data[0].id.toString() }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [selectedCourseId]);

  const handleJoin = async (groupId: number) => {
    try {
      await apiClient.post(`/study-groups/${groupId}/join`);
      await fetchGroups();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Gruba katılınamadı.');
    }
  };

  const handleLeave = async (groupId: number) => {
    try {
      await apiClient.post(`/study-groups/${groupId}/leave`);
      await fetchGroups();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Gruptan ayrılınamadı.');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCreateError(null);

    try {
      await apiClient.post('/study-groups', {
        course_id: parseInt(createData.course_id),
        title: createData.title,
        topic: createData.topic,
        description: createData.description,
        max_members: Number(createData.max_members),
        mode: createData.mode,
        scheduled_at: createData.scheduled_at ? new Date(createData.scheduled_at).toISOString() : null,
        meeting_link: createData.meeting_link || null,
      });

      setIsCreateOpen(false);
      setCreateData({
        course_id: courses[0]?.id?.toString() || '',
        title: '',
        topic: '',
        description: '',
        max_members: 5,
        mode: 'online',
        scheduled_at: '',
        meeting_link: '',
      });
      await fetchGroups();
    } catch (err: any) {
      setCreateError(err.response?.data?.detail || 'Grup oluşturulamadı.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 block mb-1">
            Birlikte Öğrenme & Sınav Hazırlığı
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Çalışma Grupları
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Ders bazlı akran çalışma gruplarına katılın veya kendi çalışma grubunuzu kurun.
          </p>
        </div>

        {user && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            Çalışma Grubu Kur
          </button>
        )}
      </div>

      {/* Filter by course */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="w-full sm:w-64">
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:border-sky-500 outline-none text-slate-800"
          >
            <option value="">Tüm Dersler</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs text-slate-400 font-medium">{groups.length} aktif grup</span>
      </div>

      {/* Groups List */}
      {isLoading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-6 h-6 text-sky-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Çalışma grupları yükleniyor...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200 p-8 space-y-2">
          <Users className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Seçili derste aktif bir çalışma grubu bulunmuyor.</p>
          <p className="text-xs text-slate-500">İlk grubu kurarak akranlarınızı davet edebilirsiniz.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => {
            const isMember = group.members.some((m) => m.user_id === user?.id);
            const isCreator = group.creator_id === user?.id;

            return (
              <div
                key={group.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {group.course?.code}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        group.current_members_count >= group.max_members
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {group.current_members_count} / {group.max_members} Üye
                    </span>
                  </div>

                  <h3 className="font-semibold text-slate-900 text-base mb-1">{group.title}</h3>
                  <div className="text-xs font-medium text-sky-700 mb-2">Konu: {group.topic}</div>

                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">
                    {group.description || 'Grup açıklaması belirtilmedi.'}
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Kurucu:</span>
                      <strong className="text-slate-800 font-medium">{group.creator_name}</strong>
                    </div>
                    {group.scheduled_at && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(group.scheduled_at).toLocaleDateString('tr-TR')}</span>
                      </div>
                    )}
                    {group.meeting_link && isMember && (
                      <div className="pt-1">
                        <a
                          href={group.meeting_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold hover:underline"
                        >
                          <Video className="w-3.5 h-3.5" /> Toplantı Bağlantısı <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500 font-medium">
                    {group.mode === 'online' ? 'Çevrim İçi' : 'Yüz Yüze'}
                  </div>

                  {isMember ? (
                    isCreator ? (
                      <span className="text-[11px] font-semibold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200">
                        Grup Yöneticisisiniz
                      </span>
                    ) : (
                      <button
                        onClick={() => handleLeave(group.id)}
                        className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-medium rounded-lg text-xs flex items-center gap-1 transition-colors"
                      >
                        <LogOut className="w-3 h-3" /> Ayrıl
                      </button>
                    )
                  ) : group.current_members_count >= group.max_members ? (
                    <span className="text-xs font-medium text-slate-400">Kontenjan Dolu</span>
                  ) : (
                    <button
                      onClick={() => handleJoin(group.id)}
                      className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg text-xs flex items-center gap-1 shadow-xs transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Gruba Katıl
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-600" />
                Yeni Çalışma Grubu Oluştur
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Ders *</label>
                <select
                  value={createData.course_id}
                  onChange={(e) => setCreateData({ ...createData, course_id: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Grup Başlığı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Vize Öncesi Soru Çözüm Grubu"
                  value={createData.title}
                  onChange={(e) => setCreateData({ ...createData, title: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Odaklanılacak Konu *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Dinamik Bellek ve Ağaçlar"
                  value={createData.topic}
                  onChange={(e) => setCreateData({ ...createData, topic: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Görüşme Biçimi</label>
                  <select
                    value={createData.mode}
                    onChange={(e) => setCreateData({ ...createData, mode: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
                  >
                    <option value="online">Çevrim İçi (Online)</option>
                    <option value="in_person">Yüz Yüze</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Maksimum Üye Sayısı</label>
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={createData.max_members}
                    onChange={(e) => setCreateData({ ...createData, max_members: parseInt(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Planlanan Tarih / Saat</label>
                <input
                  type="datetime-local"
                  value={createData.scheduled_at}
                  onChange={(e) => setCreateData({ ...createData, scheduled_at: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Görüşme Bağlantısı (Varsa)</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/... veya Zoom linki"
                  value={createData.meeting_link}
                  onChange={(e) => setCreateData({ ...createData, meeting_link: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Açıklama</label>
                <textarea
                  rows={3}
                  placeholder="Çalışmanın planı ve hedefler..."
                  value={createData.description}
                  onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 resize-none text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Oluşturuluyor...' : 'Grubu Kur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
