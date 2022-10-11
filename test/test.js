import {mongoose, CONNECTION_STRING} from '../vars.mjs'
import {app} from '../app.mjs'
import {StatusCodes as sc} from 'http-status-codes'

import chai from 'chai'
import chaiHttp from 'chai-http';

try {
  await mongoose.connect(CONNECTION_STRING)
} catch (err) {
  console.log(`FAILED to connect to database...\nerror : ${err}`)    
// eslint-disable-next-line no-undef
  process.exit(0)
}


chai.should();
chai.use(chaiHttp);

var assert = chai.assert;
const testUser = {name: 'TestUser', email: 'testuser@rohilla.co.in', password: 'testpass'}
const testPost = {title: 'Post By TestUser', description: 'Desc of post by TestUser'}
const dummyUser = {name: 'DummyUser', email: 'dummyuser@rohilla.co.in', password: 'passpass'}
const dummyUserComment = 'Comment by DummyUser'

async function registerOrAuthenticate(user) {
  let res = await chai.request(app).post('/api/register').send(user)
  assert.isTrue(res.status == sc.CREATED || res.status == sc.CONFLICT)
  if(res.status == sc.CONFLICT) {
    res = await chai.request(app).post('/api/authenticate').send(user)
  }
  return res.body
}


// eslint-disable-next-line no-undef
// eslint-disable-next-line no-undef
describe('Social Media API', () => {
  let testUserToken = null
  let dummyUserToken = null
  let testUserRefreshToken = null
  let testUserID = null
  let dummyUserID = null
  let postID = null

  // eslint-disable-next-line no-undef
  before(async () => {
    // eslint-disable-next-line no-undef
    console.log(`Register or Authenticate TestUser and DummyUser for testing and setup environment`)
    testUserToken = (await registerOrAuthenticate(testUser)).token
    testUserRefreshToken = (await registerOrAuthenticate(testUser)).refresh_token
    dummyUserToken = (await registerOrAuthenticate(dummyUser)).token
    let res = await chai.request(app).get('/api/user').set({Authorization: testUserToken})
    testUserID = res.body.user.id
    res = await chai.request(app).get('/api/user').set({Authorization: dummyUserToken})
    dummyUserID = res.body.user.id

    res = await chai.request(app).post(`/api/posts`).set({'Authorization': testUserToken}).send(testPost)
    postID = res.body.post.postID
  })

// eslint-disable-next-line no-undef
  describe('POST /api/authenticate - Authenticate/login a user with email and password', () => {
    
// eslint-disable-next-line no-undef
    it(`It should return access token and refresh token by authenticating "TestUser" with email=testuser@rohilla.co.in and password=testpass`, (done) => {  
      chai.request(app).post('/api/authenticate').send(testUser).end((err, res) => {
        res.body.success.should.be.eq(true)
        res.status.should.be.eq(sc.OK)
        assert.isTrue(res.body.token.startsWith('Bearer'))
        assert.isTrue(res.body.refresh_token.startsWith('Bearer'))
      })
      done()
    })

  })

// eslint-disable-next-line no-undef
  describe('POST /api/register - Register a user with email and password', () => {
// eslint-disable-next-line no-undef
    it(`It should not register a user with already registered email`, (done) => {
      chai.request(app).post('/api/register').send(testUser).end((err, res) => {
        res.body.success.should.be.eq(false)
        res.status.should.be.eq(sc.CONFLICT)
      })
      done()
    })
  })

// eslint-disable-next-line no-undef
  describe('GET /api/refresh - Get a new access token from refresh token', () => {
    // eslint-disable-next-line no-undef
    it(`It should return an access token`, async () => {
      chai.request(app).get('/api/refresh').set({'Authorization': testUserRefreshToken}).end((err, res) => {
        res.body.success.should.be.eq(true)
        res.status.should.be.eq(sc.OK)
        assert.isTrue(res.body.token.startsWith('Bearer'))
      })
    })
  })



// eslint-disable-next-line no-undef
  describe('GET /api/user - Get info of authenticated user', () => {
    // eslint-disable-next-line no-undef
    it(`It should return name, userID, numFollowers, numFollowings of a user`, async () => {
      const res = await chai.request(app).get('/api/user').set({'Authorization': testUserToken})
      res.status.should.be.eq(sc.OK)
      assert.isDefined(res.body.user.name)
      assert.isDefined(res.body.user.id)
      assert.isDefined(res.body.user.numFollowers)
      assert.isDefined(res.body.user.numFollowings)
    })
  })

// eslint-disable-next-line no-undef
  describe('POST /api/follow/id - Follow a user by user id', () => {
    // eslint-disable-next-line no-undef
    it(`TestUser should follow DummyUser`, async () => {
      chai.request(app).post(`/api/follow/${dummyUserID}`).set({'Authorization': testUserToken}).end((err, res) => {
        res.status.should.be.eq(sc.OK)
      })
    })
  })

// eslint-disable-next-line no-undef
  describe('POST /api/unfollow/id - Unfollow a user by user id', () => {
    // eslint-disable-next-line no-undef
    it(`TestUser should unfollow DummyUser`, async () => {    
      chai.request(app).post(`/api/unfollow/${dummyUserID}`).set({'Authorization': testUserToken}).end((err, res) => {
        res.status.should.be.eq(sc.OK)
      })
    })
  })


// // eslint-disable-next-line no-undef
//   describe('POST /api/posts - add new post', () => {
// // eslint-disable-next-line no-undef
//     it(`TestUser should create a post with title='${testPost.title}', description='${testPost.description}'`, async () => {
//       const res = await chai.request(app).post(`/api/posts`).set({'Authorization': testUserToken}).send(testPost)
//       res.status.should.be.eq(sc.CREATED)
//       res.body.post.should.be.a('Object')
//     })
//   })

// eslint-disable-next-line no-undef
  describe('POST /api/like/id - Like a post by post id', () => {
    // eslint-disable-next-line no-undef
    it(`DummyUser should like post created by TestUser`, async () => {
      chai.request(app).post(`/api/like/${postID}`).set({'Authorization': dummyUserToken}).end((err, res) => {
        res.status.should.be.eq(sc.OK)
      })
    })
  })

  // eslint-disable-next-line no-undef
  describe('POST /api/unlike/id - Unlike a post by post id', () => {
    // eslint-disable-next-line no-undef
    it(`DummyUser should unlike post created by TestUser`, async () => {
      chai.request(app).post(`/api/unlike/${postID}`).set({'Authorization': dummyUserToken}).end((err, res) => {
        res.status.should.be.eq(sc.OK)
      })
    })
  })
  // eslint-disable-next-line no-undef
  describe('POST /api/comment/id - comment on a post by post id', () => {
    // eslint-disable-next-line no-undef
    it(`DummyUser should comment on post created by TestUser`, async () => {

      chai.request(app).post(`/api/comment/${postID}`).set({'Authorization': dummyUserToken}).send({comment: dummyUserComment}).end((err, res) => {
        res.status.should.be.eq(sc.CREATED)
        res.body.should.have.property('commentID')
      })
    })
  })

  // eslint-disable-next-line no-undef
  describe('GET /api/posts/id - Get info of a post by id', () => {
    // eslint-disable-next-line no-undef
    it(`It should return post title, description, number of likes and number of comments`, async () => {

      chai.request(app).get(`/api/posts/${postID}`).end((err, res) => {
        res.status.should.be.eq(sc.OK)
        res.body.post.should.have.property('title')
        res.body.post.should.have.property('description')
        res.body.post.should.have.property('numLikes')
        res.body.post.should.have.property('numComments')
      })
    })
  })

  // eslint-disable-next-line no-undef
  describe('GET /api/all_posts - Get info of all posts posted by an authenticated user', () => {
    // eslint-disable-next-line no-undef
    it(`It should return array of posts having postid, title, desc, created_at, comments and likes`, async () => {
      let res = await chai.request(app).post(`/api/like/${postID}`).set({'Authorization': dummyUserToken})
      res.status.should.be.eq(sc.OK)
      res = await chai.request(app).post(`/api/like/${postID}`).set({'Authorization': testUserToken})
      res.status.should.be.eq(sc.OK)      
      res = await chai.request(app).post(`/api/comment/${postID}`).set({'Authorization': dummyUserToken}).send({comment: dummyUserComment})
      res.status.should.be.eq(sc.CREATED)

      res = await chai.request(app).get(`/api/all_posts`).set({Authorization: testUserToken})
      res.status.should.be.eq(sc.OK)
      res.body.posts.should.be.a('Array')
      assert.isTrue(res.body.posts.length > 0)

      const post = res.body.posts.find(post => post.id == postID)
      post.should.have.property('id')
      post.should.have.property('title')
      post.should.have.property('desc')
      post.should.have.property('created_at')
      post.comments.should.be.a('Array')
      assert.isTrue(post.comments.length > 0)
      
      const comment = post.comments[0]  
      comment.should.have.property('id')
      comment.should.have.property('comment')
      comment.should.have.property('commentUserID')
      
      post.likes.should.be.a('Array')
      assert.isTrue(post.likes.length > 0)
      post.likes[0].should.be.a('String')
    })
  })

  
  // eslint-disable-next-line no-undef
  after(async () => {
    console.log('Deleting post created by TestUser')
    chai.request(app).delete(`/api/posts/${postID}`).set({'Authorization': testUserToken}).end((err, res) => {
      res.status.should.be.eq(sc.NO_CONTENT)
      process.exit(0)
    })
  })

})

