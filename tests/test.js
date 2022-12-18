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

const wait = (before, after, time) => () => new Promise(resolve => {
  before()
  setTimeout(() => {
    resolve(after())
  }, time || 10)
})

const seq = V => V.reduce(
  (p, x) => p.then(x),
  Promise.resolve()
)

const test = Tests => assert => {
  const done = assert.async()
  seq(Tests.map(({url, time, res, run}) => wait(() => {
    if (typeof run == 'function') {
      run()
    }
    if (typeof url == 'string' && url.substr(0, 1) == '#') {
      window.location.hash = url
    }
  }, () => {
    assert.equal(
      text(app.innerHTML),
      text(typeof res != 'string' ? toStr(res) : res),
      url || `wait${time}`
    )
  }, time || 10))).then(done)
}

const loading = (root, params) => new Promise(resolve => {
  var stop = false
  setTimeout(() => {
    if (!stop) {
      root.innerHTML = '<h1>Loaded</h1>'
    }
    resolve()
  }, 40)
})

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
routes['/loading'] = 'loading'
microspa(app, {
  routes,
  components: {
    debug,
    loading,
    camelCase: (root) => {root.innerHTML = '<h1>camelCase</h1>'}
  }
})

QUnit.module('params', () => {
  QUnit.test('url', test([
    {url: '#/this/is/a/not/found', res: '<h1>Home Page</h1>'},
    {url: '#/', res: {route: '/'}},
    {url: '#/this/is/again/not/found', res: '<h1>Home Page</h1>'},
    {url: '#/home', res: {route: '/home'}},
    {url: '#/xxx', res: {route: '/:a', a: 'xxx'}},
    {url: '#/home/', res: {route: '/:a/:b', a: 'home', b: ''}},
    {url: '#/?x=4', res: {route: '/', x: '4'}},
    {url: '#/home?x=4', res: {route: '/home', x: '4'}},
    {url: '#/xxx?b=7', res: {route: '/:a', b: '7', a: 'xxx'}},
    {url: '#/zzz?b=7&c=9', res: {route: '/:a', b: '7', c: '9', a: 'zzz'}},
    {
      url: '#/xxx?b=7&c=9&a=yyy',
      res: {route: '/:a', b: '7', c: '9', a: 'xxx'}
    },
    {
      url: '#/kkk/8?b=7&c=9&a=yyy',
      res: {route: '/:a/:b', b: '8', c: '9', a: 'kkk'}
    },
    {url: '#/home?x.y=8', res: {route: '/home', 'x.y': '8'}},
    {url: '#/home?x=unchanged', res: {route: '/home', 'x.y': '8'}},
    {url: '#/?k=1&k=2', res: {route: '/', k: '2'}},
    {url: '#/?k=unchanged', res: {route: '/', k: '2'}},
    {url: '#/home?k[]=1&k[]=2', res: {route: '/home', 'k[]': '2'}},
    {url: '#', res: '<h1>Home Page</h1>'}
  ]))
  QUnit.test('component', test([
    {url: '#/view', res: `<h1>View</h1><ms-debug>${toStr({})}</ms-debug>`},
    {url: '#/simple?i=1', res: '<h1>Simple</h1>'},
    {
      url: '#/view?x=3&y=7',
      res: `<h1>View</h1><ms-debug>${toStr({
        x: '3',
        y: '7'
      })}</ms-debug>`
    },
    {
      url: '#/force',
      res: `<h1>Force</h1><ms-debug x="4" y="3">${toStr({
        x: '4',
        y: '3'
      })}</ms-debug>`
    },
    {url: '#/simple?i=3', res: '<h1>Simple</h1>'},
    {
      url: '#/force?z=1&x=1&y=1',
      res: `<h1>Force</h1><ms-debug x="4" y="3">${toStr({
        z: '1',
        x: '4',
        y: '3'
      })}</ms-debug>`
    },
    {
      url: '#/transform',
      res: `<h1>Transform</h1><ms-debug data-x="i" data-y="j">${
        toStr({})
      }</ms-debug>`
    },
    {url: '#/simple?i=5', res: '<h1>Simple</h1>'},
    {
      url: '#/transform?i=1',
      res: `<h1>Transform</h1><ms-debug data-x="i" data-y="j">${
        toStr({i: '1', x: '1'})
      }</ms-debug>`
    },
    {url: '#/simple?i=6', res: '<h1>Simple</h1>'},
    {
      url: '#/transform?y=2',
      res: `<h1>Transform</h1><ms-debug data-x="i" data-y="j">${
        toStr({})
      }</ms-debug>`
    },
    {url: '#/simple?i=7', res: '<h1>Simple</h1>'},
    {
      url: '#/transform?z=3',
      res: `<h1>Transform</h1><ms-debug data-x="i" data-y="j">${
        toStr({z: '3'})
      }</ms-debug>`
    },
    {url: '#/simple?i=8', res: '<h1>Simple</h1>'},
    {
      url: '#/transform?x=1&y=2&z=3&j=4&i=5',
      res: `<h1>Transform</h1><ms-debug data-x="i" data-y="j">${
        toStr({x: '5', y: '4', z: '3', j: '4', i: '5'})
      }</ms-debug>`
    },
    {
      url: '#/deep',
      res: `
        <h1>Deep</h1>
        <ms-simple><h1>Simple</h1></ms-simple>
        <ms-debug>${toStr({})}</ms-debug>
      `
    },
    {url: '#/simple?i=9', res: '<h1>Simple</h1>'},
    {
      url: '#/deep?x=3&y=7',
      res: `
        <h1>Deep</h1>
        <ms-simple><h1>Simple</h1></ms-simple>
        <ms-debug>${toStr({
          x: '3',
          y: '7'
        })}</ms-debug>
      `
    },
    {url: '#/simple?i=10', res: '<h1>Simple</h1>'},
    {url: '#/debug', res: '<h1>Simple</h1>'},
    {url: '#/comp', res: {}},
    {
      url: '#/case',
      res: `
        <h1>Case</h1>
        <ms-camelcase></ms-camelcase>
        <ms-camel-case><h1>camelCase</h1></ms-camel-case>
      `
    },
    {url: '#?v=1', res: '<h1>Home Page</h1>'},
    {
      run: () => {
        const s = document.getElementById('ms-simple')
        s.content.querySelector('h1').textContent = 'So simple!'
      },
      url: '#/simple?i=11',
      res: '<h1>So simple!</h1>'
    },
    {url: '#?v=2', res: '<h1>Home Page</h1>'},
    {
      run: () => {
        const s = document.getElementById('ms-simple')
        s.content.querySelector('h1').textContent = 'Simple'
      },
      url: '#/simple?i=12',
      res: '<h1>Simple</h1>'
    },
    {url: '#', res: '<h1>Home Page</h1>'}
  ]))
})

QUnit.module('promises', () => {
  QUnit.test('loading', test([
    {url: '#?v1', res: '<h1>Home Page</h1>'},
    {url: '#/loading', res: '<h1>Home Page</h1>'},
    {time: 40, res: '<h1>Loaded</h1>'},
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {url: '#/loading?v', res: '<h1>Simple</h1>'},
    {url: '#', res: '<h1>Simple</h1>'},
    {time: 40, res: '<h1>Home Page</h1>'}
  ]))
  //QUnit.test('error')
  //QUnit.test('no default')
  //QUnit.test('default')
})

QUnit.module('stop', () => {
  //QUnit.test('route')
  //QUnit.test('component')
  //QUnit.test('view')
})
