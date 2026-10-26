import { expect, test } from '@playwright/test'

test.describe('Home page', () => {
  test('renders the welcome heading', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 2 })).toContainText(
      'Welcome to'
    )
  })
})
