import { expect, test } from '@playwright/test'

test.describe('Home page', () => {
  test('renders the site heading', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Macro Makeovers'
    )
  })
})
