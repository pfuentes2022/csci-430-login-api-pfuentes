const mongoose = require('mongoose') 
const validator = require('validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const Schema = mongoose.Schema
//Makes schema for user creation

const userSchema = new Schema({ 
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Email is invalid.')
        }
      }
    },

    password: {
        type: String,
        required: true,
        trim: true,
        minLength: 8
      },

      name: { 
        type: String,
        unique: true,
        required: true,
        trim: true
      },

      avatar: {
        type: Buffer
      },

      tokens: [{
        token: {
            type: String,
            required: true
        }
    }]

  })

  userSchema.pre('save', async function(next) {
  
    const user = this
    
    if (user.isModified('password')) {
      user.password = await bcrypt.hash(user.password, 8)
    }
    
    next()  // run the save() method
  })

  userSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
    const user = this

    await Task.deleteMany({owner: user._id})
    next()
  })

  userSchema.methods.generateAuthToken = async function () {
    const user = this
   
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JSON_WEB_TOKEN_SECRET)
  
    user.tokens = user.tokens.concat({ token })
    await user.save()
    console.log('Returning token')
    return token
  }

  userSchema.statics.findByCredentials = async (email, password) => {
    console.log('Searching for user')       
    const user = await User.findOne({email}) 
    if (!user) { 
      throw new Error('Unable to login') 
    } 
    const isMatch = await bcrypt.compare(password, user.password) 
    if (!isMatch) { 
      throw new Error('Unable to login') 
    } 
    return user 
  }

  userSchema.virtual('tasks', {
    localField: '_id',
    foreignField: 'owner',
    ref: 'Task'
})

  userSchema.methods.toJSON = function() {
    const user = this
    
    const userObject = user.toObject()
    
    delete userObject.password
    delete userObject.__v
    delete userObject.tokens
    delete userObject.avatar
    
    return userObject
  }

  const User = mongoose.model('User', userSchema);

  module.exports = User