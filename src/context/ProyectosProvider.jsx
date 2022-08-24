import {useState, useEffect, createContext} from "react"
import clienteAxios from "../config/clienteAxios"
import {useNavigate} from "react-router-dom"
import useAuth from "../hooks/useAuth"
import io from "socket.io-client"

let socket

const ProyectosContext = createContext()

const ProyectosProvider = ({children}) =>{

    const [proyectos, setProyectos] = useState([])
    const [alerta, setAlerta] = useState({})
    const [proyecto, setProyecto] = useState({})
    const [cargando, setCargando] = useState(false)
    const [modalFormularioTarea, setModalFormularioTarea] = useState(false)
    const [tarea, setTarea] = useState({})
    const [modalEliminarTarea, setModalEliminarTarea] = useState(false)
    const [colaborador, setColaborador] = useState({})
    const [modalEliminarColaborador, setModalEliminarColaborador] = useState(false)
    const [buscador, setBuscador] = useState(false)
    const {auth} = useAuth()

    const navigate = useNavigate()

    useEffect(() =>{
        const obtenerProyectos = async () =>{
            try {
                const token = localStorage.getItem("token")
                if(!token) return

                const config = {
                    headers:{
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    }
                }

                const { data } = await clienteAxios("/proyectos", config)
                setProyectos(data)
            } catch (error) {
                console.log(error)
            }
        }
        obtenerProyectos()
    },[auth])

    useEffect(() =>{
        socket = io(import.meta.env.VITE_BACKEND_URL)
    },[])

    const mostrarAlerta = alerta =>{
        setAlerta(alerta)

        setTimeout(() =>{
            setAlerta({})
        },5000)
    }

    const submitProyecto = async proyecto =>{

        if(proyecto.id){
            await editarProyecto(proyecto)
        }else{
            await nuevoProyecto(proyecto)
        }

        return
        
    }

    const editarProyecto = async proyecto =>{
        try {
            const token = localStorage.getItem("token")
            if(!token) return

            const config = {
                headers:{
                    "Content-Type":"application/json",
                    Authorization:`Bearer ${token}`
                }
            }

            const {data} = await clienteAxios.put(`/proyectos/${proyecto.id}`, proyecto, config)
            
            const proyectosAct = proyectos.map(proyectoState => proyectoState._id === data._id ? data : proyectoState)
            setProyectos(proyectosAct)

            setAlerta({
                msg:"Proyecto Actualizado Correctamente",
                error: false
            })

            setTimeout(() =>{
                setAlerta({})
                navigate("/proyectos")
            }, 3000)
            
        } catch (error) {
            console.log(error)
        }
    }

    const nuevoProyecto = async proyecto =>{
        try {
            const token = localStorage.getItem("token")
            if(!token) return

            const config = {
                headers:{
                    "Content-Type":"application/json",
                    Authorization:`Bearer ${token}`
                }
            }

            const {data} = await clienteAxios.post("/proyectos", proyecto, config)
            
            setProyectos([...proyectos,data])

            setAlerta({
                msg:"Proyecto creado Correctamente",
                error:false
            })

            setTimeout(() =>{
                setAlerta({})
                navigate("/proyectos")
            },3000)

        } catch (error) {
            console.log(error)
        }
    }

    const obtenerProyecto = async id =>{
        setCargando(true)
        try {
            const token = localStorage.getItem("token")
            if(!token) return

            const config = {
                headers:{
                    "Content-Type":"application/json",
                    Authorization:`Bearer ${token}`
                }
            }

            const {data} = await clienteAxios(`/proyectos/${id}`,config)
            setProyecto(data)
            setAlerta({})
        } catch (error) {
            navigate("/proyectos")
            setAlerta({
                msg:error.response.data.msg,
                error:true
            })
            setTimeout(() =>{
                setAlerta({})
            },3000)
        } finally{
            setCargando(false)
        }
    }

    const eliminarProyecto = async id =>{
        try {
            const token = localStorage.getItem("token")
            if(!token) return

            const config = {
                headers:{
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }
            const {data} = await clienteAxios.delete(`/proyectos/${id}`,config)

            //Sincronizar state
            const proyectosAct = proyectos.filter(proyectoState => proyectoState._id !== id)
            setProyectos(proyectosAct)
            
            setAlerta({
                msg:data.msg,
                error: false
            })

            setTimeout(() =>{
                setAlerta({})
                navigate("/proyectos")
            }, 3000)

        } catch (error) {
            console.log(error)
        }
    }

    const handleModalTarea = () =>{
        setModalFormularioTarea(!modalFormularioTarea)
        setTarea({})
    }

    const submitTarea = async tarea =>{
        
        if(tarea?.id){
            await editarTarea(tarea)
        }else{
            await crearTarea(tarea)
        }

    }

    const handleModalEditarTarea = tarea =>{
        setTarea(tarea)
        setModalFormularioTarea(true)
    }

    const crearTarea = async tarea =>{
        try {
            const token = localStorage.getItem("token")
            if(!token) return

            const config = {
                headers:{
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }

            const {data} = await clienteAxios.post("/tareas",tarea,config)

            
            setAlerta({})
            setModalFormularioTarea(false)

            //Socket IO
            socket.emit("nueva tarea", data)
        } catch (error) {
            console.log(error)
        }
    }

    const editarTarea = async tarea =>{
        try {
            const token = localStorage.getItem("token")
            if(!token) return

            const config = {
                headers:{
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }

            const { data } =await clienteAxios.put(`/tareas/${tarea.id}`,tarea,config)
            

            //Socket
            socket.emit("actualizar tarea", data)

            setAlerta({})
            setModalFormularioTarea(false)

        } catch (error) {
            console.log(error)
        }
    }
    
    const handleModalEliminarTarea = tarea =>{
        setTarea(tarea)
        setModalEliminarTarea(!modalEliminarTarea)
    }

    const eliminarTarea = async () =>{
        try {
            const token = localStorage.getItem("token")
            if(!token) return

            const config = {
                headers:{
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }

            const { data } =await clienteAxios.delete(`/tareas/${tarea._id}`,config)
            setAlerta({
                msg: data.msg,
                error:false
            })
            
            
            setModalEliminarTarea(false)

            //Socket
            socket.emit("eliminar tarea", tarea)

            setTarea({})
            setTimeout(() =>{
                setAlerta({})
            },3000)
        } catch (error) {
            console.log(error)
        }
        
        
    }

    const submitColaborador = async email =>{
        setCargando(true)
        try {
            const token = localStorage.getItem("token")
            if(!token) return

            const config = {
                headers:{
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }

            const {data} = await clienteAxios.post("/proyectos/colaboradores", {email} , config)
            
            setColaborador(data)
            setAlerta({})
        } catch (error) {
            setAlerta({
                msg: error.response.data.msg,
                error:true
            })
        } finally{
            setCargando(false)
        }
    } 

    const agregarColaborador = async email =>{
        try {
            const token = localStorage.getItem("token")
            if(!token) return

            const config = {
                headers:{
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }

            const {data} = await clienteAxios.post(`/proyectos/colaborador/${proyecto._id}`, email, config)
            setAlerta({
                msg:data.msg,
                error:false
            })
            setColaborador({})

            setTimeout(() =>{
                setAlerta({})
            }, 3000)
        } catch (error) {
            setAlerta({
                msg: error.response.data.msg,
                error:true
            })
        }
    }

    const handleModalEliminarColaborador =  (colaborador) =>{
        setModalEliminarColaborador(!modalEliminarColaborador)
        setColaborador(colaborador)
    }

    const eliminarColaborador = async () =>{
        try {
            const token = localStorage.getItem("token")
            if(!token) return

            const config = {
                headers:{
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }

            const {data} = await clienteAxios.post(`/proyectos/eliminar-colaborador/${proyecto._id}`, {id: colaborador._id}, config)

            const proyectoAct = {...proyecto}
            proyectoAct.colaboradores = proyectoAct.colaboradores.filter(colaboradorState => colaboradorState._id !== colaborador._id)

            setProyecto(proyectoAct)

            setAlerta({
                msg:data.msg,
                error:false
            })
            setColaborador({})
            setModalEliminarColaborador(false)

            setTimeout(() =>{
                setAlerta({})
            }, 3000)

        } catch (error) {
            console.log(error.response)
        }
    }

    const completarTarea = async id =>{
        try {
            const token = localStorage.getItem("token")
            if(!token) return

            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }
            const {data} = await clienteAxios.post(`/tareas/estado/${id}`, {}, config)
            
            
            //Socket
            socket.emit("cambiar estado", data)

            setTarea({})
            setAlerta({})
        } catch (error) {
            console.log(error.response)
        }
    }

    const handleBuscador = () =>{
        setBuscador(!buscador)
    }

    //Socket io
    const submitTareasProyecto = (tarea) =>{
        //Agrega la tarea al state
        const proyectoAct = {...proyecto}
        proyectoAct.tareas = [...proyectoAct.tareas, tarea]
        setProyecto(proyectoAct)
    }

    const eliminarTareaProyecto = tarea =>{
        const proyectoAct = {...proyecto}
        proyectoAct.tareas = proyectoAct.tareas.filter(tareaState => tareaState._id !== tarea._id)
        setProyecto(proyectoAct)
    }

    const actualizarTareaProyecto = tarea =>{
        const proyectoAct = {...proyecto}
        proyectoAct.tareas = proyectoAct.tareas.map( tareaState => tareaState._id === tarea._id ? tarea : tareaState)
        setProyecto(proyectoAct)
    }

    const cambiarEstadoTarea = tarea =>{
        const proyectoAct = {...proyecto}
        proyectoAct.tareas = proyectoAct.tareas.map(tareaState => tareaState._id === tarea._id ? tarea : tareaState)
        setProyecto(proyectoAct)
    }

    const cerrarSesionProyectos = () =>{
        setProyectos([])
        setProyecto({})
        setAlerta({})
    }

    return(
        <ProyectosContext.Provider
            value={{
                proyectos,
                mostrarAlerta,
                alerta,
                submitProyecto,
                obtenerProyecto,
                proyecto,
                cargando,
                eliminarProyecto,
                handleModalTarea,
                modalFormularioTarea,
                submitTarea,
                handleModalEditarTarea,
                tarea,
                handleModalEliminarTarea,
                modalEliminarTarea,
                eliminarTarea,
                submitColaborador,
                colaborador,
                agregarColaborador,
                handleModalEliminarColaborador,
                modalEliminarColaborador,
                eliminarColaborador,
                completarTarea,
                handleBuscador,
                buscador,
                submitTareasProyecto,
                eliminarTareaProyecto,
                actualizarTareaProyecto,
                cambiarEstadoTarea,
                cerrarSesionProyectos
            }}
        >{children}   
        </ProyectosContext.Provider>
    )
}

export {
    ProyectosProvider
}

export default ProyectosContext