const mongoose = require('mongoose')

async function main() {
    await mongoose.connect('mongodb://localhost:27017/getapet')
    console.log('Conectou ao MongoDB!')
}

main().catch((err) => console.log(err))

module.exports = mongoose