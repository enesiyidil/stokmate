// Türkiye İl, İlçe, Mahalle verileri (basitleştirilmiş)
export const cities = [
    "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya",
    "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik",
    "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum",
    "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir",
    "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul",
    "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale",
    "Kırklareli", "Kırşehir", "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa",
    "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye",
    "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Şanlıurfa", "Şırnak",
    "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"
]

export const districts: Record<string, string[]> = {
    "İstanbul": ["Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü", "Beyoğlu", "Büyükçekmece", "Çatalca", "Çekmeköy", "Esenler", "Esenyurt", "Eyüpsultan", "Fatih", "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kağıthane", "Kartal", "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer", "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli", "Tuzla", "Ümraniye", "Üsküdar", "Zeytinburnu"],
    "Ankara": ["Akyurt", "Altındağ", "Ayaş", "Bala", "Beypazarı", "Çamlıdere", "Çankaya", "Çubuk", "Elmadağ", "Etimesgut", "Evren", "Gölbaşı", "Güdül", "Haymana", "Kahramankazan", "Kalecik", "Keçiören", "Kızılcahamam", "Mamak", "Nallıhan", "Polatlı", "Pursaklar", "Sincan", "Şereflikoçhisar", "Yenimahalle"],
    "İzmir": ["Aliağa", "Balçova", "Bayındır", "Bayraklı", "Bergama", "Beydağ", "Bornova", "Buca", "Çeşme", "Çiğli", "Dikili", "Foça", "Gaziemir", "Güzelbahçe", "Karabağlar", "Karaburun", "Karşıyaka", "Kemalpaşa", "Kınık", "Kiraz", "Konak", "Menderes", "Menemen", "Narlıdere", "Ödemiş", "Seferihisar", "Selçuk", "Tire", "Torbalı", "Urla"]
}

export const neighborhoods: Record<string, string[]> = {
    "Kadıköy": ["19 Mayıs", "Acıbadem", "Bostancı", "Caferağa", "Caddebostan", "Dumlupınar", "Eğitim", "Fenerbahçe", "Feneryolu", "Göztepe", "Hasanpaşa", "Koşuyolu", "Kozyatağı", "Kriton Curi", "Merdivenköy", "Osmanağa", "Rasimpaşa", "Sahrayıcedid", "Suadiye", "Zühtüpaşa"],
    "Beşiktaş": ["Abbasağa", "Arnavutköy", "Akatlar", "Bebek", "Cihannüma", "Dikilitaş", "Etiler", "Konaklar", "Kuruçeşme", "Levent", "Levazım", "Mecidiye", "Muradiye", "Nisbetiye", "Ortaköy", "Sinanpaşa", "Şenlikköy", "Ulus", "Vişnezade", "Yıldız"],
    "Çankaya": ["Aşağı Öveçler", "Bahçelievler", "Balgat", "Birlik", "Çayyolu", "Dikmen", "Emek", "Esat", "Gaziosmanpaşa", "Kavaklıdere", "Kızılay", "Maltepe", "Mustafa Kemal", "Oran", "Yamalıbahçe", "Ümit"],
    "Konak": ["Akdeniz", "Alsancak", "Bahribaba", "Basmane", "Çankaya", "Eşrefpaşa", "Gazi", "Güzelyalı", "Hatay", "İsmetpaşa", "Kahramanlar", "Kültür", "Mersinli", "Mithatpaşa", "Murat Reis", "Tuzcu", "Umurbey", "Yalı", "Yamanlar", "Zafer"]
}
