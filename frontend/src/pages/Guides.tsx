import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { GuideArticle } from '../types';
import {
  BookOpen,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckSquare,
  Square,
  Search,
  Copy,
  Check,
  Users,
  Layers,
  ArrowRight,
  Loader2
} from 'lucide-react';

const GUIDE_CATEGORIES = [
  'Tümü',
  'Proje fikri geliştirme',
  'Bilimsel araştırma ve literatür taraması',
  'Problem tanımı, amaç ve araştırma sorusu',
  'Yöntem ve teknik altyapı',
  'Proje yazımı ve başvuru belgeleri',
  'Bütçe ve kaynak planlaması',
  'Takım oluşturma ve görev dağılımı',
  'TÜBİTAK 2209-A / 2209-B başvuru süreci',
  'TEKNOFEST ve öğrenci yarışmalarına hazırlık',
  'Proje sunumu, raporlama ve sonuçların paylaşılması'
];

export const Guides: React.FC = () => {
  const [guides, setGuides] = useState<GuideArticle[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<GuideArticle | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  useEffect(() => {
    fetchGuides();
  }, [selectedCategory]);

  const fetchGuides = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'Tümü') {
        params.append('category', selectedCategory);
      }
      if (search.trim()) {
        params.append('search', search.trim());
      }
      const res = await apiClient.get<GuideArticle[]>(`/opportunities/guides?${params.toString()}`);
      setGuides(res.data);
      if (res.data.length > 0) {
        // If currently selected guide is in list, keep it, otherwise select first
        setSelectedGuide((prev) => {
          if (prev && res.data.some((g) => g.id === prev.id)) {
            return res.data.find((g) => g.id === prev.id) || res.data[0];
          }
          return res.data[0];
        });
      } else {
        setSelectedGuide(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGuides();
  };

  const toggleChecklist = (idx: number) => {
    if (!selectedGuide) return;
    const key = `${selectedGuide.id}-${idx}`;
    setCheckedItems((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleCopyTemplate = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  // Parse checklist items safely
  const getParsedChecklist = (guide: GuideArticle): string[] => {
    if (!guide.checklist_items) return [];
    try {
      const parsed = JSON.parse(guide.checklist_items);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return guide.checklist_items.split('\n').filter(Boolean);
    }
  };

  // Related guides in same category
  const relatedGuides = guides.filter(
    (g) => selectedGuide && g.id !== selectedGuide.id && g.category === selectedGuide.category
  );

  // Render article content with clean section headings and bold formatting, stripping any # characters
  const renderArticleContent = (rawContent: string) => {
    if (!rawContent) return null;

    // Clean any leading # hashes across lines
    const cleaned = rawContent.replace(/^#{1,6}\s*/gm, '');
    const lines = cleaned.split('\n');

    return lines.map((line, idx) => {
      const trimmed = line.trim();

      // Numbered section header pattern (e.g. "1. Bu Rehber Neyi Anlatıyor?")
      const isSectionHeading = /^\d+\.\s+[A-ZÇĞİÖŞÜ][^.\n]+(\?|:)?$/.test(trimmed) && trimmed.length < 80;

      if (isSectionHeading) {
        return (
          <h3
            key={idx}
            className="text-sm sm:text-base font-bold text-slate-900 pt-4 pb-1 border-b border-slate-100 flex items-center gap-2"
          >
            {trimmed}
          </h3>
        );
      }

      if (trimmed === '') {
        return <div key={idx} className="h-1" />;
      }

      // Inline bold formatting (**text**)
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={idx} className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-semibold text-slate-900">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="pb-4 border-b border-slate-200">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
          Akademik Bilgi Merkezi
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
          Proje ve Araştırma Rehberleri
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
          TÜBİTAK 2209 araştırma projeleri, TEKNOFEST yarışmaları ve bitirme tezleri için fikir geliştirmeden bütçe yönetimine, başvuru formlarından jüri sunumuna kadar adım adım pratik yönergeler.
        </p>
      </div>

      {/* Search and Category Filter */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rehber başlığı veya konu arayın (Örn: literatür taraması, Gantt şeması, bütçe)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Ara
          </button>
        </form>

        {/* Categories Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {GUIDE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left Selector List & Right Article Viewer */}
      {isLoading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-6 h-6 text-sky-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Rehberler listeleniyor...</p>
        </div>
      ) : guides.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8">
          <p className="text-sm font-semibold text-slate-800">Aranan kriterde bir rehber bulunamadı.</p>
          <button
            onClick={() => {
              setSelectedCategory('Tümü');
              setSearch('');
            }}
            className="mt-3 px-4 py-2 bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-200"
          >
            Tüm Rehberleri Göster
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Guide Cards List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Rehberler ({guides.length})
              </span>
            </div>

            <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              {guides.map((g) => {
                const isSelected = selectedGuide?.id === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => {
                      setSelectedGuide(g);
                      window.scrollTo({ top: 180, behavior: 'smooth' });
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-slate-50 border-sky-500 shadow-sm ring-1 ring-sky-500'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {g.category}
                        </span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{g.read_time_minutes} dk okuma</span>
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug">
                        {g.title}
                      </h3>

                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {g.summary}
                      </p>

                      {g.target_audience && (
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5">
                          <Users className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{g.target_audience}</span>
                        </div>
                      )}
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 shrink-0 mt-1 transition-transform ${
                        isSelected ? 'text-sky-600 translate-x-0.5' : 'text-slate-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Selected Guide Article View (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            {selectedGuide ? (
              <>
                {/* Header Information */}
                <div className="border-b border-slate-200 pb-5 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-100">
                      {selectedGuide.category}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedGuide.read_time_minutes} dakika okuma süresi</span>
                    </span>
                    {selectedGuide.updated_at && (
                      <span className="text-xs text-slate-400">
                        • Son Güncelleme: {new Date(selectedGuide.updated_at).toLocaleDateString('tr-TR')}
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                    {selectedGuide.title}
                  </h2>

                  {/* Target Audience Pill */}
                  {selectedGuide.target_audience && (
                    <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span><strong>Kimler İçin:</strong> {selectedGuide.target_audience}</span>
                    </div>
                  )}

                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {selectedGuide.summary}
                  </div>
                </div>

                {/* Structured Article Content */}
                <div className="space-y-3">
                  {renderArticleContent(selectedGuide.content)}
                </div>

                {/* Interactive Checklist (Step 6) */}
                {getParsedChecklist(selectedGuide).length > 0 && (
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 mt-6">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-sky-600" />
                      <h4 className="font-bold text-slate-900 text-sm">
                        Uygulama Kontrol Listesi
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500">
                      Bu adımları tamamladıkça işaretleyerek sürecinizi takip edebilirsiniz:
                    </p>

                    <div className="space-y-2 pt-1">
                      {getParsedChecklist(selectedGuide).map((item, idx) => {
                        const key = `${selectedGuide.id}-${idx}`;
                        const isDone = !!checkedItems[key];
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleChecklist(idx)}
                            className="w-full flex items-start gap-2.5 text-left p-2.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors"
                          >
                            <span className="mt-0.5 shrink-0">
                              {isDone ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </span>
                            <span
                              className={`text-xs leading-relaxed ${
                                isDone ? 'line-through text-slate-400 font-normal' : 'text-slate-800 font-medium'
                              }`}
                            >
                              {item}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Example / Template Box (Step 7) */}
                {selectedGuide.template_example && (
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 mt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <Layers className="w-4 h-4 text-slate-600" />
                        <span>Kullanılabilir Örnek / Belge Şablonu</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleCopyTemplate(selectedGuide.template_example || '')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        {copiedTemplate ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Kopyalandı</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Kopyala</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-3 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                      {selectedGuide.template_example}
                    </pre>
                  </div>
                )}

                {/* Official Sources & Verification Warning (Step 8) */}
                {selectedGuide.official_sources && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 mt-4">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <ShieldCheck className="w-4 h-4 text-slate-600 shrink-0" />
                      <span>Resmî Kurum Dokümanları ve Kaynaklar:</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Kuralların ve başvuru takvimlerinin güncelliğini resmî web sitelerinden kontrol ediniz:
                    </p>
                    <div className="text-xs text-sky-700 font-medium break-all pt-1">
                      {selectedGuide.official_sources}
                    </div>
                  </div>
                )}

                {/* Related Guides in Same Category */}
                {relatedGuides.length > 0 && (
                  <div className="border-t border-slate-200 pt-6 mt-6 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Bu Kategorideki Diğer Rehberler
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {relatedGuides.map((rg) => (
                        <button
                          key={rg.id}
                          type="button"
                          onClick={() => {
                            setSelectedGuide(rg);
                            window.scrollTo({ top: 180, behavior: 'smooth' });
                          }}
                          className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-left transition-colors flex items-center justify-between"
                        >
                          <div className="min-w-0 pr-2">
                            <h5 className="font-semibold text-slate-900 text-xs truncate">{rg.title}</h5>
                            <span className="text-[10px] text-slate-400">{rg.read_time_minutes} dk okuma</span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 text-slate-400 text-xs">Lütfen bir rehber seçiniz.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
