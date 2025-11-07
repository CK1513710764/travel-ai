-- Add preferences column to trips table
-- Created: 2025-01-07
-- Description: 添加旅行偏好字段到 trips 表，用于存储每次旅行的特定偏好

ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS preferences TEXT;

COMMENT ON COLUMN public.trips.preferences IS '旅行偏好 - 用户对此次旅行的兴趣、特殊需求等（例如：喜欢美食和动漫、带孩子、喜欢历史文化）';
