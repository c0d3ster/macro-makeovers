-- True when image_url holds an AI-generated stand-in rather than a real photo
alter table public.recipes add column image_is_placeholder boolean not null default false;
