export type EssayPracticeMode = 'outline' | 'full'

export interface EssayQuestion {
  id: number
  category: string
  question: string
  reference_answer: string
  max_score: number
  scoring: {
    mode: string
    key_points: string[]
    keywords: string[]
    suggested_rule?: string
  }
}

export interface EssayQuestionBank {
  title: string
  count: number
  source: string
  usage_note?: string
  questions: EssayQuestion[]
}

export interface EssayPointGrade {
  point_index: number
  status: 'full' | 'partial' | 'missed' | 'incorrect'
  score: number
  max_score: number
  evidence: string
  reason: string
}

export interface EssayGradeResult {
  score: number
  max_score: number
  point_grades: EssayPointGrade[]
  hit_points: string[]
  missed_points: string[]
  factual_errors: string[]
  feedback: string
  confidence: number
  grading_version: string
  model: string
}

export interface EssayAttempt {
  id?: number
  questionId: number
  answer: string
  mode: EssayPracticeMode
  score: number
  maxScore: number
  grade: EssayGradeResult
  createdAt: string
}

export interface EssayQuestionStats {
  questionId: number
  attemptCount: number
  bestScore: number
  lastScore: number
  lastAttemptAt: string
  masteryStatus: 'weak' | 'learning' | 'mastered'
}
