# ![](favicon.ico) MicroSPA
A router for micro-frontends

## Component(element, params) -> stop?
Component is a function defined by this signature, where:
- element: is a DOM element where it should be mounted.
- params: is an object with the params passed to component.
- stop: is an optional function that stop the component when it is called.

Example: 
```js
const ticker = (element, {count, delay}) => {
  count = count || 0
  const setCount = () => {
    element.innerHTML = `<div>${count}</div>`
    count = count + 1
  }
  setCount()
  const interval = setInterval(setCount, (delay || 1) * 1000)
  return () => {clearInterval(interval)}
}
```

This definition should handle the custom element case:
```html
<ms-ticker count="20" delay="3"></ms-ticker>
```

And should also handle the url case:
```
#/ticker?count=20&delay=3
```
