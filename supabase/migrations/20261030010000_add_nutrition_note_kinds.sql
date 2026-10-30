-- Short text around the nutrition table: a line above it that defines the builds, and analysis
-- blocks below it. Stored as notes so they get ordering, markdown, import, and diffing for free.
alter type public.note_kind add value if not exists 'nutrition_intro';
alter type public.note_kind add value if not exists 'nutrition_analysis';
