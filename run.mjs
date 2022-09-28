import {PORT, IP, mongoose, CONNECTION_STRING} from './vars.mjs'
import {app} from './app.mjs'

try {
  await mongoose.connect(CONNECTION_STRING)
  console.log('CONNECTED to database...')
  app.listen(PORT, IP, console.log(`Server listening on ${IP}:${PORT} ...`))
} catch (err) {
  console.log(`FAILED to connect to database...\nerror : ${err}`)    
}
