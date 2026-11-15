import { expect, test } from '@playwright/test'

const DISH = 'What dish should we make over?'
const RECIPE = 'Recipe link (optional)'
const DETAILS = 'Anything else? (optional)'
const SUBMIT = 'Send my idea'

test.describe('Makeover idea form', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept the GraphQL API so no real email is sent
    await page.route('/api/graphql', async (route) => {
      const postData = route.request().postDataJSON()

      if (!postData?.query?.includes('SubmitContactForm')) {
        await route.continue()
        return
      }

      const input = postData.variables?.input
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            submitContactForm: {
              id: `contact_${Date.now()}`,
              name: input.name,
              email: input.email,
              dish: input.dish,
              recipeUrl: input.recipeUrl,
              details: input.details,
              submittedAt: new Date().toISOString(),
            },
          },
          errors: null,
        }),
      })
    })
  })

  test('shows the form on the about page', async ({ page }) => {
    await page.goto('/about')

    await expect(
      page.getByRole('heading', { name: 'Have an idea for a macro makeover?' })
    ).toBeVisible()
    await expect(page.getByLabel('Name')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel(DISH)).toBeVisible()
    await expect(page.getByLabel(RECIPE)).toBeVisible()
    await expect(page.getByLabel(DETAILS)).toBeVisible()
    await expect(page.getByRole('button', { name: SUBMIT })).toBeVisible()
  })

  test('shows errors for an empty submission', async ({ page }) => {
    await page.goto('/about')

    await page.getByRole('button', { name: SUBMIT }).click()

    await expect(page.locator('#name-error')).toBeVisible()
    await expect(page.locator('#email-error')).toBeVisible()
    await expect(page.locator('#dish-error')).toBeVisible()
  })

  test('sends an idea with only the required fields', async ({ page }) => {
    await page.goto('/about')

    await page.getByLabel('Name').fill('Jane Doe')
    await page.getByLabel('Email').fill('jane@example.com')
    await page.getByLabel(DISH).fill('Chicken parm')
    await page.getByRole('button', { name: SUBMIT }).click()

    await expect(
      page.getByText('Thanks! Your makeover idea is in.')
    ).toBeVisible()
  })

  test('rejects an invalid email', async ({ page }) => {
    await page.goto('/about')

    await page.getByLabel('Name').fill('Jane Doe')
    await page.getByLabel('Email').fill('invalid-email')
    await page.getByLabel(DISH).fill('Chicken parm')
    await page.getByRole('button', { name: SUBMIT }).click()

    await expect(page.locator('#email-error')).toBeVisible()
  })

  test('rejects a recipe link that is not a full URL', async ({ page }) => {
    await page.goto('/about')

    await page.getByLabel('Name').fill('Jane Doe')
    await page.getByLabel('Email').fill('jane@example.com')
    await page.getByLabel(DISH).fill('Chicken parm')
    await page.getByLabel(RECIPE).fill('chicken parm recipe')
    await page.getByRole('button', { name: SUBMIT }).click()

    await expect(page.locator('#recipeUrl-error')).toBeVisible()
  })
})
