import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MoonPhase, MoonPhaseCompact } from '../MoonPhase'

describe('MoonPhase Component', () => {
  it('renders correctly with default props', () => {
    const { container } = render(<MoonPhase percent={50} isWaxing={true} />)
    // Check if an SVG is present
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('width', '120') // Default size
  })

  it('renders custom size', () => {
    const { container } = render(<MoonPhase percent={50} isWaxing={true} size={200} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '200')
    expect(svg).toHaveAttribute('height', '200')
  })

  it('renders full moon state (snapshot)', () => {
    const { asFragment } = render(<MoonPhase percent={100} isWaxing={true} />)
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders new moon state (snapshot)', () => {
    const { asFragment } = render(<MoonPhase percent={0} isWaxing={true} />)
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders waxing crescent state (snapshot)', () => {
    const { asFragment } = render(<MoonPhase percent={25} isWaxing={true} />)
    expect(asFragment()).toMatchSnapshot()
  })
})

describe('MoonPhaseCompact Component', () => {
  it('renders phase name and percentage', () => {
    render(
      <MoonPhaseCompact
        percent={75}
        isWaxing={true}
        phaseName="Wassende Maan"
      />
    )
    
    expect(screen.getByText('Wassende Maan')).toBeInTheDocument()
    expect(screen.getByText('75% verlicht')).toBeInTheDocument()
  })
})
