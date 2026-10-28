import type { RecipeImportInput } from '@/validations'

// A small valid recipe in the import shape
export const sampleRecipe: RecipeImportInput = {
  slug: 'test-chili',
  title: 'Test Chili',
  summary: 'A test recipe',
  servings: 4,
  prepMinutes: 10,
  cookMinutes: 40,
  costTier: 2,
  difficulty: 2,
  tags: ['Chili', 'high protein', 'chili'],
  nutrition: [
    {
      kind: 'makeover',
      label: 'Base only',
      calories: 370,
      carbsG: 42,
      fatG: 8,
      proteinG: 32,
      isDefault: false,
    },
    {
      kind: 'traditional',
      label: 'Traditional',
      calories: 480,
      carbsG: 30,
      fatG: 28,
      proteinG: 27,
      isDefault: false,
    },
  ],
  ingredients: [
    { raw: '1 lb ground turkey', quantity: 1, unit: 'lb' },
    { group: 'Umami', raw: '2 tbsp soy sauce' },
  ],
  steps: [
    { phase: 'prep', body: 'Dice the onion' },
    { phase: 'cook', body: 'Stir for 15 seconds', durationMinutes: 0.25 },
  ],
  notes: [{ kind: 'make_or_break', body: 'Simmer long enough' }],
}
