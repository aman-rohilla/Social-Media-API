## Social Media API

#### JavaScript, Node.js, Express.js, MongoDB, Mongoose, REST API, JWT, User Authentication, Docker

#### Overview

<pre>
Register/login on the app
Get user profile
Follow another user
Upload/delete a post
Like/unlike a post
Comment on a post
See all posts of a user
<pre>

##### API Endpoints: 

<pre>
<b>POST</b>   /api/register       - Register an account with name, email and password
<b>POST</b>   /api/authenticate   - Login or get access token and refresh token with name and password
<b>POST</b>   /api/follow/{id}    - Follow a user by userID
<b>POST</b>   /api/unfollow/{id}  - Unfollow a user by userID
<b>GET</b>    /api/user           - Get user info of currently logged in user
<b>POST</b>   /api/posts          - Create a new post
<b>GET</b>    /api/posts/{id}     - Get a post info by postID
<b>DELETE</b> /api/posts/{id}     - Delete a post by postID
<b>POST</b>   /api/like/{id}      - Like a post by postID
<b>POST</b>   /api/unlike/{id}    - Unlike a post by postID
<b>POST</b>   /api/comment/{id}   - Comment on a post by postID
<b>GET</b>    /api/posts          - Get info of all posts created by a user
</pre>