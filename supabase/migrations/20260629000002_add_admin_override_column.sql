-- Add admin_override column to add_money_time_slots table
-- Run this in Supabase SQL Editor if the column is missing
ALTER TABLE add_money_time_slots
  ADD COLUMN IF NOT EXISTS admin_override boolean NOT NULL DEFAULT false;
