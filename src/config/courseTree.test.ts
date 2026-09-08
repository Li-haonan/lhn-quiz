import { describe, it, expect } from 'vitest'
import { COURSE_TREE } from './courseTree'
import { CATEGORIES } from './categories'

describe('COURSE_TREE config', () => {
  it('exposes the power AI objective and essay question banks', () => {
    expect(COURSE_TREE).toHaveLength(2)
    expect(COURSE_TREE[0]).toMatchObject({
      type: 'leaf',
      key: 'power-ai',
      label: '电力人工智能',
      category: 'power-ai',
      subBank: null,
    })
    expect(COURSE_TREE[1]).toMatchObject({
      type: 'leaf',
      key: 'power-ai-essay',
      label: '电力人工智能 · 论述题',
      route: '/essay',
    })
  })

  it('points every category leaf to a visible category', () => {
    const visibleCategories = new Set(CATEGORIES.map((category) => category.key))
    for (const node of COURSE_TREE) {
      if (node.category) expect(visibleCategories.has(node.category)).toBe(true)
    }
  })
})
