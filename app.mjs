import { express, mongoose, bcrpyt, PORT, IP, CONNECTION_STRING, jwt, JWT_SECRET} from './vars.mjs'
import { User, Post } from './schema.mjs'
import { userDecoderMiddleware } from './middlewares.mjs'
import cors from 'cors'
import {StatusCodes as sc} from 'http-status-codes'
const ObjectId = mongoose.Types.ObjectId


const app = express()
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(cors())

// register a user with name, email and password
app.post('/api/register', async (req, res) => {
  
  const name     = req.body.name && req.body.name.trim()
  const email    = req.body.email && req.body.email.trim()
  const password = req.body.password && req.body.password.trim()
  
  if(!name || !email || !password) {
    return res.status(sc.BAD_REQUEST).json({message: 'Some fields are empty, required fields : name, email, password', success: false})
  }
  if(password.length < 8) {
    return res.status(sc.BAD_REQUEST).json({message: 'Password can\'t have less than 8 characters', success: false})
  }

  const salt = await bcrpyt.genSalt(10);
  const hashedPassword = await bcrpyt.hash(password, salt);

  if(await User.findOne({email}))
    return res.status(sc.CONFLICT).json({message: `${email} is already registered`, success: false})

  const user = await User.create({name, email, password: hashedPassword}) 
  return res.status(sc.CREATED).json({success: true, message:'Registeration Successful!', token: `Bearer ${user.genAccessToken()}`, refresh_token: `Bearer ${user.genRefreshToken()}`})
})

// authenticate/login user and return access token and refresh token
app.post('/api/authenticate', async (req, res) => {

  const email    = req.body.email.trim()
  const password = req.body.password.trim()

  if(!email || !password) {
    return res.status(sc.BAD_REQUEST).json({success: false, message:'Email and/or password is empty'})
  }

  const user = await User.findOne({email})
  if(!user) {
    return res.status(sc.BAD_REQUEST).json({success: false, message:`${email} is not registered`})
  }
  if(! await bcrpyt.compare(password, user.password)) {
    return res.status(sc.UNAUTHORIZED).json({success: false, message:'Password is incorrect'})
  }

  return res.status(sc.OK).json({success: true, message:'Authentication Successful!', token: `Bearer ${user.genAccessToken()}`, refresh_token: `Bearer ${user.genRefreshToken()}`})
})

// return a access token to user by authenticating with refresh token
app.get('/api/refresh', async (req, res) => {
  let userToken = req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1] : null
  
  if(!userToken) {
    return res.status(sc.BAD_REQUEST).json({success: false, message: 'Refresh token was expected'})
  }
  
  try {
    const decodedPayload = jwt.verify(userToken, JWT_SECRET) 
    const userID = decodedPayload.userID
    if(decodedPayload.refreshToken != true) {
      return res.status(sc.BAD_REQUEST).json({success: false, message: 'Refresh token was expected'})
    }

    const token = jwt.sign({userID}, JWT_SECRET, {expiresIn: '7d'})
    return res.status(sc.OK).json({success: true, token: `Bearer ${token}`})
  } catch(error) {
    return res.status(sc.UNAUTHORIZED).json({success: false, message: 'Token tempered'})
  }
})


// decode the user and assign user id to request object
app.use(userDecoderMiddleware)

// return unauthorized response to user for remaining routes except GET /api/posts/:id
app.use((req, res, next) => {
  if(req.url.startsWith('/api/posts/') && req.method == 'GET') {
    return next()
  }
  if(!req.userID) {
    return res.status(sc.UNAUTHORIZED).json({success: false, message: "Unauthorized"})
  }
  next()
})

// POST /api/follow/{id} - follow a user by user id
app.post('/api/follow/:id', async (req, res) => {

  if (req.userID == req.params.id) {
    return res.status(sc.BAD_REQUEST).json({success: true, message: `You can't follow youself`})
  }

  const user = await User.findById({_id: req.params.id}, {_id:1})
  if(!user) {
    return res.status(sc.BAD_REQUEST).json({success: false, message: `No user found with id = ${req.params.id}`})
  }

  await User.findByIdAndUpdate({_id: req.userID}, {$addToSet: {followings: mongoose.Types.ObjectId(req.params.id)}})
  await User.findByIdAndUpdate({_id: req.params.id}, {$addToSet: {followers: mongoose.Types.ObjectId(req.userID)}})
  return res.status(sc.OK).json({success: true})
})

// POST /api/unfollow/{id} - unfollow a user by id
app.post('/api/unfollow/:id', async (req, res) => {

  if (req.userID == req.params.id) {
    return res.status(sc.BAD_REQUEST).json({success: true, message: `You can't unfollow youself`})
  }
  const user = await User.findById({_id: req.params.id}, {_id:1})
  if(!user) {
    return res.status(sc.BAD_REQUEST).json({success: false, message: `No user found with id = ${req.params.id}`})
  }
  
  await User.findByIdAndUpdate({_id: req.userID}, {$pull: {followings: req.params.id}})
  await User.findByIdAndUpdate({_id: req.params.id}, {$pull: {followers: req.userID}})
  return res.status(sc.OK).json({success: true})
})


// GET /api/user 
// User Name, number of followers & followings
app.get('/api/user', async (req, res) => {
  const result = await User.aggregate([
    { $match: {_id: ObjectId(req.userID)}},
    {
      $project: {
        name: "$name",
        numFollowers: {$size: "$followers"},
        numFollowings: {$size: "$followings"},
      },
    } 
  ])
  const user = result[0]
  const userID = user._id
  delete user._id
  return res.status(sc.OK).json({success: true, user: {id: userID, ...user}})
})


// POST api/posts/ - add new post
// Input: Title, Description
// RETURN: Post-ID, Title, Description, Created Time(UTC).

app.post('/api/posts', async (req, res) => {
  const {_id: postID, title, description, createdAt: created_at} = await Post.create({
    title: req.body.title,
    description: req.body.description,
    postUserID: req.userID,
  })
  return res.status(sc.CREATED).json({success: true, post: {postID, title, description, created_at}})
})

// DELETE api/posts/{id} - delete a post by post id
app.delete('/api/posts/:id', async (req, res) => {
  const {postUserID} = await Post.findById({_id: req.params.id}, {postUserID: 1})
  if(postUserID != req.userID) {
    return res.status(sc.UNAUTHORIZED).json({success: false, message: 'Unauthorized'})
  }
  await Post.findByIdAndDelete({_id: req.params.id})
  return res.status(sc.NO_CONTENT).json({success: true})
})

// POST /api/like/{id} - Like a post
app.post('/api/like/:id', async (req, res) => {
  const post = await Post.findById({_id: req.params.id}, {_id:1})
  if(!post) {
    return res.status(sc.BAD_REQUEST).json({success: false, message: `No post found with id = ${req.params.id}`})
  }
  await Post.findByIdAndUpdate({_id: req.params.id}, {$addToSet: {likes: req.userID}})
  return res.status(sc.OK).json({success: true})
})

// POST /api/unlike/{id} - Unlike a post
app.post('/api/unlike/:id', async (req, res) => {
  const post = await Post.findById({_id: req.params.id}, {_id: 1})
  if(!post) {
    return res.status(sc.BAD_REQUEST).json({success: false, message: `No post found with id = ${req.params.id}`})
  }

  await Post.findByIdAndUpdate({_id: req.params.id}, {$pull: {likes: req.userID}})
  return res.status(sc.OK).json({success: true})
})


// POST /api/comment/{id} - Add a comment to post and return commentID
app.post('/api/comment/:id', async (req, res) => {
  const post = await Post.findById({_id: req.params.id}, {_id: 1})
  if(!post) {
    return res.status(sc.BAD_REQUEST).json({success: false, message: `No post found with id = ${req.params.id}`})
  }
  if(!req.body.comment || req.body.comment.trim().length==0) {
    return res.status(sc.BAD_REQUEST).json({success: false, message: `Comment can't be empty`})
  }
  console.log(req.body.comment.trim().length);
  const commentID = new mongoose.Types.ObjectId()
  await Post.findByIdAndUpdate({_id: req.params.id}, {$addToSet: {comments: {
    _id: commentID, comment: req.body.comment, commentUserID: req.userID
  }}})
  return res.status(sc.CREATED).json({success: true, commentID})
})


// GET api/posts/{id} - Get a post by id with number of likes and comments
app.get('/api/posts/:id', async (req, res) => {
  const result = await Post.aggregate([
    { $match: {_id: ObjectId(req.params.id)}},
    {
      $project: {
        title: "$title",
        description: "$description",
        numLikes: {$size: "$likes"},
        numComments: {$size: "$comments"}
      },
    } 
  ])
  let post = {}
  for(let [key, value] of Object.entries(result[0])) {
    if(key == '_id') continue
    post[key] = value
  }

  return res.status(sc.OK).json({success: true, post})
})


// GET /api/all_posts - get all posts of authenticated user sorted by post time
// return id, title desc, created_at, comments, likes

app.get('/api/all_posts', async (req, res) => {
  let posts = await Post.find({postUserID: req.userID}, {_id: 1, title: 1, description: 1, createdAt: 1, comments: 1, likes: 1})

  posts = posts.map(post => {
    let comments = post.comments.map(comment => {
      return {id: comment._id, comment: comment.comment, commentUserID: comment.commentUserID}
    })
    return {id: post._id, title: post.title, desc: post.description, created_at: post.createdAt, comments, likes: post.likes}
  })

  return res.status(sc.OK).json({success: true, posts})
})


app.get('*', (req, res) => {
  return res.status(404).send({success: false, message: 'Page Not Found'})
})

const errorHandler = (error, req, res, next) => {
  let errors = [];
  if (error.name === "ValidationError") {
    Object.keys(error.errors).forEach((key) => {
      errors.push(error.errors[key].message)
    });
  }
  // let message = 'Something went wrong'
  let message = error.message
  let status = sc.INTERNAL_SERVER_ERROR
  
  if(errors.length) {
    status = sc.BAD_REQUEST
    if(errors.length == 1) {
      message = errors[0]
    } else {
      message = errors
    }
  }
  return res.status(status).json({success: false, message})
}
app.use(errorHandler)

export {app}