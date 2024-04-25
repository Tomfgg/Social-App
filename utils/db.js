const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/Node2ndproject')
.then(()=>{
    console.log('mongoose successfuly connected to the database')
})
.catch((err)=>{
    console.error('something went wrong', err)
})