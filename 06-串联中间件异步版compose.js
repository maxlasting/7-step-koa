const sleep = (duratioin = 2000) => new Promise((resolve) => {
  setTimeout(resolve, duratioin)
})

// 准备几个异步函数
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

function compose (middlewares) {
  return () => {
    return dispatch(0)
    function dispatch (index) {
      const fn = middlewares[index]
      if (!fn) return Promise.resolve()
      return Promise.resolve(fn(function next () {
        console.log('exec next...')
        return dispatch(index + 1)
      }))
    }
  }
}

const app = []

app.use = app.push.bind(app)

app.use(fn1)
app.use(fn2)
app.use(fn3)

// console.log(app)

const fn = compose(app)

fn()
















