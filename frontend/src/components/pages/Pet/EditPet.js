import api from '../../../utils/api'
import { useState, useEffect} from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styles from './AddPet.module.css'
import PetForm from '../../form/PetForm'
import useFlashMessage from '../../../hooks/useFlashMessage'

function EditPet() {
    const [pet, setPet] = useState({})
    const [token] = useState(localStorage.getItem('token') || '')
    const {id} = useParams()
    const {setFlashMessage} = useFlashMessage()
    const navigate = useNavigate()

    useEffect(() => {
        api.get(`/pet/${id}`, {
            headers: {
                Authorization: `Bearer ${JSON.parse(token)}`
            }
        })
        .then((response) => {
            setPet(response.data.pet)
        })
        .catch((err) => {
            console.log(err)
        })
    }, [token, id])

    async function updatePet(pet) {
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

        const data = await api.patch(`/pet/${id}`, formData, {
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
                <h1>Editando o pet: {pet.name}</h1>
                <p>Depois da edição os dados serão atualizados no sistema</p>
            </div>
            {pet.name && (
                <PetForm petData={pet} handleSubmit={updatePet} btnText="Atualizar"/>
            )}
        </section>
    )
}

export default EditPet