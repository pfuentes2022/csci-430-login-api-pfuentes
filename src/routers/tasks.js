const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const { request } = require('express')
const MongoClient = require('mongodb').MongoClient


const router = new express.Router()

router.post('/tasks', auth, async(req, res) => {
    const user = req.user

    const task = new Task({
        ...req.body,
        owner: user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.get('/tasks', auth, async(req, res) => {
    const match = {}
    const sort = {}

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = (parts[1] == 'asc') ? 1 : -1
    }

    if (req.query.completed) {
        match.completed = (req.query.completed === 'true')
    }
    try {
        //console.log('test')
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        })

        res.send(req.user.tasks)
    } catch (e) {
        console.log(e)
        res.status(500).send()
    }
})



router.patch('/tasks', auth, async(req, res) => {
    const user = req.user
    const task = await Task.findOne({_id:req.body._id})
    const mods = req.body
    const props = Object.keys(mods)

    /*MongoClient.connect(process.env.MONGODB_URL, function(err, db) {
        const dbo = db.db("web-app-api")
        var temptask = dbo.collection('tasks').findOne({'title': req.body.title}).then(request => {
            console.log(request)
            console.log(temptask)       #### Leftover from overly complicated attempt, could not find by _id ####
        })
        console.log(props) */
    
    const modifiable = ['_id', 'title', 'description', 'completed']
    const isValid = props.every((prop) => modifiable.includes(prop))
    const validUser = task.owner.equals(user._id)
    
    if (!isValid || !validUser) {
        return res.status(400).send({ error: 'Invalid updates.' })
    }
  
    try {
            /*dbo.collection('tasks').findOneAndUpdate(     #### Leftover from overly complicated attempt ####
                {"title":req.body.title},
                {$set:{"description": req.body.description, "completed": req.body.completed}},
            )*/ 

        props.forEach((prop) => task[prop] = mods[prop])
        await task.save()
        res.send(task)
    } catch (e) {
        console.log(e)
        res.status(400).send()
    }
    res.status(200).send()
//})

})
    



    
router.delete('/tasks', auth, async(req, res) => {
    const user = req.user
    const task = await Task.findOne({_id:req.body._id})

    /*MongoClient.connect(process.env.MONGODB_URL, function(err, db) {
        
        const dbo = db.db("web-app-api")
        var look = req.body._id;
        var temptask = dbo.collection('tasks').findOne({'title': req.body.title}).then(request => {
            
            console.log(request)            #### Same as in the patch endpoint ####
            //console.log(temptask)
        }) */
    
    
    const isValid = task.owner.equals(user._id)
    if (!isValid) {
        return res.status(400).send({ error: 'Invalid updates.' })
    }
  
    try {
            /*dbo.collection('tasks').findOneAndDelete(
                {"title":"B"},
                {
                    writeConcern: {
                        w: 1,
                        j:true,
                        wtimeout: 1000
                    }
                }
            )*/

        await Task.deleteOne({_id: req.body._id})
        res.send(req.task)
        console.log("----------------------------------")
    } catch (e) {
        console.log(e)
        res.status(400).send()
    }
    res.status(200).send()
    //})
})


module.exports = router