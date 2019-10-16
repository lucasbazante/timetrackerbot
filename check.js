const mongoose = require('mongoose');

//model de pastas
const check = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    userid: {
        type: String,
        required: true
    },
    checkin: { type : Date }, 
    checkout:  {type: Date },
    break: { type : Date }, 
    endbreak:  {type: Date }
});

module.exports = mongoose.model('check', check);
