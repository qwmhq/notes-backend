require('dotenv').config()
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const Note = require('./models/note')

const app = express()

app.use(cors())
app.use(morgan('tiny'))
app.use(express.json())
app.use(express.static('dist'))

app.get('/api/notes', (request, response, next) => {
    Note.find({})
        .then(notes => {
            response.json(notes)
        })
        .catch(err => next(err))
})

app.get('/api/notes/:id', (request, response, next) => {
    Note.findById(request.params.id)
        .then(note => {
            if (note) {
                response.json(note)
            } else {
                response.status(404).end()
            }
        })
        .catch(error => next(error))
})

app.delete('/api/notes/:id', (request, response, next) => {
    Note.findByIdAndRemove(request.params.id)
        .then((result) => {
            if (result) {
                response.status(204).end()
            } else {
                response.statusMessage = 'note not found'
                response.status(404).end()
            }
        })
        .catch(err => next(err))
})

app.post('/api/notes', (request, response, next) => {
    const body = request.body

    const note = new Note({
        content: body.content,
        important: body.important || false,
    })

    note.save()
        .then(savedNote => {
            response.status(201).json(savedNote)
        })
        .catch(err => next(err))
})

app.put('/api/notes/:id', (request, response, next) => {
    const body = request.body

    if (body.content === undefined || body.important === undefined) {
        return response.status(400).json({
            error: '\'content\' or \'important\' field is missing'
        })
    }

    const note = {
        content: body.content,
        important: body.important
    }

    Note.findByIdAndUpdate(
        request.params.id,
        note,
        { new: true, runValidators: true, context: 'query' }
    )
        .then(updatedNote => {
            response.json(updatedNote)
        })
        .catch(err => next(err))
})

const unknownEndPoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}
app.use(unknownEndPoint)

const errorHandler = (error, request, response, next) => {
    if (error.name === 'CastError') {
        return response.status(404).send({ error: 'malformatted id' })
    } else if (error.name === 'ValidationError') {
        return response.status(400).json({ error: error.message })
    }
    next(error)
}
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})