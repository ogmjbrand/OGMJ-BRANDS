import { describe, it, expect } from 'vitest'
import { AGENCY, AGENCY_PORTFOLIO, AGENCY_SERVICES, getPublishedPortfolio } from '@/lib/marketing/agency'

describe('agency content rules', () => {
  it('covers the five requested service areas', () => {
    const titles = AGENCY_SERVICES.map((service) => service.title)
    expect(titles).toEqual([
      'Brand Development',
      'Website & E-commerce Development',
      'Social Media & Digital Marketing',
      'Graphic Design & Content Production',
      'AI & Business Automation',
    ])
  })

  it('only renders portfolio items explicitly approved for publication', () => {
    expect(getPublishedPortfolio([
      { name: 'A', category: 'x', workDelivered: 'y', published: true },
      { name: 'B', category: 'x', workDelivered: 'y', published: false },
    ]).map((item) => item.name)).toEqual(['A'])
    // Nothing is published until the founder confirms client permission.
    expect(getPublishedPortfolio(AGENCY_PORTFOLIO)).toHaveLength(0)
  })

  it('contains no prices or invented performance claims in agency copy', () => {
    const copy = JSON.stringify({ AGENCY, AGENCY_SERVICES: AGENCY_SERVICES.map(({ icon: _icon, ...rest }) => rest), AGENCY_PORTFOLIO })
    expect(copy).not.toMatch(/\$\s?\d/)
    expect(copy).not.toMatch(/\d+\s?%/)
  })
})
