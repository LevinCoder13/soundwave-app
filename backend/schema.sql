-- SoundWave Database Schema for WampServer MySQL / phpMyAdmin
-- Database: soundwave_db
-- Character Set: utf8mb4 / utf8mb4_unicode_ci

CREATE DATABASE IF NOT EXISTS `soundwave_db` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `soundwave_db`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Songs Cache Table (Stores YouTube/stream metadata to avoid repeated lookups)
CREATE TABLE IF NOT EXISTS `songs_cache` (
  `id` VARCHAR(120) PRIMARY KEY, -- Unique YouTube Video ID or Stream ID
  `title` VARCHAR(255) NOT NULL,
  `artist` VARCHAR(255) NOT NULL,
  `cover_art_url` TEXT,
  `duration_seconds` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_artist` (`artist`),
  INDEX `idx_title` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Playlists Table
CREATE TABLE IF NOT EXISTS `playlists` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_playlists_user` 
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Playlist Tracks Junction Table
CREATE TABLE IF NOT EXISTS `playlist_tracks` (
  `playlist_id` INT NOT NULL,
  `song_id` VARCHAR(120) NOT NULL,
  `added_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`playlist_id`, `song_id`),
  CONSTRAINT `fk_playlist_tracks_playlist` 
    FOREIGN KEY (`playlist_id`) REFERENCES `playlists`(`id`) 
    ON DELETE CASCADE,
  CONSTRAINT `fk_playlist_tracks_song` 
    FOREIGN KEY (`song_id`) REFERENCES `songs_cache`(`id`) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. User Favorites Table
CREATE TABLE IF NOT EXISTS `favorites` (
  `user_id` INT NOT NULL,
  `song_id` VARCHAR(120) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `song_id`),
  CONSTRAINT `fk_favorites_user` 
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) 
    ON DELETE CASCADE,
  CONSTRAINT `fk_favorites_song` 
    FOREIGN KEY (`song_id`) REFERENCES `songs_cache`(`id`) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
