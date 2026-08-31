import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
app.mount('#app')

// Service Worker 注册 + 自动升级。移动端用户很容易错过升级提示，从而长期运行
// 缓存中的旧 JS；因此发现已安装的新 worker 后立即激活并刷新应用。
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = new URL('sw.js', location.href).href
    navigator.serviceWorker
      .register(swUrl, { updateViaCache: 'none' })
      .then((reg) => {
        // register() may return a registration that was already waiting before
        // this page loaded. Do not wait for another updatefound event.
        reg.waiting?.postMessage('SKIP_WAITING')
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (!newWorker) return
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              newWorker.postMessage('SKIP_WAITING')
            }
          })
        })
        // Explicitly check on every full page load rather than relying on the
        // browser's service-worker update interval (which can be long on mobile).
        void reg.update()
      })
      .catch((err) => console.warn('SW 注册失败:', err))

    // SW 接管后自动刷新一次，让新资源生效
    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    })
  })
}
