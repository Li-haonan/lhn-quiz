<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '../db/database'
import { gradeEssayAnswer, loadEssayBank, recordEssayAttempt } from '../services/essayService'
import type { EssayGradeResult, EssayPracticeMode, EssayQuestion } from '../types/essay'

const route = useRoute()
const router = useRouter()
const questions = ref<EssayQuestion[]>([])
const index = ref(0)
const answer = ref('')
const grade = ref<EssayGradeResult | null>(null)
const showReference = ref(false)
const loading = ref(true)
const grading = ref(false)
const error = ref('')
const mode = (route.query.mode === 'outline' ? 'outline' : 'full') as EssayPracticeMode
const current = computed(() => questions.value[index.value])
const progress = computed(() =>
  questions.value.length ? ((index.value + 1) / questions.value.length) * 100 : 0,
)

onMounted(async () => {
  try {
    const bank = await loadEssayBank()
    let pool = [...bank.questions]
    if (typeof route.query.category === 'string')
      pool = pool.filter((q) => q.category === route.query.category)
    if (route.query.weak === '1') {
      const weakStats = await db.essayQuestionStats.where('masteryStatus').equals('weak').toArray()
      const ids = new Set(weakStats.map((s) => s.questionId))
      pool = pool.filter((q) => ids.has(q.id))
    }
    if (route.query.order === 'random') pool.sort(() => Math.random() - 0.5)
    questions.value = pool
    restoreDraft()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载论述题失败'
  } finally {
    loading.value = false
  }
})

function draftKey() {
  return current.value ? `essay-draft-${current.value.id}` : ''
}
function restoreDraft() {
  answer.value = draftKey() ? (localStorage.getItem(draftKey()) ?? '') : ''
}
watch(answer, (value) => {
  if (draftKey() && !grade.value) localStorage.setItem(draftKey(), value)
})

async function submit() {
  if (!current.value || !answer.value.trim() || grading.value) return
  grading.value = true
  error.value = ''
  try {
    const result = await gradeEssayAnswer(current.value, answer.value.trim())
    grade.value = result
    await recordEssayAttempt(current.value, answer.value.trim(), mode, result)
    localStorage.removeItem(draftKey())
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'AI 评分失败，请稍后重试'
  } finally {
    grading.value = false
  }
}

function next() {
  if (index.value >= questions.value.length - 1) {
    router.push('/essay')
    return
  }
  index.value++
  grade.value = null
  showReference.value = false
  restoreDraft()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function retry() {
  grade.value = null
  showReference.value = false
}
</script>

<template>
  <div class="essay-quiz">
    <p v-if="loading" class="state">正在准备题目…</p>
    <div v-else-if="error && !current" class="state error">
      {{ error }} <button class="btn btn-outline" @click="router.push('/essay')">返回</button>
    </div>
    <div v-else-if="!current" class="state">
      没有符合条件的题目。
      <button class="btn btn-outline" @click="router.push('/essay')">返回</button>
    </div>
    <template v-else>
      <header class="quiz-head">
        <button class="back" @click="router.push('/essay')">← 退出练习</button>
        <span>{{ index + 1 }} / {{ questions.length }}</span>
        <span>{{ current.category }}</span>
      </header>
      <div class="progress"><div :style="{ width: progress + '%' }" /></div>

      <article class="question-card">
        <span class="question-number">论述题 {{ current.id }}</span>
        <h1>{{ current.question }}</h1>
        <div class="answer-meta">
          <span>{{ mode === 'outline' ? '提纲作答' : '完整作答' }}</span
          ><span>{{ answer.length }} 字</span>
        </div>
        <textarea
          v-model="answer"
          :disabled="!!grade || grading"
          rows="12"
          placeholder="在这里组织你的答案。建议先分点作答，再提交 AI 评分……"
        />
        <p v-if="error" class="error-message">{{ error }}</p>
        <div v-if="!grade" class="submit-row">
          <span>AI 将依据内置参考答案逐项评分</span>
          <button
            class="btn btn-accent btn-lg"
            :disabled="!answer.trim() || grading"
            @click="submit"
          >
            {{ grading ? 'AI 正在阅卷…' : '提交评分' }}
          </button>
        </div>
      </article>

      <section v-if="grade" class="grade-panel">
        <div class="score-block">
          <strong>{{ grade.score }}</strong
          ><span>/ {{ grade.max_score }} 分</span
          ><small>AI 评分 · 置信度 {{ Math.round(grade.confidence * 100) }}%</small>
        </div>
        <div class="feedback">
          <h2>总体建议</h2>
          <p>{{ grade.feedback || '继续结合评分点完善答案。' }}</p>
        </div>
        <div class="point-list">
          <h2>评分点明细</h2>
          <article
            v-for="(point, pointIndex) in grade.point_grades"
            :key="pointIndex"
            :class="['point', point.status]"
          >
            <div class="point-head">
              <span>{{
                point.status === 'full'
                  ? '已覆盖'
                  : point.status === 'partial'
                    ? '部分覆盖'
                    : point.status === 'incorrect'
                      ? '存在错误'
                      : '未覆盖'
              }}</span
              ><strong>{{ point.score }} / {{ point.max_score }}</strong>
            </div>
            <p>{{ current.scoring.key_points[pointIndex] }}</p>
            <small v-if="point.evidence">你的答案：{{ point.evidence }}</small>
            <small>{{ point.reason }}</small>
          </article>
        </div>
        <div v-if="grade.factual_errors.length" class="fact-errors">
          <h2>需要纠正</h2>
          <ul>
            <li v-for="item in grade.factual_errors" :key="item">{{ item }}</li>
          </ul>
        </div>
        <div class="reference">
          <button class="btn btn-outline" @click="showReference = !showReference">
            {{ showReference ? '收起参考答案' : '查看参考答案' }}
          </button>
          <div v-if="showReference" class="reference-text">{{ current.reference_answer }}</div>
        </div>
        <div class="next-row">
          <button class="btn btn-outline" @click="retry">重新作答</button
          ><button class="btn btn-accent" @click="next">
            {{ index === questions.length - 1 ? '完成练习' : '下一题' }}
          </button>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.essay-quiz {
  max-width: 860px;
  margin: 0 auto;
}
.state {
  border: 1px solid var(--border);
  padding: 28px;
  background: var(--bg-card);
}
.state.error,
.error-message {
  color: var(--wrong);
}
.quiz-head {
  display: flex;
  justify-content: space-between;
  color: var(--text-secondary);
  font-size: 13px;
  align-items: center;
}
.back {
  border: 0;
  background: transparent;
  color: var(--text-secondary);
}
.progress {
  height: 3px;
  background: var(--border);
  margin: 14px 0 24px;
}
.progress div {
  height: 100%;
  background: var(--accent);
  transition: width 0.25s;
}
.question-card,
.grade-panel {
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: clamp(20px, 5vw, 42px);
}
.question-number {
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}
h1 {
  font: 500 clamp(22px, 4vw, 30px)/1.55 var(--font-display);
  margin: 10px 0 24px;
}
.answer-meta {
  display: flex;
  justify-content: space-between;
  color: var(--text-secondary);
  font-size: 12px;
  margin-bottom: 6px;
}
textarea {
  width: 100%;
  resize: vertical;
  min-height: 260px;
  padding: 16px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-primary);
  font: 15px/1.8 var(--font-body);
}
textarea:focus {
  border-color: var(--accent);
  outline: 1px solid var(--accent);
}
.submit-row,
.next-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 18px;
}
.submit-row span {
  color: var(--text-secondary);
  font-size: 12px;
}
.grade-panel {
  margin-top: 20px;
  border-top: 4px solid var(--accent);
}
.score-block {
  display: flex;
  align-items: baseline;
  gap: 7px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 20px;
}
.score-block strong {
  font: 56px var(--font-display);
  color: var(--accent);
}
.score-block span {
  color: var(--text-secondary);
}
.score-block small {
  margin-left: auto;
  color: var(--text-muted);
}
.feedback {
  padding: 24px 0;
}
.feedback h2,
.point-list h2,
.fact-errors h2 {
  font: 500 18px var(--font-display);
  margin-bottom: 8px;
}
.feedback p {
  color: var(--text-secondary);
}
.point {
  padding: 16px;
  border-left: 3px solid var(--border);
  background: var(--bg);
  margin: 10px 0;
}
.point.full {
  border-color: var(--correct);
}
.point.partial {
  border-color: var(--warning);
}
.point.incorrect {
  border-color: var(--wrong);
}
.point-head {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 7px;
}
.point p {
  font-size: 14px;
}
.point small {
  display: block;
  color: var(--text-secondary);
  margin-top: 7px;
}
.fact-errors {
  color: var(--wrong);
  padding: 18px 0;
}
.fact-errors ul {
  padding-left: 20px;
}
.reference {
  border-top: 1px solid var(--border);
  padding-top: 22px;
}
.reference-text {
  white-space: pre-wrap;
  margin-top: 16px;
  padding: 18px;
  background: var(--bg);
  line-height: 1.8;
}
@media (max-width: 600px) {
  .submit-row {
    align-items: stretch;
    flex-direction: column;
  }
  .score-block {
    flex-wrap: wrap;
  }
  .score-block small {
    width: 100%;
    margin: 0;
  }
}
</style>
