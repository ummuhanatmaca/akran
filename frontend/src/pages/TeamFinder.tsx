import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { ProjectIdea } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  PlusCircle,
  Send,
  X,
  Loader2
} from 'lucide-react';

export const TeamFinder: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Project Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createData, setCreateData] = useState({
    title: '',
    category: 'TÜBİTAK 2209-A',
    required_skills: '',
    description: '',
  });

  // Apply Modal
  const [applyModalProject, setApplyModalProject] = useState<ProjectIdea | null>(null);
  const [applyMessage, setApplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<ProjectIdea[]>('/opportunities/projects/all');
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post('/opportunities/projects', createData);
      setIsCreateOpen(false);
      setCreateData({
        title: '',
        category: 'TÜBİTAK 2209-A',
        required_skills: '',
        description: '',
      });
      await fetchProjects();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Proje ilanı oluşturulamadı.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyModalProject) return;

    setIsSubmitting(true);
    try {
      await apiClient.post(`/opportunities/projects/${applyModalProject.id}/apply`, {
        message: applyMessage,
      });
      alert('Başvurunuz proje sahibine iletildi. Başarılar dileriz!');
      setApplyModalProject(null);
      setApplyMessage('');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Başvuru gönderilemedi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 block mb-1">
            İş Birliği & Proje Takımları
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Takım Arkadaşı Bul
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            TÜBİTAK ve TEKNOFEST projelerine ekip arkadaşı arayın veya ilgilendiğiniz projelere yeteneklerinizle katılın.
          </p>
        </div>

        <button
          onClick={() => {
            if (!user) {
              alert('İlan açmak için lütfen giriş yapın.');
              return;
            }
            setIsCreateOpen(true);
          }}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Proje İlanı Yayınla
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-6 h-6 text-sky-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Projeler taranıyor...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200 p-8 space-y-2">
          <Users className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Henüz yayınlanmış bir proje ilanı yok.</p>
          <p className="text-xs text-slate-500">İlk ilanı vererek takım arkadaşlarınızı aramaya başlayabilirsiniz.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => {
            const isCreator = user?.id === proj.creator_id;
            const skills = proj.required_skills.split(',').map((s) => s.trim());

            return (
              <div
                key={proj.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {proj.category}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Kurucu: <strong className="text-slate-600 font-medium">{proj.creator_name}</strong>
                    </span>
                  </div>

                  <h3 className="font-semibold text-slate-900 text-base mb-1.5">{proj.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4 line-clamp-3">
                    {proj.description}
                  </p>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Aranan Beceriler:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    {proj.applications?.length || 0} Başvuru
                  </span>

                  {isCreator ? (
                    <span className="text-xs font-semibold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200">
                      Sizin İlanınız
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        if (!user) {
                          alert('Başvurmak için lütfen giriş yapın.');
                          return;
                        }
                        setApplyModalProject(proj);
                      }}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" /> Takıma Başvur
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 relative animate-in fade-in">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">Yeni Proje İlanı Yayınla</h3>
            <p className="text-xs text-slate-500 mb-4">Proje fikrinizi ve aradığınız teknik becerileri belirtin.</p>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Kategori / Program *</label>
                <select
                  value={createData.category}
                  onChange={(e) => setCreateData({ ...createData, category: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
                >
                  <option value="TÜBİTAK 2209-A">TÜBİTAK 2209-A Üniversite Öğrencileri Araştırma Projeleri</option>
                  <option value="TÜBİTAK 2209-B">TÜBİTAK 2209-B Sanayiye Yönelik Bitirme Projeleri</option>
                  <option value="TEKNOFEST">TEKNOFEST Yarışma Takımı</option>
                  <option value="Hackathon">Hackathon / İnovasyon Maratonu</option>
                  <option value="Bitirme Projesi">Disiplinler Arası Bitirme Projesi</option>
                  <option value="Diğer">Diğer Akademik Girişim</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Proje Başlığı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Tarımsal Verim İçin Gömülü Yapay Zekâ Destekli İHA Sistemi"
                  value={createData.title}
                  onChange={(e) => setCreateData({ ...createData, title: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Aranan Beceriler (Virgülle ayırın) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Python, PyTorch, ROS, PCB Tasarımı, React"
                  value={createData.required_skills}
                  onChange={(e) => setCreateData({ ...createData, required_skills: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Proje Tanımı ve Hedefler *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Projenin amacı, çözdüğü problem ve takımdan beklenen katkılar..."
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
                  {isSubmitting ? 'Yayınlanıyor...' : 'İlanı Yayınla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {applyModalProject && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 relative animate-in fade-in">
            <button
              onClick={() => setApplyModalProject(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">Projeye Başvur</h3>
            <p className="text-xs text-slate-500 mb-4">
              <strong>"{applyModalProject.title}"</strong> projesine başvuruyorsunuz.
            </p>

            <form onSubmit={handleApplySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Kendinizi ve Projeye Katkınızı Tanıtın *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Hangi bölümdesiniz, aranan becerilerden hangilerine hakimsiniz ve bu projede ne yapmak istersiniz?"
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 resize-none text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setApplyModalProject(null)}
                  className="px-3.5 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'İletiliyor...' : 'Başvuruyu Gönder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
