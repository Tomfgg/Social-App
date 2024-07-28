const mongoose = require('mongoose');
require('dotenv').config()
const DB_HOST = process.env.DB_HOST
const DB_PORT = process.env.DB_PORT
const DB_NAME = process.env.DB_NAME
const DB_CONNECT = process.env.DB_CONNECT

mongoose.connect(DB_CONNECT)
.then(()=>{
    console.log('mongoose successfuly connected to the database')
})
.catch((err)=>{
    console.error('something went wrong', err)
})