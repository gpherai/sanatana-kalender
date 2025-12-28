import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AlmanacHeader } from '../AlmanacHeader'

describe('AlmanacHeader', () => {
  it('renders title and location', () => {
    render(<AlmanacHeader location="Den Haag" />)

    expect(screen.getByText(/Panchang Almanac/i)).toBeInTheDocument()
    expect(screen.getByText('Den Haag')).toBeInTheDocument()
  })
})
