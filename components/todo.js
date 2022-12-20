export default (node, {value}) => import("https://unpkg.com/hyperapp")
  .then(({h, text, app}) => {
    var stop = false
    const AddTodo = (state) => stop ? state : ({
      ...state,
      value: "",
      todos: state.todos.concat(state.value),
    })

    const NewValue = (state, event) => stop ? state : ({
      ...state,
      value: event.target.value,
    })

    app({
      init: { todos: [], value: value || "" },
      view: ({ todos, value }) =>
        h(node.tagName.toLowerCase(), {}, [
          h("h1", {}, text("To do list")),
          h("input", { type: "text", oninput: NewValue, value }),
          h("ul", {},
            todos.map((todo) => h("li", {}, text(todo)))
          ),
          h("button", { onclick: AddTodo }, text("New!")),
        ]),
      node: node
    })

    return () => {stop = true}
  })
