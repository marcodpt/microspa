export default (root, {delay, message}) => {
  delay = isNaN(delay) ? 0 : parseInt(delay)
  if (delay) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(message)
      }, delay * 1000)
    })
  } else {
    throw message
  }
}
