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
const AppError = require('./utils/AppError')
require('./utils/db')
const multer = require('multer')
// const upload = multer()
const bodyParser = require('body-parser')
const path = require('path')
const fs = require('fs')
//================================

//================================
app.use('/postFile',express.static(path.join(__dirname, 'uploads/posts')))
app.use('/commentFile',express.static(path.join(__dirname, 'uploads/comments')))
app.use('/replyFile',express.static(path.join(__dirname, 'uploads/replies')))

// app.use(bodyParser.json({ limit: '50mb' }));
// app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// app.use(upload.any())
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/users', userRoutes)
app.use('/posts', postRoutes)
app.use('/likes', likeRoutes)
app.use('/comments', commentRoutes)
app.use('/replies', replyRoutes)
app.use('/friends', friendRoutes)

// app.get('/image/:name', async (req, res, next) => {
//     const { name } = req.params
//     fs.access(path.join(__dirname, 'uploads/posts', name), (err) => {
//         if (err) return next(new AppError('error accessing file', 404))
//         else res.setHeader('Content-Type', 'image/jpeg').send(fs.readFileSync(path.join(__dirname, 'uploads/posts', name)))
//     })

// })

app.use((err, req, res, next) => {
    const error = err.message || 'internal server error';
    const statusCode = err.statusCode || 500
    // const errors = err.errors || []
    const status = err.status || 'error'

    res.status(statusCode).json({ error, statusCode, status })

})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})