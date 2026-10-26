import { useEffect, useState } from 'react'

// Tracks which nav item is active: Contact while the #contact section is on screen
export const useActiveNavItem = (): string => {
  const [activeItem, setActiveItem] = useState('home')

  useEffect(() => {
    const contactSection = document.getElementById('contact')
    if (!contactSection) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setActiveItem('contact')
        } else {
          setActiveItem('home')
        }
      },
      {
        root: null,
        threshold: 0.25, // trigger as soon as 25% of #contact is visible
      }
    )

    observer.observe(contactSection)

    return () => observer.disconnect()
  }, [])

  return activeItem
}
