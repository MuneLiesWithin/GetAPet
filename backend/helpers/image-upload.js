const multer = require('multer')
const path = require('path')

// Path to store images
const imageStorage = multer.diskStorage({
    destination: function (req, file, callback) {
        let folder = ''

        if(req.baseUrl.includes('user')) {
            folder = 'users'
        } else if(req.baseUrl.includes('pet')) {
            folder = 'pets'
        }

        callback(null, `public/images/${folder}`)
    },
    filename: function (req, file, callback) {
        callback(null, Date.now() + String(Math.floor(Math.random() * 1000)) +path.extname(file.originalname))
    }
})

const imageUpload = multer({
    storage: imageStorage,
    fileFilter(req, file, callback) {
        if(!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
            return callback(new Error('Por favor envie apenas jpg ou png!'))
        }
        callback(undefined, true)
    }
})

module.exports = { imageUpload }