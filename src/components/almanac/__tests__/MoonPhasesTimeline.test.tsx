import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MoonPhasesTimeline } from '../MoonPhasesTimeline'

describe('MoonPhasesTimeline', () => {
  it('returns null when there are no phases', () => {
    const { container } = render(
      <MoonPhasesTimeline
        moonPhases={[]}
        month={0}
        selectedDate={new Date(2025, 0, 1)}
        onSelectDate={() => {}}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders phases and handles selection', async () => {
    const onSelectDate = vi.fn()
    const phases = [
      {
        date: new Date(2025, 0, 1),
        type: 'new' as const,
        name: 'New Moon',
        emoji: 'N',
      },
      {
        date: new Date(2025, 0, 15),
        type: 'full' as const,
        name: 'Full Moon',
        emoji: 'F',
      },
    ]

    render(
      <MoonPhasesTimeline
        moonPhases={phases}
        month={0}
        selectedDate={phases[0].date}
        onSelectDate={onSelectDate}
      />
    )

    const selected = screen.getByRole('button', { name: /New Moon/i })
    expect(selected).toHaveClass('bg-theme-surface-raised')

    const other = screen.getByRole('button', { name: /Full Moon/i })
    await userEvent.click(other)

    expect(onSelectDate).toHaveBeenCalledWith(phases[1].date)
  })
})
