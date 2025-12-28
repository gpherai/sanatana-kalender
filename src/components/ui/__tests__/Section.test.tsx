import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sun } from 'lucide-react'
import { Section } from '../Section'

describe('Section', () => {
  it('renders title, description, children, and icon color', () => {
    const { container } = render(
      <Section
        title="Settings"
        description="Section description"
        icon={Sun}
        iconColor="accent"
      >
        <div>Content</div>
      </Section>
    )

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByText('Section description')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()

    const icon = container.querySelector('svg')
    expect(icon).toBeTruthy()
    expect(icon).toHaveClass('text-theme-accent')
  })
})
