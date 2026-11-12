-- =====================================================================
--  Prizren Heritage Platform - MySQL schema (MySQL 8+ / 9)
--  Normalised (3NF), utf8mb4, InnoDB, with PKs, FKs and indexes.
--  Run with:  npm run db:init --prefix server   (or in MySQL Workbench)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `prizren_heritage`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `prizren_heritage`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `visitor_statistics`;
DROP TABLE IF EXISTS `user_activity`;
DROP TABLE IF EXISTS `wishlist`;
DROP TABLE IF EXISTS `favorites`;
DROP TABLE IF EXISTS `comments`;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `cultural_item_translations`;
DROP TABLE IF EXISTS `cultural_items`;
DROP TABLE IF EXISTS `site_content`;
DROP TABLE IF EXISTS `monument_3d_models`;
DROP TABLE IF EXISTS `monument_images`;
DROP TABLE IF EXISTS `monument_translations`;
DROP TABLE IF EXISTS `monuments`;
DROP TABLE IF EXISTS `password_resets`;
DROP TABLE IF EXISTS `email_verifications`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `roles`;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- Roles & users
-- ---------------------------------------------------------------------
CREATE TABLE `roles` (
  `id`          TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(30)  NOT NULL,
  `description` VARCHAR(255) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_roles_name` (`name`)
) ENGINE=InnoDB;

CREATE TABLE `users` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `role_id`           TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `first_name`        VARCHAR(80)  NOT NULL,
  `last_name`         VARCHAR(80)  NOT NULL,
  `email`             VARCHAR(190) NOT NULL,
  `password_hash`     VARCHAR(255) NOT NULL,
  `is_verified`       TINYINT(1)   NOT NULL DEFAULT 0,
  `verified_at`       DATETIME     NULL,
  `accepted_terms_at` DATETIME     NOT NULL,
  `preferred_lang`    CHAR(2)      NOT NULL DEFAULT 'sq',
  `bio`               VARCHAR(500) NULL,
  `is_active`         TINYINT(1)   NOT NULL DEFAULT 1,
  `last_login_at`     DATETIME     NULL,
  `created_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_role` (`role_id`),
  KEY `idx_users_created` (`created_at`),
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB;

-- Only the SHA-256 hash of each token is stored, never the raw token.
CREATE TABLE `email_verifications` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED NOT NULL,
  `token_hash` CHAR(64)     NOT NULL,
  `expires_at` DATETIME     NOT NULL,
  `used_at`    DATETIME     NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_emailver_token` (`token_hash`),
  KEY `idx_emailver_user` (`user_id`),
  KEY `idx_emailver_expires` (`expires_at`),
  CONSTRAINT `fk_emailver_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `password_resets` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED NOT NULL,
  `token_hash` CHAR(64)     NOT NULL,
  `expires_at` DATETIME     NOT NULL,
  `used_at`    DATETIME     NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pwreset_token` (`token_hash`),
  KEY `idx_pwreset_user` (`user_id`),
  KEY `idx_pwreset_expires` (`expires_at`),
  CONSTRAINT `fk_pwreset_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Monuments (language-neutral data) + translations (sq / en / de)
-- ---------------------------------------------------------------------
CREATE TABLE `monuments` (
  `id`                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug`                VARCHAR(120) NOT NULL,
  `category`            ENUM('fortress','mosque','church','cathedral','hamam','bridge','complex','tekke','museum') NOT NULL,
  `model_archetype`     ENUM('fortress','mosque','church','cathedral','hamam','bridge','tekke','complex','museum') NOT NULL,
  `latitude`            DECIMAL(9,6) NOT NULL,
  `longitude`           DECIMAL(9,6) NOT NULL,
  `built_year_start`    SMALLINT NULL,
  `built_year_end`      SMALLINT NULL,
  `heritage_reference`  VARCHAR(255) NULL,
  `sources`             JSON NULL,
  `is_published`        TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order`          INT NOT NULL DEFAULT 0,
  `view_count`          INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_monuments_slug` (`slug`),
  KEY `idx_monuments_published_sort` (`is_published`, `sort_order`),
  KEY `idx_monuments_category` (`category`),
  KEY `idx_monuments_geo` (`latitude`, `longitude`)
) ENGINE=InnoDB;

CREATE TABLE `monument_translations` (
  `monument_id`       INT UNSIGNED NOT NULL,
  `lang`              CHAR(2)      NOT NULL,
  `name`              VARCHAR(200) NOT NULL,
  `alt_name`          VARCHAR(200) NULL,
  `period_label`      VARCHAR(160) NULL,
  `architectural_style` VARCHAR(200) NULL,
  `short_description` VARCHAR(600) NOT NULL,
  `history`           TEXT NOT NULL,
  `significance`      TEXT NOT NULL,
  `architecture`      TEXT NOT NULL,
  `visitor_info`      TEXT NOT NULL,
  PRIMARY KEY (`monument_id`, `lang`),
  KEY `idx_mtrans_lang_name` (`lang`, `name`),
  CONSTRAINT `fk_mtrans_monument` FOREIGN KEY (`monument_id`) REFERENCES `monuments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `monument_images` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `monument_id` INT UNSIGNED NULL,           -- NULL = site-wide image (hero, etc.)
  `file_path`   VARCHAR(255) NOT NULL,       -- optimised 1600px WebP
  `thumb_path`  VARCHAR(255) NOT NULL,       -- 800px WebP
  `width`       SMALLINT UNSIGNED NULL,
  `height`      SMALLINT UNSIGNED NULL,
  `caption`     VARCHAR(255) NULL,
  `author`      VARCHAR(255) NULL,
  `license`     VARCHAR(80)  NULL,
  `license_url` VARCHAR(255) NULL,
  `source_url`  VARCHAR(500) NULL,
  `is_cover`    TINYINT(1) NOT NULL DEFAULT 0,
  `sort_order`  INT NOT NULL DEFAULT 0,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mimg_monument_sort` (`monument_id`, `sort_order`),
  CONSTRAINT `fk_mimg_monument` FOREIGN KEY (`monument_id`) REFERENCES `monuments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Real 3D files (GLB/GLTF). `model_kind` and `is_authentic` make it explicit
-- whether a model is a genuine scan / documented reconstruction or an artist's
-- interpretation. When a monument has no active row here the UI shows a clearly
-- labelled schematic interpretation instead - never an "authentic" claim.
CREATE TABLE `monument_3d_models` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `monument_id` INT UNSIGNED NOT NULL,
  `title`       VARCHAR(200) NOT NULL,
  `file_path`   VARCHAR(255) NOT NULL,
  `file_size`   INT UNSIGNED NULL,
  `format`      ENUM('glb','gltf') NOT NULL DEFAULT 'glb',
  `model_kind`  ENUM('photogrammetry_scan','laser_scan','documented_reconstruction','artist_model') NOT NULL DEFAULT 'artist_model',
  `is_authentic` TINYINT(1) NOT NULL DEFAULT 0,
  `source_name` VARCHAR(200) NULL,
  `source_url`  VARCHAR(500) NULL,
  `license`     VARCHAR(120) NULL,
  `credit`      VARCHAR(255) NULL,
  `is_active`   TINYINT(1) NOT NULL DEFAULT 1,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_m3d_monument_active` (`monument_id`, `is_active`),
  CONSTRAINT `fk_m3d_monument` FOREIGN KEY (`monument_id`) REFERENCES `monuments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- User interactions
-- ---------------------------------------------------------------------
CREATE TABLE `favorites` (
  `user_id`     INT UNSIGNED NOT NULL,
  `monument_id` INT UNSIGNED NOT NULL,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `monument_id`),
  KEY `idx_fav_monument` (`monument_id`),
  CONSTRAINT `fk_fav_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fav_monument` FOREIGN KEY (`monument_id`) REFERENCES `monuments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- "Want to visit" list
CREATE TABLE `wishlist` (
  `user_id`     INT UNSIGNED NOT NULL,
  `monument_id` INT UNSIGNED NOT NULL,
  `visited`     TINYINT(1) NOT NULL DEFAULT 0,
  `note`        VARCHAR(500) NULL,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `monument_id`),
  KEY `idx_wish_monument` (`monument_id`),
  CONSTRAINT `fk_wish_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wish_monument` FOREIGN KEY (`monument_id`) REFERENCES `monuments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `reviews` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     INT UNSIGNED NOT NULL,
  `monument_id` INT UNSIGNED NOT NULL,
  `rating`      TINYINT UNSIGNED NOT NULL,
  `body`        VARCHAR(1500) NULL,
  `is_hidden`   TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_review_user_monument` (`user_id`, `monument_id`),
  KEY `idx_review_monument` (`monument_id`, `is_hidden`),
  CONSTRAINT `chk_review_rating` CHECK (`rating` BETWEEN 1 AND 5),
  CONSTRAINT `fk_review_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_review_monument` FOREIGN KEY (`monument_id`) REFERENCES `monuments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `comments` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     INT UNSIGNED NOT NULL,
  `monument_id` INT UNSIGNED NOT NULL,
  `parent_id`   INT UNSIGNED NULL,
  `body`        VARCHAR(1500) NOT NULL,
  `is_hidden`   TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_comment_monument` (`monument_id`, `is_hidden`, `created_at`),
  KEY `idx_comment_user` (`user_id`),
  KEY `idx_comment_parent` (`parent_id`),
  CONSTRAINT `fk_comment_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comment_monument` FOREIGN KEY (`monument_id`) REFERENCES `monuments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comment_parent` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `user_activity` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     INT UNSIGNED NOT NULL,
  `action`      VARCHAR(40) NOT NULL,
  `monument_id` INT UNSIGNED NULL,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_activity_user_created` (`user_id`, `created_at`),
  KEY `idx_activity_monument` (`monument_id`),
  CONSTRAINT `fk_activity_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_activity_monument` FOREIGN KEY (`monument_id`) REFERENCES `monuments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Statistics (privacy friendly: visitor identified only by a daily-salted hash)
-- ---------------------------------------------------------------------
CREATE TABLE `visitor_statistics` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `monument_id`  INT UNSIGNED NULL,
  `user_id`      INT UNSIGNED NULL,
  `path`         VARCHAR(255) NOT NULL,
  `visitor_hash` CHAR(16) NOT NULL,
  `lang`         CHAR(2)  NULL,
  `device`       ENUM('desktop','tablet','mobile','bot') NOT NULL DEFAULT 'desktop',
  `visited_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_stats_visited` (`visited_at`),
  KEY `idx_stats_monument_visited` (`monument_id`, `visited_at`),
  KEY `idx_stats_visitor` (`visitor_hash`, `visited_at`),
  CONSTRAINT `fk_stats_monument` FOREIGN KEY (`monument_id`) REFERENCES `monuments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_stats_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Editable site content (homepage texts, etc.) + events / activities / timeline
-- ---------------------------------------------------------------------
CREATE TABLE `site_content` (
  `content_key`   VARCHAR(100) NOT NULL,
  `lang`          CHAR(2)      NOT NULL,
  `content_value` TEXT         NOT NULL,
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`content_key`, `lang`)
) ENGINE=InnoDB;

CREATE TABLE `cultural_items` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `type`        ENUM('event','activity','timeline') NOT NULL,
  `monument_id` INT UNSIGNED NULL,
  `link_url`    VARCHAR(500) NULL,
  `image_path`  VARCHAR(255) NULL,
  `sort_order`  INT NOT NULL DEFAULT 0,
  `is_published` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_citems_type_sort` (`type`, `is_published`, `sort_order`),
  KEY `idx_citems_monument` (`monument_id`),
  CONSTRAINT `fk_citems_monument` FOREIGN KEY (`monument_id`) REFERENCES `monuments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE `cultural_item_translations` (
  `item_id`     INT UNSIGNED NOT NULL,
  `lang`        CHAR(2)      NOT NULL,
  `title`       VARCHAR(200) NOT NULL,
  `description` TEXT         NOT NULL,
  `when_label`  VARCHAR(160) NULL,
  PRIMARY KEY (`item_id`, `lang`),
  CONSTRAINT `fk_citrans_item` FOREIGN KEY (`item_id`) REFERENCES `cultural_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Reference data
INSERT INTO `roles` (`id`, `name`, `description`) VALUES
  (1, 'user',   'Visitor / citizen with a personal dashboard'),
  (2, 'editor', 'Can manage monuments, media, content and moderate comments'),
  (3, 'admin',  'Full access including users and statistics');
