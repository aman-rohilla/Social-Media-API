import { jwt, JWT_SECRET} from './vars.mjs' 

const userDecoderMiddleware = (req, res, next) => {

  let userToken = req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1] : null
  
  if(!userToken) return next()

  try {
    const decodedPayload = jwt.verify(userToken, JWT_SECRET) 
    if(! decodedPayload.refreshToken)
      req.userID = decodedPayload.userID
    next()    
  } catch(error) {
    next()
  }
}

export { userDecoderMiddleware }