import ms from '../index.js'
import ticker from './components/ticker.js'
import counter from './components/counter.js'
import todo from './components/todo.js'

window.stop = ms(document.getElementById('app'), {
  components: {
    ticker,
    counter,
    todo
  },
  routes: {
    '/counter': counter
  }
})
