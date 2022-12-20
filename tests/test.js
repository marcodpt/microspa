import microspa from "../index.js"

const step = 30
const long = 120
const tick = 50

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
  }, time || step)
})

const seq = V => V.reduce(
  (p, x) => p.then(x),
  Promise.resolve()
)

const T = []
const test = Tests => assert => {
  const done = assert.async()
  seq(Tests.map(({url, time, res, run, tick, blank}) => wait(() => {
    if (blank) {
      while(T.length) {
        T.pop()
      }
    }
    if (typeof run == 'function') {
      run()
    }
    if (typeof url == 'string' && url.substr(0, 1) == '#') {
      location.replace(url)
    }
  }, () => {
    assert.equal(
      text(app.innerHTML),
      text(typeof res != 'string' ? toStr(res) : res),
      url || `wait: ${time}`
    )
    if (tick != null) {
      assert.equal(
        toStr(T),
        toStr(tick),
        `ticks: ${url || time}`
      )
    }
  }, time || step))).then(done)
}

const lazy = (root, params) => new Promise(resolve => {
  setTimeout(() => {
    root.innerHTML = '<h1>Loaded</h1>'
    resolve()
  }, long)
})

const rejected = (root, params) => new Promise((resolve, reject) => {
  setTimeout(() => {
    root.innerHTML = '<h1>Rejected</h1>'
    reject('Test rejected!')
  }, long)
})

const err = (root, params) => {
  root.innerHTML = '<h1>Error</h1>'
  throw 'Test error!'
}

const ticker = (root, {start}) => {
  start = (isNaN(start) ? 0 : parseInt(start)) - 1
  const i = T.length
  T.push(start)
  const update = () => root.innerHTML = `<h1>Tick: ${++T[i]}</h1>`
  update()
  const interval = setInterval(update, tick)
  return () => clearInterval(interval)
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
routes['/ticker/:start'] = ticker
routes['/ticker'] = 'ticker'
routes['/many'] = 'ms-many'
routes['/too/many'] = 'ms-too-many'
microspa(app, {
  routes,
  components: {
    debug,
    lazy,
    rejected,
    err,
    ticker,
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
    {time: long, res: '<h1>Loaded</h1>'},
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {url: '#/lazy', res: '<h1>Simple</h1>'},
    {url: '#', res: '<h1>Simple</h1>'},
    {time: long, res: '<h1>Home Page</h1>'},
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
      time: long
    },
    {
      url: '#/lazy',
      res: `
        <h1>Loading...</h1>
        <ms-simple></ms-simple>
      `
    },
    {time: long, res: '<h1>Loaded</h1>'},
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
    {time: long, res: '<h1>Home Page</h1>'},
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
      time: long
    },
    {url: '#', res: '<h1>Home Page</h1>'},
    {url: '#/lazy', res: '<h1>Home Page</h1>'},
    {time: long, res: '<h1>Loaded</h1>'},
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {url: '#/lazy', res: '<h1>Simple</h1>'},
    {url: '#', res: '<h1>Simple</h1>'},
    {time: long, res: '<h1>Home Page</h1>'},
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
      time: long
    },
    {
      url: '#/lazy',
      res: `
        <h1>Loading...</h1>
        <ms-simple></ms-simple>
      `
    },
    {time: long, res: '<h1>Loaded</h1>'},
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
    {time: long, res: '<h1>Home Page</h1>'},
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
      time: long
    },
    {url: '#', res: '<h1>Home Page</h1>'},
    {url: '#/lazy', res: '<h1>Home Page</h1>'},
    {time: long, res: '<h1>Loaded</h1>'},
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {url: '#/lazy', res: '<h1>Simple</h1>'},
    {url: '#', res: '<h1>Simple</h1>'},
    {time: long, res: '<h1>Home Page</h1>'}
  ]))
  QUnit.test('error', test([
    {url: '#', res: '<h1>Home Page</h1>'},
    {url: '#/err', res: '<h1>Error</h1>'},
    {url: '#/rejected', res: '<h1>Error</h1>'},
    {time: long, res: '<h1>Rejected</h1>'},
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {url: '#/rejected', res: '<h1>Simple</h1>'},
    {url: '#', res: '<h1>Simple</h1>'},
    {time: long, res: '<h1>Home Page</h1>'},
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
      time: long
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
      time: long,
      res: `
        <h1>Route Fail!</h1>
        <ms-simple></ms-simple>
      `
    },
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {url: '#/rejected', res: '<h1>Simple</h1>'},
    {url: '#', res: '<h1>Simple</h1>'},
    {time: long, res: '<h1>Home Page</h1>'},
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
      time: long
    },
    {url: '#', res: '<h1>Home Page</h1>'},
    {url: '#/err', res: '<h1>Error</h1>'},
    {url: '#/rejected', res: '<h1>Error</h1>'},
    {time: long, res: '<h1>Rejected</h1>'},
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {url: '#/rejected', res: '<h1>Simple</h1>'},
    {url: '#', res: '<h1>Simple</h1>'},
    {time: long, res: '<h1>Home Page</h1>'},
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
      time: long
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
      time: long,
      res: `
        <h1>Route Fail!</h1>
        <ms-simple></ms-simple>
      `
    },
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {url: '#/rejected', res: '<h1>Simple</h1>'},
    {url: '#', res: '<h1>Simple</h1>'},
    {time: long, res: '<h1>Home Page</h1>'},
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
      time: long
    },
    {url: '#', res: '<h1>Home Page</h1>'},
    {url: '#/err', res: '<h1>Error</h1>'},
    {url: '#/rejected', res: '<h1>Error</h1>'},
    {time: long, res: '<h1>Rejected</h1>'},
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {url: '#/rejected', res: '<h1>Simple</h1>'},
    {url: '#', res: '<h1>Simple</h1>'},
    {time: long, res: '<h1>Home Page</h1>'},
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
      time: long
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
      time: long
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
  QUnit.test('route', test([
    {url: '#', res: '<h1>Home Page</h1>', blank: true},
    {
      url: '#/ticker/5',
      res: `<h1>Tick: 5</h1>`,
      tick: [5]
    },
    {
      time: 2*tick + 10,
      res: `<h1>Tick: 7</h1>`,
      tick: [7]
    },
    {
      url: '#',
      res: '<h1>Home Page</h1>',
      tick: [7]
    },
    {
      time: long,
      res: '<h1>Home Page</h1>',
      tick: [7]
    },
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {url: '#/lazy', res: '<h1>Simple</h1>'},
    {url: '#/ticker/2', res: `<h1>Simple</h1>`, tick: [7]},
    {url: '#', res: '<h1>Simple</h1>'},
    {time: long, res: '<h1>Home Page</h1>', tick: [7]},
    {url: '#/lazy', res: '<h1>Home Page</h1>'},
    {url: '#/ticker/11', res: `<h1>Home Page</h1>`, tick: [7]},
    {
      time: long - step,
      res: `<h1>Tick: 11</h1>`,
      tick: [7, 11]
    },
    {
      time: 2*tick + 10,
      res: `<h1>Tick: 13</h1>`,
      tick: [7, 13]
    },
    {url: '#', res: '<h1>Home Page</h1>', tick: [7, 13]},
    {time: long, res: '<h1>Home Page</h1>', tick: [7, 13]}
  ]))
  QUnit.test('component', test([
    {url: '#', res: '<h1>Home Page</h1>', blank: true},
    {
      url: '#/ticker',
      res: `<h1>Tick: 0</h1>`,
      tick: [0]
    },
    {
      time: 2*tick + 10,
      res: `<h1>Tick: 2</h1>`,
      tick: [2]
    },
    {
      url: '#',
      res: '<h1>Home Page</h1>',
      tick: [2]
    },
    {
      time: long,
      res: '<h1>Home Page</h1>',
      tick: [2]
    },
    {url: '#/simple', res: '<h1>Simple</h1>'},
    {url: '#/lazy', res: '<h1>Simple</h1>'},
    {url: '#/ticker', res: `<h1>Simple</h1>`, tick: [2]},
    {url: '#', res: '<h1>Simple</h1>'},
    {time: long, res: '<h1>Home Page</h1>', tick: [2]},
    {url: '#/lazy', res: '<h1>Home Page</h1>'},
    {url: '#/ticker', res: `<h1>Home Page</h1>`, tick: [2]},
    {
      time: long - step,
      res: `<h1>Tick: 0</h1>`,
      tick: [2, 0]
    },
    {
      time: 2*tick + 10,
      res: `<h1>Tick: 2</h1>`,
      tick: [2, 2]
    },
    {url: '#', res: '<h1>Home Page</h1>', tick: [2, 2]},
    {time: long, res: '<h1>Home Page</h1>', tick: [2, 2]}
  ]))
  QUnit.test('view', test([
    {url: '#', res: '<h1>Home Page</h1>', blank: true},
    {
      tick: [1, 7],
      url: '#/many?start=1',
      res: `
        <h1>Many</h1>
        <ms-ticker><h1>Tick: 1</h1></ms-ticker>
        <ms-ticker start="7"><h1>Tick: 7</h1></ms-ticker>
      `,
    },
    {
      time: 2*tick + 10,
      tick: [3, 9],
      res: `
        <h1>Many</h1>
        <ms-ticker><h1>Tick: 3</h1></ms-ticker>
        <ms-ticker start="7"><h1>Tick: 9</h1></ms-ticker>
      `
    },
    {url: '#', res: '<h1>Home Page</h1>', tick: [3, 9]},
    {time: long, res: '<h1>Home Page</h1>', tick: [3, 9]},
    {
      tick: [3, 9, 13, 5, 13, 7],
      url: '#/too/many?start=13',
      res: `
        <h1>Too many</h1>
        <ms-ticker><h1>Tick: 13</h1></ms-ticker>
        <ms-ticker start="5"><h1>Tick: 5</h1></ms-ticker>
        <ms-many>
          <h1>Many</h1>
          <ms-ticker><h1>Tick: 13</h1></ms-ticker>
          <ms-ticker start="7"><h1>Tick: 7</h1></ms-ticker>
        </ms-many>
      `,
    },
    {
      time: 2*tick + 10,
      tick: [3, 9, 15, 7, 15, 9],
      res: `
        <h1>Too many</h1>
        <ms-ticker><h1>Tick: 15</h1></ms-ticker>
        <ms-ticker start="5"><h1>Tick: 7</h1></ms-ticker>
        <ms-many>
          <h1>Many</h1>
          <ms-ticker><h1>Tick: 15</h1></ms-ticker>
          <ms-ticker start="7"><h1>Tick: 9</h1></ms-ticker>
        </ms-many>
      `
    },
    {url: '#', res: '<h1>Home Page</h1>', tick: [3, 9, 15, 7, 15, 9]},
    {time: long, res: '<h1>Home Page</h1>', tick: [3, 9, 15, 7, 15, 9]},
  ]))
})
