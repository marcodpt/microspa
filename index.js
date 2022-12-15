const components = {}

const setView = (root, id) => {
  const e = document.getElementById(id)
  if (e) {
    root.innerHTML = e.innerHTML
  }
}

const run = (name, root, params) => Promise.resolve()
  .then(() => {
    setView(root, 'ms-loading')
    return components[name](root, params)
  })
  .catch(err => {
    setView(root, 'ms-error')
    throw err
  })

const register = (name, component) => {
  if (!name || typeof name != 'string') {
    throw `You must provide a name for the component: ${name}`
  }
  if (typeof component != 'function') {
    throw `Component must be a function with signature: (element, params) -> stop`
  }

  components[name] = component
} 

const template = (name, element) => {
  if (element == null) {
    element = name
    name = element.getAttribute('id')
  }

  if (!name) {
    throw `No id associated to element:\n${element.outerHTML}`
  }

  const template = element.tagName.toLowerCase() == 'template' ? element : 
    Array.from(element.children).reduce((template, child) => {
      template.content.appendChild(child.cloneNode(true))
      return template
    }, document.createElement('template'))

  components[name] = (root, params) => {
    root.innerHTML = ''
    Array.from(template.content.children).forEach(child => {
      root.appendChild(child)
    })

    const Stop = []
    Object.keys(components).forEach(name => {
      const kebab = 'ms-'+name
        .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
        .toLowerCase()

      root.querySelectorAll(kebab).forEach(e => {
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

        Stop.push(run(name, e, {
          ...params,
          ...attrs
        }))
      })
    })

    return Promise.allSettled(Stop).then(Stop => () => Stop
      .map(({value}) => value)
      .filter(stop => typeof stop == 'function')
      .forEach(stop => stop())
    )
  }
}

const start = (root, routes) => {
  routes = routes || {}
  const id = root.getAttribute('id') || null
  if (id) {
    template(root)
  }
  const state = {
    path: null,
    stop: () => {},
    pending: false
  }
  const getUrl = () => window.location.hash.substr(1)
  const router = (test) => {
    console.log('router')
    if (state.path === false) {
      return
    }
    const url = getUrl()
    const Url = url.split('?')
    const path = Url.shift()
    console.log('path: '+path)
    if (path === state.path) {
      return
    }
    const query = Url.join('=').split('&')
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
    console.log('query: '+JSON.stringify(query, undefined, 2))

    const Path = path.split('/').map(decodeURIComponent)
    const {route, params} = Object.keys(routes).reduce((match, route) => {
      const Route = route.split('/')
      if (Route.length == Path.length) {
        var weight = 1
        const params = Path.reduce((params, value, i) => {
          if (params) {
            if (Route[i].substr(0, 1) == ':') {
              params[Route[i]] = value
            } else if (Route[i] !== value) {
              params = null
            } else {
              weight++
            }
          }
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
      route: id,
      params: {},
      weight: 0
    })
    console.log(components)
    console.log('id: '+id)

    if (route != null && !state.pending) {
      state.stop()
      state.path = path 
      state.stop = null

      console.log('route: '+route)
      run(route, root, {
        ...query,
        ...params
      }).then(stop => {
        state.stop = typeof stop == 'function' ? stop : () => {}
        router()
      }).catch(err => {
        state.stop = () => {}
        throw err
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

export {register, template, start}
