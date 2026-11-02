import React from 'react';
import { FileText, ShieldAlert, CheckCircle, Scale } from 'lucide-react';

export const Terms: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 block mb-1">
          Topluluk İlkeleri & Kurallar
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Kullanım Koşulları ve Akademik Etik İlkeleri
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Son Güncelleme: {new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Temel İlke: Kesinlikle Ücretsiz ve Gönüllülük Esaslı</h2>
          <p>
            AKRAN, ticari bir pazar yeri değildir. Platform üzerinden eşleşen akran anlatıcıları ve öğrenciler,
            verilen ders desteği, soru çözümü veya danışmanlık karşılığında doğrudan ya da dolaylı hiçbir ücret talep edemez.
            Ücret talebinde bulunduğu tespit edilen hesaplar askıya alınır.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Akademik Dürüstlük ve Kopya Yasağı</h2>
          <p>
            Akran desteği; konu anlatımı, zorlanılan kavramların açıklanması ve öğrenme metodolojisi paylaşımını kapsar.
            Canlı sınav esnasında kopya çekmek/vermek, başkası adına ödev yaptırmak veya akademik sahtecilik
            oluşturacak eylemlerde bulunmak kesinlikle yasaktır ve üniversite disiplin yönetmelikleriyle çelişir.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Telif Hakları ve Materyal Paylaşımı</h2>
          <p>
            Yüklenen ders notlarının öğrencinin kendi el yazısı, ders özetleri veya açık kaynaklı eğitim içerikleri olması esastır.
            Yayınevlerine ait telifli kitap taramaları, gizlilik dereceli sınav soruları veya izinsiz belgelerin yüklenmesi yasaktır.
            Platformda telif hakkı ihlali olduğunu düşündüğünüz içerikleri materyal kartındaki bildiri butonu üzerinden
            veya <a href="mailto:destek@akran.edu.tr" className="text-sky-600 font-semibold underline">destek@akran.edu.tr</a> adresine raporlayabilirsiniz.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. Saygılı ve Kapsayıcı Topluluk Ortamı</h2>
          <p>
            Tüm kullanıcılar çalışma gruplarında, ders oturumlarında ve takım bulma ilanlarında birbirlerine karşı
            nezaket ve saygı kurallarına uymakla yükümlüdür. Ayrımcılık, hakaret veya taciz içeren davranışlar
            platformdan kalıcı olarak uzaklaştırılma sebebidir.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">5. Sorumluluk Sınırları</h2>
          <p>
            AKRAN, öğrencilerin bağımsız olarak bir araya geldiği açık bir iş birliği ortamıdır.
            Akran anlatımlarının veya paylaşılan notların akademik doğruluğu tamamen paylaşım sahibinin
            sorumluluğundadır; platform resmî bir müfredat garantisi vermemektedir.
          </p>
        </section>
      </div>
    </div>
  );
};
