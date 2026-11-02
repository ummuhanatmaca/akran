import React from 'react';
import { ShieldCheck, Lock, Eye, Database, CheckCircle2 } from 'lucide-react';

export const Privacy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 block mb-1">
          Kullanıcı Hakları & Şeffaflık
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Gizlilik Politikası ve Veri Aydınlatma Metni
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Son Güncelleme: {new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Amaç ve Kapsam</h2>
          <p>
            AKRAN Platformu, üniversite öğrencileri arasında açık ve ücretsiz akademik dayanışmayı
            desteklemek amacıyla geliştirilmiş bir akademik bitirme projesidir. Bu aydınlatma metni,
            platformu ziyaret eden ve kayıt olan öğrencilerin hangi verilerinin ne amaçla işlendiğini
            açık ve şeffaf biçimde bildirmek üzere hazırlanmıştır.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. İşlenen Veriler</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li><strong>Kimlik ve İletişim Bilgileri:</strong> Ad soyad, üniversite e-posta adresi.</li>
            <li><strong>Akademik Bilgiler:</strong> Üniversite, bölüm, sınıf seviyesi, anlatılmak veya öğrenilmek istenen ders tercihleri.</li>
            <li><strong>Müsaitlik ve Takvim Verileri:</strong> Akran eşleştirme algoritmasının çalışabilmesi için belirlenen haftalık uygun saat aralıkları.</li>
            <li><strong>Yüklenen Materyaller:</strong> Öğrencilerin gönüllü olarak sisteme yüklediği ders notları, çalışma özetleri ve dosya meta verileri.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Verilerin Güvenliği</h2>
          <p>
            Kullanıcı parolaları veritabanında asla düz metin olarak tutulmaz; endüstri standardı <strong>Bcrypt</strong> algoritması
            ile tuzlanarak özetlenir (hash). Sistem oturumları güvenli JSON Web Token (JWT) belirteçleri ile yönetilir.
            Yüklenen dosyalar zararlı uzantı ve dizin atlama (path traversal) risklerine karşı UUID tabanlı rastgele adlandırma
            yöntemiyle saklanır.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. Üçüncü Taraflarla Paylaşım</h2>
          <p>
            AKRAN, kâr amacı gütmeyen akademik bir projedir. Toplanan hiçbir kullanıcı verisi reklam, pazarlama
            veya profil çıkarma amacıyla üçüncü şahıs veya ticari şirketlere aktarılmaz ve satılmaz.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">5. Kullanıcı Hakları ve İletişim</h2>
          <p>
            Hesabınızı ve yüklediğiniz materyalleri dilediğiniz zaman profilinizden silebilir veya güncelleyebilirsiniz.
            Gizlilikle ilgili her türlü soru ve veri silme talebiniz için{' '}
            <a href="mailto:destek@akran.edu.tr" className="text-sky-600 font-semibold underline">
              destek@akran.edu.tr
            </a>{' '}
            adresi üzerinden iletişime geçebilirsiniz.
          </p>
        </section>
      </div>
    </div>
  );
};
