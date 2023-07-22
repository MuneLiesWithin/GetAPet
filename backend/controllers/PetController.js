const Pet = require('../models/Pet')
const mongoose = require('mongoose')

// Helpers
const getToken = require('../helpers/get-token')
const getUserByToken = require('../helpers/get-user-by-token')

module.exports = class PetController {
    static async create(req, res) {
        const {name, age, weight, color} = req.body

        const images = req.files

        const available = true

        // Validations
        if(!name) {
            res.status(422).json({message: 'O nome é obrigatório!'})
            return
        }
        if(!age) {
            res.status(422).json({message: 'A idade é obrigatória!'})
            return
        }
        if(!weight) {
            res.status(422).json({message: 'O peso é obrigatório!'})
            return
        }
        if(!color) {
            res.status(422).json({message: 'A cor é obrigatória!'})
            return
        }
        if(!images) {
            res.status(422).json({message: 'A imagem é obrigatória!'})
            return
        }
        if(images.length === 0) {
            res.status(422).json({message: 'A imagem é obrigatória!'})
            return
        }
        
        // Get owner
        const token = getToken(req)
        const user = await getUserByToken(token)

        // Create a pet
        const pet = new Pet({
            name,
            age,
            weight,
            color,
            available,
            images: [],
            user: {
                _id: user.id,
                name: user.name,
                image: user.image,
                phone: user.phone
            }
        })

        images.map((image) => {
            pet.images.push(image.filename)
        })

        try {
            const newPet = await pet.save()
            res.status(201).json({message: 'Pet cadastrado com sucesso!', newPet})
        } catch (err) {
            res.status(500).json({message: err})
        }
    }

    static async getAll(req, res) {
        const pets = await Pet.find().sort('-createdAt')
        res.status(200).json({pets})
    }

    static async getAllUserPets(req, res) {
        // Get user by token
        const token = getToken(req)
        const user = await getUserByToken(token)

        const pets = await Pet.find({'user._id': user._id.toString()}).sort('-createdAt')

        res.status(200).json({pets})
    }

    static async getAllUserAdoptions(req, res) {
        // Get user by token
        const token = getToken(req)
        const user = await getUserByToken(token)

        const pets = await Pet.find({'adopter._id': user._id}).sort('-createdAt')

        res.status(200).json({pets})
    }

    static async getPetById(req, res) {
        const id = req.params.id

        // Check if ID is valid
        if(!mongoose.isValidObjectId(id)) {
            res.status(422).json({message: "ID inválido!"})
            return
        }

        const pet = await Pet.findOne({_id: id})

        // Check if pet exists
        if(!pet) {
            res.status(404).json({message: 'Pet não encontrado!'})
            return
        }

        res.status(200).json({pet})
    }

    static async removePetById(req, res) {
        const id = req.params.id

        if(!mongoose.isValidObjectId(id)) {
            res.status(422).json({message: "ID inválido!"})
            return
        }

        const pet = await Pet.findOne({_id: id})

        if(!pet) {
            res.status(404).json({message: 'Pet não encontrado!'})
            return
        }

        // Check if logged user registered the pet
        const token = getToken(req)
        const user = await getUserByToken(token)
        
        if(pet.user._id.toString() !== user._id.toString()) {
            res.status(422).json({message: 'Houve um problema!'})
            return
        }

        await Pet.findByIdAndRemove(id)

        res.status(200).json({message: 'Pet excluído com sucesso!'})
    }

    static async updatePet(req, res) {
        const id = req.params.id
        const {name, age, weight, color, available} = req.body
        const images = req.files

        const updatedData = {}

        if(!mongoose.isValidObjectId(id)) {
            res.status(422).json({message: "ID inválido!"})
            return
        }

        const pet = await Pet.findOne({_id: id})

        if(!pet) {
            res.status(404).json({message: 'Pet não encontrado!'})
            return
        }

        const token = getToken(req)
        const user = await getUserByToken(token)
        
        if(pet.user._id.toString() !== user._id.toString()) {
            res.status(422).json({message: 'Houve um problema!'})
            return
        }

        if(!name) {
            res.status(422).json({message: 'O nome é obrigatório!'})
            return
        } else {
            updatedData.name = name
        }
        if(!age) {
            res.status(422).json({message: 'A idade é obrigatório!'})
            return
        } else {
            updatedData.age = age
        }
        if(!weight) {
            res.status(422).json({message: 'O peso é obrigatório!'})
            return
        } else {
            updatedData.weight = weight
        }
        if(!color) {
            res.status(422).json({message: 'A cor é obrigatório!'})
            return
        } else {
            updatedData.color = color
        }
        if(images.length > 0) {
            updatedData.images = []
            images.map((image) => {
                updatedData.images.push(image.filename)
            })
        }
        

        await Pet.findByIdAndUpdate(id, updatedData)

        res.status(200).json({message: 'Pet atualizado com sucesso!'})
    }

    static async schedule(req, res) {
        const id = req.params.id

        if(!mongoose.isValidObjectId(id)) {
            res.status(422).json({message: "ID inválido!"})
            return
        }

        const pet = await Pet.findOne({_id: id})

        if(!pet) {
            res.status(404).json({message: 'Pet não encontrado!'})
            return
        }

        // Check if user registered pet
        const token = getToken(req)
        const user = await getUserByToken(token)
        
        if(pet.user._id.toString() === user._id.toString()) {
            res.status(422).json({message: 'Não é possível agendar uma visita ao seu próprio pet!'})
            return
        }

        // Check if user has already scheduled a visit
        if(pet.adopter) {
            if(pet.adopter._id.toString() === user._id.toString()){
                res.status(422).json({message: 'Você já agendou uma visita a este pet!'})
                return
            }
        }

        // Add user to pet
        pet.adopter = {
            _id: user._id,
            name: user.name,
            image: user.image
        }

        await Pet.findByIdAndUpdate(id, pet)
        res.status(200).json({message: `Visita agendada com sucesso, entre em contado com ${pet.user.name} pelo telefone ${pet.user.phone}`})
    }

    static async concludeAdoption(req, res) {
        const id = req.params.id

        if(!mongoose.isValidObjectId(id)) {
            res.status(422).json({message: "ID inválido!"})
            return
        }

        const pet = await Pet.findOne({_id: id})

        if(!pet) {
            res.status(404).json({message: 'Pet não encontrado!'})
            return
        }

        const token = getToken(req)
        const user = await getUserByToken(token)
        
        if(pet.user._id.toString() !== user._id.toString()) {
            res.status(422).json({message: 'Houve um problema!'})
            return
        }

        pet.available = false

        await Pet.findByIdAndUpdate(id, pet)
        res.status(200).json({message: 'Adoção concluída com sucesso!'})
    }
}