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

const setView = (node, selector) => {
  const templates = document.body.querySelectorAll(`template[${selector}]`)
  if (templates.length) {
    while (node.lastChild) {
      node.removeChild(node.lastChild)
    }
    templates.forEach(t => {
      Array.from(t.content.children).forEach(child => {
        node.appendChild(child.cloneNode(true))
      })
    })
  } else if (selector.indexOf('=') >= 0 || selector == 'data-default') {
    setView(node, 'data-home')
  }
}

const resolveComp = (comp, node, params) => Promise.resolve()
  .then(() => {
    if (!node.innerHTML.trim()) {
      setView(node, 'data-loading')
    }
    return comp(node, getParams(node, params))
  })
  .catch(err => {
    const html = node.getAttribute('error')
    if (!html) {
      setView(node, 'data-error')
    } else {
      node.innerHTML = html
    }
  })

const resolveView = (node, selector, components, params) => {
  setView(node, selector)
  const Comp = []

  Object.keys(components).forEach(name => {
    const kebab = 'ms-'+name
      .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
      .toLowerCase()

    node.querySelectorAll(kebab).forEach(e => {
      Comp.push({
        node: e,
        comp: components[name]
      })
    })
  })

  return Promise.allSettled(
    Comp.map(({node, comp}) => resolveComp(comp, node, params))
  ).then(Stop => () => Stop
    .map(({value}) => value)
    .filter(stop => typeof stop == 'function')
    .forEach(stop => stop())
  )
}

export default (root, components) => {
  components = components || {}

  const getPath = path => (path || '').substr(0, 2) != '#/' ? '#/' : path
  const home = getPath(root.getAttribute('data-path'))

  if (root.tagName.toLowerCase() != 'template') {
    const tpl = Array.from(root.children).reduce((template, child) => {
      template.content.appendChild(child.cloneNode(true))
      return template
    }, document.createElement('template'))
    tpl.setAttribute('data-path', home)
    tpl.setAttribute('data-home', true)
    document.body.appendChild(tpl)
  } else {
    root.setAttribute('data-path', home)
    root.setAttribute('data-home', true)
  }

  const state = {
    path: null,
    signature: null,
    stop: () => {},
    pending: false
  }
  const router = () => {
    if (state.path === false || state.pending) {
      return
    }
    var url = getPath(window.location.hash)
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
      .reduce((Q, {key, value}) => {
        if (key.substr(key.length - 2) == '[]') {
          key = key.substr(0, key.length - 2)
          if (!(Q[key] instanceof Array)) {
            Q[key] = []
          }
          Q[key].push(value)
        } else {
          Q[key] = value
        }
        return Q
      }, {})

    const Path = path.split('/').map(decodeURIComponent)
    const routes = []
    document.body.querySelectorAll('template[data-path^="#/"]').forEach(t => {
      const p = t.getAttribute('data-path')
      if (routes.indexOf(p) < 0) {
        routes.push(p)
      }
    })

    const {selector, params} = routes.reduce((match, route) => {
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
            selector: `data-path="${route}"`,
            params,
            weight
          }
        }
      }
      return match
    }, {
      selector: 'data-default',
      params: {},
      weight: 0
    })
    const signature = `${selector}\n${JSON.stringify(params)}`

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

      resolveView(root, selector, components, {
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
