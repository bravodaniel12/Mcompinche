import { Router } from "express"
import  {listarFavo,agregarFavorito,eliminarFavorito } from '../controllers/favoritos.js';
//import {validarUsuario, validarUsu} from '../../validate/Usuariosvalidate.js'
import { validarToken  } from '../controllers/autenticacion.js'

const rutafavoritos = Router()
// Listar todos los historiales médicos
rutafavoritos.get('/listarfavo', validarToken, listarFavo);

// Registrar un nuevo historial médico
rutafavoritos.post('/registrarfavo', validarToken,agregarFavorito);

// Actualizar un historial médico por ID
rutafavoritos.delete('/eliminarfavo/:id_mascota',validarToken, eliminarFavorito);


export default rutafavoritos;