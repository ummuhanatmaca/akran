import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { LearningGoal, Course } from '../types';
import {
  Target,
  PlusCircle,
  CheckCircle,
  Circle,
  Calendar,
  Trash2,
  Clock,
  Loader2,
  X
} from 'lucide-react';

export const LearningGoals: React.FC = () => {
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Goal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    course_id: '',
    topic: '',
    description: '',
    target_date: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchGoals = async () => {
    setIsLoading(true);
    try {
      const [gRes, cRes] = await Promise.all([
        apiClient.get<LearningGoal[]>('/goals'),
        apiClient.get<Course[]>('/courses'),
      ]);
      setGoals(gRes.data);
      setCourses(cRes.data);
      if (!newGoal.course_id && cRes.data.length > 0) {
        setNewGoal(prev => ({ ...prev, course_id: cRes.data[0].id.toString() }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleToggleStatus = async (goal: LearningGoal) => {
    const nextStatus = goal.status === 'completed' ? 'in_progress' : 'completed';
    try {
      await apiClient.put(`/goals/${goal.id}`, { status: nextStatus });
      setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, status: nextStatus } : g));
    } catch (err) {
      alert('Hedef güncellenemedi.');
    }
  };

  const handleDelete = async (goalId: number) => {
    try {
      await apiClient.delete(`/goals/${goalId}`);
      setGoals(prev => prev.filter(g => g.id !== goalId));
    } catch (err) {
      alert('Hedef silinemedi.');
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post('/goals', {
        course_id: parseInt(newGoal.course_id),
        topic: newGoal.topic,
        description: newGoal.description,
        target_date: newGoal.target_date ? new Date(newGoal.target_date).toISOString() : null,
      });
      setIsAddOpen(false);
      setNewGoal({
        course_id: courses[0]?.id?.toString() || '',
        topic: '',
        description: '',
        target_date: '',
      });
      await fetchGoals();
    } catch (err) {
      alert('Hedef eklenemedi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const completedCount = goals.filter(g => g.status === 'completed').length;
  const progressPct = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 block mb-1">
            Bireysel Gelişim Takibi
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Akademik Öğrenme Hedeflerim
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Zorlandığınız konuları hedef olarak ekleyin, akran desteği aldıkça ilerlemenizi takip edin.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Yeni Hedef Ekle
        </button>
      </div>

      {/* Progress overview */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">Genel Hedef İlerlemesi</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Toplam {goals.length} hedeften {completedCount} tanesi tamamlandı.
          </div>
        </div>

        <div className="w-full sm:w-64 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>%{progressPct}</span>
            <span>{progressPct === 100 ? 'Hepsi Tamamlandı' : 'Devam Ediyor'}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-sky-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Goals list */}
      {isLoading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-6 h-6 text-sky-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Hedefler yükleniyor...</p>
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200 p-8 space-y-2">
          <Target className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Henüz bir öğrenme hedefi eklemediniz.</p>
          <p className="text-xs text-slate-500">Çalışmak istediğiniz konuları belirleyerek başlayın.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((g) => {
            const isDone = g.status === 'completed';
            return (
              <div
                key={g.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-start justify-between gap-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleStatus(g)}
                    className="mt-0.5 text-slate-400 hover:text-sky-600 transition-colors"
                    title={isDone ? 'Tamamlanmadı olarak işaretle' : 'Tamamlandı olarak işaretle'}
                  >
                    {isDone ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 hover:text-slate-500" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {g.course?.code}
                      </span>
                      <h3
                        className={`text-sm font-semibold ${
                          isDone ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {g.topic}
                      </h3>
                    </div>

                    {g.description && (
                      <p className="text-xs text-slate-500 mb-2 leading-relaxed">{g.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>Ders: {g.course?.name}</span>
                      {g.target_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Hedef Tarih: {new Date(g.target_date).toLocaleDateString('tr-TR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(g.id)}
                  className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors"
                  title="Hedefi Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-sky-600" />
                Yeni Öğrenme Hedefi
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Ders *</label>
                <select
                  value={newGoal.course_id}
                  onChange={(e) => setNewGoal({ ...newGoal, course_id: e.target.value })}
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
                <label className="block text-xs font-medium text-slate-700 mb-1">Hedef Konu *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Dinamik Programlama Algoritmaları"
                  value={newGoal.topic}
                  onChange={(e) => setNewGoal({ ...newGoal, topic: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Açıklama / Notlar</label>
                <textarea
                  rows={2}
                  placeholder="Bu konuda hangi soruları çözmek veya hangi kavramı anlamak istiyorsunuz?"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 resize-none text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Hedeflenen Tarih</label>
                <input
                  type="date"
                  value={newGoal.target_date}
                  onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Kaydediliyor...' : 'Hedefi Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
