// 请求对象，以 ctx.url 为例
const request = {
  get url () {
    // 先不要纠结这里的 req ，后面肯定要给 request 挂在一个对象 key 就叫 req
    return this.req.url
  }
}

// 响应对象，以 ctx.body 为例
const response = {
  get body () {
    return this._body
  },
  set body (val) {
    this._body = val
  }
}

// 上下文对象 context
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

module.exports = { request, response, context }

