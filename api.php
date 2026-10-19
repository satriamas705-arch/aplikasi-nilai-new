<?php
/**
 * Backend REST API Endpoint - Aplikasi Penilaian Terpadu
 */
require_once __DIR__ . '/config/database.php';

header('Content-Type: application/json; charset=utf-8');

$pdo = Database::getConnection();
$driver = Database::getDriver();

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Parse JSON body jika ada
$rawBody = file_get_contents('php://input');
$input = json_decode($rawBody, true);
if (!is_array($input)) {
    $input = $_POST;
}

function sendJson($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function getSettingsMap($pdo) {
    $rows = $pdo->query("SELECT setting_key, setting_value FROM settings")->fetchAll();
    $map = [];
    foreach ($rows as $r) {
        $map[$r['setting_key']] = $r['setting_value'];
    }
    return $map;
}

function upsertSetting($pdo, $key, $val) {
    $stmt = $pdo->prepare("SELECT COUNT(*) as c FROM settings WHERE setting_key = ?");
    $stmt->execute([$key]);
    $exists = (int)$stmt->fetch()['c'] > 0;
    if ($exists) {
        $u = $pdo->prepare("UPDATE settings SET setting_value = ? WHERE setting_key = ?");
        $u->execute([$val, $key]);
    } else {
        $i = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)");
        $i->execute([$key, $val]);
    }
}

try {
    switch ($action) {
        // ==================== AUTHENTICATION ====================
        case 'login':
            $username = trim($input['username'] ?? '');
            $password = trim($input['password'] ?? '');
            $settings = getSettingsMap($pdo);

            $adminUser = $settings['admin_username'] ?? 'administrator';
            $adminPass = $settings['admin_password'] ?? 'administrator';

            // Cek login Admin
            if ($username === $adminUser && $password === $adminPass) {
                $_SESSION['user'] = [
                    'id' => 0,
                    'role' => 'admin',
                    'nama' => $settings['admin_nama'] ?? 'Administrator Sekolah',
                    'nip' => '-',
                    'username' => $username,
                    'mapel_ampuan' => [],
                    'kelas_ampuan' => [],
                    'foto' => $settings['admin_foto'] ?? ''
                ];
                sendJson(['success' => true, 'user' => $_SESSION['user']]);
            }

            // Cek login Guru (bisa menggunakan NIP Guru maupun Username)
            $cleanUser = str_replace(' ', '', $username);
            $stmt = $pdo->prepare("SELECT * FROM guru WHERE (username = ? OR nip = ? OR REPLACE(nip, ' ', '') = ?) AND password = ? LIMIT 1");
            $stmt->execute([$username, $username, $cleanUser, $password]);
            $guru = $stmt->fetch();
            if ($guru) {
                $_SESSION['user'] = [
                    'id' => (int)$guru['id'],
                    'role' => 'guru',
                    'nama' => $guru['nama_guru'],
                    'nip' => $guru['nip'],
                    'username' => $guru['username'],
                    'mapel_ampuan' => json_decode($guru['mapel_ampuan'] ?: '[]', true),
                    'kelas_ampuan' => json_decode($guru['kelas_ampuan'] ?: '[]', true),
                    'foto' => $guru['foto']
                ];
                sendJson(['success' => true, 'user' => $_SESSION['user']]);
            }

            sendJson(['success' => false, 'message' => 'Username/NIP atau Password salah!'], 401);
            break;

        case 'logout':
            unset($_SESSION['user']);
            session_destroy();
            sendJson(['success' => true]);
            break;

        case 'profile_update_foto':
            if (!isset($_SESSION['user'])) {
                sendJson(['success' => false, 'message' => 'Sesi login tidak ditemukan.'], 401);
            }
            $foto = $input['foto'] ?? '';
            $role = $_SESSION['user']['role'] ?? '';
            if ($role === 'admin') {
                upsertSetting($pdo, 'admin_foto', $foto);
                $_SESSION['user']['foto'] = $foto;
            } elseif ($role === 'guru') {
                $uid = (int)($_SESSION['user']['id'] ?? 0);
                $stmt = $pdo->prepare("UPDATE guru SET foto = ? WHERE id = ?");
                $stmt->execute([$foto, $uid]);
                $_SESSION['user']['foto'] = $foto;
            }
            sendJson([
                'success' => true,
                'message' => $foto !== '' ? 'Foto profil berhasil diperbarui!' : 'Foto profil berhasil dihapus.',
                'foto' => $foto
            ]);
            break;

        case 'profile_change_password':
            if (!isset($_SESSION['user'])) {
                sendJson(['success' => false, 'message' => 'Sesi login tidak ditemukan.'], 401);
            }
            $oldPass = trim($input['old_password'] ?? '');
            $newPass = trim($input['new_password'] ?? '');
            $confirmPass = trim($input['confirm_password'] ?? '');

            if ($newPass === '') {
                sendJson(['success' => false, 'message' => 'Password baru tidak boleh kosong!'], 400);
            }
            if ($newPass !== $confirmPass) {
                sendJson(['success' => false, 'message' => 'Konfirmasi password baru tidak cocok!'], 400);
            }

            $role = $_SESSION['user']['role'] ?? '';
            if ($role === 'admin') {
                $settings = getSettingsMap($pdo);
                $currentAdminPass = $settings['admin_password'] ?? 'administrator';
                if ($oldPass !== $currentAdminPass) {
                    sendJson(['success' => false, 'message' => 'Password lama Administrator tidak sesuai!'], 400);
                }
                upsertSetting($pdo, 'admin_password', $newPass);
                sendJson(['success' => true, 'message' => 'Password Administrator berhasil diubah!']);
            } elseif ($role === 'guru') {
                $uid = (int)($_SESSION['user']['id'] ?? 0);
                $stmt = $pdo->prepare("SELECT password FROM guru WHERE id = ? LIMIT 1");
                $stmt->execute([$uid]);
                $gRow = $stmt->fetch();
                if (!$gRow || $gRow['password'] !== $oldPass) {
                    sendJson(['success' => false, 'message' => 'Password lama Guru tidak sesuai!'], 400);
                }
                $uStmt = $pdo->prepare("UPDATE guru SET password = ? WHERE id = ?");
                $uStmt->execute([$newPass, $uid]);
                sendJson(['success' => true, 'message' => 'Password Guru berhasil diubah!']);
            }
            sendJson(['success' => false, 'message' => 'Role pengguna tidak valid.'], 400);
            break;

        // ==================== INITIAL / ALL DATA ====================
        case 'get_all_data':
            $settings = getSettingsMap($pdo);
            $kelas = $pdo->query("SELECT * FROM kelas ORDER BY jenjang ASC, kode_kelas ASC")->fetchAll();
            $mapel = $pdo->query("SELECT * FROM mapel ORDER BY no_urut ASC, id ASC")->fetchAll();
            $guruRaw = $pdo->query("SELECT * FROM guru ORDER BY id ASC")->fetchAll();
            $guru = [];
            foreach ($guruRaw as $g) {
                $g['mapel_ampuan'] = json_decode($g['mapel_ampuan'] ?: '[]', true) ?: [];
                $g['kelas_ampuan'] = json_decode($g['kelas_ampuan'] ?: '[]', true) ?: [];
                $guru[] = $g;
            }
            $murid = $pdo->query("SELECT * FROM murid ORDER BY kode_kelas ASC, nama_murid ASC")->fetchAll();
            $konfigSumatif = $pdo->query("SELECT * FROM konfigurasi_sumatif")->fetchAll();
            $nilaiSumatifRaw = $pdo->query("SELECT * FROM nilai_sumatif")->fetchAll();
            $nilaiSumatif = [];
            foreach ($nilaiSumatifRaw as $ns) {
                $ns['nilai_s'] = json_decode($ns['nilai_s'] ?: '{}', true) ?: [];
                $nilaiSumatif[] = $ns;
            }
            $nilaiKelas9 = $pdo->query("SELECT * FROM nilai_kelas9")->fetchAll();

            // Sinkronkan kembali sesi user (Admin / Guru) dengan data terbaru
            if (isset($_SESSION['user'])) {
                if ($_SESSION['user']['role'] === 'admin') {
                    $_SESSION['user']['nama'] = $settings['admin_nama'] ?? 'Administrator Sekolah';
                    $_SESSION['user']['username'] = $settings['admin_username'] ?? 'administrator';
                    $_SESSION['user']['foto'] = $settings['admin_foto'] ?? '';
                } elseif ($_SESSION['user']['role'] === 'guru') {
                    foreach ($guru as $g) {
                        if ((int)$g['id'] === (int)$_SESSION['user']['id']) {
                            $_SESSION['user']['nama'] = $g['nama_guru'];
                            $_SESSION['user']['nip'] = $g['nip'];
                            $_SESSION['user']['mapel_ampuan'] = $g['mapel_ampuan'];
                            $_SESSION['user']['kelas_ampuan'] = $g['kelas_ampuan'];
                            $_SESSION['user']['foto'] = $g['foto'];
                            break;
                        }
                    }
                }
            }

            sendJson([
                'success' => true,
                'db_driver' => $driver,
                'user' => $_SESSION['user'] ?? null,
                'settings' => $settings,
                'kelas' => $kelas,
                'mapel' => $mapel,
                'guru' => $guru,
                'murid' => $murid,
                'konfigurasi_sumatif' => $konfigSumatif,
                'nilai_sumatif' => $nilaiSumatif,
                'nilai_kelas9' => $nilaiKelas9
            ]);
            break;

        // ==================== MANAJEMEN DATA GURU ====================
        case 'guru_save':
            $id = isset($input['id']) ? (int)$input['id'] : 0;
            $nama = trim($input['nama_guru'] ?? '');
            $nip = trim($input['nip'] ?? '');
            $mapelAmpuan = isset($input['mapel_ampuan']) && is_array($input['mapel_ampuan']) ? json_encode(array_values($input['mapel_ampuan'])) : '[]';
            $kelasAmpuan = isset($input['kelas_ampuan']) && is_array($input['kelas_ampuan']) ? json_encode(array_values($input['kelas_ampuan'])) : '[]';
            $username = trim($input['username'] ?? '');
            if ($username === '' && $nip !== '') {
                $username = str_replace(' ', '', $nip);
            }
            $password = trim($input['password'] ?? 'guru123456');
            if ($password === '') {
                $password = 'guru123456';
            }
            $foto = $input['foto'] ?? null;

            if ($nama === '' || $username === '') {
                sendJson(['success' => false, 'message' => 'Nama guru dan NIP/username wajib diisi.'], 400);
            }

            $oldNamaGuru = $nama;
            if ($id > 0) {
                $oldG = $pdo->prepare("SELECT nama_guru FROM guru WHERE id = ?");
                $oldG->execute([$id]);
                $oldGRow = $oldG->fetch();
                if ($oldGRow) $oldNamaGuru = $oldGRow['nama_guru'];

                if ($foto !== null) {
                    $stmt = $pdo->prepare("UPDATE guru SET nama_guru=?, nip=?, mapel_ampuan=?, kelas_ampuan=?, username=?, password=?, foto=? WHERE id=?");
                    $stmt->execute([$nama, $nip, $mapelAmpuan, $kelasAmpuan, $username, $password, $foto, $id]);
                } else {
                    $stmt = $pdo->prepare("UPDATE guru SET nama_guru=?, nip=?, mapel_ampuan=?, kelas_ampuan=?, username=?, password=? WHERE id=?");
                    $stmt->execute([$nama, $nip, $mapelAmpuan, $kelasAmpuan, $username, $password, $id]);
                }
            } else {
                $stmt = $pdo->prepare("INSERT INTO guru (nama_guru, nip, mapel_ampuan, kelas_ampuan, username, password, foto) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$nama, $nip, $mapelAmpuan, $kelasAmpuan, $username, $password, $foto ?: '']);
            }

            // Sinkronkan penugasan Wali Kelas jika dikirim dari form Guru
            if (array_key_exists('wali_kelas_kode', $input)) {
                $waliKode = trim((string)$input['wali_kelas_kode']);
                $pdo->prepare("UPDATE kelas SET wali_kelas = '' WHERE LOWER(TRIM(wali_kelas)) IN (LOWER(?), LOWER(?))")
                    ->execute([$oldNamaGuru, $nama]);
                if ($waliKode !== '') {
                    $pdo->prepare("UPDATE kelas SET wali_kelas = ? WHERE kode_kelas = ?")
                        ->execute([$nama, $waliKode]);
                }
            } elseif ($oldNamaGuru !== $nama) {
                $pdo->prepare("UPDATE kelas SET wali_kelas = ? WHERE LOWER(TRIM(wali_kelas)) = LOWER(?)")
                    ->execute([$nama, $oldNamaGuru]);
            }

            sendJson(['success' => true, 'message' => 'Data guru berhasil disimpan.']);
            break;

        case 'guru_upload_foto':
            $id = (int)($input['id'] ?? 0);
            $foto = $input['foto'] ?? '';
            $stmt = $pdo->prepare("UPDATE guru SET foto = ? WHERE id = ?");
            $stmt->execute([$foto, $id]);
            sendJson(['success' => true, 'message' => 'Foto guru berhasil diperbarui.']);
            break;

        case 'guru_reset_password':
            $id = (int)($input['id'] ?? 0);
            $newPass = trim($input['new_password'] ?? 'guru123456');
            if ($newPass === '') $newPass = 'guru123456';
            $stmt = $pdo->prepare("UPDATE guru SET password = ? WHERE id = ?");
            $stmt->execute([$newPass, $id]);
            sendJson(['success' => true, 'message' => 'Password guru berhasil diubah menjadi: ' . $newPass]);
            break;

        case 'guru_delete':
            $id = (int)($input['id'] ?? 0);
            $stmt = $pdo->prepare("DELETE FROM guru WHERE id = ?");
            $stmt->execute([$id]);
            sendJson(['success' => true, 'message' => 'Data guru dihapus.']);
            break;

        case 'guru_delete_all':
            $pdo->exec("DELETE FROM guru");
            sendJson(['success' => true, 'message' => 'Seluruh data guru berhasil dihapus.']);
            break;

        case 'guru_bulk_import':
            $rows = $input['rows'] ?? [];
            $stmt = $pdo->prepare("INSERT INTO guru (nama_guru, nip, mapel_ampuan, kelas_ampuan, username, password) VALUES (?, ?, ?, ?, ?, ?)");
            $count = 0;
            foreach ($rows as $r) {
                $nama = trim($r['nama_guru'] ?? '');
                if ($nama === '') continue;
                $nip = trim($r['nip'] ?? '');
                $mapelArr = is_array($r['mapel_ampuan'] ?? null) ? $r['mapel_ampuan'] : array_values(array_filter(array_map('trim', explode(',', (string)($r['mapel_ampuan'] ?? '')))));
                $kelasArr = is_array($r['kelas_ampuan'] ?? null) ? $r['kelas_ampuan'] : array_values(array_map('trim', explode(',', (string)($r['kelas_ampuan'] ?? ''))));
                $defaultUser = $nip !== '' ? str_replace(' ', '', $nip) : strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $nama));
                $username = trim($r['username'] ?? '') ?: $defaultUser;
                $password = trim($r['password'] ?? '') ?: 'guru123456';
                $stmt->execute([$nama, $nip, json_encode($mapelArr), json_encode($kelasArr), $username, $password]);
                $count++;
            }
            sendJson(['success' => true, 'message' => "$count data guru berhasil diimpor."]);
            break;

        // ==================== MANAJEMEN DATA MURID ====================
        case 'murid_save':
            $id = (int)($input['id'] ?? 0);
            $nama = trim($input['nama_murid'] ?? '');
            $nis = trim($input['nis_nisn'] ?? '');
            $agama = trim($input['agama'] ?? 'Islam');
            $kodeKelas = trim($input['kode_kelas'] ?? '');

            if ($nama === '' || $kodeKelas === '') {
                sendJson(['success' => false, 'message' => 'Nama murid dan kelas wajib diisi.'], 400);
            }

            if ($id > 0) {
                $stmt = $pdo->prepare("UPDATE murid SET nama_murid=?, nis_nisn=?, agama=?, kode_kelas=? WHERE id=?");
                $stmt->execute([$nama, $nis, $agama, $kodeKelas, $id]);
                // Update kode_kelas di tabel nilai jika murid pindah kelas
                $pdo->prepare("UPDATE nilai_sumatif SET kode_kelas=? WHERE murid_id=?")->execute([$kodeKelas, $id]);
                $pdo->prepare("UPDATE nilai_kelas9 SET kode_kelas=? WHERE murid_id=?")->execute([$kodeKelas, $id]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO murid (nama_murid, nis_nisn, agama, kode_kelas) VALUES (?, ?, ?, ?)");
                $stmt->execute([$nama, $nis, $agama, $kodeKelas]);
            }
            sendJson(['success' => true, 'message' => 'Data murid berhasil disimpan.']);
            break;

        case 'murid_delete':
            $id = (int)($input['id'] ?? 0);
            $pdo->prepare("DELETE FROM murid WHERE id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM nilai_sumatif WHERE murid_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM nilai_kelas9 WHERE murid_id = ?")->execute([$id]);
            sendJson(['success' => true, 'message' => 'Data murid berhasil dihapus.']);
            break;

        case 'murid_delete_all':
            $pdo->exec("DELETE FROM murid");
            $pdo->exec("DELETE FROM nilai_sumatif");
            $pdo->exec("DELETE FROM nilai_kelas9");
            sendJson(['success' => true, 'message' => 'Seluruh data murid beserta nilainya berhasil dihapus.']);
            break;

        case 'murid_bulk_import':
            $rows = $input['rows'] ?? [];
            $stmt = $pdo->prepare("INSERT INTO murid (nama_murid, nis_nisn, agama, kode_kelas) VALUES (?, ?, ?, ?)");
            $count = 0;
            foreach ($rows as $r) {
                $nama = trim($r['nama_murid'] ?? '');
                if ($nama === '') continue;
                $nis = trim($r['nis_nisn'] ?? '');
                $agama = trim($r['agama'] ?? 'Islam');
                $kelas = trim($r['kode_kelas'] ?? 'VII-A');
                $stmt->execute([$nama, $nis, $agama, $kelas]);
                $count++;
            }
            sendJson(['success' => true, 'message' => "$count data murid berhasil diimpor."]);
            break;

        // ==================== MANAJEMEN DATA KELAS ====================
        case 'kelas_save':
            $id = (int)($input['id'] ?? 0);
            $kode = trim($input['kode_kelas'] ?? '');
            $nama = trim($input['nama_kelas'] ?? '');
            $wali = trim($input['wali_kelas'] ?? '');
            $jenjang = trim($input['jenjang'] ?? '');
            $jmlSumatif = (int)($input['jml_sumatif'] ?? 3);
            if ($jmlSumatif < 1) $jmlSumatif = 3;

            if ($jenjang === '') {
                if (stripos($kode, 'IX') !== false || stripos($nama, 'IX') !== false || stripos($kode, '9') !== false) $jenjang = 'IX';
                elseif (stripos($kode, 'VIII') !== false || stripos($nama, 'VIII') !== false || stripos($kode, '8') !== false) $jenjang = 'VIII';
                else $jenjang = 'VII';
            }

            if ($kode === '' || $nama === '') {
                sendJson(['success' => false, 'message' => 'Kode kelas dan nama kelas wajib diisi.'], 400);
            }

            if ($id > 0) {
                $old = $pdo->prepare("SELECT kode_kelas FROM kelas WHERE id = ?");
                $old->execute([$id]);
                $oldRow = $old->fetch();
                $oldKode = $oldRow ? $oldRow['kode_kelas'] : $kode;

                $stmt = $pdo->prepare("UPDATE kelas SET kode_kelas=?, nama_kelas=?, jenjang=?, wali_kelas=?, jml_sumatif=? WHERE id=?");
                $stmt->execute([$kode, $nama, $jenjang, $wali, $jmlSumatif, $id]);

                if ($oldKode !== $kode) {
                    $pdo->prepare("UPDATE murid SET kode_kelas=? WHERE kode_kelas=?")->execute([$kode, $oldKode]);
                    $pdo->prepare("UPDATE nilai_sumatif SET kode_kelas=? WHERE kode_kelas=?")->execute([$kode, $oldKode]);
                    $pdo->prepare("UPDATE nilai_kelas9 SET kode_kelas=? WHERE kode_kelas=?")->execute([$kode, $oldKode]);
                    $pdo->prepare("UPDATE konfigurasi_sumatif SET kode_kelas=? WHERE kode_kelas=?")->execute([$kode, $oldKode]);
                }
            } else {
                $stmt = $pdo->prepare("INSERT INTO kelas (kode_kelas, nama_kelas, jenjang, wali_kelas, jml_sumatif) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$kode, $nama, $jenjang, $wali, $jmlSumatif]);
            }
            sendJson(['success' => true, 'message' => 'Data kelas berhasil disimpan.']);
            break;

        case 'kelas_delete':
            $id = (int)($input['id'] ?? 0);
            $pdo->prepare("DELETE FROM kelas WHERE id = ?")->execute([$id]);
            sendJson(['success' => true, 'message' => 'Data kelas berhasil dihapus.']);
            break;

        case 'kelas_delete_all':
            $pdo->exec("DELETE FROM kelas");
            $pdo->exec("DELETE FROM konfigurasi_sumatif");
            sendJson(['success' => true, 'message' => 'Seluruh data kelas berhasil dihapus.']);
            break;

        case 'kelas_bulk_import':
            $rows = $input['rows'] ?? [];
            $stmt = $pdo->prepare("INSERT INTO kelas (kode_kelas, nama_kelas, jenjang, wali_kelas, jml_sumatif) VALUES (?, ?, ?, ?, ?)");
            $count = 0;
            foreach ($rows as $r) {
                $kode = trim($r['kode_kelas'] ?? '');
                $nama = trim($r['nama_kelas'] ?? '');
                if ($kode === '' || $nama === '') continue;
                $wali = trim($r['wali_kelas'] ?? '');
                $jenjang = trim($r['jenjang'] ?? '');
                if ($jenjang === '') {
                    if (stripos($kode, 'IX') !== false || stripos($kode, '9') !== false) $jenjang = 'IX';
                    elseif (stripos($kode, 'VIII') !== false || stripos($kode, '8') !== false) $jenjang = 'VIII';
                    else $jenjang = 'VII';
                }
                $stmt->execute([$kode, $nama, $jenjang, $wali, 3]);
                $count++;
            }
            sendJson(['success' => true, 'message' => "$count data kelas berhasil diimpor."]);
            break;

        // ==================== MANAJEMEN DATA MAPEL ====================
        case 'mapel_save':
            $id = (int)($input['id'] ?? 0);
            $noUrut = (int)($input['no_urut'] ?? 1);
            $nama = trim($input['nama_mapel'] ?? '');
            $isAgama = isset($input['is_agama']) ? (int)$input['is_agama'] : (stripos($nama, 'Agama') !== false ? 1 : 0);

            if ($nama === '') {
                sendJson(['success' => false, 'message' => 'Nama mata pelajaran wajib diisi.'], 400);
            }

            if ($id > 0) {
                $stmt = $pdo->prepare("UPDATE mapel SET no_urut=?, nama_mapel=?, is_agama=? WHERE id=?");
                $stmt->execute([$noUrut, $nama, $isAgama, $id]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO mapel (no_urut, nama_mapel, is_agama) VALUES (?, ?, ?)");
                $stmt->execute([$noUrut, $nama, $isAgama]);
            }
            sendJson(['success' => true, 'message' => 'Data mata pelajaran berhasil disimpan.']);
            break;

        case 'mapel_delete':
            $id = (int)($input['id'] ?? 0);
            $pdo->prepare("DELETE FROM mapel WHERE id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM nilai_sumatif WHERE mapel_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM nilai_kelas9 WHERE mapel_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM konfigurasi_sumatif WHERE mapel_id = ?")->execute([$id]);
            sendJson(['success' => true, 'message' => 'Data mata pelajaran berhasil dihapus.']);
            break;

        case 'mapel_delete_all':
            $pdo->exec("DELETE FROM mapel");
            $pdo->exec("DELETE FROM nilai_sumatif");
            $pdo->exec("DELETE FROM nilai_kelas9");
            $pdo->exec("DELETE FROM konfigurasi_sumatif");
            sendJson(['success' => true, 'message' => 'Seluruh mata pelajaran berhasil dihapus.']);
            break;

        case 'mapel_bulk_import':
            $rows = $input['rows'] ?? [];
            $stmt = $pdo->prepare("INSERT INTO mapel (no_urut, nama_mapel, is_agama) VALUES (?, ?, ?)");
            $count = 0;
            foreach ($rows as $idx => $r) {
                $nama = trim($r['nama_mapel'] ?? '');
                if ($nama === '') continue;
                $noUrut = (int)($r['no_urut'] ?? ($idx + 1));
                $isAgama = isset($r['is_agama']) ? (int)$r['is_agama'] : (stripos($nama, 'Agama') !== false ? 1 : 0);
                $stmt->execute([$noUrut, $nama, $isAgama]);
                $count++;
            }
            sendJson(['success' => true, 'message' => "$count mata pelajaran berhasil diimpor."]);
            break;

        // ==================== NILAI SUMATIF & KONFIGURASI ====================
        case 'konfig_sumatif_save':
            $kodeKelas = trim($input['kode_kelas'] ?? '');
            $mapelId = (int)($input['mapel_id'] ?? 0);
            $jmlSumatif = max(1, min(15, (int)($input['jml_sumatif'] ?? 3)));
            $bobotSumatif = (float)($input['bobot_sumatif'] ?? 50);
            $bobotSts = (float)($input['bobot_sts'] ?? 25);
            $bobotSas = (float)($input['bobot_sas'] ?? 25);

            $stmtCheck = $pdo->prepare("SELECT id FROM konfigurasi_sumatif WHERE kode_kelas = ? AND mapel_id = ?");
            $stmtCheck->execute([$kodeKelas, $mapelId]);
            $row = $stmtCheck->fetch();

            if ($row) {
                $stmtUpd = $pdo->prepare("UPDATE konfigurasi_sumatif SET jml_sumatif=?, bobot_sumatif=?, bobot_sts=?, bobot_sas=? WHERE id=?");
                $stmtUpd->execute([$jmlSumatif, $bobotSumatif, $bobotSts, $bobotSas, $row['id']]);
            } else {
                $stmtIns = $pdo->prepare("INSERT INTO konfigurasi_sumatif (kode_kelas, mapel_id, jml_sumatif, bobot_sumatif, bobot_sts, bobot_sas) VALUES (?, ?, ?, ?, ?, ?)");
                $stmtIns->execute([$kodeKelas, $mapelId, $jmlSumatif, $bobotSumatif, $bobotSts, $bobotSas]);
            }

            // Sinkronkan juga ke tabel kelas untuk default jml_sumatif kelas tersebut
            $pdo->prepare("UPDATE kelas SET jml_sumatif = ? WHERE kode_kelas = ?")->execute([$jmlSumatif, $kodeKelas]);

            // Hitung ulang nilai akhir untuk siswa di kelas & mapel tersebut
            $stmtNilai = $pdo->prepare("SELECT * FROM nilai_sumatif WHERE kode_kelas = ? AND mapel_id = ?");
            $stmtNilai->execute([$kodeKelas, $mapelId]);
            $existingNilai = $stmtNilai->fetchAll();

            $totalBobot = $bobotSumatif + $bobotSts + $bobotSas;
            if ($totalBobot <= 0) $totalBobot = 100;

            $stmtUpdateNilai = $pdo->prepare("UPDATE nilai_sumatif SET rerata_sumatif=?, nilai_akhir=? WHERE id=?");
            foreach ($existingNilai as $en) {
                $sArr = json_decode($en['nilai_s'] ?: '{}', true) ?: [];
                $sum = 0;
                for ($i = 1; $i <= $jmlSumatif; $i++) {
                    $sum += (float)($sArr['s' . $i] ?? 0);
                }
                $rerataS = round($sum / $jmlSumatif, 2);
                $sts = (float)$en['sts'];
                $sas = (float)$en['sas'];
                $na = round((($rerataS * $bobotSumatif) + ($sts * $bobotSts) + ($sas * $bobotSas)) / $totalBobot, 2);
                $stmtUpdateNilai->execute([$rerataS, $na, $en['id']]);
            }

            sendJson(['success' => true, 'message' => 'Pengaturan jumlah sumatif & bobot berhasil disimpan.']);
            break;

        case 'nilai_sumatif_bulk_save':
            $kodeKelas = trim($input['kode_kelas'] ?? '');
            $mapelId = (int)($input['mapel_id'] ?? 0);
            $jmlSumatif = max(1, (int)($input['jml_sumatif'] ?? 3));
            $bobotSumatif = (float)($input['bobot_sumatif'] ?? 50);
            $bobotSts = (float)($input['bobot_sts'] ?? 25);
            $bobotSas = (float)($input['bobot_sas'] ?? 25);
            $rows = $input['rows'] ?? [];

            // Simpan konfigurasi terlebih dahulu
            $stmtCheckK = $pdo->prepare("SELECT id FROM konfigurasi_sumatif WHERE kode_kelas = ? AND mapel_id = ?");
            $stmtCheckK->execute([$kodeKelas, $mapelId]);
            $kRow = $stmtCheckK->fetch();
            if ($kRow) {
                $pdo->prepare("UPDATE konfigurasi_sumatif SET jml_sumatif=?, bobot_sumatif=?, bobot_sts=?, bobot_sas=? WHERE id=?")
                    ->execute([$jmlSumatif, $bobotSumatif, $bobotSts, $bobotSas, $kRow['id']]);
            } else {
                $pdo->prepare("INSERT INTO konfigurasi_sumatif (kode_kelas, mapel_id, jml_sumatif, bobot_sumatif, bobot_sts, bobot_sas) VALUES (?, ?, ?, ?, ?, ?)")
                    ->execute([$kodeKelas, $mapelId, $jmlSumatif, $bobotSumatif, $bobotSts, $bobotSas]);
            }

            $totalBobot = $bobotSumatif + $bobotSts + $bobotSas;
            if ($totalBobot <= 0) $totalBobot = 100;

            $stmtFind = $pdo->prepare("SELECT id FROM nilai_sumatif WHERE murid_id = ? AND mapel_id = ?");
            $stmtUpd = $pdo->prepare("UPDATE nilai_sumatif SET kode_kelas=?, agama_mapel=?, nilai_s=?, rerata_sumatif=?, sts=?, sas=?, nilai_akhir=?, updated_at=CURRENT_TIMESTAMP WHERE id=?");
            $stmtIns = $pdo->prepare("INSERT INTO nilai_sumatif (murid_id, kode_kelas, mapel_id, agama_mapel, nilai_s, rerata_sumatif, sts, sas, nilai_akhir) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");

            foreach ($rows as $r) {
                $muridId = (int)($r['murid_id'] ?? 0);
                if ($muridId <= 0) continue;
                $agamaMapel = trim($r['agama_mapel'] ?? '');
                $nilaiS = is_array($r['nilai_s'] ?? null) ? $r['nilai_s'] : [];

                $sumS = 0;
                for ($i = 1; $i <= $jmlSumatif; $i++) {
                    $val = (float)($nilaiS['s' . $i] ?? 0);
                    $nilaiS['s' . $i] = $val;
                    $sumS += $val;
                }
                $rerataS = round($sumS / $jmlSumatif, 2);
                $sts = (float)($r['sts'] ?? 0);
                $sas = (float)($r['sas'] ?? 0);
                $na = round((($rerataS * $bobotSumatif) + ($sts * $bobotSts) + ($sas * $bobotSas)) / $totalBobot, 2);

                $stmtFind->execute([$muridId, $mapelId]);
                $found = $stmtFind->fetch();
                if ($found) {
                    $stmtUpd->execute([$kodeKelas, $agamaMapel, json_encode($nilaiS), $rerataS, $sts, $sas, $na, $found['id']]);
                } else {
                    $stmtIns->execute([$muridId, $kodeKelas, $mapelId, $agamaMapel, json_encode($nilaiS), $rerataS, $sts, $sas, $na]);
                }
            }

            sendJson(['success' => true, 'message' => 'Nilai sumatif berhasil disimpan!']);
            break;

        // ==================== ANALISIS KELAS IX ====================
        case 'konfig_kelas9_save':
            $bRapor = (float)($input['k9_bobot_rapor'] ?? 60);
            $bUs = (float)($input['k9_bobot_us'] ?? 40);
            $bTulis = (float)($input['k9_bobot_us_tulis'] ?? 60);
            $bPraktik = (float)($input['k9_bobot_us_praktik'] ?? 40);

            upsertSetting($pdo, 'k9_bobot_rapor', (string)$bRapor);
            upsertSetting($pdo, 'k9_bobot_us', (string)$bUs);
            upsertSetting($pdo, 'k9_bobot_us_tulis', (string)$bTulis);
            upsertSetting($pdo, 'k9_bobot_us_praktik', (string)$bPraktik);

            // Hitung ulang semua nilai kelas IX dengan bobot baru
            $allK9 = $pdo->query("SELECT * FROM nilai_kelas9")->fetchAll();
            $totUs = ($bTulis + $bPraktik) > 0 ? ($bTulis + $bPraktik) : 100;
            $totNa = ($bRapor + $bUs) > 0 ? ($bRapor + $bUs) : 100;

            $stmtU = $pdo->prepare("UPDATE nilai_kelas9 SET rerata_rapor=?, rerata_us=?, nilai_akhir=? WHERE id=?");
            foreach ($allK9 as $row) {
                $rRapor = round(((float)$row['sem1'] + (float)$row['sem2'] + (float)$row['sem3'] + (float)$row['sem4'] + (float)$row['sem5'] + (float)$row['sem6']) / 6, 2);
                $rUs = round((((float)$row['us_tulis'] * $bTulis) + ((float)$row['us_praktik'] * $bPraktik)) / $totUs, 2);
                $na = round((($rRapor * $bRapor) + ($rUs * $bUs)) / $totNa, 2);
                $stmtU->execute([$rRapor, $rUs, $na, $row['id']]);
            }

            sendJson(['success' => true, 'message' => 'Bobot Analisis Kelas IX berhasil disimpan & nilai telah dihitung ulang.']);
            break;

        case 'nilai_kelas9_bulk_save':
            $kodeKelas = trim($input['kode_kelas'] ?? '');
            $mapelId = (int)($input['mapel_id'] ?? 0);
            $bRapor = (float)($input['k9_bobot_rapor'] ?? 60);
            $bUs = (float)($input['k9_bobot_us'] ?? 40);
            $bTulis = (float)($input['k9_bobot_us_tulis'] ?? 60);
            $bPraktik = (float)($input['k9_bobot_us_praktik'] ?? 40);
            $rows = $input['rows'] ?? [];

            upsertSetting($pdo, 'k9_bobot_rapor', (string)$bRapor);
            upsertSetting($pdo, 'k9_bobot_us', (string)$bUs);
            upsertSetting($pdo, 'k9_bobot_us_tulis', (string)$bTulis);
            upsertSetting($pdo, 'k9_bobot_us_praktik', (string)$bPraktik);

            $totUs = ($bTulis + $bPraktik) > 0 ? ($bTulis + $bPraktik) : 100;
            $totNa = ($bRapor + $bUs) > 0 ? ($bRapor + $bUs) : 100;

            $stmtFind = $pdo->prepare("SELECT id FROM nilai_kelas9 WHERE murid_id = ? AND mapel_id = ?");
            $stmtUpd = $pdo->prepare("UPDATE nilai_kelas9 SET kode_kelas=?, agama_mapel=?, sem1=?, sem2=?, sem3=?, sem4=?, sem5=?, sem6=?, rerata_rapor=?, us_tulis=?, us_praktik=?, rerata_us=?, nilai_akhir=?, updated_at=CURRENT_TIMESTAMP WHERE id=?");
            $stmtIns = $pdo->prepare("INSERT INTO nilai_kelas9 (murid_id, kode_kelas, mapel_id, agama_mapel, sem1, sem2, sem3, sem4, sem5, sem6, rerata_rapor, us_tulis, us_praktik, rerata_us, nilai_akhir) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

            foreach ($rows as $r) {
                $muridId = (int)($r['murid_id'] ?? 0);
                if ($muridId <= 0) continue;
                $agamaMapel = trim($r['agama_mapel'] ?? '');
                $s1 = (float)($r['sem1'] ?? 0);
                $s2 = (float)($r['sem2'] ?? 0);
                $s3 = (float)($r['sem3'] ?? 0);
                $s4 = (float)($r['sem4'] ?? 0);
                $s5 = (float)($r['sem5'] ?? 0);
                $s6 = (float)($r['sem6'] ?? 0);
                $usTulis = (float)($r['us_tulis'] ?? 0);
                $usPraktik = (float)($r['us_praktik'] ?? 0);

                $rRapor = round(($s1 + $s2 + $s3 + $s4 + $s5 + $s6) / 6, 2);
                $rUs = round((($usTulis * $bTulis) + ($usPraktik * $bPraktik)) / $totUs, 2);
                $na = round((($rRapor * $bRapor) + ($rUs * $bUs)) / $totNa, 2);

                $stmtFind->execute([$muridId, $mapelId]);
                $found = $stmtFind->fetch();
                if ($found) {
                    $stmtUpd->execute([$kodeKelas, $agamaMapel, $s1, $s2, $s3, $s4, $s5, $s6, $rRapor, $usTulis, $usPraktik, $rUs, $na, $found['id']]);
                } else {
                    $stmtIns->execute([$muridId, $kodeKelas, $mapelId, $agamaMapel, $s1, $s2, $s3, $s4, $s5, $s6, $rRapor, $usTulis, $usPraktik, $rUs, $na]);
                }
            }

            sendJson(['success' => true, 'message' => 'Data Nilai Analisis Kelas IX berhasil disimpan!']);
            break;

        case 'nilai_kelas9_reset_row':
            $muridId = (int)($input['murid_id'] ?? 0);
            $mapelId = (int)($input['mapel_id'] ?? 0);
            $pdo->prepare("DELETE FROM nilai_kelas9 WHERE murid_id = ? AND mapel_id = ?")->execute([$muridId, $mapelId]);
            sendJson(['success' => true, 'message' => 'Nilai siswa berhasil direset.']);
            break;

        case 'nilai_kelas9_reset_all':
            $kodeKelas = trim($input['kode_kelas'] ?? '');
            $mapelId = (int)($input['mapel_id'] ?? 0);
            if ($kodeKelas !== '' && $mapelId > 0) {
                $pdo->prepare("DELETE FROM nilai_kelas9 WHERE kode_kelas = ? AND mapel_id = ?")->execute([$kodeKelas, $mapelId]);
            }
            sendJson(['success' => true, 'message' => 'Seluruh nilai Kelas IX pada kelas & mapel ini berhasil direset.']);
            break;

        // ==================== PENGATURAN SEKOLAH & BACKUP/RESTORE ====================
        case 'settings_save':
            $fields = $input['settings'] ?? [];
            foreach ($fields as $k => $v) {
                upsertSetting($pdo, $k, (string)$v);
            }
            sendJson(['success' => true, 'message' => 'Pengaturan sekolah & aplikasi berhasil disimpan.']);
            break;

        case 'backup_sql':
            $tables = ['settings', 'kelas', 'mapel', 'guru', 'murid', 'konfigurasi_sumatif', 'nilai_sumatif', 'nilai_kelas9'];
            $sqlDump = "-- ==========================================================\n";
            $sqlDump .= "-- BACKUP DATABASE APLIKASI PENILAIAN TERPADU\n";
            $sqlDump .= "-- Waktu Backup: " . date('Y-m-d H:i:s') . "\n";
            $sqlDump .= "-- ==========================================================\n\n";

            foreach ($tables as $t) {
                $sqlDump .= "-- Tabel: `$t`\n";
                $sqlDump .= "DELETE FROM `$t`;\n";
                $rows = $pdo->query("SELECT * FROM `$t`")->fetchAll();
                foreach ($rows as $row) {
                    $cols = array_map(function($c) { return "`$c`"; }, array_keys($row));
                    $vals = array_map(function($v) use ($pdo) {
                        return $v === null ? "NULL" : $pdo->quote((string)$v);
                    }, array_values($row));
                    $sqlDump .= "INSERT INTO `$t` (" . implode(", ", $cols) . ") VALUES (" . implode(", ", $vals) . ");\n";
                }
                $sqlDump .= "\n";
            }

            sendJson([
                'success' => true,
                'filename' => 'backup_penilaian_' . date('Ymd_His') . '.sql',
                'sql' => $sqlDump
            ]);
            break;

        case 'restore_json':
            $data = $input['backup_data'] ?? null;
            if (!is_array($data)) {
                sendJson(['success' => false, 'message' => 'Format file JSON tidak valid.'], 400);
            }

            if (isset($data['settings']) && is_array($data['settings'])) {
                $pdo->exec("DELETE FROM settings");
                $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)");
                foreach ($data['settings'] as $k => $v) {
                    $stmt->execute([$k, (string)$v]);
                }
            }

            $tableMap = [
                'kelas' => ['id', 'kode_kelas', 'nama_kelas', 'jenjang', 'wali_kelas', 'jml_sumatif'],
                'mapel' => ['id', 'no_urut', 'nama_mapel', 'is_agama'],
                'guru' => ['id', 'nama_guru', 'nip', 'mapel_ampuan', 'kelas_ampuan', 'username', 'password', 'foto'],
                'murid' => ['id', 'nama_murid', 'nis_nisn', 'agama', 'kode_kelas'],
                'konfigurasi_sumatif' => ['id', 'kode_kelas', 'mapel_id', 'jml_sumatif', 'bobot_sumatif', 'bobot_sts', 'bobot_sas'],
                'nilai_sumatif' => ['id', 'murid_id', 'kode_kelas', 'mapel_id', 'agama_mapel', 'nilai_s', 'rerata_sumatif', 'sts', 'sas', 'nilai_akhir'],
                'nilai_kelas9' => ['id', 'murid_id', 'kode_kelas', 'mapel_id', 'agama_mapel', 'sem1', 'sem2', 'sem3', 'sem4', 'sem5', 'sem6', 'rerata_rapor', 'us_tulis', 'us_praktik', 'rerata_us', 'nilai_akhir']
            ];

            foreach ($tableMap as $table => $cols) {
                if (isset($data[$table]) && is_array($data[$table])) {
                    $pdo->exec("DELETE FROM `$table`");
                    $placeholders = implode(',', array_fill(0, count($cols), '?'));
                    $colList = implode(',', $cols);
                    $stmt = $pdo->prepare("INSERT INTO `$table` ($colList) VALUES ($placeholders)");
                    foreach ($data[$table] as $row) {
                        $vals = [];
                        foreach ($cols as $c) {
                            $v = $row[$c] ?? '';
                            if (is_array($v)) $v = json_encode($v);
                            $vals[] = $v;
                        }
                        $stmt->execute($vals);
                    }
                }
            }

            sendJson(['success' => true, 'message' => 'Database berhasil direstore dari file JSON!']);
            break;

        case 'restore_sql':
            $sqlContent = $input['sql_content'] ?? '';
            if (trim($sqlContent) === '') {
                sendJson(['success' => false, 'message' => 'Isi file SQL kosong.'], 400);
            }
            // Pisahkan statement SQL per baris perintah
            $lines = explode("\n", $sqlContent);
            $buffer = '';
            $executed = 0;
            foreach ($lines as $line) {
                $trimmed = trim($line);
                if ($trimmed === '' || strpos($trimmed, '--') === 0 || strpos($trimmed, '/*') === 0) {
                    continue;
                }
                $buffer .= $line . "\n";
                if (substr($trimmed, -1) === ';') {
                    $pdo->exec($buffer);
                    $buffer = '';
                    $executed++;
                }
            }
            sendJson(['success' => true, 'message' => "Restore SQL berhasil ($executed perintah dieksekusi)."]);
            break;

        default:
            sendJson(['success' => false, 'message' => 'Action API tidak ditemukan: ' . $action], 404);
    }
} catch (Exception $e) {
    sendJson(['success' => false, 'message' => 'Server Error: ' . $e->getMessage()], 500);
}
