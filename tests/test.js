import microspa from "../index.js"

const toStr = X => JSON.stringify(X, undefined, 2)

const text = str => str.trim()
  .replace(/>\s+</g, () => '><')
  .replace(/\s+/g, () => ' ')

const debug = (root, params) => {
  root.innerHTML = toStr(params)
}

const app = document.getElementById('app')

const wait = (before, after) => () => new Promise(resolve => {
  before()
  setTimeout(() => {
    resolve(after())
  }, 50)
})

const seq = V => V.reduce(
  (p, x) => p.then(x),
  Promise.resolve()
)

const test = Tests => assert => {
  const done = assert.async()
  seq(Object.keys(Tests).map(url => wait(() => {
    window.location.hash = '#'+url
  }, () => {
    const res = Tests[url]
    assert.equal(
      text(app.innerHTML),
      text(typeof res != 'string' ? toStr(res) : res)
    )
  }))).then(done)
}

microspa(app, {
  routes: {
    '/:a': debug,
    '/:a/:b': debug,
    '/': debug,
    '/home': debug
  }
})

QUnit.module('params', () => {
  QUnit.test('url params', test({
    '/': {},
    '/home': {},
    '/xxx': {a: 'xxx'}
  }))
})
