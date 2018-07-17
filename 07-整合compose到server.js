const http = require('http')
const { request, response, context } = require('./03-封装上下文、请求、响应对象.js')

class Koa {
  constructor () {
    this.context = context
    this.request = request
    this.response = response
    this.middlewares = []
  }
  use (middleware) {
    this.middlewares.push(middleware)
    return this
  }
  createCtx (req, res) {
    const ctx = Object.create(this.context)
    ctx.request = Object.create(this.request)
    ctx.response = Object.create(this.response)
    ctx.req = ctx.request.req = req
    ctx.res = ctx.response.res = res
    return ctx
  }
  compose (middlewares) {
    return ctx => {
      return dispatch(0)
      function dispatch (index) {
        const fn = middlewares[index++]
        if (!fn || typeof fn !== 'function') return Promise.resolve()
        return Promise.resolve(fn(ctx, next))
        function next () {
          return dispatch(index)
        }
      }
    }
  }
  listen (...rest) {
    const server = http.createServer(async (req, res) => {
      const ctx = this.createCtx(req, res)
      const fn = this.compose(this.middlewares)
      await fn(ctx) 
      
      ctx.res.end(ctx.body)
    })
    server.listen(...rest)
  }
}

const app = new Koa()

const sleep = (duratioin = 2000) => new Promise((resolve) => {
  setTimeout(resolve, duratioin)
})

app.use(async (ctx, next) => {
  ctx.body = 'Hello'
  await sleep()
  await next()
  ctx.body += 'q!'
})

app.use(async (ctx, next) => {
  ctx.body += ', My name is'
  await sleep()
  await next()
})

app.use(async (ctx, next) => {
  ctx.body += ' F'
})

app.listen(8080, () => {
  console.log(`Server is running at port 8080.`)
})

























































