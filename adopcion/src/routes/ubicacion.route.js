import { Router } from "express"
import  {obtenerDepartamentos,obtenerCiudadesPorDepartamento} from '../controllers/ubicacion.controller.js';
//import {validarUsuario, validarUsu} from '../../validate/Usuariosvalidate.js'
import { validarToken  } from '../controllers/autenticacion.js'

const rutaubi = Router()

rutaubi.get('/listardepar',validarToken, obtenerDepartamentos);
rutaubi.get('/listarmuni',validarToken, obtenerCiudadesPorDepartamento);


export default rutaubi;