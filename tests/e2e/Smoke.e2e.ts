import { expect, test } from '@playwright/test'

test.describe('Home page', () => {
  test('renders the site heading', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Macro Makeovers'
    )
  })

  test('sends old filter links to the recipe list', async ({ page }) => {
    await page.goto('/?goal=fat-loss')

    await expect(page).toHaveURL(/\/recipes\?goal=fat-loss$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Recipes')
  })
})

// Each page and the start of its main heading
const CONTENT_PAGES: [string, string][] = [
  ['/recipes', 'Recipes'],
  ['/guides', 'Guides'],
  ['/guides/nutrition', 'Nutrition guide'],
  ['/about', 'About'],
  ['/basket', 'Your basket'],
]

test.describe('Content pages', () => {
  for (const [path, heading] of CONTENT_PAGES) {
    test(`${path} renders its heading`, async ({ page }) => {
      await page.goto(path)

      await expect(page.getByRole('heading', { level: 1 })).toContainText(
        heading
      )
    })
  }
})
