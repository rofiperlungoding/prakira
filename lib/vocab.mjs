// Reviewed word lists for actions. An action written by the model may only use words from COMMON plus the
// STEP list of its own hazard, and must use at least one STEP word (lib/verify.mjs). So "stay near water"
// cannot be shown for polluted air, and neither can a wrong word such as "bayam" (spinach) for "bayangan".
// The lists were written by hand on 2026-10-08 from actions the model produced for the tuned places
// (eval/places.mjs), after reading each one. They are this project's own lists, not a standard.
// ponytail: a closed vocabulary limits what can be said; it cannot make a sentence wise. Reviewed words can
// still be combined into a poor action, so a person still has to read the advice.
const words = (s) => new Set(s.split(/\s+/).filter(Boolean));

export const COMMON = {
  en: words(`a an the and or to of in on at with for from when if as while your you their them it is are be this that these
    all every each often more less most some any not no do don t does can may should need try also then even only
    today tomorrow day days after next during before early late morning evening night time times hour hours few long short
    use wear put keep take stay go going get give make avoid limit plan check let help bring carry have leave stop start
    child children young baby kids older adult adults people family anyone everyone pregnant worker workers yourself
    home house work working task tasks job play playing trip trips outing outings outside outdoor outdoors inside indoors room rooms
    heavy hard light strong much well safe sure very too so up down off out away sit sitting possible`),
  id: words(`dan atau di ke dari yang untuk saat ketika jika bila dengan pada agar supaya karena juga lebih sering banyak setiap
    selalu semua hari ini itu besok lusa pagi siang sore malam kali jam sebelum sesudah setelah selama terutama sebaiknya
    jangan tidak bisa perlu harus anda kamu kita mereka anak kecil bayi lansia orang tua ibu hamil keluarga rumah luar dalam
    ruangan tempat kerja bekerja pekerja keluar pergi bermain main gunakan pakai memakai pakaikan berikan beri jaga menjaga
    hindari kurangi batasi bawa simpan cari tetap usahakan pastikan lakukan berat keras ringan kuat sekali sangat lama sebentar
    sakit merasa terasa tubuh badan aktivitas kegiatan beraktivitas melindungi terlindungi lindungi perlindungan`),
};

export const STEP = {
  en: {
    heat: words(`water drink drinks drinking cold cool cooler coolest cooling shade shady rest resting break breaks fan fans blowing
      curtain curtains blinds close closed sunny side sides wet cloth cloths neck face clothes clothing loose sit sitting hat
      heat hot hottest midday noon afternoon bath shower sun thirsty sip sips slow slowly`),
    rain: words(`umbrella raincoat coat boots drain drains gutter gutters clear clean flood flooding flooded water valuables
      documents papers floor lift raise high higher ground shelf shelves route routes travel drive driving road roads low
      sandbags phone phones charge charged power plugs unplug electric roof leak leaks river rivers bag emergency move dry
      rain slippery walk cross street streets car bike motorbike park parked ready pack torch flashlight items things important`),
    air: words(`mask masks window windows door doors shut close closed breathe breathing breath air clean cleaner dirty smoke smoky
      dust dusty purifier filter inhaler medicine run running exercise effort activity sport sports lungs cough coughing
      polluted pollution`),
    uv: words(`hat hats sunscreen sleeve sleeves shade sunglasses glasses umbrella skin sun cover covered exposed shield block
      protect wide brim brimmed face neck hands arms legs ears apply reapply clothes clothing midday noon rays`),
  },
  // In Indonesian "air" means water; the air hazard is "udara".
  id: {
    heat: words(`minum air dingin sejuk teduh berteduh istirahat beristirahat rehat kipas angin naungan bayangan bawah haus tirai
      gorden tutup basah kain leher pakaian baju tipis longgar topi panas terik matahari mandi tidur duduk`),
    rain: words(`payung jas hujan selokan saluran got bersihkan banjir air barang berharga dokumen penting lantai angkat naikkan
      tinggi rak rute perjalanan jalan berkendara kendaraan motor mobil listrik cabut colokan ponsel isi daya atap bocor
      sungai tas darurat siaga siapkan pindahkan kering licin genangan lewati parkir senter`),
    air: words(`masker jendela pintu tutup menutup udara bersih kotor berdebu debu asap napas nafas bernapas pernapasan olahraga
      berolahraga pembersih penyaring inhaler obat batuk paru polusi tercemar`),
    uv: words(`topi lebar baju pakaian lengan panjang kacamata hitam payung tabir surya krim krem pelindung kulit teduh berteduh
      naungan bayangan bawah matahari terik tutup tutupi wajah leher tangan oleskan ulangi warna gelap`),
  },
};
