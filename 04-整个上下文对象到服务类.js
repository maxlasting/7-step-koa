const http = require('http')
const { request, response, context } = require('./03-封装上下文、请求、响应对象.js')

class Koa {
  constructor () {
    this.context = context
    this.request = request
    this.response = response
  }
  use (cb) {
    this.cb = cb
  }
  createCtx (req, res) {
    const ctx = Object.create(this.context)
    ctx.request = Object.create(this.request)
    ctx.response = Object.create(this.response)
    ctx.req = ctx.request.req = req
    ctx.res = ctx.response.res = res
    return ctx
  }
  listen (...rest) {
    const server = http.createServer(async (req, res) => {
      const ctx = this.createCtx(req, res)
         
      await this.cb(ctx) 
      
      ctx.res.end(ctx.body)
    })
    server.listen(...rest)
  }
}

const app = new Koa()

const sleep = (duratioin = 2000) => new Promise((resolve) => {
  setTimeout(resolve, duratioin)
})

app.use(async (ctx) => {
  await sleep()
  ctx.body = 'Hello, Koa!'
})

app.listen(8080, () => {
  console.log(`Server is running at port 8080.`)
})

























































