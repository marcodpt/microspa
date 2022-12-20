export default (root, {start, delay}) => {
  start = (isNaN(start) ? 0 : parseInt(start)) - 1
  const update = () => {
    root.innerHTML = `<h1>Tick: ${++start}</h1>`
    console.log('tick: '+start)
  }
  update()
  const interval = setInterval(update, (delay || 1) * 1000)
  return () => {clearInterval(interval)}
}
