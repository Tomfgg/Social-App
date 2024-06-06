const express = require('express')
const app = express()
require('dotenv').config()
const port = process.env.PORT || 3000
const userRoutes = require('./routers/user')
const postRoutes = require('./routers/post')
const likeRoutes = require('./routers/like')
const replyRoutes = require('./routers/reply')
const friendRoutes = require('./routers/friend')
const commentRoutes = require('./routers/comment')
require('./utils/db')
const path = require('path')

app.use('/postFile',express.static(path.join(__dirname, 'uploads/posts')))
app.use('/commentFile',express.static(path.join(__dirname, 'uploads/comments')))
app.use('/replyFile',express.static(path.join(__dirname, 'uploads/replies')))


app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/users', userRoutes)
app.use('/posts', postRoutes)
app.use('/likes', likeRoutes)
app.use('/comments', commentRoutes)
app.use('/replies', replyRoutes)
app.use('/friends', friendRoutes)



app.use((err, req, res, next) => {
    const error = err.message || 'internal server error';
    const statusCode = err.statusCode || 500
    const status = err.status || 'error'

    res.status(statusCode).json({ error, statusCode, status })

})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})