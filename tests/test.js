import microspa from "../index.js"

const toStr = X => JSON.stringify(X, undefined, 2)

const text = str => str.trim()
  .replace(/>\s+</g, () => '><')
  .replace(/\s+/g, () => ' ')

const debug = (root, params) => {
  root.innerHTML = toStr(params)
}
const routes = {}
const setDebug = route => {
  routes[route] = (root, params) => debug(root, {
    route,
    ...params
  })
}

const app = document.getElementById('app')

const wait = (before, after) => () => new Promise(resolve => {
  before()
  setTimeout(() => {
    resolve(after())
  }, 10)
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
      text(typeof res != 'string' ? toStr(res) : res),
      url
    )
  }))).then(done)
}

setDebug('/:a')
setDebug('/:a/:b')
setDebug('/')
setDebug('/home')
routes['/view'] = 'ms-view'
routes['/simple'] = 'ms-simple'
routes['/force'] = 'ms-force'
routes['/transform'] = 'ms-transform'
routes['/deep'] = 'ms-deep'
routes['/debug'] = 'ms-debug'
routes['/comp'] = 'debug'
routes['/case'] = 'ms-case'
microspa(app, {
  routes,
  components: {
    debug,
    camelCase: (root) => {root.innerHTML = '<h1>camelCase</h1>'}
  }
})

QUnit.module('params', () => {
  QUnit.test('url', test({
    '/this/is/a/not/found': '<h1>Home Page</h1>',
    '/': {route: '/'},
    '/this/is/again/not/found': '<h1>Home Page</h1>',
    '/home': {route: '/home'},
    '/xxx': {route: '/:a', a: 'xxx'},
    '/home/': {route: '/:a/:b', a: 'home', b: ''},
    '/?x=4': {route: '/', x: '4'},
    '/home?x=4': {route: '/home', x: '4'},
    '/xxx?b=7': {route: '/:a', b: '7', a: 'xxx'},
    '/zzz?b=7&c=9': {route: '/:a', b: '7', c: '9', a: 'zzz'},
    '/xxx?b=7&c=9&a=yyy': {route: '/:a', b: '7', c: '9', a: 'xxx'},
    '/kkk/8?b=7&c=9&a=yyy': {route: '/:a/:b', b: '8', c: '9', a: 'kkk'},
    '/home?x.y=8': {route: '/home', 'x.y': '8'},
    '/home?x=unchanged': {route: '/home', 'x.y': '8'},
    '/?k=1&k=2': {route: '/', k: '2'},
    '/?k=unchanged': {route: '/', k: '2'},
    '/home?k[]=1&k[]=2': {route: '/home', 'k[]': '2'},
    '': '<h1>Home Page</h1>'
  }))
  QUnit.test('component', test({
    '/view': `<h1>View</h1><ms-debug>${toStr({})}</ms-debug>`,
    '/simple?i=1': '<h1>Simple</h1>',
    '/view?x=3&y=7': `<h1>View</h1><ms-debug>${toStr({
      x: '3',
      y: '7'
    })}</ms-debug>`,
    '/force': `<h1>Force</h1><ms-debug x="4" y="3">${toStr({
      x: '4',
      y: '3'
    })}</ms-debug>`,
    '/simple?i=3': '<h1>Simple</h1>',
    '/force?z=1&x=1&y=1': `<h1>Force</h1><ms-debug x="4" y="3">${toStr({
      z: '1',
      x: '4',
      y: '3'
    })}</ms-debug>`,
    '/transform': `<h1>Transform</h1><ms-debug data-x="i" data-y="j">${
      toStr({})
    }</ms-debug>`,
    '/simple?i=5': '<h1>Simple</h1>',
    '/transform?i=1': `<h1>Transform</h1><ms-debug data-x="i" data-y="j">${
      toStr({i: '1', x: '1'})
    }</ms-debug>`,
    '/simple?i=6': '<h1>Simple</h1>',
    '/transform?y=2': `<h1>Transform</h1><ms-debug data-x="i" data-y="j">${
      toStr({})
    }</ms-debug>`,
    '/simple?i=7': '<h1>Simple</h1>',
    '/transform?z=3': `<h1>Transform</h1><ms-debug data-x="i" data-y="j">${
      toStr({z: '3'})
    }</ms-debug>`,
    '/simple?i=8': '<h1>Simple</h1>',
    '/transform?x=1&y=2&z=3&j=4&i=5': `<h1>Transform</h1><ms-debug data-x="i" data-y="j">${
      toStr({x: '5', y: '4', z: '3', j: '4', i: '5'})
    }</ms-debug>`,
    '/deep': `
      <h1>Deep</h1>
      <ms-simple><h1>Simple</h1></ms-simple>
      <ms-debug>${toStr({})}</ms-debug>
    `,
    '/simple?i=9': '<h1>Simple</h1>',
    '/deep?x=3&y=7': `
      <h1>Deep</h1>
      <ms-simple><h1>Simple</h1></ms-simple>
      <ms-debug>${toStr({
        x: '3',
        y: '7'
      })}</ms-debug>
    `,
    '/simple?i=10': '<h1>Simple</h1>',
    '/debug': '<h1>Simple</h1>',
    '/comp': {},
    '/case': `
      <h1>Case</h1>
      <ms-camelcase></ms-camelcase>
      <ms-camel-case><h1>camelCase</h1></ms-camel-case>
    `,
    '': '<h1>Home Page</h1>'
  }))
})

//Test pending and error state, and prove they can and cannot be recursive
//Test stop from route, component and the app
