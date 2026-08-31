import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { describe, expect, it, vi } from 'vitest'

type FetchEvent = {
  request: { method: string; url: string; destination: string }
  respondWith: (response: Promise<unknown>) => void
}

function loadFetchHandler() {
  let fetchHandler: ((event: FetchEvent) => void) | undefined
  const context = {
    URL,
    Response,
    Promise,
    fetch: vi.fn(),
    caches: {
      open: vi.fn(),
      keys: vi.fn(),
      delete: vi.fn(),
      match: vi.fn(),
    },
    self: {
      registration: { scope: 'https://example.com/lhn-quiz/' },
      location: { origin: 'https://example.com' },
      addEventListener: vi.fn((name: string, handler: (event: FetchEvent) => void) => {
        if (name === 'fetch') fetchHandler = handler
      }),
      skipWaiting: vi.fn(),
      clients: { claim: vi.fn() },
    },
  }

  vm.runInNewContext(readFileSync('public/sw.js', 'utf8'), context)
  if (!fetchHandler) throw new Error('Service Worker did not register a fetch handler')
  return { fetchHandler, fetchMock: context.fetch, cacheMatchMock: context.caches.match }
}

function dispatch(
  handler: (event: FetchEvent) => void,
  path: string,
  destination: string,
): Promise<unknown> {
  let response: Promise<unknown> | undefined
  handler({
    request: { method: 'GET', url: `https://example.com${path}`, destination },
    respondWith(value) {
      response = value
    },
  })
  if (!response) throw new Error('Request was not handled')
  return response
}

describe('mobile Service Worker refresh behavior', () => {
  it('bypasses stale HTTP caches for the page and JavaScript bundle', async () => {
    const { fetchHandler, fetchMock, cacheMatchMock } = loadFetchHandler()
    fetchMock.mockResolvedValue({ ok: false, type: 'basic' })
    cacheMatchMock.mockResolvedValue(undefined)

    await dispatch(fetchHandler, '/lhn-quiz/', 'document')
    await dispatch(fetchHandler, '/lhn-quiz/assets/index-old.js', 'script')

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ destination: 'document' }),
      { cache: 'no-store' },
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ destination: 'script' }),
      { cache: 'no-store' },
    )
  })

  it('keeps large question banks cache-first for mobile data usage', async () => {
    const { fetchHandler, fetchMock, cacheMatchMock } = loadFetchHandler()
    const cachedBank = { source: 'cache' }
    cacheMatchMock.mockResolvedValue(cachedBank)

    await expect(dispatch(fetchHandler, '/lhn-quiz/power-ai-question-bank.json', '')).resolves.toBe(
      cachedBank,
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
