import { mongoose, jwt, JWT_SECRET } from './vars.mjs'

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, `Name can't be empty`],
    minlength: [2, 'Name too short'],
    maxlength: [50, 'Name too big'],
    trim: true,
  }, 
  email: {
    type: String,
    required: [true, `Email can't be empty`],
    minlength: [6, 'Email too short'],
    maxlength: [50, 'Name too big'],
    trim: true,
    match: [/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, `Email format is invalid`],
    unique: true
  },
  password: {
    type: String,
    trim: true,
    required: [true, `Password can't be empty`],
    minlength: [8, 'Password is less than 8 characters'],
  },
  followers: [{
    type: mongoose.Schema.ObjectId,
    ref:'User',
  }],
  followings: [{
    type: mongoose.Schema.ObjectId,
    ref:'User',
  }]

},
{ 
  timestamps: true
})


UserSchema.methods.genAccessToken = function() {
  return jwt.sign({userID: this._id}, JWT_SECRET, {expiresIn: '7d'})
}

UserSchema.methods.genRefreshToken = function() {
  return jwt.sign({userID: this._id, refreshToken: true}, JWT_SECRET, {expiresIn: '14d'})
}

const User = mongoose.model('User', UserSchema)

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, `Post title can't be empty`],
    trim: true,
    maxlength: [100, `Post title can't have more than 100 characters`]
  },
  description: {
    type: String,
    required: [true, `Post description can't be empty`],
    maxlength: [500, `Post description can't have more than 500 characters`]
  },
  postUserID: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    comment: {
      type: String,
      required: [true, `Comment can't be empty`],
      minlength: [1, `Comment can't be empty`],
      maxlength: [500, `Comment can't have more than 500 characters`]
    },
    commentUserID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  
}, {timestamps: true})

const Post = mongoose.model('Post', PostSchema)

export {User, Post}
