import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  vus: Number(__ENV.VUS ?? 10),
  duration: __ENV.DURATION ?? '30s',
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1000'],
  },
}

const baseUrl = __ENV.BASE_URL ?? 'http://localhost:8080'
const productId = __ENV.PRODUCT_ID

if (!productId) {
  throw new Error('PRODUCT_ID is required. Example: k6 run -e PRODUCT_ID=... src/scripts/benchmark.js')
}

export default function () {
  const response = http.get(`${baseUrl}/products/${productId}`)

  check(response, {
    'status is 200': (res) => res.status === 200,
    'cache header is present': (res) => ['HIT', 'MISS'].includes(String(res.headers['X-Cache'])),
  })

  sleep(1)
}
