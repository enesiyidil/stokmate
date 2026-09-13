import type { NavigateFunction } from 'react-router-dom';

/**
 * Tag renkleri - açık krem/amber tema ile uyumlu (sipariş sayfası stili)
 */
export const getTagColor = (tag: string) => {
    switch (tag) {
        case 'SIPARIS': return 'bg-blue-100 text-blue-900 border-blue-300';
        case 'STOKLU_SATIS': return 'bg-emerald-100 text-emerald-900 border-emerald-300';
        case 'SEVKIYAT': return 'bg-purple-100 text-purple-900 border-purple-300';
        case 'URUN': return 'bg-cyan-100 text-cyan-900 border-cyan-300';
        case 'URUN_KABUL': return 'bg-teal-100 text-teal-900 border-teal-300';
        case 'BAKIYE_DEFTERI': return 'bg-amber-100 text-amber-900 border-amber-300';
        case 'CAPRAZ_DONUSTURME': return 'bg-orange-100 text-orange-900 border-orange-300';
        case 'ARACLAR': return 'bg-slate-100 text-slate-900 border-slate-300';
        case 'KISISEL': return 'bg-pink-100 text-pink-900 border-pink-300';
        case 'MAGAZA': return 'bg-indigo-100 text-indigo-900 border-indigo-300';
        case 'GENEL': return 'bg-gray-100 text-gray-900 border-gray-300';
        case 'DIGER': return 'bg-stone-100 text-stone-900 border-stone-300';
        default: return 'bg-stone-100 text-stone-900 border-stone-300';
    }
}

/**
 * Öncelik bilgisi - açık krem/amber tema ile uyumlu
 */
export const getPriorityInfo = (priority: string) => {
    switch (priority) {
        case 'HIGH': return { label: 'Yüksek', color: 'text-red-900 bg-red-100 border-red-300' };
        case 'MEDIUM': return { label: 'Orta', color: 'text-yellow-900 bg-yellow-100 border-yellow-300' };
        case 'LOW': return { label: 'Düşük', color: 'text-green-900 bg-green-100 border-green-300' };
        default: return { label: 'Bilinmiyor', color: 'text-amber-900 bg-amber-100 border-amber-300' };
    }
}

/**
 * PostgreSQL bytea -> TEXT dönüşümünden kalan octal escape dizilerini düzeltir.
 * Örnek: \304\261 → ı, \303\266 → ö
 *
 * ÖNEMLİ: Sadece gerçekten \NNN (octal) pattern içeren metinlere uygulanır.
 * Normal UTF-8 stringlere dokunmaz — çünkü charCodeAt bazlı byte dönüşümü
 * zaten düzgün olan UTF-8 metni bozar.
 */
export const decodePostgresEscaped = (text: string | null | undefined): string => {
    if (!text) return text || '';

    // PostgreSQL bytea octal escape: ters slash + tam olarak 3 rakam (0-7)
    const OCTAL_PATTERN = /\\[0-3][0-7]{2}/;
    if (!OCTAL_PATTERN.test(text)) {
        // Octal escape yok, metni olduğu gibi geri döndür
        return text;
    }

    // Art arda gelen octal escape baytlarını grupla ve UTF-8 olarak decode et
    let result = '';
    let i = 0;

    while (i < text.length) {
        // Ters slash + 3 oktal rakam mı?
        if (
            text[i] === '\\' &&
            i + 3 < text.length &&
            /^[0-3][0-7]{2}$/.test(text.slice(i + 1, i + 4))
        ) {
            // Ardışık tüm oktal escape baytlarını topla
            const bytes: number[] = [];
            while (
                i < text.length &&
                text[i] === '\\' &&
                i + 3 < text.length &&
                /^[0-3][0-7]{2}$/.test(text.slice(i + 1, i + 4))
            ) {
                bytes.push(parseInt(text.slice(i + 1, i + 4), 8));
                i += 4;
            }
            // Byte dizisini UTF-8 string olarak çöz
            result += new TextDecoder('utf-8').decode(new Uint8Array(bytes));
        } else {
            result += text[i];
            i++;
        }
    }

    return result;
}

export const getLinkToEntity = (type: string, id: string, navigate: NavigateFunction) => {
    switch (type) {
        case 'ORDER': navigate(`/orders/${id}`); break;
        case 'PRODUCT': navigate(`/products/${id}`); break;
        default: break;
    }
}
