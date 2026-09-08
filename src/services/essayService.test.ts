import { describe, expect, it } from 'vitest'
import { validateEssayGrade } from './essayService'
import type { EssayQuestion } from '../types/essay'

const question: EssayQuestion = {
  id: 1,
  category: '测试',
  question: '测试题目',
  reference_answer: '参考答案',
  max_score: 10,
  scoring: {
    mode: 'semantic_keypoint',
    key_points: ['评分点一', '评分点二'],
    keywords: ['测试'],
  },
}

describe('validateEssayGrade', () => {
  it('normalizes a complete rubric result', () => {
    const result = validateEssayGrade(
      {
        score: 7.5,
        point_grades: [
          { status: 'full', score: 5, max_score: 5, evidence: '证据一', reason: '完整' },
          {
            status: 'partial',
            score: 2.5,
            max_score: 5,
            evidence: '证据二',
            reason: '部分',
          },
        ],
        hit_points: ['评分点一'],
        missed_points: ['评分点二不完整'],
        factual_errors: [],
        feedback: '继续补充',
        confidence: 0.9,
      },
      question,
      'test-model',
    )

    expect(result.score).toBe(7.5)
    expect(result.point_grades).toHaveLength(2)
    expect(result.model).toBe('test-model')
    expect(result.grading_version).toBe('essay-rubric-v1')
  })

  it('rejects missing rubric points', () => {
    expect(() =>
      validateEssayGrade(
        {
          score: 5,
          point_grades: [
            { status: 'full', score: 5, max_score: 5, evidence: '证据', reason: '完整' },
          ],
        },
        question,
        'test-model',
      ),
    ).toThrow(/逐项完成评分/)
  })

  it('rejects a total that differs from rubric scores', () => {
    expect(() =>
      validateEssayGrade(
        {
          score: 9,
          point_grades: [
            { status: 'full', score: 5, max_score: 5, evidence: '证据', reason: '完整' },
            { status: 'partial', score: 2, max_score: 5, evidence: '证据', reason: '部分' },
          ],
        },
        question,
        'test-model',
      ),
    ).toThrow(/分项得分不一致/)
  })
})
