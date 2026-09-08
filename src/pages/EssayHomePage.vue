<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../db/database'
import { loadEssayBank } from '../services/essayService'
import type { EssayQuestion, EssayQuestionStats } from '../types/essay'

const router = useRouter()
const questions = ref<EssayQuestion[]>([])
const stats = ref<EssayQuestionStats[]>([])
const loading = ref(true)
const error = ref('')
const selectedCategory = ref('全部')
const selectedMode = ref<'outline' | 'full'>('full')

const categories = computed(() => ['全部', ...new Set(questions.value.map((q) => q.category))])
const practiced = computed(() => stats.value.length)
const mastered = computed(() => stats.value.filter((s) => s.masteryStatus === 'mastered').length)
const weak = computed(() => stats.value.filter((s) => s.masteryStatus === 'weak').length)

onMounted(async () => {
  try {
    const [bank, savedStats] = await Promise.all([loadEssayBank(), db.essayQuestionStats.toArray()])
    questions.value = bank.questions
    stats.value = savedStats
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载论述题失败'
  } finally {
    loading.value = false
  }
})

function start(order: 'sequential' | 'random', weakOnly = false) {
  const query: Record<string, string> = { order, mode: selectedMode.value }
  if (selectedCategory.value !== '全部') query.category = selectedCategory.value
  if (weakOnly) query.weak = '1'
  router.push({ path: '/essay/quiz', query })
}
</script>

<template>
  <div class="essay-home">
    <header class="page-head">
      <div>
        <span class="eyebrow">AI 语义评分</span>
        <h1>论述题训练</h1>
        <p>围绕参考答案逐项评分，不要求逐字复述。先组织自己的答案，再查看评分与补充建议。</p>
      </div>
      <button class="btn btn-outline" @click="router.push('/settings')">AI 设置</button>
    </header>

    <p v-if="loading" class="notice">正在加载题库…</p>
    <p v-else-if="error" class="notice error">{{ error }}</p>
    <template v-else>
      <section class="stats-grid" aria-label="论述题进度">
        <div>
          <strong>{{ questions.length }}</strong
          ><span>题目总数</span>
        </div>
        <div>
          <strong>{{ practiced }}</strong
          ><span>已练习</span>
        </div>
        <div>
          <strong>{{ mastered }}</strong
          ><span>已掌握</span>
        </div>
        <div>
          <strong>{{ weak }}</strong
          ><span>薄弱题</span>
        </div>
      </section>

      <section class="practice-panel">
        <div class="panel-copy">
          <h2>开始一轮练习</h2>
          <p>提交后由你在设置中配置的 AI 按内置参考答案和评分点给出 10 分制评价。</p>
        </div>
        <label>
          知识分类
          <select v-model="selectedCategory">
            <option v-for="category in categories" :key="category">{{ category }}</option>
          </select>
        </label>
        <div class="mode-choice" aria-label="作答模式">
          <button :class="{ active: selectedMode === 'full' }" @click="selectedMode = 'full'">
            <strong>完整作答</strong>
            <span>组织完整论述，逐点评分</span>
          </button>
          <button :class="{ active: selectedMode === 'outline' }" @click="selectedMode = 'outline'">
            <strong>提纲速背</strong>
            <span>只写关键词和答题框架</span>
          </button>
        </div>
        <div class="actions">
          <button class="btn btn-accent" @click="start('sequential')">顺序练习</button>
          <button class="btn btn-outline" @click="start('random')">随机练习</button>
          <button class="btn btn-outline" :disabled="weak === 0" @click="start('sequential', true)">
            薄弱题重练
          </button>
        </div>
      </section>

      <section class="category-section">
        <h2>题库范围</h2>
        <div class="category-list">
          <button
            v-for="category in categories.slice(1)"
            :key="category"
            @click="selectedCategory = category"
          >
            <span>{{ category }}</span>
            <strong>{{ questions.filter((q) => q.category === category).length }} 题</strong>
          </button>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.essay-home {
  max-width: 920px;
  margin: 0 auto;
}
.page-head {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-start;
  margin-bottom: 28px;
}
.page-head h1 {
  font-family: var(--font-display);
  font-size: clamp(30px, 5vw, 46px);
  font-weight: 500;
  margin: 4px 0 8px;
}
.page-head p,
.panel-copy p {
  color: var(--text-secondary);
  max-width: 660px;
}
.eyebrow {
  color: var(--accent);
  letter-spacing: 0.14em;
  font-size: 12px;
  font-weight: 700;
}
.notice {
  padding: 28px;
  border: 1px solid var(--border);
  background: var(--bg-card);
}
.notice.error {
  color: var(--wrong);
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border: 1px solid var(--border);
  background: var(--bg-card);
  margin-bottom: 24px;
}
.stats-grid div {
  padding: 22px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
}
.stats-grid div:last-child {
  border: 0;
}
.stats-grid strong {
  font: 32px var(--font-display);
}
.stats-grid span {
  color: var(--text-secondary);
  font-size: 13px;
}
.practice-panel {
  border-left: 4px solid var(--accent);
  background: var(--bg-card);
  padding: 26px;
  display: grid;
  gap: 20px;
  margin-bottom: 34px;
}
.practice-panel h2,
.category-section h2 {
  font-family: var(--font-display);
  font-weight: 500;
}
label {
  display: grid;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 13px;
  max-width: 360px;
}
select {
  padding: 10px 12px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-primary);
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.mode-choice {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  max-width: 560px;
}
.mode-choice button {
  display: grid;
  gap: 3px;
  padding: 12px;
  text-align: left;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-primary);
}
.mode-choice button.active {
  border-color: var(--accent);
  box-shadow: inset 3px 0 var(--accent);
}
.mode-choice span {
  color: var(--text-secondary);
  font-size: 12px;
}
.category-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  border-top: 1px solid var(--border);
  margin-top: 12px;
}
.category-list button {
  display: flex;
  justify-content: space-between;
  padding: 16px 4px;
  background: transparent;
  color: var(--text-primary);
  border: 0;
  border-bottom: 1px solid var(--border);
  text-align: left;
}
.category-list button:nth-child(odd) {
  margin-right: 24px;
}
.category-list strong {
  color: var(--text-secondary);
  font-size: 12px;
}
@media (max-width: 640px) {
  .page-head {
    flex-direction: column;
  }
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .stats-grid div:nth-child(2) {
    border-right: 0;
  }
  .stats-grid div:nth-child(-n + 2) {
    border-bottom: 1px solid var(--border);
  }
  .category-list {
    grid-template-columns: 1fr;
  }
  .mode-choice {
    grid-template-columns: 1fr;
  }
  .category-list button:nth-child(odd) {
    margin-right: 0;
  }
}
</style>
