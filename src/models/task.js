const mongoose = require('mongoose')
const User = require('./user')

const Schema = mongoose.Schema

const taskSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String
    },
    completed: {
        type: Boolean,
        default: false
    },
    owner: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, 
{ timestamps: true })

taskSchema.methods.toJSON = function() {
    const user = this
    
    const userObject = user.toObject()
    
    delete userObject.__v
    
    return userObject
  }

const Task = mongoose.model('Task', taskSchema);

module.exports = Task