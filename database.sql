-- =========================================================================
-- DATABASE SQL: APLIKASI PENILAIAN TERPADU SMP (MySQL / MariaDB - XAMPP/Laragon)
-- Nama Database: db_penilaian_smp
-- Catatan: Aplikasi juga otomatis membuat database & tabel ini saat dijalankan.
-- =========================================================================

CREATE DATABASE IF NOT EXISTS `db_penilaian_smp` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `db_penilaian_smp`;

-- 1. Tabel Pengaturan Sekolah & Aplikasi
CREATE TABLE IF NOT EXISTS `settings` (
    `setting_key` VARCHAR(100) PRIMARY KEY,
    `setting_value` LONGTEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabel Kelas
CREATE TABLE IF NOT EXISTS `kelas` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `kode_kelas` VARCHAR(50) NOT NULL,
    `nama_kelas` VARCHAR(100) NOT NULL,
    `jenjang` VARCHAR(10) NOT NULL DEFAULT 'VII',
    `wali_kelas` VARCHAR(150) DEFAULT '',
    `jml_sumatif` INT DEFAULT 3,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabel Mata Pelajaran
CREATE TABLE IF NOT EXISTS `mapel` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `no_urut` INT NOT NULL DEFAULT 1,
    `nama_mapel` VARCHAR(150) NOT NULL,
    `is_agama` INT NOT NULL DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabel Guru
CREATE TABLE IF NOT EXISTS `guru` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nama_guru` VARCHAR(150) NOT NULL,
    `nip` VARCHAR(50) DEFAULT '',
    `mapel_ampuan` TEXT,
    `kelas_ampuan` TEXT,
    `username` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `foto` LONGTEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Tabel Murid
CREATE TABLE IF NOT EXISTS `murid` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nama_murid` VARCHAR(150) NOT NULL,
    `nis_nisn` VARCHAR(50) NOT NULL,
    `agama` VARCHAR(50) NOT NULL DEFAULT 'Islam',
    `kode_kelas` VARCHAR(50) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Tabel Konfigurasi Sumatif & Bobot per Kelas + Mapel
CREATE TABLE IF NOT EXISTS `konfigurasi_sumatif` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `kode_kelas` VARCHAR(50) NOT NULL,
    `mapel_id` INT NOT NULL,
    `jml_sumatif` INT NOT NULL DEFAULT 3,
    `bobot_sumatif` DOUBLE NOT NULL DEFAULT 50,
    `bobot_sts` DOUBLE NOT NULL DEFAULT 25,
    `bobot_sas` DOUBLE NOT NULL DEFAULT 25,
    UNIQUE KEY `uniq_kelas_mapel` (`kode_kelas`, `mapel_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Tabel Nilai Sumatif Siswa
CREATE TABLE IF NOT EXISTS `nilai_sumatif` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `murid_id` INT NOT NULL,
    `kode_kelas` VARCHAR(50) NOT NULL,
    `mapel_id` INT NOT NULL,
    `agama_mapel` VARCHAR(50) DEFAULT '',
    `nilai_s` TEXT,
    `rerata_sumatif` DOUBLE DEFAULT 0,
    `sts` DOUBLE DEFAULT 0,
    `sas` DOUBLE DEFAULT 0,
    `nilai_akhir` DOUBLE DEFAULT 0,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uniq_murid_mapel_sum` (`murid_id`, `mapel_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Tabel Nilai Analisis Kelas IX (6 Semester + US Tulis & Praktik)
CREATE TABLE IF NOT EXISTS `nilai_kelas9` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `murid_id` INT NOT NULL,
    `kode_kelas` VARCHAR(50) NOT NULL,
    `mapel_id` INT NOT NULL,
    `agama_mapel` VARCHAR(50) DEFAULT '',
    `sem1` DOUBLE DEFAULT 0,
    `sem2` DOUBLE DEFAULT 0,
    `sem3` DOUBLE DEFAULT 0,
    `sem4` DOUBLE DEFAULT 0,
    `sem5` DOUBLE DEFAULT 0,
    `sem6` DOUBLE DEFAULT 0,
    `rerata_rapor` DOUBLE DEFAULT 0,
    `us_tulis` DOUBLE DEFAULT 0,
    `us_praktik` DOUBLE DEFAULT 0,
    `rerata_us` DOUBLE DEFAULT 0,
    `nilai_akhir` DOUBLE DEFAULT 0,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uniq_murid_mapel_k9` (`murid_id`, `mapel_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
