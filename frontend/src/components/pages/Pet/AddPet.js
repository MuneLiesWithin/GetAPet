import styles from './AddPet.module.css'
import api from '../../../utils/api'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import PetForm from '../../form/PetForm'

/* Hooks */
import useFlashMessage from '../../../hooks/useFlashMessage'


function AddPet() {
    const [token] = useState(localStorage.getItem('token') || '')
    const {setFlashMessage} = useFlashMessage()
    const navigate = useNavigate()

    async function registerPet(pet) {
        let msgType = 'success'

        const formData = new FormData()
        
        await Object.keys(pet).forEach((key) => {
            if(key === 'images') {
                for(let i = 0; i < pet[key].length; i++) {
                    formData.append('images', pet[key][i])
                }
            } else {
                formData.append(key, pet[key])
            }
        })

        const data = await api.post('/pet/create', formData, {
            headers: {
                Authorization: `Bearer ${JSON.parse(token)}`,
                'Content-Type': 'multipart/form-data'
            }
        })
        .then((response) => {
            return response.data
        })
        .catch((error) => {
            msgType = 'error'
            return error.response.data
        })
        
        setFlashMessage(data.message, msgType)
        if(msgType !== 'error'){
            navigate('/pet/mypets')
        } 
    }

    return (
        <section>
            <div className={styles.addpet_header}>
                <h1>Cadastre um Pet</h1>
                <p>Depois ele ficará disponível para adoção</p>
            </div>
            <PetForm btnText="Cadastrar Pet" handleSubmit={registerPet}/>
        </section>
    )
}

export default AddPet