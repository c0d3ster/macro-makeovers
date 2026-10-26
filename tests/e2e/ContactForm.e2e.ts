import { expect, test } from '@playwright/test'

test.describe('Contact Form', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept the GraphQL API to prevent real emails from being sent
    await page.route('/api/graphql', async (route) => {
      const request = route.request()
      const postData = request.postDataJSON()

      // Check if this is a contact form submission
      if (postData?.query?.includes('SubmitContactForm')) {
        const variables = postData.variables?.input

        // Success response for valid submissions
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              submitContactForm: {
                id: `contact_${Date.now()}`,
                name: variables.name,
                email: variables.email,
                subject: variables.subject,
                message: variables.message,
                submittedAt: new Date().toISOString(),
              },
            },
            errors: null,
          }),
        })
      } else {
        // For other GraphQL queries, pass through
        await route.continue()
      }
    })
  })

  test('should display contact form on landing page', async ({ page }) => {
    await page.goto('/')

    // Check if the form elements are visible
    await expect(page.getByLabel('Name')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Subject')).toBeVisible()
    await expect(page.getByLabel('Message')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Send Message' })
    ).toBeVisible()
  })

  test('should show validation errors for empty form submission', async ({
    page,
  }) => {
    await page.goto('/')

    // Try to submit empty form
    await page.getByRole('button', { name: 'Send Message' }).click()

    // Inline field errors appear beneath each input
    await expect(page.locator('#name-error')).toBeVisible()
    await expect(page.locator('#subject-error')).toBeVisible()
    await expect(page.locator('#message-error')).toBeVisible()
  })

  test('should successfully submit form with valid data', async ({ page }) => {
    await page.goto('/')

    // Fill out the form
    await page.getByLabel('Name').fill('John Doe')
    await page.getByLabel('Email').fill('john@example.com')
    await page.getByLabel('Subject').fill('Website Project')
    await page
      .getByLabel('Message')
      .fill(
        'This is a test message for a website project that needs to be at least 10 characters long.'
      )

    // Submit the form
    await page.getByRole('button', { name: 'Send Message' }).click()

    // Check for success message in toast
    await expect(
      page.getByText(
        "Message sent successfully! I'll get back to you within 24 hours."
      )
    ).toBeVisible()
  })

  test('should handle invalid email format', async ({ page }) => {
    await page.goto('/')

    // Fill form with invalid email
    await page.getByLabel('Name').fill('John Doe')
    await page.getByLabel('Email').fill('invalid-email')
    await page.getByLabel('Subject').fill('Test Project')
    await page
      .getByLabel('Message')
      .fill(
        'This is a test message that is long enough to meet the minimum requirement.'
      )

    await page.getByRole('button', { name: 'Send Message' }).click()

    // Inline field error appears beneath the email input
    await expect(page.locator('#email-error')).toBeVisible()
  })

  test('should handle message too short', async ({ page }) => {
    await page.goto('/')

    // Fill form with message that's too short
    await page.getByLabel('Name').fill('John Doe')
    await page.getByLabel('Email').fill('john@example.com')
    await page.getByLabel('Subject').fill('Test Project')
    await page.getByLabel('Message').fill('Short')

    await page.getByRole('button', { name: 'Send Message' }).click()

    // Inline field error appears beneath the message textarea
    await expect(page.locator('#message-error')).toBeVisible()
  })
})
