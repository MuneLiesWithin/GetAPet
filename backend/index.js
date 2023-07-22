const express = require('express')
const cors = require('cors')
const UserRoutes = require('./routes/UserRoutes')
const PetRoutes = require('./routes/PetRoutes')

const app = express()

// JSON response
app.use(express.json())

// Solve cors
app.use(cors({ credentials: true, origin: 'http://localhost:3000' }))

// Public folder for imgs
app.use(express.static('public'))


// Routes
app.use('/user', UserRoutes)
app.use('/pet', PetRoutes)

app.listen(5000)