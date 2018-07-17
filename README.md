# 7步封装一个简单的Koa

- - -

## 一个简单的 http 服务

使用 node 提供的 http 模块，可以很容易的实现一个基本的 http 服务器，新建一个 application.js 文件，内容如下：

```
const http = require('http')

const server = http.createServer((req, res) => {
  res.end('Hello, Fq!')
})

server.listen(8080, () => {
  console.info('Server is running at 8080')
})
```

之后通过 node 来启动这个脚本，打开浏览器 输入地址 localhost:8080，即可访问。


## 改造成服务类

接下来在这个基础上改造一下，把 server 封装成一个对象。

```
const http = require('http')

class Application () {
  constructor () {}
  use (cb) {
    this.callback = cb
  }
  listen (...args) {
    const server = http.createServer((req, res) => {
      this.callback(req, res)
    })
    server.listen(...args)
  }
}

module.exports = Application
```

新建 server.js ，测试代码如下：

```
const Koa = require('./application.js')
const app = new Koa()

app.use((req, res) => {
  res.end('Hello, Fq!')
})

app.listen(8080, () => {
  console.log('Server started!')
})
```


## 封装上下文对象

为了实现类似 Koa 那种 `ctx.xxx` 这样的方式，先来新建3个文件：`request.js`，`response.js`，`context.js` 。

```
// request.js  以 url 为例：

const request = {
  get url () {
    return this.req.url
  }
}

module.exports = request
```

```
// response.js

const reponse = {
  get body () {
    return this._body
  },
  set body (val) {
    this._body = val
  }
}

module.exports = reponse
```

```
// context.js

const context = {
  get url () {
    return this.request.url
  },
  get body () {
	  return this.response.body
  },
  set body (val) {
    this.response.body = val
  }
}

module.exports = context
```

## 整合上下文对象到服务类

可能看到上面3个对象，会有点迷糊的感觉，下面就把这3个对象添加到 Application 类中：

```
const http = require('http')
const request = require('./require.js')
const response = require('./response.js')
const context = require('./context.js')

class Application {
  constructor () {
	  // 先把这3个属性添加到构造函数中
    this.context = context
    this.request = request
    this.response = response
  }
  use (cb) {
    this.callback = cb
  }
  createCtx (req, res) {
	  // 新建 ctx 对象，并且继承于 context
    const ctx = Object.create(this.context)
	  // 像 ctx 对象添加两个属性 request  response
    ctx.request = Object.create(this.request)
    ctx.response = Object.create(this.response)
    // 像 ctx 添加 req res 属性，同时挂载到 response request 对象上
    // req res 为 nodejs http 模块的 原生对象
    ctx.req = ctx.request.req = req
    ctx.res = ctx.response.res = res
    return ctx
  }
  listen (...args) {
	  // 这里改造成 异步形式
    const server = http.createServer(async (req, res) => {
      const ctx = this.createCtx(req, res)
      await this.callback(ctx)
      ctx.res.end(ctx.body)
    })
    server.listen(...args)
  }
}

module.exports = Application
```

修改 `server.js` 文件，再次测试：

```
const Koa = require('./application.js')
const app = new Koa()

app.use(async (ctx) => {
  ctx.body = ctx.url
})

app.listen(8080, () => {
  console.log('Server started!')
})
```


## 串联中间件

到此为止，咱们写的 Koa 只能使用一个中间件，而且还不涉及到异步，下面咱们就一起来看看 Koa 中最核心的 compose 函数，是如何把各个中间件串联起来的。

为了更容易的理解，先来写一个同步版本的，依次执行 fn1, fn2：

```
const fn1 = x => Math.pow(x, 2)
const fn2 = x => 2 * x

function compose (middlewares) {
  return (x) => {
    let ret = middlewares[0](x)
	  for (let i=1; i<middlewares.length; i++) {
      ret = middlewares[i](ret)
    }
	  return ret
  }
}

const fn = compose([fn1, fn2])

console.log(fn(2))  // 8
```

上面代码可以直接在浏览器中测试结果。

那么如果  fn1 fn2 中如果有异步操作，应该如何处理呢，实际上只需要使用 Promise 改造一下 compose 的逻辑即可。

首先实现一个测试用休眠函数：

```
const sleep = (duratioin = 2000) => new Promise((resolve) => {
  setTimeout(resolve, duratioin)
})
```

其次准备3个测试用异步函数，最终效果是实现一个洋葱圈模型：

```
const fn1 = async (next) => {
  console.log('fn1 start 休眠2秒')
  await sleep()
  await next()
  console.log('fn1 over')
}

const fn2 = async (next) => {
  console.log('fn2 start 休眠3秒')
  await sleep(3000)
  await next()
  console.log('fn2 duration....')
  await sleep(1000)
  console.log('fn2 over')
}

const fn3= async (next) => {
  console.log('fn3 start')
  await sleep()
  console.log('fn3 over')
}
```

执行的顺序为 fn1 -> fn2 -> fn3 -> fn2 -> fn1

最后就是主角`componse`

```
function compose (middlewares) {
  return (context) => {
    return dispatch(0)
    function dispatch (i) {
      const fn = middlewares[i]
      if (!fn) return Promise.resolve()
      return Promise.resolve(fn(function next () {
		  // await 的本质就是 一个返回 Promise 对象的函数
		  // 所以这里一定要 return
        return dispatch(i+1)
      }))
    }
  }
}
```

测试用例：

```
const fn = compose([fn1, fn2, fn3])

fn()
```


## 整合compose到Server

废话不说，直接上代码：

```
class Application {
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
        if (!fn || typeof fn !== 'function') {
		    return Promise.resolve()
		  }
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

module.exports = Application
```

下面可以测试一下了～

```
const Koa = require('./application.js')
const app = new Koa()

const sleep = (time) => new Promise((resolve, reject) => {
  setTimeout(resolve, time || 2000)
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
  console.log('Server started!')
})
```

到此为止，一个简单的 Koa 就实现完毕了，是不是 so easy ？
