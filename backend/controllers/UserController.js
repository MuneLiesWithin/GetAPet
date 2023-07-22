const User = require('../models/User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

// Helpers
const createUserToken = require('../helpers/create-user-token')
const getToken = require('../helpers/get-token')
const getUserByToken = require('../helpers/get-user-by-token')

module.exports = class UserController {
    static async register(req, res) {
       const { name, email, phone, password, confirmpassword } = req.body 

       // Validations
       if(!name) {
        res.status(422).json({message: 'O nome é obrigatório!'})
        return
       }
       if(!email) {
        res.status(422).json({message: 'O E-mail é obrigatório!'})
        return
       }
       if(!phone) {
        res.status(422).json({message: 'O telefone é obrigatório!'})
        return
       }
       if(!password) {
        res.status(422).json({message: 'Insira sua senha!'})
        return
       }
       if(!confirmpassword) {
        res.status(422).json({message: 'Confirme sua senha!'})
        return
       }
       if(password !== confirmpassword) {
        res.status(422).json({message: 'Senhas diferentes!'})
        return
       }

       // Check if user exists
       const UserExists = await User.findOne({email: email})

       if(UserExists) {
        res.status(422).json({message: 'Usuário já cadastrado!'})
        return
       }

       // Create password
       const salt = await bcrypt.genSalt(12)
       const hashPass = await bcrypt.hash(password, salt)

       // Create user
       const user =  new User({
        name,
        email,
        phone,
        password: hashPass
       })

       try {
        const newUser = await user.save()
        await createUserToken(newUser, req, res)
       } catch (error) {
        res.status(500).json({message: error})
       }
    }

    static async login(req, res) {
        const {email, password} = req.body

        if(!email) {
            res.status(422).json({message: 'Insira seu E-mail!'})
            return
        }
        if(!password) {
            res.status(422).json({message: 'Insira sua senha!'})
            return
        }

        // Check if user exists
        const user = await User.findOne({email: email})

        if(!user) {
            res.status(422).json({message: 'Não há usuário cadastrado com este E-mail!'})
            return
        }

        // Check if password matches
        const checkPass = await bcrypt.compare(password, user.password)

        if(!checkPass) {
            res.status(422).json({message: 'Senha inválida!'})
            return
        }

        await createUserToken(user, req, res)
    }

    static async checkUser(req, res) {
        let currentUser

        if(req.headers.authorization) {
            const token = getToken(req)
            const decoded = jwt.verify(token, 'nossosecret')

            currentUser = await User.findById(decoded.id).select('-password')
        } else {
            currentUser = null
        }

        res.status(200).json(currentUser)
    }

    static async getUserById(req, res) {
        const id = req.params.id
        
        if(!mongoose.isValidObjectId(id)) {
            res.status(422).json({message: "ID inválido!"})
            return
        }
    
        const user = await User.findById(id).select('-password')

        if(!user) {
            res.status(422).json({message: "Usuário não encontrado!"})
            return
        }

        res.status(200).json({user})   
    }

    static async editUser(req, res) {
        const id = req.params.id

        const token = getToken(req)
        const user = await getUserByToken(token)

        const {name, email, phone, password, confirmpassword} = req.body

        if(req.file) {
            user.image = req.file.filename
        }

        // Validations
        if(!name) {
            res.status(422).json({message: 'O nome é obrigatório!'})
            return
        }
        user.name = name

        if(!email) {
            res.status(422).json({message: 'O E-mail é obrigatório!'})
            return
        }

        const UserExists = await User.findOne({email: email})

        // Check if email is already taken
        if(UserExists && user._id.toString() !== UserExists._id.toString()) {
            res.status(422).json({message: 'Este E-mail já está em uso!'})
        }
        user.email = email

        if(!phone) {
            res.status(422).json({message: 'O telefone é obrigatório!'})
            return
        }
        user.phone = phone

        if(password !== confirmpassword) {
            res.status(422).json({message: 'Senhas diferentes!'})
            return
        } else if(password === confirmpassword && password != null) {
            const salt = await bcrypt.genSalt(12)
            const hashPass = await bcrypt.hash(password, salt)

            user.password = hashPass
        }
        
        try {
            await User.findOneAndUpdate(
                {_id: user._id},
                {$set: user},
                {new: true}
            )
            res.status(200).json({message: 'Usuário atualizado com sucesso!'})
        } catch (error) {
            res.status(500).json({message: error})
        }
    }
}