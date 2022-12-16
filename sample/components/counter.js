export default (node, {start}) => import("https://unpkg.com/superfine")
  .then(({h, text, patch}) => {
    const setState = (state) =>
      patch(
        node,
        h(node.tagName.toLowerCase(), {}, [
          h("h1", {}, text(state)),
          h("button", { onclick: () => setState(state - 1) }, text("-")),
          h("button", { onclick: () => setState(state + 1) }, text("+")),
        ])
      )

    setState(isNaN(start) ? 0 : parseInt(start))
  })
