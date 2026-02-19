-- Migration: Add folder column to documents table
-- Run in: Supabase Dashboard → SQL Editor
-- Date: 2026-02-19

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS folder text DEFAULT NULL;
