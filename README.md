# ![](favicon.ico) MicroSPA
A router for [micro-frontends](https://micro-frontends.org/)

## Usage
[Live Demo](https://marcodpt.github.io/microspa/)

```html
<html>
  <head>
    <script type="module">
      import microspa from "https://cdn.jsdelivr.net/gh/marcodpt/microspa/index.js"
      import ticker from './components/ticker.js'
      import counter from './components/counter.js'
      import todo from './components/todo.js'

      window.stop = microspa(document.getElementById('app'), {
        components: {
          ticker,
          counter,
          todo
        },
        routes: {
          '/counter/:start': counter,
          '/todo': todo,
          '/ticker': ticker,
          '/view': 'ms-view'
        }
      })
    </script>
  </head>
  <body>
    <nav>
      <a href="#/">Home</a>
      <a href="#/todo">Todo</a>
      <a href="#/ticker">Ticker</a>
      <a href="#/view">View with 2 tickers</a>
      <a href="#/counter/7">Counter 7</a>
      <a href="#/this/is/404">Not Founded</a>
      <a href="javascript:;" onclick="stop()">Stop Router</a>
      <a href="tests">Test page</a>
    </nav>
    <main id="app">
      <h1>MicroSPA</h1>
      <p>Hello world! From MicroSPA</p>
      <ms-counter start=15></ms-counter>
      <ms-todo value=read></ms-todo>
    </main>
    <template id="ms-view">
      <h1>Some template defined view with 2 tickers</h1>
      <ms-ticker></ms-ticker>
      <ms-ticker start="10"></ms-ticker>
    </template>
    <template id="ms-error">
      <h1>Error!</h1>
      <p>Error executing script!</p>
      <p>Please check browser logs!</p>
    </template>
    <template id="ms-loading">
      <h1>Loading...</h1>
    </template>
  </body>
</html>
```
 - `ticker`: a [component](#-Component) made with vanilla js.
[Source](https://raw.githubusercontent.com/marcodpt/microspa/main/components/ticker.js) 
 - `counter`: a [component](#-Component) made with
[superfine](https://github.com/jorgebucaran/superfine).
[Source](https://raw.githubusercontent.com/marcodpt/microspa/main/components/counter.js) 
 - `todo`: a [component](#-Component) made with
[hyperapp](https://github.com/jorgebucaran/hyperapp).
[Source](https://raw.githubusercontent.com/marcodpt/microspa/main/components/todo.js) 
 - all [components](#-Component) are lazy loaded, as you navigate to the routes.
This is a key concept for very fast page load.
(ex.: [qwik](https://github.com/BuilderIO/qwik)).
 - `<main id="app">`: The default route, rendered on the server side.
 - `<template id="ms-view">`: A view defined by `html`.
 - `<template id="ms-error">`: An optional view, which is rendered every time the
[promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
associated with the route is `rejected`. 
 - `<template id="ms-loading">`: An optional view, which is rendered every time the
[promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
associated with the route is `pending`.
 - `<ms-ticker>`: calls the associated [component](#-Component).
 - `<ms-counter>`: calls the associated [component](#-Component).
 - `<ms-todo>`: calls the associated [component](#-Component).

## microspa(root, {routes, components}) -> [promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) stop?

### DOM element `root`
The DOM element where the router should be mounted.

### Object `components`
An object where the keys are the [component](#-Component) names and the 
values are [component](#-Component) functions.

The name of the [components](#-Component) must be written in
[camel case](https://en.wikipedia.org/wiki/Camel_case),
and you can use the name of the routes object that way.
But if you use it in an `html` view, it will convert tox
[kebab case](https://en.wikipedia.org/wiki/Letter_case#Kebab_case)
starting with `ms-`.

Ex: someComp -> ms-some-comp

### Object `routes`
An object where the keys are the paths of the routes and the values can be:
 - [component](#-Component) functions
 - a string with an id of an `html` view (must start with `ms-`)
 - a string that is a key in the `components` object

Paths can define params with `:param`.

Ex: /counter/:start
This will match:
 - /counter/7
```js
{
  start: "7"
}
```

 - The route with the fewest params will have the highest priority.
 - If no route matches, the `*` route will be called, if defined,
or the `html` view `<template id="ms-default">` if present in the DOM,
or the original content of the `root` element will be displayed.
 - Query params will be merged with path params (highest priority) to be sent
as the [component](#-Component) `params`.

With the routes:
 - /counter/:start
 - /:key/:value
 - /counter/0

The route `/counter/5` will match:
 - /counter/:start
```js
{
  start: "5"
}
```

The route `/counter/5?start=7&delay=3` will match:
 - /counter/:start
```js
{
  start: "5",
  delay: "3"
}
```

The route `/counter/0` will match:
 - /counter/0
```js
{}
```

The route `/other/0` will match:
 - /:key/:value
```js
{
  key: "other",
  value: "0"
}
```

Whenever `MicroSPA` matches a route, it will:
 - Calls the `stop` function of each [component](#-Component) in the previous route.
 - Renders the `<template id="ms-loading">` view on the `root` element if it
exists in the DOM.
 - Calls the [component](#-Component) with the `root` element and path/query `params`.
 - Resolves all custom elements starting with `ms-` that are defined in the `components` object.
 - If some error occurs and the view `<template id="ms-error">` exists in DOM,
it will be rendered in the `root` element.

Some remarks:
 - only path changes will trigger [components](#-Component) rerender.
 - query params changes will be ignored, you must use then to store the current
state in url for link sharing eg. 
 - this is a hash router designed to use `html` files as single page apps
without ANY building steps.

### Fn `stop`
A function that stops the router. It will call the `stop` function of all
[components](#-Component) on the screen, and then the router will stop. 

# Component
Note that `microspa` is also a component.
Definition:

## Component(element, params) -> [promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) stop?
- `element`: The DOM element where it should be mounted.
- `params`: An object with the params passed to the component.
- `stop`: An optional function that stops the component when it is called.

Example: 
```js
const ticker = (root, {start, delay}) => {
  start = (isNaN(start) ? 0 : parseInt(start)) - 1
  const update = () => {
    root.innerHTML = `<h1>Tick: ${++start}</h1>`
    console.log('tick: '+start)
  }
  update()
  const interval = setInterval(update, (delay || 1) * 1000)
  return () => {clearInterval(interval)}
}
```

This definition should handle the custom element case:
```html
<ms-ticker count="20" delay="3"></ms-ticker>
```

And it should also handle the case of the url:
```
#/ticker?count=20&delay=3
```

## Contributing
Everything within this documentation is tested 
[here](https://marcodpt.github.io/microspa/tests/).
And it will always like this. Any changes to the documentation,
any contributions MUST be present in the tests.

If the tests do not pass in your browser, if you find any bugs, please raise
an issue.

It's a very simple project. Any contribution is greatly appreciated.
