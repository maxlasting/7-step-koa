const http = require('http')

class Express {
  constructor () {}
  use (cb) {
    this.cb = cb
  }
  listen (...rest) {
    const server = http.createServer((req, res) => {
      this.cb(req, res)
    })
    server.listen(...rest)
  }
}

const app = new Express()

app.use((req, res) => {
  res.end('Hello')
})

app.listen(8080, () => {
  console.log('Server is running at port 8080.')
})