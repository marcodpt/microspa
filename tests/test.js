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
  }, time || 30)
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
  }, time || 30))).then(done)
}

const lazy = (root, params) => new Promise(resolve => {
  setTimeout(() => {
    root.innerHTML = '<h1>Loaded</h1>'
    resolve()
  }, 120)
})

const rejected = (root, params) => new Promise((resolve, reject) => {
  setTimeout(() => {
    root.innerHTML = '<h1>Rejected</h1>'
    reject('Test rejected!')
  }, 120)
})

const err = (root, params) => {
  root.innerHTML = '<h1>Error</h1>'
  throw 'Test error!'
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
routes['/lazy'] = 'lazy'
routes['/loading'] = 'ms-loading'
routes['/rejected'] = 'rejected'
routes['/err'] = 'err'
routes['/error'] = 'ms-error'
routes['/404'] = 'ms-default'
microspa(app, {
  routes,
  components: {
    debug,
    lazy,
    rejected,
    err,
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
    {url: '#/simple', res: '<h1>Simple</h1>'},
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
    {url: '#/simple', res: '<h1>Simple</h1>'},
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
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {
      url: '#/transform?i=1',
      res: `<h1>Transform</h1><ms-debug data-x="i" data-y="j">${
        toStr({i: '1', x: '1'})
      }</ms-debug>`
    },
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {
      url: '#/transform?y=2',
      res: `<h1>Transform</h1><ms-debug data-x="i" data-y="j">${
        toStr({})
      }</ms-debug>`
    },
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {
      url: '#/transform?z=3',
      res: `<h1>Transform</h1><ms-debug data-x="i" data-y="j">${
        toStr({z: '3'})
      }</ms-debug>`
    },
    {url: '#/simple', res: '<h1>Simple</h1>'},
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
    {url: '#/simple', res: '<h1>Simple</h1>'},
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
    {url: '#/simple', res: '<h1>Simple</h1>'},
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
    {url: '#', res: '<h1>Home Page</h1>'},
    {
      run: () => {
        const s = document.getElementById('ms-simple')
        s.content.querySelector('h1').textContent = 'So simple!'
      },
      url: '#/simple',
      res: '<h1>So simple!</h1>'
    },
    {url: '#', res: '<h1>Home Page</h1>'},
    {
      run: () => {
        const s = document.getElementById('ms-simple')
        s.content.querySelector('h1').textContent = 'Simple'
      },
      url: '#/simple',
      res: '<h1>Simple</h1>'
    },
    {url: '#', res: '<h1>Home Page</h1>'}
  ]))
})

QUnit.module('promises', () => {
  QUnit.test('loading', test([
    {url: '#', res: '<h1>Home Page</h1>'},
    {url: '#/lazy', res: '<h1>Home Page</h1>'},
    {time: 120, res: '<h1>Loaded</h1>'},
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {url: '#/lazy', res: '<h1>Simple</h1>'},
    {url: '#', res: '<h1>Simple</h1>'},
    {time: 120, res: '<h1>Home Page</h1>'},
    {url: '#/loading', res: '<h1>Home Page</h1>'},
    {
      run: () => {
        const e = document.createElement('template')
        e.setAttribute('id', 'ms-loading')
        e.innerHTML = `
          <h1>Loading...</h1>
          <ms-simple></ms-simple>
        `
        document.body.appendChild(e)
      },
      url: '#',
      res: '<h1>Home Page</h1>',
      time: 120
    },
    {
      url: '#/lazy',
      res: `
        <h1>Loading...</h1>
        <ms-simple></ms-simple>
      `
    },
    {time: 120, res: '<h1>Loaded</h1>'},
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {
      url: '#/lazy',
      res: `
        <h1>Loading...</h1>
        <ms-simple></ms-simple>
      `
    },
    {
      url: '#',
      res: `
        <h1>Loading...</h1>
        <ms-simple></ms-simple>
      `
    },
    {time: 120, res: '<h1>Home Page</h1>'},
    {
      url: '#/loading',
      res: `
        <h1>Loading...</h1>
        <ms-simple><h1>Simple</h1></ms-simple>
      `
    },
    {
      run: () => {
        const e = document.getElementById('ms-loading')
        e.parentNode.removeChild(e)
      },
      res: `
        <h1>Loading...</h1>
        <ms-simple><h1>Simple</h1></ms-simple>
      `,
      time: 120
    },
    {url: '#', res: '<h1>Home Page</h1>'},
    {url: '#/lazy', res: '<h1>Home Page</h1>'},
    {time: 120, res: '<h1>Loaded</h1>'},
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {url: '#/lazy', res: '<h1>Simple</h1>'},
    {url: '#', res: '<h1>Simple</h1>'},
    {time: 120, res: '<h1>Home Page</h1>'},
    {url: '#/loading', res: '<h1>Home Page</h1>'},
    {
      run: () => {
        const e = document.createElement('div')
        e.setAttribute('id', 'ms-loading')
        e.setAttribute('style', 'display: none')
        e.innerHTML = `
          <h1>Loading...</h1>
          <ms-simple></ms-simple>
        `
        document.body.appendChild(e)
      },
      url: '#',
      res: '<h1>Home Page</h1>',
      time: 120
    },
    {
      url: '#/lazy',
      res: `
        <h1>Loading...</h1>
        <ms-simple></ms-simple>
      `
    },
    {time: 120, res: '<h1>Loaded</h1>'},
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {
      url: '#/lazy',
      res: `
        <h1>Loading...</h1>
        <ms-simple></ms-simple>
      `
    },
    {
      url: '#',
      res: `
        <h1>Loading...</h1>
        <ms-simple></ms-simple>
      `
    },
    {time: 120, res: '<h1>Home Page</h1>'},
    {
      url: '#/loading',
      res: `
        <h1>Loading...</h1>
        <ms-simple><h1>Simple</h1></ms-simple>
      `
    },
    {
      run: () => {
        const e = document.getElementById('ms-loading')
        e.parentNode.removeChild(e)
      },
      res: `
        <h1>Loading...</h1>
        <ms-simple><h1>Simple</h1></ms-simple>
      `,
      time: 120
    },
    {url: '#', res: '<h1>Home Page</h1>'},
    {url: '#/lazy', res: '<h1>Home Page</h1>'},
    {time: 120, res: '<h1>Loaded</h1>'},
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {url: '#/lazy', res: '<h1>Simple</h1>'},
    {url: '#', res: '<h1>Simple</h1>'},
    {time: 120, res: '<h1>Home Page</h1>'}
  ]))
  QUnit.test('error', test([
    {url: '#', res: '<h1>Home Page</h1>'},
    {url: '#/err', res: '<h1>Error</h1>'},
    {url: '#/rejected', res: '<h1>Error</h1>'},
    {time: 120, res: '<h1>Rejected</h1>'},
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {url: '#/rejected', res: '<h1>Simple</h1>'},
    {url: '#', res: '<h1>Simple</h1>'},
    {time: 120, res: '<h1>Home Page</h1>'},
    {url: '#/error', res: '<h1>Home Page</h1>'},
    {
      run: () => {
        const e = document.createElement('template')
        e.setAttribute('id', 'ms-error')
        e.innerHTML = `
          <h1>Route Fail!</h1>
          <ms-simple></ms-simple>
        `
        document.body.appendChild(e)
      },
      url: '#',
      res: '<h1>Home Page</h1>',
      time: 120
    },
    {
      url: '#/err',
      res: `
        <h1>Route Fail!</h1>
        <ms-simple></ms-simple>
      `
    },
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {url: '#/rejected', res: '<h1>Simple</h1>'},
    {
      time: 120,
      res: `
        <h1>Route Fail!</h1>
        <ms-simple></ms-simple>
      `
    },
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {url: '#/rejected', res: '<h1>Simple</h1>'},
    {url: '#', res: '<h1>Simple</h1>'},
    {time: 120, res: '<h1>Home Page</h1>'},
    {
      url: '#/error',
      res: `
        <h1>Route Fail!</h1>
        <ms-simple><h1>Simple</h1></ms-simple>
      `
    },
    {
      run: () => {
        const e = document.getElementById('ms-error')
        e.parentNode.removeChild(e)
      },
      res: `
        <h1>Route Fail!</h1>
        <ms-simple><h1>Simple</h1></ms-simple>
      `,
      time: 120
    },
    {url: '#', res: '<h1>Home Page</h1>'},
    {url: '#/err', res: '<h1>Error</h1>'},
    {url: '#/rejected', res: '<h1>Error</h1>'},
    {time: 120, res: '<h1>Rejected</h1>'},
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {url: '#/rejected', res: '<h1>Simple</h1>'},
    {url: '#', res: '<h1>Simple</h1>'},
    {time: 120, res: '<h1>Home Page</h1>'},
    {url: '#/error', res: '<h1>Home Page</h1>'},
    {
      run: () => {
        const e = document.createElement('div')
        e.setAttribute('id', 'ms-error')
        e.setAttribute('style', 'display: none')
        e.innerHTML = `
          <h1>Route Fail!</h1>
          <ms-simple></ms-simple>
        `
        document.body.appendChild(e)
      },
      url: '#',
      res: '<h1>Home Page</h1>',
      time: 120
    },
    {
      url: '#/err',
      res: `
        <h1>Route Fail!</h1>
        <ms-simple></ms-simple>
      `
    },
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {url: '#/rejected', res: '<h1>Simple</h1>'},
    {
      time: 120,
      res: `
        <h1>Route Fail!</h1>
        <ms-simple></ms-simple>
      `
    },
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {url: '#/rejected', res: '<h1>Simple</h1>'},
    {url: '#', res: '<h1>Simple</h1>'},
    {time: 120, res: '<h1>Home Page</h1>'},
    {
      url: '#/error',
      res: `
        <h1>Route Fail!</h1>
        <ms-simple><h1>Simple</h1></ms-simple>
      `
    },
    {
      run: () => {
        const e = document.getElementById('ms-error')
        e.parentNode.removeChild(e)
      },
      res: `
        <h1>Route Fail!</h1>
        <ms-simple><h1>Simple</h1></ms-simple>
      `,
      time: 120
    },
    {url: '#', res: '<h1>Home Page</h1>'},
    {url: '#/err', res: '<h1>Error</h1>'},
    {url: '#/rejected', res: '<h1>Error</h1>'},
    {time: 120, res: '<h1>Rejected</h1>'},
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {url: '#/rejected', res: '<h1>Simple</h1>'},
    {url: '#', res: '<h1>Simple</h1>'},
    {time: 120, res: '<h1>Home Page</h1>'},
    {url: '#/error', res: '<h1>Home Page</h1>'},
    {url: '#', res: '<h1>Home Page</h1>'}
  ]))
  QUnit.test('default', test([
    {url: '#', res: '<h1>Home Page</h1>'},
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {url: '#/this/is/not/found', res: '<h1>Home Page</h1>'},
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {url: '#/404', res: '<h1>Home Page</h1>'},
    {
      run: () => {
        const x = document.getElementById('ms-default')
        x.setAttribute('id', 'old-default')
        const e = document.createElement('template')
        e.setAttribute('id', 'ms-default')
        e.innerHTML = `
          <h1>Not Found</h1>
          <ms-simple></ms-simple>
        `
        document.body.appendChild(e)
      },
      res: '<h1>Home Page</h1>'
    },
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {
      url: '#',
      res: `
        <h1>Not Found</h1>
        <ms-simple><h1>Simple</h1></ms-simple>
      `
    },
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {
      url: '#/this/is/not/found',
      res: `
        <h1>Not Found</h1>
        <ms-simple><h1>Simple</h1></ms-simple>
      `
    },
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {
      url: '#/404',
      res: `
        <h1>Not Found</h1>
        <ms-simple><h1>Simple</h1></ms-simple>
      `
    },
    {
      run: () => {
        const e = document.getElementById('ms-default')
        e.parentNode.removeChild(e)
        const x = document.getElementById('old-default')
        x.setAttribute('id', 'ms-default')
      },
      res: `
        <h1>Not Found</h1>
        <ms-simple><h1>Simple</h1></ms-simple>
      `,
      time: 120
    },
    {url: '#', res: '<h1>Home Page</h1>'},
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {url: '#/this/is/not/found', res: '<h1>Home Page</h1>'},
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {url: '#/404', res: '<h1>Home Page</h1>'},
    {
      run: () => {
        const x = document.getElementById('ms-default')
        x.setAttribute('id', 'old-default')
        const e = document.createElement('div')
        e.setAttribute('id', 'ms-default')
        e.setAttribute('style', 'display: none')
        e.innerHTML = `
          <h1>Not Found</h1>
          <ms-simple></ms-simple>
        `
        document.body.appendChild(e)
      },
      res: '<h1>Home Page</h1>'
    },
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {
      url: '#',
      res: `
        <h1>Not Found</h1>
        <ms-simple><h1>Simple</h1></ms-simple>
      `
    },
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {
      url: '#/this/is/not/found',
      res: `
        <h1>Not Found</h1>
        <ms-simple><h1>Simple</h1></ms-simple>
      `
    },
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {
      url: '#/404',
      res: `
        <h1>Not Found</h1>
        <ms-simple><h1>Simple</h1></ms-simple>
      `
    },
    {
      run: () => {
        const e = document.getElementById('ms-default')
        e.parentNode.removeChild(e)
        const x = document.getElementById('old-default')
        x.setAttribute('id', 'ms-default')
      },
      res: `
        <h1>Not Found</h1>
        <ms-simple><h1>Simple</h1></ms-simple>
      `,
      time: 120
    },
    {url: '#', res: '<h1>Home Page</h1>'},
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {url: '#/this/is/not/found', res: '<h1>Home Page</h1>'},
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {url: '#/404', res: '<h1>Home Page</h1>'},
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {url: '#', res: '<h1>Home Page</h1>'}
  ]))
})

QUnit.module('stop', () => {
  //QUnit.test('route')
  //QUnit.test('component')
  //QUnit.test('view')
})
