// Stand-in photos kept in public/images until real photos are uploaded. A recipe's own image_url
// always wins over these.
const PLACEHOLDER_PHOTOS: Record<string, string> = {
  'blackened-chicken-alfredo': '/images/01-blackened-chicken-alfredo.jpg',
  'spicy-turkey-chili': '/images/02-spicy-turkey-chili.jpg',
  'turkey-taco-grillers': '/images/03-turkey-taco-grillers-or-lean-beef.jpg',
  'ham-and-prosciutto-sliders': '/images/04-ham-prosciutto-sliders.jpg',
  'greek-yogurt-tuna-melt': '/images/05-greek-yogurt-tuna-melt.jpg',
  'cheesy-chicken-and-broccoli-rice-bake':
    '/images/06-cheesy-chicken-and-broccoli-rice-bake.jpg',
  'lemon-pepper-shrimp-pesto-linguine':
    '/images/07-lemon-pepper-shrimp-pesto-linguine.jpg',
  'kickin-fried-chicken': '/images/08-kickin-fried-chicken.jpg',
  'beef-bulgogi': '/images/09-beef-bulgogi.jpg',
  'cheesy-hash-brown-bacon-bake': '/images/10-cheesy-hash-brown-bacon-bake.jpg',
  'southwest-sausage-hash-brown-bake':
    '/images/10a-southwest-sausage-hash-brown-bake.jpg',
  'pollo-asado-chicken-thigh-bowl':
    '/images/11-pollo-asado-chicken-thigh-bowl.jpg',
  'shake-n-bake-pork-chops': '/images/12-shake-n-bake-pork-chops.jpg',
  'red-enchilada-casserole': '/images/13-red-enchilada-casserole.jpg',
}

export const placeholderPhotoFor = (slug: string): string | undefined =>
  PLACEHOLDER_PHOTOS[slug]
