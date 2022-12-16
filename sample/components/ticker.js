export default (element, {count, delay}) => {
  count = count || 0
  const setCount = () => {
    console.log('tick')
    element.innerHTML = `<div>${count}</div>`
    count = count + 1
  }
  setCount()
  const interval = setInterval(setCount, (delay || 1) * 1000)
  return () => {clearInterval(interval)}
}
