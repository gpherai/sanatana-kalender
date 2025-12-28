import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PageLayout } from '../PageLayout'

describe('PageLayout', () => {
  it('shows loading state when loading is true', () => {
    render(<PageLayout loading loadingMessage="Loading..." />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Child')).not.toBeInTheDocument()
  })

  it('applies width, spacing, and custom classes', () => {
    const { container } = render(
      <PageLayout width="narrow" spacing className="custom-class">
        <div>Child</div>
      </PageLayout>
    )

    const main = container.querySelector('main')
    expect(main).toBeTruthy()
    expect(main).toHaveClass('max-w-2xl')
    expect(main).toHaveClass('space-y-8')
    expect(main).toHaveClass('custom-class')
    expect(screen.getByText('Child')).toBeInTheDocument()
  })
})
