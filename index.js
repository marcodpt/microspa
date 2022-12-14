const components = {}

const fromEl => element => {
  const template = element.tagName.toLowerCase() == 'template' ? element : 
    Array.from(element.children).reduce((template, child) => {
      template.content.appendChild(child.cloneNode(true))
      return template
    }, document.createElement('template'))

  return (root, params) => {
    root.innerHTML = ''
    Array.from(template.content.children).forEach(child => {
      root.appendChild(child)
    })

    const Stop = []
    Object.keys(components).forEach(name => {
      const kebab = name
        .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
        .toLowerCase()

      root.querySelectorAll(kebab).forEach(e => {
        params = Array.from(e.attributes).reduce((attrs, {
          nodeName,
          nodeValue
        }) => ({
          ...attrs,
          [nodeName]: nodeValue
        }), params)

        const stop = components[name](e, params)
        if (typeof stop == 'function') {
          Stop.push(stop)
        }
      })
    })

    return () => stop.forEach(stopComp => stopComp())
  }
}

const router = ({
  routes,
  home,
  notFound,
  pending,
  rejected
}) => {
  return url => {
    const Url = url.split('?')
    const path = Url.shift()
    const query = Url.join('=').split('&')
      .map(pair => pair.split('='))
      .map(pair => ({
        key: decodeURIComponent(pair.shift()),
        value: decodeURIComponent(Pair.join('='))
      }))
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
          if (Params) {
            if (Route[i].substr(0, 1) == ':') {
              Params[Route[i]] = value
            } else if (Route[i] !== value) {
              Params = null
            } else {
              weight++
            }
          }
        }, {})
        if (Params && weight > match.weight) {
          return
        }
      }
      return match
    }, {
      route: null,
      params: {},
      weight: 0
    })
  }
}
