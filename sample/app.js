import {register, template, start} from '../index.js'

register('counter', (node, {start}) => import("https://unpkg.com/superfine")
  .then(({h, text, patch}) => {
    const setState = (state) =>
      patch(
        node,
        h(node.tagName, {}, [
          h("h1", {}, text(state)),
          h("button", { onclick: () => setState(state - 1) }, text("-")),
          h("button", { onclick: () => setState(state + 1) }, text("+")),
        ])
      )

    setState(isNaN(start) ? 0 : parseInt(start))
  })
)

register('todo', (node, {value}) => import("https://unpkg.com/hyperapp")
  .then(({h, text, app}) => {
    const AddTodo = (state) => ({
      ...state,
      value: "",
      todos: state.todos.concat(state.value),
    })

    const NewValue = (state, event) => ({
      ...state,
      value: event.target.value,
    })

    app({
      init: { todos: [], value: value || "" },
      view: ({ todos, value }) =>
        h("main", {}, [
          h("h1", {}, text("To do list")),
          h("input", { type: "text", oninput: NewValue, value }),
          h("ul", {},
            todos.map((todo) => h("li", {}, text(todo)))
          ),
          h("button", { onclick: AddTodo }, text("New!")),
        ]),
      node: node,
    })
  })
)

start(document.getElementById('app'))
