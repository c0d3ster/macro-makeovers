-- Heat from 1 (mild) to 5 (extra hot). Null means not spicy, so no chilis show.
alter table public.recipes
  add column spice_level smallint check (spice_level between 1 and 5);

-- Starting ratings for the seed recipes, for a typical eater. Unknown slugs match nothing.
update public.recipes as r
set spice_level = v.level
from (
  values
    ('kickin-fried-chicken', 3),
    ('pollo-asado-chicken-thigh-bowl', 2),
    ('red-enchilada-casserole', 2),
    ('spicy-turkey-chili', 2),
    ('cheesy-hash-brown-bacon-bake', 1),
    ('southwest-sausage-hash-brown-bake', 1),
    ('cheesy-chicken-and-broccoli-rice-bake', 1),
    ('ham-and-prosciutto-sliders', 1),
    ('turkey-taco-grillers', 1),
    ('blackened-chicken-alfredo', 1)
) as v (slug, level)
where r.slug = v.slug;
