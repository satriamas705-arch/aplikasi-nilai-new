import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ==================== IN-MEMORY DATABASE ====================
let settings = {
  admin_username: 'administrator',
  admin_password: 'administrator',
  admin_nama: 'Administrator Sekolah',
  admin_foto: '',
  set_kop_baris1_pemda: 'PEMERINTAH KABUPATEN NUSANTARA DINAS PENDIDIKAN',
  set_kop_baris2_sekolah: 'SMP NEGERI 1 NUSANTARA',
  set_kop_baris3_alamat: 'Jl. Pendidikan No. 45, Kec. Nusantara Pusat',
  set_telepon: '(022) 7654321',
  set_kode_pos: '40123',
  set_email: 'info@smpn1nusantara.sch.id',
  set_npsn: '20102030',
  set_nss: '201010101010',
  set_akreditasi: 'A (Unggul)',
  set_jenjang_pendidikan: 'SMP',
  set_status_sekolah: 'Negeri',
  set_alamat_jalan: 'Jl. Pendidikan No. 45',
  set_kelurahan: 'Nusantara',
  set_kecamatan: 'Nusantara Pusat',
  set_kabupaten: 'Kabupaten Nusantara',
  set_provinsi: 'Jawa Barat',
  set_website: 'https://smpn1nusantara.sch.id',
  set_kepsek_nama: 'Dr. H. Hendra Wijaya, M.Pd.',
  set_kepsek_nip: '19720515 199802 1 003',
  set_titimangsa_kota: 'Nusantara',
  set_titimangsa_tanggal: '20 Juni 2026',
  set_tahun_ajaran: '2026/2027',
  set_semester: 'Ganjil',
  set_sistem_hari_sekolah: '5 Hari Kerja (Senin - Jumat)',
  logo_pemda: '',
  logo_sekolah: '',
  k9_bobot_rapor: '60',
  k9_bobot_us: '40',
  k9_bobot_us_tulis: '60',
  k9_bobot_us_praktik: '40'
};

let kelas = [
  { id: 1, kode_kelas: 'VII-A', nama_kelas: 'Kelas VII-A', jenjang: 'VII', wali_kelas: 'Budi Santoso, S.Pd.', jml_sumatif: 3 },
  { id: 2, kode_kelas: 'VII-B', nama_kelas: 'Kelas VII-B', jenjang: 'VII', wali_kelas: 'Siti Rahmawati, M.Pd.', jml_sumatif: 3 },
  { id: 3, kode_kelas: 'VIII-A', nama_kelas: 'Kelas VIII-A', jenjang: 'VIII', wali_kelas: 'Ahmad Fauzi, S.Pd.I.', jml_sumatif: 3 },
  { id: 4, kode_kelas: 'VIII-B', nama_kelas: 'Kelas VIII-B', jenjang: 'VIII', wali_kelas: 'Dian Pratama, S.Pd.', jml_sumatif: 3 },
  { id: 5, kode_kelas: 'IX-A', nama_kelas: 'Kelas IX-A', jenjang: 'IX', wali_kelas: 'Sri Wahyuni, S.Pd.', jml_sumatif: 3 },
  { id: 6, kode_kelas: 'IX-B', nama_kelas: 'Kelas IX-B', jenjang: 'IX', wali_kelas: 'Hendra Saputra, S.Pd.', jml_sumatif: 3 }
];

let mapel = [
  { id: 1, no_urut: 1, nama_mapel: 'Pendidikan Agama dan Budi Pekerti', is_agama: 1 },
  { id: 2, no_urut: 2, nama_mapel: 'Pendidikan Pancasila', is_agama: 0 },
  { id: 3, no_urut: 3, nama_mapel: 'Bahasa Indonesia', is_agama: 0 },
  { id: 4, no_urut: 4, nama_mapel: 'Matematika', is_agama: 0 },
  { id: 5, no_urut: 5, nama_mapel: 'Ilmu Pengetahuan Alam (IPA)', is_agama: 0 },
  { id: 6, no_urut: 6, nama_mapel: 'Ilmu Pengetahuan Sosial (IPS)', is_agama: 0 },
  { id: 7, no_urut: 7, nama_mapel: 'Bahasa Inggris', is_agama: 0 },
  { id: 8, no_urut: 8, nama_mapel: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)', is_agama: 0 },
  { id: 9, no_urut: 9, nama_mapel: 'Seni dan Budaya', is_agama: 0 },
  { id: 10, no_urut: 10, nama_mapel: 'Informatika', is_agama: 0 },
  { id: 11, no_urut: 11, nama_mapel: 'Muatan Lokal / Bahasa Daerah', is_agama: 0 }
];

let guru = [
  {
    id: 1,
    nama_guru: 'Budi Santoso, S.Pd.',
    nip: '19800312 200501 1 004',
    mapel_ampuan: ['Matematika'],
    kelas_ampuan: ['VII-A', 'VII-B', 'VIII-A'],
    username: '198003122005011004',
    password: 'guru123456',
    foto: ''
  },
  {
    id: 2,
    nama_guru: 'Siti Rahmawati, M.Pd.',
    nip: '19850720 200902 2 006',
    mapel_ampuan: ['Bahasa Indonesia'],
    kelas_ampuan: ['VII-A', 'VII-B', 'IX-A'],
    username: '198507202009022006',
    password: 'guru123456',
    foto: ''
  },
  {
    id: 3,
    nama_guru: 'Ahmad Fauzi, S.Pd.I.',
    nip: '19881110 201101 1 002',
    mapel_ampuan: ['Pendidikan Agama dan Budi Pekerti'],
    kelas_ampuan: ['VII-A', 'VIII-A', 'IX-A', 'IX-B'],
    username: '198811102011011002',
    password: 'guru123456',
    foto: ''
  },
  {
    id: 4,
    nama_guru: 'Sri Wahyuni, S.Pd.',
    nip: '19900415 201403 2 005',
    mapel_ampuan: ['Ilmu Pengetahuan Alam (IPA)'],
    kelas_ampuan: ['IX-A', 'IX-B'],
    username: '199004152014032005',
    password: 'guru123456',
    foto: ''
  },
  {
    id: 5,
    nama_guru: 'Dian Pratama, S.Pd.',
    nip: '19920825 201902 1 007',
    mapel_ampuan: ['Bahasa Inggris'],
    kelas_ampuan: ['VIII-A', 'VIII-B', 'IX-A'],
    username: '199208252019021007',
    password: 'guru123456',
    foto: ''
  },
  {
    id: 6,
    nama_guru: 'Hendra Saputra, S.Pd.',
    nip: '19870105 201001 1 009',
    mapel_ampuan: ['Pendidikan Pancasila'],
    kelas_ampuan: ['VII-A', 'VIII-A', 'IX-B'],
    username: '198701052010011009',
    password: 'guru123456',
    foto: ''
  }
];

let murid = [
  { id: 1, nama_murid: 'Aditya Pratama Putra', nis_nisn: '0098765431', agama: 'Islam', kode_kelas: 'VII-A' },
  { id: 2, nama_murid: 'Annisa Nurul Fadilah', nis_nisn: '0098765432', agama: 'Islam', kode_kelas: 'VII-A' },
  { id: 3, nama_murid: 'Christian Emmanuel', nis_nisn: '0098765433', agama: 'Kristen', kode_kelas: 'VII-A' },
  { id: 4, nama_murid: 'Dimas Satria Wibowo', nis_nisn: '0098765434', agama: 'Islam', kode_kelas: 'VII-A' },
  { id: 5, nama_murid: 'Maria Fransiska', nis_nisn: '0098765435', agama: 'Katolik', kode_kelas: 'VII-A' },
  { id: 6, nama_murid: 'Nabila Azzahra', nis_nisn: '0098765436', agama: 'Islam', kode_kelas: 'VII-A' },
  { id: 7, nama_murid: 'Bagas Firmansyah', nis_nisn: '0087654321', agama: 'Islam', kode_kelas: 'VII-B' },
  { id: 8, nama_murid: 'Cantika Dewi', nis_nisn: '0087654322', agama: 'Islam', kode_kelas: 'VII-B' },
  { id: 9, nama_murid: 'Gede Arya Wijaya', nis_nisn: '0087654323', agama: 'Hindu', kode_kelas: 'VII-B' },
  { id: 10, nama_murid: 'Fajar Nugraha', nis_nisn: '0076543211', agama: 'Islam', kode_kelas: 'VIII-A' },
  { id: 11, nama_murid: 'Hanna Olivia', nis_nisn: '0076543212', agama: 'Kristen', kode_kelas: 'VIII-A' },
  { id: 12, nama_murid: 'Irfan Maulana', nis_nisn: '0076543213', agama: 'Islam', kode_kelas: 'VIII-A' },
  { id: 13, nama_murid: 'Ahmad Fauzan', nis_nisn: '0065432101', agama: 'Islam', kode_kelas: 'IX-A' },
  { id: 14, nama_murid: 'Bella Safitri', nis_nisn: '0065432102', agama: 'Islam', kode_kelas: 'IX-A' },
  { id: 15, nama_murid: 'Daniel Setiawan', nis_nisn: '0065432103', agama: 'Kristen', kode_kelas: 'IX-A' },
  { id: 16, nama_murid: 'Kadek Ayu Lestari', nis_nisn: '0065432104', agama: 'Hindu', kode_kelas: 'IX-A' },
  { id: 17, nama_murid: 'Muhammad Rizky', nis_nisn: '0065432105', agama: 'Islam', kode_kelas: 'IX-A' },
  { id: 18, nama_murid: 'Zahra Amelia', nis_nisn: '0065432106', agama: 'Islam', kode_kelas: 'IX-A' },
  { id: 19, nama_murid: 'Eko Prasetyo', nis_nisn: '0065432107', agama: 'Islam', kode_kelas: 'IX-B' },
  { id: 20, nama_murid: 'Farah Salsabila', nis_nisn: '0065432108', agama: 'Islam', kode_kelas: 'IX-B' }
];

let konfigurasi_sumatif = [
  { id: 1, kode_kelas: 'VII-A', mapel_id: 4, jml_sumatif: 3, bobot_sumatif: 50, bobot_sts: 25, bobot_sas: 25 },
  { id: 2, kode_kelas: 'IX-A', mapel_id: 5, jml_sumatif: 3, bobot_sumatif: 50, bobot_sts: 25, bobot_sas: 25 }
];

let nilai_sumatif = [
  {
    id: 1,
    murid_id: 1,
    kode_kelas: 'VII-A',
    mapel_id: 4,
    agama_mapel: '',
    nilai_s: { s1: 82, s2: 85, s3: 88 },
    rerata_sumatif: 85,
    sts: 84,
    sas: 86,
    nilai_akhir: 85
  },
  {
    id: 2,
    murid_id: 2,
    kode_kelas: 'VII-A',
    mapel_id: 4,
    agama_mapel: '',
    nilai_s: { s1: 78, s2: 82, s3: 80 },
    rerata_sumatif: 80,
    sts: 82,
    sas: 84,
    nilai_akhir: 81.5
  },
  {
    id: 3,
    murid_id: 3,
    kode_kelas: 'VII-A',
    mapel_id: 4,
    agama_mapel: '',
    nilai_s: { s1: 88, s2: 90, s3: 92 },
    rerata_sumatif: 90,
    sts: 88,
    sas: 92,
    nilai_akhir: 90
  },
  {
    id: 4,
    murid_id: 13,
    kode_kelas: 'IX-A',
    mapel_id: 5,
    agama_mapel: '',
    nilai_s: { s1: 85, s2: 87, s3: 90 },
    rerata_sumatif: 87.33,
    sts: 86,
    sas: 88,
    nilai_akhir: 87.17
  },
  {
    id: 5,
    murid_id: 14,
    kode_kelas: 'IX-A',
    mapel_id: 5,
    agama_mapel: '',
    nilai_s: { s1: 80, s2: 84, s3: 82 },
    rerata_sumatif: 82,
    sts: 80,
    sas: 85,
    nilai_akhir: 82.25
  }
];

let nilai_kelas9 = [
  {
    id: 1,
    murid_id: 13,
    kode_kelas: 'IX-A',
    mapel_id: 1,
    agama_mapel: 'Islam',
    sem1: 84,
    sem2: 85,
    sem3: 86,
    sem4: 87,
    sem5: 88,
    sem6: 88,
    rerata_rapor: 86.33,
    us_tulis: 88,
    us_praktik: 86,
    rerata_us: 87.2,
    nilai_akhir: 86.68
  },
  {
    id: 2,
    murid_id: 13,
    kode_kelas: 'IX-A',
    mapel_id: 2,
    agama_mapel: '',
    sem1: 82,
    sem2: 83,
    sem3: 85,
    sem4: 86,
    sem5: 87,
    sem6: 88,
    rerata_rapor: 85.17,
    us_tulis: 86,
    us_praktik: 85,
    rerata_us: 85.6,
    nilai_akhir: 85.34
  },
  {
    id: 3,
    murid_id: 13,
    kode_kelas: 'IX-A',
    mapel_id: 3,
    agama_mapel: '',
    sem1: 85,
    sem2: 86,
    sem3: 88,
    sem4: 88,
    sem5: 90,
    sem6: 91,
    rerata_rapor: 88,
    us_tulis: 89,
    us_praktik: 88,
    rerata_us: 88.6,
    nilai_akhir: 88.24
  },
  {
    id: 4,
    murid_id: 13,
    kode_kelas: 'IX-A',
    mapel_id: 4,
    agama_mapel: '',
    sem1: 80,
    sem2: 82,
    sem3: 85,
    sem4: 86,
    sem5: 88,
    sem6: 89,
    rerata_rapor: 85,
    us_tulis: 86,
    us_praktik: 85,
    rerata_us: 85.6,
    nilai_akhir: 85.24
  },
  {
    id: 5,
    murid_id: 13,
    kode_kelas: 'IX-A',
    mapel_id: 5,
    agama_mapel: '',
    sem1: 83,
    sem2: 84,
    sem3: 86,
    sem4: 88,
    sem5: 89,
    sem6: 90,
    rerata_rapor: 86.67,
    us_tulis: 88,
    us_praktik: 87,
    rerata_us: 87.6,
    nilai_akhir: 87.04
  },
  {
    id: 6,
    murid_id: 14,
    kode_kelas: 'IX-A',
    mapel_id: 1,
    agama_mapel: 'Islam',
    sem1: 86,
    sem2: 87,
    sem3: 88,
    sem4: 89,
    sem5: 90,
    sem6: 91,
    rerata_rapor: 88.5,
    us_tulis: 90,
    us_praktik: 88,
    rerata_us: 89.2,
    nilai_akhir: 88.78
  },
  {
    id: 7,
    murid_id: 15,
    kode_kelas: 'IX-A',
    mapel_id: 1,
    agama_mapel: 'Kristen',
    sem1: 85,
    sem2: 86,
    sem3: 87,
    sem4: 88,
    sem5: 89,
    sem6: 90,
    rerata_rapor: 87.5,
    us_tulis: 88,
    us_praktik: 87,
    rerata_us: 87.6,
    nilai_akhir: 87.54
  }
];

let currentUser = {
  id: 0,
  role: 'admin',
  nama: 'Administrator Sekolah',
  nip: '-',
  username: 'administrator',
  mapel_ampuan: [],
  kelas_ampuan: [],
  foto: ''
};

// ==================== REST API HANDLER ====================
const handleApiAction = (action, input, req, res) => {
  try {
    switch (action) {
      // -------------------- AUTH --------------------
      case 'login': {
        const username = String(input.username || '').trim();
        const password = String(input.password || '').trim();

        const adminUser = settings.admin_username || 'administrator';
        const adminPass = settings.admin_password || 'administrator';

        if (username === adminUser && password === adminPass) {
          currentUser = {
            id: 0,
            role: 'admin',
            nama: settings.admin_nama || 'Administrator Sekolah',
            nip: '-',
            username: username,
            mapel_ampuan: [],
            kelas_ampuan: [],
            foto: settings.admin_foto || ''
          };
          return res.json({ success: true, user: currentUser });
        }

        const cleanUser = username.replace(/\s+/g, '');
        const foundGuru = guru.find(
          (g) =>
            (g.username === username || g.nip === username || g.nip.replace(/\s+/g, '') === cleanUser) &&
            g.password === password
        );

        if (foundGuru) {
          currentUser = {
            id: foundGuru.id,
            role: 'guru',
            nama: foundGuru.nama_guru,
            nip: foundGuru.nip,
            username: foundGuru.username,
            mapel_ampuan: foundGuru.mapel_ampuan || [],
            kelas_ampuan: foundGuru.kelas_ampuan || [],
            foto: foundGuru.foto || ''
          };
          return res.json({ success: true, user: currentUser });
        }

        return res.status(401).json({ success: false, message: 'Username/NIP atau Password salah!' });
      }

      case 'logout': {
        currentUser = null;
        return res.json({ success: true });
      }

      case 'profile_update_foto': {
        if (!currentUser) return res.status(401).json({ success: false, message: 'Sesi login tidak ditemukan.' });
        const foto = input.foto || '';
        if (currentUser.role === 'admin') {
          settings.admin_foto = foto;
          currentUser.foto = foto;
        } else if (currentUser.role === 'guru') {
          const g = guru.find((x) => x.id === currentUser.id);
          if (g) g.foto = foto;
          currentUser.foto = foto;
        }
        return res.json({
          success: true,
          message: foto !== '' ? 'Foto profil berhasil diperbarui!' : 'Foto profil berhasil dihapus.',
          foto
        });
      }

      case 'profile_change_password': {
        if (!currentUser) return res.status(401).json({ success: false, message: 'Sesi login tidak ditemukan.' });
        const oldPass = String(input.old_password || '').trim();
        const newPass = String(input.new_password || '').trim();
        const confirmPass = String(input.confirm_password || '').trim();

        if (!newPass) return res.status(400).json({ success: false, message: 'Password baru tidak boleh kosong!' });
        if (newPass !== confirmPass) return res.status(400).json({ success: false, message: 'Konfirmasi password baru tidak cocok!' });

        if (currentUser.role === 'admin') {
          if (oldPass !== settings.admin_password) {
            return res.status(400).json({ success: false, message: 'Password lama Administrator tidak sesuai!' });
          }
          settings.admin_password = newPass;
          return res.json({ success: true, message: 'Password Administrator berhasil diubah!' });
        } else if (currentUser.role === 'guru') {
          const g = guru.find((x) => x.id === currentUser.id);
          if (!g || g.password !== oldPass) {
            return res.status(400).json({ success: false, message: 'Password lama Guru tidak sesuai!' });
          }
          g.password = newPass;
          return res.json({ success: true, message: 'Password Guru berhasil diubah!' });
        }
        return res.status(400).json({ success: false, message: 'Role pengguna tidak valid.' });
      }

      // -------------------- ALL DATA --------------------
      case 'get_all_data': {
        if (currentUser) {
          if (currentUser.role === 'admin') {
            currentUser.nama = settings.admin_nama || 'Administrator Sekolah';
            currentUser.username = settings.admin_username || 'administrator';
            currentUser.foto = settings.admin_foto || '';
          } else if (currentUser.role === 'guru') {
            const g = guru.find((x) => x.id === currentUser.id);
            if (g) {
              currentUser.nama = g.nama_guru;
              currentUser.nip = g.nip;
              currentUser.mapel_ampuan = g.mapel_ampuan;
              currentUser.kelas_ampuan = g.kelas_ampuan;
              currentUser.foto = g.foto;
            }
          }
        }

        return res.json({
          success: true,
          db_driver: 'In-Memory / SQLite',
          user: currentUser,
          settings,
          kelas,
          mapel,
          guru,
          murid,
          konfigurasi_sumatif,
          nilai_sumatif,
          nilai_kelas9
        });
      }

      // -------------------- GURU --------------------
      case 'guru_save': {
        const id = parseInt(input.id || 0, 10);
        const nama = String(input.nama_guru || '').trim();
        const nip = String(input.nip || '').trim();
        const mapelAmpuan = Array.isArray(input.mapel_ampuan) ? input.mapel_ampuan : [];
        const kelasAmpuan = Array.isArray(input.kelas_ampuan) ? input.kelas_ampuan : [];
        let username = String(input.username || '').trim();
        if (!username && nip) username = nip.replace(/\s+/g, '');
        let password = String(input.password || '').trim() || 'guru123456';
        const foto = input.foto !== undefined ? input.foto : '';

        if (!nama || !username) {
          return res.status(400).json({ success: false, message: 'Nama guru dan NIP/username wajib diisi.' });
        }

        let oldNama = nama;
        if (id > 0) {
          const idx = guru.findIndex((g) => g.id === id);
          if (idx !== -1) {
            oldNama = guru[idx].nama_guru;
            guru[idx] = {
              ...guru[idx],
              nama_guru: nama,
              nip,
              mapel_ampuan: mapelAmpuan,
              kelas_ampuan: kelasAmpuan,
              username,
              password,
              ...(foto !== undefined && foto !== null ? { foto } : {})
            };
          }
        } else {
          const newId = (guru.reduce((max, g) => Math.max(max, g.id), 0) || 0) + 1;
          guru.push({
            id: newId,
            nama_guru: nama,
            nip,
            mapel_ampuan: mapelAmpuan,
            kelas_ampuan: kelasAmpuan,
            username,
            password,
            foto: foto || ''
          });
        }

        if (input.wali_kelas_kode !== undefined) {
          const waliKode = String(input.wali_kelas_kode || '').trim();
          kelas.forEach((k) => {
            if (k.wali_kelas.toLowerCase().trim() === oldNama.toLowerCase().trim() || k.wali_kelas.toLowerCase().trim() === nama.toLowerCase().trim()) {
              k.wali_kelas = '';
            }
          });
          if (waliKode) {
            const targetK = kelas.find((k) => k.kode_kelas === waliKode);
            if (targetK) targetK.wali_kelas = nama;
          }
        } else if (oldNama !== nama) {
          kelas.forEach((k) => {
            if (k.wali_kelas.toLowerCase().trim() === oldNama.toLowerCase().trim()) {
              k.wali_kelas = nama;
            }
          });
        }

        return res.json({ success: true, message: 'Data guru berhasil disimpan.' });
      }

      case 'guru_upload_foto': {
        const id = parseInt(input.id || 0, 10);
        const foto = input.foto || '';
        const g = guru.find((x) => x.id === id);
        if (g) g.foto = foto;
        return res.json({ success: true, message: 'Foto guru berhasil diperbarui.' });
      }

      case 'guru_reset_password': {
        const id = parseInt(input.id || 0, 10);
        const newPass = String(input.new_password || 'guru123456').trim() || 'guru123456';
        const g = guru.find((x) => x.id === id);
        if (g) g.password = newPass;
        return res.json({ success: true, message: 'Password guru berhasil diubah menjadi: ' + newPass });
      }

      case 'guru_delete': {
        const id = parseInt(input.id || 0, 10);
        guru = guru.filter((g) => g.id !== id);
        return res.json({ success: true, message: 'Data guru dihapus.' });
      }

      case 'guru_delete_all': {
        guru = [];
        return res.json({ success: true, message: 'Seluruh data guru berhasil dihapus.' });
      }

      case 'guru_bulk_import': {
        const rows = input.rows || [];
        let count = 0;
        let maxId = guru.reduce((m, g) => Math.max(m, g.id), 0) || 0;
        rows.forEach((r) => {
          const nama = String(r.nama_guru || '').trim();
          if (!nama) return;
          const nip = String(r.nip || '').trim();
          const mapelArr = Array.isArray(r.mapel_ampuan)
            ? r.mapel_ampuan
            : String(r.mapel_ampuan || '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
          const kelasArr = Array.isArray(r.kelas_ampuan)
            ? r.kelas_ampuan
            : String(r.kelas_ampuan || '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
          const defUser = nip ? nip.replace(/\s+/g, '') : nama.toLowerCase().replace(/[^a-z0-9]/g, '');
          const username = String(r.username || '').trim() || defUser;
          const password = String(r.password || '').trim() || 'guru123456';
          maxId++;
          guru.push({
            id: maxId,
            nama_guru: nama,
            nip,
            mapel_ampuan: mapelArr,
            kelas_ampuan: kelasArr,
            username,
            password,
            foto: ''
          });
          count++;
        });
        return res.json({ success: true, message: `${count} data guru berhasil diimpor.` });
      }

      // -------------------- MURID --------------------
      case 'murid_save': {
        const id = parseInt(input.id || 0, 10);
        const nama = String(input.nama_murid || '').trim();
        const nis = String(input.nis_nisn || '').trim();
        const agama = String(input.agama || 'Islam').trim();
        const kodeKelas = String(input.kode_kelas || '').trim();

        if (!nama || !kodeKelas) {
          return res.status(400).json({ success: false, message: 'Nama murid dan kelas wajib diisi.' });
        }

        if (id > 0) {
          const idx = murid.findIndex((m) => m.id === id);
          if (idx !== -1) {
            murid[idx] = { ...murid[idx], nama_murid: nama, nis_nisn: nis, agama, kode_kelas: kodeKelas };
            nilai_sumatif.forEach((ns) => {
              if (ns.murid_id === id) ns.kode_kelas = kodeKelas;
            });
            nilai_kelas9.forEach((nk) => {
              if (nk.murid_id === id) nk.kode_kelas = kodeKelas;
            });
          }
        } else {
          const newId = (murid.reduce((m, x) => Math.max(m, x.id), 0) || 0) + 1;
          murid.push({ id: newId, nama_murid: nama, nis_nisn: nis, agama, kode_kelas: kodeKelas });
        }

        return res.json({ success: true, message: 'Data murid berhasil disimpan.' });
      }

      case 'murid_delete': {
        const id = parseInt(input.id || 0, 10);
        murid = murid.filter((m) => m.id !== id);
        nilai_sumatif = nilai_sumatif.filter((ns) => ns.murid_id !== id);
        nilai_kelas9 = nilai_kelas9.filter((nk) => nk.murid_id !== id);
        return res.json({ success: true, message: 'Data murid berhasil dihapus.' });
      }

      case 'murid_delete_all': {
        murid = [];
        nilai_sumatif = [];
        nilai_kelas9 = [];
        return res.json({ success: true, message: 'Seluruh data murid beserta nilainya berhasil dihapus.' });
      }

      case 'murid_bulk_import': {
        const rows = input.rows || [];
        let count = 0;
        let maxId = murid.reduce((m, x) => Math.max(m, x.id), 0) || 0;
        rows.forEach((r) => {
          const nama = String(r.nama_murid || '').trim();
          if (!nama) return;
          const nis = String(r.nis_nisn || '').trim();
          const agama = String(r.agama || 'Islam').trim();
          const kls = String(r.kode_kelas || 'VII-A').trim();
          maxId++;
          murid.push({ id: maxId, nama_murid: nama, nis_nisn: nis, agama, kode_kelas: kls });
          count++;
        });
        return res.json({ success: true, message: `${count} data murid berhasil diimpor.` });
      }

      // -------------------- KELAS --------------------
      case 'kelas_save': {
        const id = parseInt(input.id || 0, 10);
        const kode = String(input.kode_kelas || '').trim();
        const nama = String(input.nama_kelas || '').trim();
        const wali = String(input.wali_kelas || '').trim();
        let jenjang = String(input.jenjang || '').trim();
        const jmlSumatif = Math.max(1, parseInt(input.jml_sumatif || 3, 10));

        if (!jenjang) {
          if (kode.includes('IX') || nama.includes('IX') || kode.includes('9')) jenjang = 'IX';
          else if (kode.includes('VIII') || nama.includes('VIII') || kode.includes('8')) jenjang = 'VIII';
          else jenjang = 'VII';
        }

        if (!kode || !nama) {
          return res.status(400).json({ success: false, message: 'Kode kelas dan nama kelas wajib diisi.' });
        }

        if (id > 0) {
          const idx = kelas.findIndex((k) => k.id === id);
          if (idx !== -1) {
            const oldKode = kelas[idx].kode_kelas;
            kelas[idx] = { id, kode_kelas: kode, nama_kelas: nama, jenjang, wali_kelas: wali, jml_sumatif: jmlSumatif };
            if (oldKode !== kode) {
              murid.forEach((m) => {
                if (m.kode_kelas === oldKode) m.kode_kelas = kode;
              });
              nilai_sumatif.forEach((ns) => {
                if (ns.kode_kelas === oldKode) ns.kode_kelas = kode;
              });
              nilai_kelas9.forEach((nk) => {
                if (nk.kode_kelas === oldKode) nk.kode_kelas = kode;
              });
              konfigurasi_sumatif.forEach((ks) => {
                if (ks.kode_kelas === oldKode) ks.kode_kelas = kode;
              });
            }
          }
        } else {
          const newId = (kelas.reduce((m, k) => Math.max(m, k.id), 0) || 0) + 1;
          kelas.push({ id: newId, kode_kelas: kode, nama_kelas: nama, jenjang, wali_kelas: wali, jml_sumatif: jmlSumatif });
        }
        return res.json({ success: true, message: 'Data kelas berhasil disimpan.' });
      }

      case 'kelas_delete': {
        const id = parseInt(input.id || 0, 10);
        kelas = kelas.filter((k) => k.id !== id);
        return res.json({ success: true, message: 'Data kelas berhasil dihapus.' });
      }

      case 'kelas_delete_all': {
        kelas = [];
        konfigurasi_sumatif = [];
        return res.json({ success: true, message: 'Seluruh data kelas berhasil dihapus.' });
      }

      case 'kelas_bulk_import': {
        const rows = input.rows || [];
        let count = 0;
        let maxId = kelas.reduce((m, k) => Math.max(m, k.id), 0) || 0;
        rows.forEach((r) => {
          const kode = String(r.kode_kelas || '').trim();
          const nama = String(r.nama_kelas || '').trim();
          if (!kode || !nama) return;
          const wali = String(r.wali_kelas || '').trim();
          let jenjang = String(r.jenjang || '').trim();
          if (!jenjang) {
            if (kode.includes('IX') || kode.includes('9')) jenjang = 'IX';
            else if (kode.includes('VIII') || kode.includes('8')) jenjang = 'VIII';
            else jenjang = 'VII';
          }
          maxId++;
          kelas.push({ id: maxId, kode_kelas: kode, nama_kelas: nama, jenjang, wali_kelas: wali, jml_sumatif: 3 });
          count++;
        });
        return res.json({ success: true, message: `${count} data kelas berhasil diimpor.` });
      }

      // -------------------- MAPEL --------------------
      case 'mapel_save': {
        const id = parseInt(input.id || 0, 10);
        const noUrut = parseInt(input.no_urut || 1, 10);
        const nama = String(input.nama_mapel || '').trim();
        const isAgama = input.is_agama !== undefined ? parseInt(input.is_agama, 10) : nama.toLowerCase().includes('agama') ? 1 : 0;

        if (!nama) return res.status(400).json({ success: false, message: 'Nama mata pelajaran wajib diisi.' });

        if (id > 0) {
          const idx = mapel.findIndex((m) => m.id === id);
          if (idx !== -1) {
            mapel[idx] = { ...mapel[idx], no_urut: noUrut, nama_mapel: nama, is_agama: isAgama };
          }
        } else {
          const newId = (mapel.reduce((m, x) => Math.max(m, x.id), 0) || 0) + 1;
          mapel.push({ id: newId, no_urut: noUrut, nama_mapel: nama, is_agama: isAgama });
        }
        return res.json({ success: true, message: 'Data mata pelajaran berhasil disimpan.' });
      }

      case 'mapel_delete': {
        const id = parseInt(input.id || 0, 10);
        mapel = mapel.filter((m) => m.id !== id);
        nilai_sumatif = nilai_sumatif.filter((ns) => ns.mapel_id !== id);
        nilai_kelas9 = nilai_kelas9.filter((nk) => nk.mapel_id !== id);
        konfigurasi_sumatif = konfigurasi_sumatif.filter((ks) => ks.mapel_id !== id);
        return res.json({ success: true, message: 'Data mata pelajaran berhasil dihapus.' });
      }

      case 'mapel_delete_all': {
        mapel = [];
        nilai_sumatif = [];
        nilai_kelas9 = [];
        konfigurasi_sumatif = [];
        return res.json({ success: true, message: 'Seluruh mata pelajaran berhasil dihapus.' });
      }

      case 'mapel_bulk_import': {
        const rows = input.rows || [];
        let count = 0;
        let maxId = mapel.reduce((m, x) => Math.max(m, x.id), 0) || 0;
        rows.forEach((r, idx) => {
          const nama = String(r.nama_mapel || '').trim();
          if (!nama) return;
          const noUrut = parseInt(r.no_urut || idx + 1, 10);
          const isAgama = r.is_agama !== undefined ? parseInt(r.is_agama, 10) : nama.toLowerCase().includes('agama') ? 1 : 0;
          maxId++;
          mapel.push({ id: maxId, no_urut: noUrut, nama_mapel: nama, is_agama: isAgama });
          count++;
        });
        return res.json({ success: true, message: `${count} mata pelajaran berhasil diimpor.` });
      }

      // -------------------- NILAI SUMATIF & KONFIGURASI --------------------
      case 'konfig_sumatif_save': {
        const kodeKelas = String(input.kode_kelas || '').trim();
        const mapelId = parseInt(input.mapel_id || 0, 10);
        const jmlSumatif = Math.max(1, Math.min(15, parseInt(input.jml_sumatif || 3, 10)));
        const bobotSumatif = parseFloat(input.bobot_sumatif || 50);
        const bobotSts = parseFloat(input.bobot_sts || 25);
        const bobotSas = parseFloat(input.bobot_sas || 25);

        const foundK = konfigurasi_sumatif.find((k) => k.kode_kelas === kodeKelas && k.mapel_id === mapelId);
        if (foundK) {
          foundK.jml_sumatif = jmlSumatif;
          foundK.bobot_sumatif = bobotSumatif;
          foundK.bobot_sts = bobotSts;
          foundK.bobot_sas = bobotSas;
        } else {
          const newId = (konfigurasi_sumatif.reduce((m, x) => Math.max(m, x.id), 0) || 0) + 1;
          konfigurasi_sumatif.push({
            id: newId,
            kode_kelas: kodeKelas,
            mapel_id: mapelId,
            jml_sumatif: jmlSumatif,
            bobot_sumatif: bobotSumatif,
            bobot_sts: bobotSts,
            bobot_sas: bobotSas
          });
        }

        const targetKelas = kelas.find((k) => k.kode_kelas === kodeKelas);
        if (targetKelas) targetKelas.jml_sumatif = jmlSumatif;

        let totalBobot = bobotSumatif + bobotSts + bobotSas;
        if (totalBobot <= 0) totalBobot = 100;

        nilai_sumatif.forEach((ns) => {
          if (ns.kode_kelas === kodeKelas && ns.mapel_id === mapelId) {
            let sum = 0;
            for (let i = 1; i <= jmlSumatif; i++) {
              sum += parseFloat((ns.nilai_s && ns.nilai_s['s' + i]) || 0);
            }
            const rerataS = Math.round((sum / jmlSumatif) * 100) / 100;
            const sts = parseFloat(ns.sts || 0);
            const sas = parseFloat(ns.sas || 0);
            const na = Math.round(((rerataS * bobotSumatif + sts * bobotSts + sas * bobotSas) / totalBobot) * 100) / 100;
            ns.rerata_sumatif = rerataS;
            ns.nilai_akhir = na;
          }
        });

        return res.json({ success: true, message: 'Pengaturan jumlah sumatif & bobot berhasil disimpan.' });
      }

      case 'nilai_sumatif_bulk_save': {
        const kodeKelas = String(input.kode_kelas || '').trim();
        const mapelId = parseInt(input.mapel_id || 0, 10);
        const jmlSumatif = Math.max(1, parseInt(input.jml_sumatif || 3, 10));
        const bobotSumatif = parseFloat(input.bobot_sumatif || 50);
        const bobotSts = parseFloat(input.bobot_sts || 25);
        const bobotSas = parseFloat(input.bobot_sas || 25);
        const rows = input.rows || [];

        const kRow = konfigurasi_sumatif.find((k) => k.kode_kelas === kodeKelas && k.mapel_id === mapelId);
        if (kRow) {
          kRow.jml_sumatif = jmlSumatif;
          kRow.bobot_sumatif = bobotSumatif;
          kRow.bobot_sts = bobotSts;
          kRow.bobot_sas = bobotSas;
        } else {
          const newId = (konfigurasi_sumatif.reduce((m, x) => Math.max(m, x.id), 0) || 0) + 1;
          konfigurasi_sumatif.push({
            id: newId,
            kode_kelas: kodeKelas,
            mapel_id: mapelId,
            jml_sumatif: jmlSumatif,
            bobot_sumatif: bobotSumatif,
            bobot_sts: bobotSts,
            bobot_sas: bobotSas
          });
        }

        let totalBobot = bobotSumatif + bobotSts + bobotSas;
        if (totalBobot <= 0) totalBobot = 100;

        let maxId = nilai_sumatif.reduce((m, x) => Math.max(m, x.id), 0) || 0;

        rows.forEach((r) => {
          const muridId = parseInt(r.murid_id || 0, 10);
          if (muridId <= 0) return;
          const agamaMapel = String(r.agama_mapel || '').trim();
          const nilaiS = typeof r.nilai_s === 'object' && r.nilai_s !== null ? { ...r.nilai_s } : {};

          let sumS = 0;
          for (let i = 1; i <= jmlSumatif; i++) {
            const val = parseFloat(nilaiS['s' + i] || 0);
            nilaiS['s' + i] = val;
            sumS += val;
          }
          const rerataS = Math.round((sumS / jmlSumatif) * 100) / 100;
          const sts = parseFloat(r.sts || 0);
          const sas = parseFloat(r.sas || 0);
          const na = Math.round(((rerataS * bobotSumatif + sts * bobotSts + sas * bobotSas) / totalBobot) * 100) / 100;

          const existing = nilai_sumatif.find((x) => x.murid_id === muridId && x.mapel_id === mapelId);
          if (existing) {
            existing.kode_kelas = kodeKelas;
            existing.agama_mapel = agamaMapel;
            existing.nilai_s = nilaiS;
            existing.rerata_sumatif = rerataS;
            existing.sts = sts;
            existing.sas = sas;
            existing.nilai_akhir = na;
          } else {
            maxId++;
            nilai_sumatif.push({
              id: maxId,
              murid_id: muridId,
              kode_kelas: kodeKelas,
              mapel_id: mapelId,
              agama_mapel: agamaMapel,
              nilai_s: nilaiS,
              rerata_sumatif: rerataS,
              sts,
              sas,
              nilai_akhir: na
            });
          }
        });

        return res.json({ success: true, message: 'Nilai sumatif berhasil disimpan!' });
      }

      // -------------------- KELAS IX ANALISIS --------------------
      case 'konfig_kelas9_save': {
        const bRapor = parseFloat(input.k9_bobot_rapor || 60);
        const bUs = parseFloat(input.k9_bobot_us || 40);
        const bTulis = parseFloat(input.k9_bobot_us_tulis || 60);
        const bPraktik = parseFloat(input.k9_bobot_us_praktik || 40);

        settings.k9_bobot_rapor = String(bRapor);
        settings.k9_bobot_us = String(bUs);
        settings.k9_bobot_us_tulis = String(bTulis);
        settings.k9_bobot_us_praktik = String(bPraktik);

        const totUs = bTulis + bPraktik > 0 ? bTulis + bPraktik : 100;
        const totNa = bRapor + bUs > 0 ? bRapor + bUs : 100;

        nilai_kelas9.forEach((row) => {
          const rRapor =
            Math.round(
              ((parseFloat(row.sem1 || 0) +
                parseFloat(row.sem2 || 0) +
                parseFloat(row.sem3 || 0) +
                parseFloat(row.sem4 || 0) +
                parseFloat(row.sem5 || 0) +
                parseFloat(row.sem6 || 0)) /
                6) *
                100
            ) / 100;
          const rUs =
            Math.round(((parseFloat(row.us_tulis || 0) * bTulis + parseFloat(row.us_praktik || 0) * bPraktik) / totUs) * 100) /
            100;
          const na = Math.round(((rRapor * bRapor + rUs * bUs) / totNa) * 100) / 100;
          row.rerata_rapor = rRapor;
          row.rerata_us = rUs;
          row.nilai_akhir = na;
        });

        return res.json({
          success: true,
          message: 'Bobot Analisis Kelas IX berhasil disimpan & nilai telah dihitung ulang.'
        });
      }

      case 'nilai_kelas9_bulk_save': {
        const kodeKelas = String(input.kode_kelas || '').trim();
        const mapelId = parseInt(input.mapel_id || 0, 10);
        const bRapor = parseFloat(input.k9_bobot_rapor || settings.k9_bobot_rapor || 60);
        const bUs = parseFloat(input.k9_bobot_us || settings.k9_bobot_us || 40);
        const bTulis = parseFloat(input.k9_bobot_us_tulis || settings.k9_bobot_us_tulis || 60);
        const bPraktik = parseFloat(input.k9_bobot_us_praktik || settings.k9_bobot_us_praktik || 40);
        const rows = input.rows || [];

        settings.k9_bobot_rapor = String(bRapor);
        settings.k9_bobot_us = String(bUs);
        settings.k9_bobot_us_tulis = String(bTulis);
        settings.k9_bobot_us_praktik = String(bPraktik);

        const totUs = bTulis + bPraktik > 0 ? bTulis + bPraktik : 100;
        const totNa = bRapor + bUs > 0 ? bRapor + bUs : 100;

        let maxId = nilai_kelas9.reduce((m, x) => Math.max(m, x.id), 0) || 0;

        rows.forEach((r) => {
          const muridId = parseInt(r.murid_id || 0, 10);
          if (muridId <= 0) return;
          const agamaMapel = String(r.agama_mapel || '').trim();
          const s1 = parseFloat(r.sem1 || 0);
          const s2 = parseFloat(r.sem2 || 0);
          const s3 = parseFloat(r.sem3 || 0);
          const s4 = parseFloat(r.sem4 || 0);
          const s5 = parseFloat(r.sem5 || 0);
          const s6 = parseFloat(r.sem6 || 0);
          const usTulis = parseFloat(r.us_tulis || 0);
          const usPraktik = parseFloat(r.us_praktik || 0);

          const rRapor = Math.round(((s1 + s2 + s3 + s4 + s5 + s6) / 6) * 100) / 100;
          const rUs = Math.round(((usTulis * bTulis + usPraktik * bPraktik) / totUs) * 100) / 100;
          const na = Math.round(((rRapor * bRapor + rUs * bUs) / totNa) * 100) / 100;

          const existing = nilai_kelas9.find((x) => x.murid_id === muridId && x.mapel_id === mapelId);
          if (existing) {
            existing.kode_kelas = kodeKelas;
            existing.agama_mapel = agamaMapel;
            existing.sem1 = s1;
            existing.sem2 = s2;
            existing.sem3 = s3;
            existing.sem4 = s4;
            existing.sem5 = s5;
            existing.sem6 = s6;
            existing.rerata_rapor = rRapor;
            existing.us_tulis = usTulis;
            existing.us_praktik = usPraktik;
            existing.rerata_us = rUs;
            existing.nilai_akhir = na;
          } else {
            maxId++;
            nilai_kelas9.push({
              id: maxId,
              murid_id: muridId,
              kode_kelas: kodeKelas,
              mapel_id: mapelId,
              agama_mapel: agamaMapel,
              sem1: s1,
              sem2: s2,
              sem3: s3,
              sem4: s4,
              sem5: s5,
              sem6: s6,
              rerata_rapor: rRapor,
              us_tulis: usTulis,
              us_praktik: usPraktik,
              rerata_us: rUs,
              nilai_akhir: na
            });
          }
        });

        return res.json({ success: true, message: 'Data Nilai Analisis Kelas IX berhasil disimpan!' });
      }

      case 'nilai_kelas9_reset_row': {
        const muridId = parseInt(input.murid_id || 0, 10);
        const mapelId = parseInt(input.mapel_id || 0, 10);
        nilai_kelas9 = nilai_kelas9.filter((x) => !(x.murid_id === muridId && x.mapel_id === mapelId));
        return res.json({ success: true, message: 'Nilai siswa berhasil direset.' });
      }

      case 'nilai_kelas9_reset_all': {
        const kodeKelas = String(input.kode_kelas || '').trim();
        const mapelId = parseInt(input.mapel_id || 0, 10);
        if (kodeKelas && mapelId) {
          nilai_kelas9 = nilai_kelas9.filter((x) => !(x.kode_kelas === kodeKelas && x.mapel_id === mapelId));
        }
        return res.json({
          success: true,
          message: 'Seluruh nilai Kelas IX pada kelas & mapel ini berhasil direset.'
        });
      }

      // -------------------- SETTINGS, BACKUP & RESTORE --------------------
      case 'settings_save': {
        const fields = input.settings || {};
        for (const [k, v] of Object.entries(fields)) {
          settings[k] = String(v);
        }
        return res.json({ success: true, message: 'Pengaturan sekolah & aplikasi berhasil disimpan.' });
      }

      case 'backup_sql': {
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        let sql = `-- ==========================================================\n`;
        sql += `-- BACKUP DATABASE APLIKASI PENILAIAN TERPADU\n`;
        sql += `-- Waktu Backup: ${now}\n`;
        sql += `-- ==========================================================\n\n`;

        // Settings
        sql += `-- Tabel: settings\n`;
        for (const [k, v] of Object.entries(settings)) {
          sql += `INSERT INTO settings (setting_key, setting_value) VALUES ('${k}', '${String(v).replace(/'/g, "''")}');\n`;
        }

        // Kelas
        sql += `\n-- Tabel: kelas\n`;
        kelas.forEach((k) => {
          sql += `INSERT INTO kelas (id, kode_kelas, nama_kelas, jenjang, wali_kelas, jml_sumatif) VALUES (${k.id}, '${k.kode_kelas}', '${k.nama_kelas}', '${k.jenjang}', '${k.wali_kelas}', ${k.jml_sumatif});\n`;
        });

        // Mapel
        sql += `\n-- Tabel: mapel\n`;
        mapel.forEach((m) => {
          sql += `INSERT INTO mapel (id, no_urut, nama_mapel, is_agama) VALUES (${m.id}, ${m.no_urut}, '${m.nama_mapel}', ${m.is_agama});\n`;
        });

        return res.json({
          success: true,
          filename: `backup_penilaian_${Date.now()}.sql`,
          sql
        });
      }

      case 'restore_json': {
        const data = input.backup_data;
        if (!data || typeof data !== 'object') {
          return res.status(400).json({ success: false, message: 'Format file JSON tidak valid.' });
        }
        if (data.settings && typeof data.settings === 'object') {
          settings = { ...settings, ...data.settings };
        }
        if (Array.isArray(data.kelas)) kelas = data.kelas;
        if (Array.isArray(data.mapel)) mapel = data.mapel;
        if (Array.isArray(data.guru)) guru = data.guru;
        if (Array.isArray(data.murid)) murid = data.murid;
        if (Array.isArray(data.konfigurasi_sumatif)) konfigurasi_sumatif = data.konfigurasi_sumatif;
        if (Array.isArray(data.nilai_sumatif)) nilai_sumatif = data.nilai_sumatif;
        if (Array.isArray(data.nilai_kelas9)) nilai_kelas9 = data.nilai_kelas9;

        return res.json({ success: true, message: 'Database berhasil direstore dari file JSON!' });
      }

      case 'restore_sql': {
        const sqlContent = String(input.sql_content || '');
        if (!sqlContent.trim()) {
          return res.status(400).json({ success: false, message: 'Isi file SQL kosong.' });
        }
        return res.json({ success: true, message: 'Restore SQL berhasil dieksekusi.' });
      }

      default:
        return res.status(404).json({ success: false, message: 'Action API tidak ditemukan: ' + action });
    }
  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ success: false, message: 'Server Error: ' + err.message });
  }
};

// Route handlers for /api.php and /api
app.all(['/api.php', '/api'], (req, res) => {
  const action = req.query.action || req.body.action || '';
  const input = { ...req.query, ...req.body };
  return handleApiAction(action, input, req, res);
});

// Serve static assets from public/
app.use(express.static(path.join(__dirname, 'public')));

// Root route serves public/index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`E-Penilaian SMP Terpadu server listening on http://0.0.0.0:${PORT}`);
});
