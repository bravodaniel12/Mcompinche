import { Router } from "express"
import  {listarHistoriales,registrarHistorial, actualizarHistorial, buscarHistorial} from '../controllers/historialm.controller.js';
//import {validarUsuario, validarUsu} from '../../validate/Usuariosvalidate.js'
import { validarToken  } from '../controllers/autenticacion.js'

const rutaHmedico = Router()
// Listar todos los historiales médicos
rutaHmedico.get('/listarhm', listarHistoriales);

// Registrar un nuevo historial médico
rutaHmedico.post('/registrarhm', validarToken,registrarHistorial);

// Actualizar un historial médico por ID
rutaHmedico.put('/actualizarhm/:id_historial',validarToken, actualizarHistorial);

// Buscar un historial médico por ID
rutaHmedico.get('/buscarhm/:id_historial', buscarHistorial);


export default rutaHmedico;