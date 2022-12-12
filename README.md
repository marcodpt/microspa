# ![microspa](favicon.ico) microspa
A router for micro-frontends

## Component(element, params) -> stop
Component is a function defined by this signature, where:
- element: is a DOM element where it should be mounted.
- params: is an object with the params passed to component.
- stop: is a function that stop the component when it is called.

Example: 
```js
const counter = (element, {start, delay}) => {
  var count = start || 0
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
<my-counter start="20" delay="3"></my-counter>
```

And should also handle the url case:
```
#/counter?start=20&delay=3
```
