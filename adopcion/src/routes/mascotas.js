import { Router } from "express"
import  {obtenerMascotas,obtenerFotosDeMascota, RegistrarM, buscarmasco, actualizarMascota, cartaMascotas} from '../controllers/mascotas.controller.js';
//import {validarUsuario, validarUsu} from '../../validate/Usuariosvalidate.js'
import { validarToken  } from '../controllers/autenticacion.js'


const rutaMasco = Router();

rutaMasco.get('/cartasMascotas', validarToken,cartaMascotas); 
rutaMasco.get('/listarMasco', validarToken,obtenerMascotas);   
rutaMasco.post('/registrarMasco' ,validarToken,RegistrarM);
rutaMasco.put('/actualizarMasco/:id',validarToken,actualizarMascota);
rutaMasco.get('/buscarMasco/:id_mascota',validarToken, buscarmasco);
rutaMasco.post('/verfotosmasco' ,obtenerFotosDeMascota);

export default rutaMasco;
