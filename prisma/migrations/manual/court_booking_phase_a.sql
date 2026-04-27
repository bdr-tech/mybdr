-- ============================================================
-- Court Booking Phase A — MVP 무료 대관 마이그레이션
--
-- 작성일: 2026-04-22
-- 작성자: developer
-- 실행 정책: ⚠️ 자동 실행 금지. 운영 DB 위험 → PM 승인 후 수동 실행만 허용.
--
-- 변경 내역 (3건):
--   1. court_infos 테이블에 booking_mode + booking_fee_per_hour 2컬럼 추가
--   2. court_bookings 테이블 신규 생성 (Phase A 핵심)
--   3. 인덱스 3건 + FK 2건
--
-- 실행 방법 (운영자 수동):
--   psql $DATABASE_URL -f prisma/migrations/manual/court_booking_phase_a.sql
--
-- 롤백 SQL은 본 파일 하단 ROLLBACK 섹션 참조
-- ============================================================

BEGIN;

-- ─────────────────────────────────────────────
-- 1. court_infos 컬럼 추가
-- ─────────────────────────────────────────────
ALTER TABLE court_infos
  ADD COLUMN IF NOT EXISTS booking_mode VARCHAR NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS booking_fee_per_hour DECIMAL(10, 0);

-- 기존 코트는 모두 booking_mode='none' 으로 시작 (대관 미지원).
-- 운영자 본인이 manage 페이지에서 'internal' 로 토글해야 예약 페이지가 활성화됨.

-- ─────────────────────────────────────────────
-- 2. court_bookings 테이블 신규 생성
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS court_bookings (
  id                  BIGSERIAL PRIMARY KEY,
  court_info_id       BIGINT NOT NULL,
  user_id             BIGINT NOT NULL,
  start_at            TIMESTAMP(6) NOT NULL,
  end_at              TIMESTAMP(6) NOT NULL,
  duration_hours      INTEGER NOT NULL,
  purpose             VARCHAR NOT NULL DEFAULT 'pickup',
  expected_count      INTEGER,
  amount              DECIMAL(10, 0) NOT NULL DEFAULT 0,
  discount_amount     DECIMAL(10, 0) DEFAULT 0,
  final_amount        DECIMAL(10, 0) NOT NULL DEFAULT 0,
  platform_fee        DECIMAL(10, 0) DEFAULT 0,
  status              VARCHAR NOT NULL DEFAULT 'confirmed',
  payment_id          BIGINT,
  cancellation_reason TEXT,
  cancelled_at        TIMESTAMP(6),
  refunded_at         TIMESTAMP(6),
  created_at          TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- 3. FK 제약 (NoAction — Prisma 기본 정책 따름)
-- ─────────────────────────────────────────────
ALTER TABLE court_bookings
  ADD CONSTRAINT court_bookings_court_info_id_fkey
  FOREIGN KEY (court_info_id) REFERENCES court_infos(id)
  ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE court_bookings
  ADD CONSTRAINT court_bookings_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id)
  ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ─────────────────────────────────────────────
-- 4. 인덱스 (성능 핵심)
-- ─────────────────────────────────────────────
-- 슬롯 충돌 검사: WHERE court_info_id = ? AND start_at < ? AND end_at > ? 의 범위 스캔
CREATE INDEX IF NOT EXISTS court_bookings_court_info_id_start_at_idx
  ON court_bookings(court_info_id, start_at);

-- 내 예약 목록 (/profile/bookings)
CREATE INDEX IF NOT EXISTS court_bookings_user_id_status_idx
  ON court_bookings(user_id, status);

-- 운영자 대시보드 (/courts/[id]/manage) — 최신 예약 우선 정렬
CREATE INDEX IF NOT EXISTS court_bookings_status_created_at_idx
  ON court_bookings(status, created_at);

COMMIT;

-- ============================================================
-- ROLLBACK SQL (필요 시 별도 트랜잭션으로 실행)
-- ============================================================
-- BEGIN;
--   DROP INDEX IF EXISTS court_bookings_status_created_at_idx;
--   DROP INDEX IF EXISTS court_bookings_user_id_status_idx;
--   DROP INDEX IF EXISTS court_bookings_court_info_id_start_at_idx;
--   DROP TABLE IF EXISTS court_bookings;
--   ALTER TABLE court_infos DROP COLUMN IF EXISTS booking_fee_per_hour;
--   ALTER TABLE court_infos DROP COLUMN IF EXISTS booking_mode;
-- COMMIT;
