const getParams = (e, params) => {
  const attrs = Array.from(e.attributes).reduce((attrs, {
    nodeName,
    nodeValue
  }) => {
    if (nodeName.substr(0, 5) == 'data-') {
      attrs[nodeName.substr(5)] = params[nodeValue]
    } else {
      attrs[nodeName] = nodeValue
    }
    return attrs
  }, {})

  return {
    ...params,
    ...attrs
  }
}

const setView = (root, view, components, params) => {
  if (view) {
    while (root.lastChild) {
      root.removeChild(root.lastChild)
    }
    const e = view.tagName.toLowerCase() == 'template' ? view.content : view 
    Array.from(e.children).forEach(child => {
      root.appendChild(child.cloneNode(true))
    })

    if (components) {
      const Stop = []

      Object.keys(components).forEach(name => {
        const kebab = 'ms-'+name
          .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
          .toLowerCase()

        root.querySelectorAll(kebab).forEach(e => {
          Stop.push(run(components, components[name], e, getParams(e, params)))
        })
      })

      document.querySelectorAll('template[id^=ms-]').forEach(view => {
        root.querySelectorAll(view.getAttribute('id')).forEach(root => {
          Stop.push(setView(root, view, components, getParams(root, params)))
        })
      })

      return Promise.allSettled(Stop).then(Stop => () => Stop
        .map(({value}) => value)
        .filter(stop => typeof stop == 'function')
        .forEach(stop => stop())
      )
    }
  }
  return () => {}
}

const run = (components, action, root, params) => Promise.resolve()
  .then(() => {
    setView(root, document.getElementById('ms-loading'))

    if (typeof action == 'function') {
      return action(root, params)
    } else if (typeof action == 'string' && action.substr(0, 3) == 'ms-') {
      return setView(root, document.getElementById(action), components, params)
    } else if (typeof action == 'string' && components[action]) {
      return components[action](root, params)
    }
  })
  .catch(err => {
    setView(root, document.getElementById('ms-error'))
    console.warn(err)
  })

export default (root, {components, routes}) => {
  components = components || {}
  routes = routes || {}

  if (!document.getElementById('ms-default')) {
    const tpl = Array.from(root.children).reduce((template, child) => {
      template.content.appendChild(child.cloneNode(true))
      return template
    }, document.createElement('template'))
    tpl.setAttribute('id', 'ms-default')
    document.body.appendChild(tpl)
  }

  if (!routes['*']) {
    routes['*'] = 'ms-default'
  }

  const state = {
    path: null,
    signature: null,
    stop: () => {},
    pending: false
  }
  const getUrl = () => window.location.hash.substr(1)
  const router = (test) => {
    if (state.path === false || state.pending) {
      return
    }
    const url = getUrl()
    const Url = url.split('?')
    const path = Url.shift()
    if (path === state.path) {
      return
    }
    const query = Url.join('?').split('&')
      .map(pair => pair.split('='))
      .map(pair => ({
        key: decodeURIComponent(pair.shift()),
        value: decodeURIComponent(pair.join('='))
      }))
      .filter(({key}) => key != "")
      .reduce((Q, {key, value}) => ({
        ...Q,
        [key]: value
      }), {})

    const Path = path.split('/').map(decodeURIComponent)
    const {route, params} = Object.keys(routes).reduce((match, route) => {
      const Route = route.split('/')
      if (Route.length == Path.length) {
        var weight = 1
        const params = Path.reduce((params, value, i) => {
          if (params) {
            if (Route[i].substr(0, 1) == ':') {
              params[Route[i].substr(1)] = value
            } else if (Route[i] !== value) {
              params = null
            } else {
              weight++
            }
          }
          return params
        }, {})
        if (params && weight > match.weight) {
          return {
            route,
            params,
            weight
          }
        }
      }
      return match
    }, {
      route: '*',
      params: {},
      weight: 0
    })
    const signature = `${route}\n${JSON.stringify(params)}`

    if (state.signature !== signature) {
      state.stop()
      state.path = path 
      state.signature = signature
      state.stop = () => {}
      state.pending = true
      const rerun = stop => {
        state.pending = false
        state.stop = typeof stop == 'function' ? stop : () => {}
        router()
      }

      run(components, routes[route], root, {
        ...query,
        ...params
      }).then(rerun).catch(err => {
        rerun()
        console.warn(err)
      })
    }
  }
  router()
  window.addEventListener('hashchange', router)

  return () => {
    state.stop()
    state.path = false
  } 
}
