export default (node, {start}) => import("https://unpkg.com/superfine")
  .then(({h, text, patch}) => {
    var stop = false
    const setState = (state) => stop ? null :
      patch(
        node,
        h(node.tagName.toLowerCase(), {}, [
          h("h1", {}, text(state)),
          h("button", { onclick: () => setState(state - 1) }, text("-")),
          h("button", { onclick: () => setState(state + 1) }, text("+")),
        ])
      )

    setState(isNaN(start) ? 0 : parseInt(start))

    return () => {stop = true}
  })
