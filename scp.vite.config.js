/**
 * 此文件用于处理`SCP`问题
 */

const scriptSrc = new Set([
  "'self'",
  "'unsafe-inline'",
  // "'unsafe-eval'", // 此策略将出现警告信息
  'resource:',
  'blob:'
])

const connectSrc = new Set(["'self'", 'ws://127.0.0.1:*', 'http://localhost:*', 'ws://localhost:*'])

const frameSrc = new Set(["'self'", 'http://localhost:*', 'http://127.0.0.1:*', 'blob:'])

/**
 * 将我们自定义的协议注册自CSP
 */
const cspConfigPolicy = {
  'default-src': ["'none'"],
  'child-src': ["'self'", 'blob:', 'https://*.google.com', 'https://*.gstatic.com'],
  'script-src': Array.from(scriptSrc),
  'connect-src': Array.from(connectSrc),
  'img-src': ['*', 'data:', 'blob:', 'sugar:'],
  'frame-src': Array.from(frameSrc),
  'style-src': ['*', "'unsafe-inline'"],
  'font-src': ['https://*.gstatic.com'],
  'object-src': ["'none'"],
  'form-action': ["'none'"],
  'manifest-src': ["'self'"],
  'base-uri': ["'none'"],
  'block-all-mixed-content': [';']
}
export function cspPlugin() {
  return {
    name: 'vite-plugin-csp',
    transformIndexHtml(html) {
      const cspString = Object.entries(cspConfigPolicy)
        .map(([directive, sources]) => {
          return `${directive} ${sources.join(' ')}`
        })
        .join('; ')

      return html.replace(
        '<head>',
        `<head><meta http-equiv="Content-Security-Policy" content="${cspString}">`
      )
    }
  }
}
