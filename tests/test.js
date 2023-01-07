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
      text(typeof res == 'string' ? res :
        `<ms-debug${res.route ? ` route="${res.route}"` : ''}>${toStr(res)}</ms-debug>`
      ),
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

microspa(app, {
  debug,
  lazy,
  rejected,
  err,
  ticker,
  camelCase: (root) => {root.innerHTML = '<h1>camelCase</h1>'},
  simple: (root) => {root.innerHTML = '<h1>Simple</h1>'}
})

QUnit.module('params', () => {
  QUnit.test('url', test([
    {url: '#/this/is/a/not/found', res: '<h1>Home Page</h1>'},
    {url: '#/', res: '<h1>Home Page</h1>'},
    {url: '#/this/is/again/not/found', res: '<h1>Home Page</h1>'},
    {url: '#/home', res: {route: '/home'}},
    {url: '#/xxx', res: {a: 'xxx', route: '/:a'}},
    {url: '#/home/', res: {a: 'home', b: '', route: '/:a/:b'}},
    {url: '#/xxx?x=4', res: {x: '4', a: 'xxx', route: '/:a'}},
    {url: '#/home?x=4', res: {x: '4', route: '/home'}},
    {url: '#/xxx?b=7', res: {b: '7', a: 'xxx', route: '/:a'}},
    {url: '#/zzz?b=7&c=9', res: {b: '7', c: '9', a: 'zzz', route: '/:a'}},
    {
      url: '#/xxx?b=7&c=9&a=yyy',
      res: {b: '7', c: '9', a: 'xxx', route: '/:a'}
    },
    {
      url: '#/kkk/8?b=7&c=9&a=yyy',
      res: {b: '8', c: '9', a: 'kkk', route: '/:a/:b'}
    },
    {url: '#/home?x.y=8', res: {'x.y': '8', route: '/home'}},
    {url: '#/home?x=unchanged', res: {'x.y': '8', route: '/home'}},
    {url: '#/xxx?k=1&k=2', res: {k: '2', a: 'xxx', route: '/:a'}},
    {url: '#/xxx?k=unchanged', res: {k: '2', a: 'xxx', route: '/:a'}},
    {url: '#/home?k[]=1&k[]=2', res: {'k[]': '2', route: '/home'}},
    {url: '#', res: '<h1>Home Page</h1>'}
  ]))
  QUnit.test('component', test([
    {url: '#/view', res: `<h1>View</h1><ms-debug>${toStr({})}</ms-debug>`},
    {url: '#/simple', res: '<ms-simple><h1>Simple</h1></ms-simple>'},
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
    {url: '#/simple', res: '<ms-simple><h1>Simple</h1></ms-simple>'},
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
    {url: '#/simple', res: '<ms-simple><h1>Simple</h1></ms-simple>'},
    {
      url: '#/transform?i=1',
      res: `<h1>Transform</h1><ms-debug data-x="i" data-y="j">${
        toStr({i: '1', x: '1'})
      }</ms-debug>`
    },
    {url: '#/simple', res: '<ms-simple><h1>Simple</h1></ms-simple>'},
    {
      url: '#/transform?y=2',
      res: `<h1>Transform</h1><ms-debug data-x="i" data-y="j">${
        toStr({})
      }</ms-debug>`
    },
    {url: '#/simple', res: '<ms-simple><h1>Simple</h1></ms-simple>'},
    {
      url: '#/transform?z=3',
      res: `<h1>Transform</h1><ms-debug data-x="i" data-y="j">${
        toStr({z: '3'})
      }</ms-debug>`
    },
    {url: '#/simple', res: '<ms-simple><h1>Simple</h1></ms-simple>'},
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
    {url: '#/simple', res: '<ms-simple><h1>Simple</h1></ms-simple>'},
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
    {url: '#/simple', res: '<ms-simple><h1>Simple</h1></ms-simple>'},
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
  ]))
})

QUnit.module('promises', () => {
  QUnit.test('loading', test([
    {url: '#', res: '<h1>Home Page</h1>'},
    {url: '#/lazy', res: '<ms-lazy></ms-lazy>'},
    {time: long, res: '<ms-lazy><h1>Loaded</h1></ms-lazy>'},
    {url: '#', res: '<h1>Home Page</h1>'},
    {url: '#/lazy', res: '<ms-lazy></ms-lazy>'},
    {url: '#', res: '<ms-lazy></ms-lazy>'},
    {time: long, res: '<h1>Home Page</h1>'},
    {url: '#/loading', res: {a: 'loading', route: '/:a'}},
    {
      run: () => {
        const e = document.createElement('template')
        e.setAttribute('data-loading', true)
        e.setAttribute('data-path', '#/loading')
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
      res: `<ms-lazy>
        <h1>Loading...</h1>
        <ms-simple></ms-simple>
      </ms-lazy>`
    },
    {time: long, res: '<ms-lazy><h1>Loaded</h1></ms-lazy>'},
    {url: '#/simple', res: '<ms-simple><h1>Simple</h1></ms-simple>'},
    {
      url: '#/lazy',
      res: `<ms-lazy>
        <h1>Loading...</h1>
        <ms-simple></ms-simple>
      </ms-lazy>`
    },
    {
      url: '#',
      res: `<ms-lazy>
        <h1>Loading...</h1>
        <ms-simple></ms-simple>
      </ms-lazy>`
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
        const e = document.querySelector('[data-loading]')
        e.parentNode.removeChild(e)
      },
      res: `
        <h1>Loading...</h1>
        <ms-simple><h1>Simple</h1></ms-simple>
      `,
      time: long
    },
    {url: '#', res: '<h1>Home Page</h1>'},
    {url: '#/lazy', res: '<ms-lazy></ms-lazy>'},
    {time: long, res: '<ms-lazy><h1>Loaded</h1></ms-lazy>'},
    {url: '#/simple', res: '<ms-simple><h1>Simple</h1></ms-simple>'},
    {url: '#/lazy', res: '<ms-lazy></ms-lazy>'},
    {url: '#', res: '<ms-lazy></ms-lazy>'},
    {time: long, res: '<h1>Home Page</h1>'},
    {url: '#/loading', res: {a: 'loading', route: '/:a'}},
    {url: '#', res: '<h1>Home Page</h1>'}
  ]))
  QUnit.test('error', test([
    {url: '#', res: '<h1>Home Page</h1>'},
    {url: '#/err', res: '<ms-err><h1>Error</h1></ms-err>'},
    {url: '#/rejected', res: '<ms-rejected></ms-rejected>'},
    {time: long, res: '<ms-rejected><h1>Rejected</h1></ms-rejected>'},
    {url: '#/simple', res: '<ms-simple><h1>Simple</h1></ms-simple>'},
    {url: '#/rejected', res: '<ms-rejected></ms-rejected>'},
    {url: '#', res: '<ms-rejected></ms-rejected>'},
    {time: long, res: '<h1>Home Page</h1>'},
    {url: '#/error', res: {a: 'error', route: '/:a'}},
    {
      run: () => {
        const e = document.createElement('template')
        e.setAttribute('data-error', true)
        e.setAttribute('data-path', "#/error")
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
      res: `<ms-err>
        <h1>Route Fail!</h1>
        <ms-simple></ms-simple>
      </ms-err>`
    },
    {url: '#/simple', res: '<ms-simple><h1>Simple</h1></ms-simple>'},
    {url: '#/rejected', res: '<ms-rejected></ms-rejected>'},
    {
      time: long,
      res: `<ms-rejected>
        <h1>Route Fail!</h1>
        <ms-simple></ms-simple>
      </ms-rejected>`
    },
    {url: '#/simple', res: '<ms-simple><h1>Simple</h1></ms-simple>'},
    {url: '#/rejected', res: '<ms-rejected></ms-rejected>'},
    {url: '#', res: '<ms-rejected></ms-rejected>'},
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
        const e = document.querySelector('[data-error]')
        e.parentNode.removeChild(e)
      },
      res: `
        <h1>Route Fail!</h1>
        <ms-simple><h1>Simple</h1></ms-simple>
      `,
      time: long
    },
    {url: '#', res: '<h1>Home Page</h1>'},
    {url: '#/err', res: '<ms-err><h1>Error</h1></ms-err>'},
    {url: '#/rejected', res: '<ms-rejected></ms-rejected>'},
    {time: long, res: '<ms-rejected><h1>Rejected</h1></ms-rejected>'},
    {url: '#/simple', res: '<ms-simple><h1>Simple</h1></ms-simple>'},
    {url: '#/rejected', res: '<ms-rejected></ms-rejected>'},
    {url: '#', res: '<ms-rejected></ms-rejected>'},
    {time: long, res: '<h1>Home Page</h1>'},
    {url: '#/error', res: {a: 'error', route: '/:a'}},
    {url: '#', res: '<h1>Home Page</h1>'}
  ]))
  QUnit.test('default', test([
    {url: '#', res: '<h1>Home Page</h1>'},
    {url: '#my-id', res: '<h1>Home Page</h1>'},
    {url: '#/simple', res: '<ms-simple><h1>Simple</h1></ms-simple>'},
    {url: '#my-id', res: '<h1>Home Page</h1>'},
    {url: '#/simple', res: '<ms-simple><h1>Simple</h1></ms-simple>'},
    {url: '#/this/is/not/found', res: '<h1>Home Page</h1>'},
    {url: '#/404', res: {a: '404', route: '/:a'}},
    {url: '#/simple', res: '<ms-simple><h1>Simple</h1></ms-simple>'},
    {
      run: () => {
        const e = document.createElement('template')
        e.setAttribute('data-default', true)
        e.setAttribute('data-path', "#/404")
        e.innerHTML = `
          <h1>Not Found</h1>
          <ms-simple></ms-simple>
        `
        document.body.appendChild(e)
      },
      res: '<ms-simple><h1>Simple</h1></ms-simple>'
    },
    {url: '#', res: `<h1>Home Page</h1>`},
    {url: '#/simple', res: '<ms-simple><h1>Simple</h1></ms-simple>'},
    {
      url: '#/this/is/not/found',
      res: `
        <h1>Not Found</h1>
        <ms-simple><h1>Simple</h1></ms-simple>
      `
    },
    {url: '#/simple', res: '<ms-simple><h1>Simple</h1></ms-simple>'},
    {
      url: '#/404',
      res: `
        <h1>Not Found</h1>
        <ms-simple><h1>Simple</h1></ms-simple>
      `
    },
    {
      run: () => {
        const e = document.querySelector('[data-default]')
        e.parentNode.removeChild(e)
      },
      res: `
        <h1>Not Found</h1>
        <ms-simple><h1>Simple</h1></ms-simple>
      `,
      time: long
    },
    {url: '#', res: '<h1>Home Page</h1>'},
    {url: '#my-id', res: '<h1>Home Page</h1>'},
    {url: '#/simple', res: '<ms-simple><h1>Simple</h1></ms-simple>'},
    {url: '#my-id', res: '<h1>Home Page</h1>'},
    {url: '#/simple', res: '<ms-simple><h1>Simple</h1></ms-simple>'},
    {url: '#/this/is/not/found', res: '<h1>Home Page</h1>'},
    {url: '#/404', res: {a: '404', route: '/:a'}},
    {url: '#/simple', res: '<ms-simple><h1>Simple</h1></ms-simple>'},
    {url: '#', res: '<h1>Home Page</h1>'}
  ]))
})

QUnit.module('stop', () => {
  QUnit.test('route', test([
    {url: '#', res: '<h1>Home Page</h1>', blank: true},
    {
      url: '#/ticker/5',
      res: `<ms-ticker><h1>Tick: 5</h1></ms-ticker>`,
      tick: [5]
    },
    {
      time: 2*tick + 10,
      res: `<ms-ticker><h1>Tick: 7</h1></ms-ticker>`,
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
    {url: '#/simple', res: '<ms-simple><h1>Simple</h1></ms-simple>'},
    {url: '#/lazy', res: '<ms-lazy></ms-lazy>'},
    {url: '#/ticker/2', res: `<ms-lazy></ms-lazy>`, tick: [7]},
    {url: '#', res: '<ms-lazy></ms-lazy>'},
    {time: long, res: '<h1>Home Page</h1>', tick: [7]},
    {url: '#/lazy', res: '<ms-lazy></ms-lazy>'},
    {url: '#/ticker/11', res: `<ms-lazy></ms-lazy>`, tick: [7]},
    {
      time: long - step,
      res: `<ms-ticker><h1>Tick: 11</h1></ms-ticker>`,
      tick: [7, 11]
    },
    {
      time: 2*tick + 10,
      res: `<ms-ticker><h1>Tick: 13</h1></ms-ticker>`,
      tick: [7, 13]
    },
    {url: '#', res: '<h1>Home Page</h1>', tick: [7, 13]},
    {time: long, res: '<h1>Home Page</h1>', tick: [7, 13]}
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
