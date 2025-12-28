import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LocationSection } from '../LocationSection'
import { PRESET_LOCATIONS } from '@/lib/constants'

describe('LocationSection', () => {
  it('calls onLocationPreset when preset is selected', () => {
    const onLocationPreset = vi.fn()

    render(
      <LocationSection
        locationName="Den Haag"
        locationLat={52.07}
        locationLon={4.3}
        dailyInfo={null}
        onLocationPreset={onLocationPreset}
        onLocationChange={() => {}}
      />
    )

    const preset = PRESET_LOCATIONS[0]
    const button = screen.getByRole('button', { name: preset.name })
    fireEvent.click(button)

    expect(onLocationPreset).toHaveBeenCalledWith(preset)
  })

  it('calls onLocationChange for input updates', () => {
    const onLocationChange = vi.fn()

    render(
      <LocationSection
        locationName="Den Haag"
        locationLat={52.07}
        locationLon={4.3}
        dailyInfo={null}
        onLocationPreset={() => {}}
        onLocationChange={onLocationChange}
      />
    )

    fireEvent.change(screen.getByLabelText(/Naam/i), {
      target: { value: 'Utrecht' },
    })
    fireEvent.change(screen.getByLabelText(/Breedtegraad/i), {
      target: { value: '52.1' },
    })
    fireEvent.change(screen.getByLabelText(/Lengtegraad/i), {
      target: { value: '5.1' },
    })

    expect(onLocationChange).toHaveBeenCalledWith('locationName', 'Utrecht')
    expect(onLocationChange).toHaveBeenCalledWith('locationLat', 52.1)
    expect(onLocationChange).toHaveBeenCalledWith('locationLon', 5.1)
  })

  it('renders daily info when provided', () => {
    render(
      <LocationSection
        locationName="Den Haag"
        locationLat={52.07}
        locationLon={4.3}
        dailyInfo={{
          sunrise: '06:00',
          sunset: '18:00',
          moonPhasePercent: 42,
          moonPhaseName: 'Waxing',
          isWaxing: true,
        }}
        onLocationPreset={() => {}}
        onLocationChange={() => {}}
      />
    )

    expect(screen.getByText('06:00')).toBeInTheDocument()
    expect(screen.getByText('18:00')).toBeInTheDocument()
    expect(screen.getByText('Waxing')).toBeInTheDocument()
    expect(screen.getByText('42%')).toBeInTheDocument()
  })
})
