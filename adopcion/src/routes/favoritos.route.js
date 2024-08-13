import { Router } from "express"
import  {listarFavo,agregarFavorito,eliminarFavorito, listarMascotasAdoptadas,getPetById } from '../controllers/favoritos.js';
//import {validarUsuario, validarUsu} from '../../validate/Usuariosvalidate.js'
import { validarToken  } from '../controllers/autenticacion.js'

const rutafavoritos = Router()
// Listar todos los historiales médicos
rutafavoritos.get('/listarfavo', validarToken, listarFavo);

rutafavoritos.get('/listaradoptadas', validarToken, listarMascotasAdoptadas)

// Registrar un nuevo historial médico
rutafavoritos.post('/registrarfavo/:id_mascota', validarToken,agregarFavorito);

// Actualizar un historial médico por ID
rutafavoritos.delete('/eliminarfavo/:id_mascota',validarToken, eliminarFavorito);

rutafavoritos.get('/mascota/:id_mascota', validarToken, getPetById);
export default rutafavoritos;