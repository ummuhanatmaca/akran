import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Opportunity } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  ExternalLink,
  Heart,
  Calendar,
  Building,
  Search,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  XCircle,
  ArrowRight
} from 'lucide-react';

export const Opportunities: React.FC = () => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [category, setCategory] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [targetAudience, setTargetAudience] = useState<string>('');
  const [appType, setAppType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('deadline_approaching');
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchOpportunities = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (statusFilter && statusFilter !== 'all') params.append('status_filter', statusFilter);
      if (targetAudience && targetAudience !== 'all') params.append('target_audience', targetAudience);
      if (appType && appType !== 'all') params.append('application_type', appType);
      if (sortBy) params.append('sort_by', sortBy);
      if (search.trim()) params.append('search', search.trim());

      const res = await apiClient.get<Opportunity[]>(`/opportunities?${params.toString()}`);
      setOpportunities(res.data);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Fırsatlar yüklenirken bir sorun oluştu. Lütfen bağlantınızı kontrol ediniz.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [category, statusFilter, targetAudience, appType, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOpportunities();
  };

  const toggleFavorite = async (oppId: number) => {
    if (!user) {
      alert('Fırsatları favorilerinize eklemek için lütfen giriş yapın.');
      return;
    }
    try {
      const res = await apiClient.post(`/opportunities/${oppId}/favorite`);
      setOpportunities(prev =>
        prev.map(o => o.id === oppId ? { ...o, is_favorited: res.data.favorited } : o)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleTrackingChange = async (oppId: number, newStatus: string) => {
    if (!user) {
      alert('Başvuru takibi için lütfen giriş yapın.');
      return;
    }
    try {
      await apiClient.post(`/opportunities/${oppId}/tracking`, {
        status: newStatus,
        notes: ''
      });
      setOpportunities(prev =>
        prev.map(o => o.id === oppId ? { ...o, tracking_status: newStatus } : o)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Başvuruya Açık
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
            <Clock className="w-3 h-3" /> Yakında Açılacak
          </span>
        );
      case 'closed':
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            <XCircle className="w-3 h-3" /> Sona Erdi
          </span>
        );
      case 'pending_verification':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" /> Doğrulama Bekleniyor
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded bg-slate-100 text-slate-700">
            <HelpCircle className="w-3 h-3" /> {status}
          </span>
        );
    }
  };

  const getDaysRemaining = (endDateStr?: string) => {
    if (!endDateStr) return null;
    const end = new Date(endDateStr);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return null;
    return diffDays;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Akademik Fırsat Platformu
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
            Bilimsel Fırsatlar ve Proje Çağrıları
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Üniversite öğrencilerine yönelik TÜBİTAK araştırma destekleri, TEKNOFEST yarışmaları, burslar ve inovasyon programları resmî kaynaklardan doğrulanarak sunulmaktadır.
          </p>
        </div>

        <Link
          to="/guides"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shrink-0"
        >
          <span>Proje Hazırlama Rehberleri</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4 shadow-sm">
        {/* Search row */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Program adı, kurum veya anahtar kelime arayın (Örn: TÜBİTAK 2209, yapay zekâ, burs)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Filtrele
          </button>
        </form>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800"
            >
              <option value="">Tüm Kategoriler</option>
              <option value="TÜBİTAK">TÜBİTAK Programları</option>
              <option value="TEKNOFEST">TEKNOFEST</option>
              <option value="Yarışma">Mühendislik Yarışmaları</option>
              <option value="Hackathon">Hackathon & Maratonlar</option>
              <option value="Burs">Burs & Eğitim Destekleri</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Başvuru Durumu</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="open">Başvuruya Açık</option>
              <option value="upcoming">Yakında Açılacak</option>
              <option value="closed">Sona Erdi</option>
              <option value="pending_verification">Doğrulama Bekliyor</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Hedef Kitle</label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800"
            >
              <option value="all">Tüm Seviyeler</option>
              <option value="Lisans">Lisans</option>
              <option value="Ön Lisans">Ön Lisans</option>
              <option value="Lisansüstü">Lisansüstü</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Başvuru Biçimi</label>
            <select
              value={appType}
              onChange={(e) => setAppType(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800"
            >
              <option value="all">Bireysel ve Takım</option>
              <option value="individual">Bireysel Başvuru</option>
              <option value="team">Takım Başvurusu</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Sıralama</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-sky-500 text-slate-800"
            >
              <option value="deadline_approaching">Son Tarihi Yaklaşanlar</option>
              <option value="open_first">Başvuruya Açık Olanlar</option>
              <option value="newest">Son Eklenenler</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content State */}
      {isLoading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-6 h-6 text-sky-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Güncel bilimsel fırsatlar doğrulanıyor...</p>
        </div>
      ) : errorMessage ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-rose-800 text-xs">
          <AlertCircle className="w-6 h-6 text-rose-600 mx-auto mb-2" />
          <p className="font-semibold">{errorMessage}</p>
          <button
            onClick={fetchOpportunities}
            className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded font-medium hover:bg-rose-700"
          >
            Yeniden Dene
          </button>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8">
          <p className="text-sm font-semibold text-slate-800">Seçilen kriterlere uygun fırsat bulunamadı.</p>
          <p className="text-xs text-slate-500 mt-1">Filtreleri temizleyerek veya arama terimini değiştirerek tekrar deneyebilirsiniz.</p>
          <button
            onClick={() => {
              setCategory('');
              setStatusFilter('all');
              setTargetAudience('');
              setAppType('all');
              setSearch('');
            }}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
          >
            Filtreleri Temizle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((opp) => {
            const daysLeft = getDaysRemaining(opp.end_date);
            const isApproaching = daysLeft !== null && daysLeft <= 14 && daysLeft >= 0;

            return (
              <div
                key={opp.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  {/* Category & Favorite Header */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {opp.category}
                      </span>
                      {getStatusBadge(opp.status)}
                    </div>

                    <button
                      onClick={() => toggleFavorite(opp.id)}
                      className={`p-1.5 rounded-md transition-colors ${
                        opp.is_favorited
                          ? 'text-rose-600 bg-rose-50'
                          : 'text-slate-400 hover:text-rose-600 hover:bg-slate-50'
                      }`}
                      title={opp.is_favorited ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                    >
                      <Heart className={`w-4 h-4 ${opp.is_favorited ? 'fill-rose-600' : ''}`} />
                    </button>
                  </div>

                  {/* Title & Organization */}
                  <h3 className="font-bold text-slate-900 text-base mb-1.5 leading-snug">
                    {opp.title}
                  </h3>
                  <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-3">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{opp.organization}</span>
                  </div>

                  {/* Summary */}
                  <p className="text-xs text-slate-600 leading-relaxed mb-4 line-clamp-3">
                    {opp.summary || opp.requirements || 'Öğrencilere yönelik proje başvuru çağrısı.'}
                  </p>

                  {/* Support / Prize info if available */}
                  {opp.prize_support && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 mb-3">
                      <span className="text-slate-500 font-medium">Destek / Ödül:</span>{' '}
                      <span className="font-semibold text-slate-900">{opp.prize_support}</span>
                    </div>
                  )}

                  {/* Meta details list */}
                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    {opp.end_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" /> Son Başvuru:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900">
                            {new Date(opp.end_date).toLocaleDateString('tr-TR')}
                          </span>
                          {isApproaching && opp.status === 'open' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                              {daysLeft === 0 ? 'Son Gün' : `${daysLeft} gün kaldı`}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Hedef Kitle:</span>
                      <span className="font-medium text-slate-800">{opp.target_audience || 'Tüm Öğrenciler'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Başvuru Biçimi:</span>
                      <span className="font-medium text-slate-800">
                        {opp.application_type === 'both' ? 'Bireysel veya Takım' : opp.application_type === 'team' ? 'Takım Başvurusu' : 'Bireysel'}
                      </span>
                    </div>

                    {opp.last_checked_at && (
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>Son Kontrol:</span>
                        <span>{new Date(opp.last_checked_at).toLocaleDateString('tr-TR')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions & Tracking Selector */}
                <div className="border-t border-slate-100 pt-4 mt-4 space-y-3">
                  {user && (
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                        Kişisel Takip Durumu
                      </label>
                      <select
                        value={opp.tracking_status || ''}
                        onChange={(e) => handleTrackingChange(opp.id, e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-sky-500"
                      >
                        <option value="">Takip Listesine Ekle...</option>
                        <option value="examining">Şartnameyi inceliyorum</option>
                        <option value="preparing">Proje raporu hazırlıyorum</option>
                        <option value="applied">Başvuru yapıldı</option>
                        <option value="completed">Sonuçlandı / Tamamlandı</option>
                      </select>
                    </div>
                  )}

                  {/* Primary & Secondary Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={opp.official_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors text-center"
                    >
                      <span>Resmî Duyuruyu İncele</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </a>

                    {opp.application_url && opp.status === 'open' && (
                      <a
                        href={opp.application_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors whitespace-nowrap"
                      >
                        <span>Başvuruya Git</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
