// 两个函数，依此运算
const fn1 = x => x * 2
const fn2 = x => x + 10

function compose(...rest) {
  return x => {
    let ret = rest[0](x)
    for (let i=1; i<rest.length; i++) {
      ret = rest[i](ret)
    }
    return ret
  }
}

const fn = compose(fn1, fn2)

const ret = fn(5)

console.log(ret) // 20