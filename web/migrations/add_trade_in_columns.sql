-- Migration: Add trade-in columns to user_preferences table
-- Run this in Supabase SQL Editor

alter table public.user_preferences
  add column if not exists trade_in_value_cents bigint,
  add column if not exists trade_in_vin text,
  add column if not exists trade_in_condition_score integer,
  add column if not exists trade_in_condition_issues jsonb,
  add column if not exists trade_in_image_url text,
  add column if not exists trade_in_last_estimated_at timestamptz;

-- Optional: Create index if it doesn't exist
create index if not exists idx_user_preferences_user_id on public.user_preferences(user_id);

