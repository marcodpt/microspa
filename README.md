# ![](favicon.ico) MicroSPA
A router for [micro-frontends](https://micro-frontends.org/)
 - A hash router for server-side rendered views.
 - All [components](#Component) are lazy-loaded, with
[promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) and/or
[dynamic imports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import).
 - No building step, use `template` tag to define the routes.
 - Use [custom elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements) to access [components](#Component) within routes.
 - `loading`, `error`, `default` (404 not found) templates are available.  

## Usage
[Live Demo](https://marcodpt.github.io/microspa/)

 - `ticker`: a [component](#Component) made with vanilla js.
[Source](https://raw.githubusercontent.com/marcodpt/microspa/main/components/ticker.js) 
 - `counter`: a [component](#Component) made with
[superfine](https://github.com/jorgebucaran/superfine).
[Source](https://raw.githubusercontent.com/marcodpt/microspa/main/components/counter.js) 
 - `todo`: a [component](#Component) made with
[hyperapp](https://github.com/jorgebucaran/hyperapp).
[Source](https://raw.githubusercontent.com/marcodpt/microspa/main/components/todo.js) 
 - `error`: a [component](#Component) made with vanilla js that
throws an error or rejects a promise after some delay.
[Source](https://raw.githubusercontent.com/marcodpt/microspa/main/components/error.js) 

```html
<html>
  <head>
    <script type="module">
      import microspa from "https://cdn.jsdelivr.net/gh/marcodpt/microspa/index.js"

      /*
        Here we are defining the root of the router:
        <main id="app">

        And we set 4 custom elements: 
        <ms-ticker>: vanilla JS,
        <ms-counter>: Superfine,
        <ms-todo>: Hyperapp,
        <ms-error>: throw error or reject promise
      */
      window.stop = microspa(document.getElementById('app'), {
        ticker: './components/ticker.js',
        counter: './components/counter.js',
        todo: './components/todo.js',
        error: './components/error.js' 
      })
    </script>
  </head>
  <body>
    <nav>
      <!--
        This navigate to:
        <main id="app">
      -->
      <a href="#/">Home</a> |

      <!--
        This navigate to:
          <template data-path="#/todo">
        The value will be:
          plant a tree
      -->
      <a href="#/todo?value=plant%20a%20tree">Todo</a> |

      <!--
        This navigate to:
        <template data-path="#/tickers">
      -->
      <a href="#/tickers">2 tickers</a> |

      <!--
        This navigate to:
        <template data-path="#/counter/:start">
      -->
      <a href="#/counter/7?start=9&x=11">3 Counters</a> |

      <!--
        This navigate to:
        <template data-path="#/error">
      -->
      <a href="#/error">Error example</a> |

      <!--
        This navigate to:
        <template data-default>
      -->
      <a href="#/this/is/404">Not Founded</a> |

      <!--This completely stops the router -->
      <a href="javascript:;" onclick="stop()">Stop Router</a>
    </nav>

    <!--
      This is the root of the router,
      by default #/ but you can add a
      data-path attibute.
      The `ms-todo` will start with:
        read a book
    -->
    <main id="app">
      <h1>MicroSPA</h1>
      <p>Hello world! From MicroSPA</p>
      <ms-todo value="read a book"></ms-todo>
    </main>

    <!-- This is a single component route -->
    <template data-path="#/todo">
      <ms-todo></ms-todo>
    </template>

    <template data-path="#/tickers">
      <h1> 2 tickers</h1>

      <!--
        This ticker will start with
        query param `start` or default 0
      -->
      <ms-ticker></ms-ticker>

      <!--This ticker will start always with 10-->
      <ms-ticker start="10"></ms-ticker>
    </template>


    <!--
      The nav link will set the hash to:
      #/counter/7?start=9&x=11
    -->
    <template data-path="#/counter/:start">
      <!--
        starts with 7,
        path has higher priority than query.
      -->
      <ms-counter></ms-counter>

      <!--
        starts with 1,
        attributes has the highest priority.
      -->
      <ms-counter start="1"></ms-counter>

      <!--
        start with 11,
        data-start="x" sets the `start` to `x`.
      -->
      <ms-counter data-start="x"></ms-counter>
    </template>


    <template data-path="#/error">
      <!--
        Display <h1>Custom loading...</h1> for 2s,
        then reject with <template data-error>
      -->
      <ms-error message="first error" delay="2">
        <h1>Custom loading...</h1>
      </ms-error>

      <!--
        Display <template data-loading> for 1s,
        then reject with <template data-error>
      -->
      <ms-error message="second error" delay="1"></ms-error>

      <!--
        Throws an error and
        display <template data-error>
      -->
      <ms-error message="third error"></ms-error>

      <!--
        Throws an error and
        display <h1>Custom error</h1>
      -->
      <ms-error
        message="fourth error"
        error="<h1>Custom error</h1>"
      ></ms-error>
    </template>

    <!--
      This route will be displayed every time
      the router does not match any route
    -->
    <template data-default>
      <h1>Not Found!</h1>
      <p>Sorry, page not found. <a href="#/">Go home</a></p>
    </template>

    <!--
      This template will be displayed inside a custom element,
      if it reject the promise or throw an error
      and has no error attribute
    -->
    <template data-error>
      <h1>Error!</h1>
      <p>Error executing script!</p>
      <p>Please check browser logs!</p>
    </template>

    <!--
      This template will be displayed inside a custom element,
      if it is loading and it has no innerHTML.
    -->
    <template data-loading>
      <h1>Loading...</h1>
    </template>
  </body>
</html>
```

## microspa(root, components) -> [promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) stop?
Note that `microspa` is also a [component](#Component).

### DOM element `root`
The DOM element where the router should be mounted.

### Object `components`
An object where the keys are the [component](#Component) names and the 
values are [component](#Component) functions or strings with a URL to an import.

The name of the [components](#Component) must be written in
[camel case](https://en.wikipedia.org/wiki/Camel_case),
and you can use the name of the routes object that way.
But if you use it in an `html` view, it will convert to
[kebab case](https://en.wikipedia.org/wiki/Letter_case#Kebab_case)
starting with `ms-`.

```
someComp -> ms-some-comp
```
### Fn `stop`
A function that stops the router. It will call the `stop` function of all
[components](#Component) on the screen, and then the router will stop. 

# Component
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

Another example:
```js
const counter = (node, {start}) => import("https://unpkg.com/superfine")
  .then(({h, text, patch}) => {
    const setState = state => patch(
      node,
      h(node.tagName.toLowerCase(), {}, [
        h("h1", {}, text(state)),
        h("button", { onclick: () => setState(state - 1) }, text("-")),
        h("button", { onclick: () => setState(state + 1) }, text("+")),
      ])
    )

    setState(isNaN(start) ? 0 : parseInt(start))
  })
```

Here we use [dynamic imports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import) to load the framework.
Ideally, all dependencies can be loaded this way.
For example, you can see some similarity in this paradigm in
[qwik](https://github.com/BuilderIO/qwik)

## Contributing
Everything within this documentation is tested 
[here](https://marcodpt.github.io/microspa/tests/).
And it will always like this. Any changes to the documentation,
any contributions MUST be present in the tests.

It's a very simple project.
Any contribution, any feedback is greatly appreciated.
