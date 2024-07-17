import { Router } from "express"
import  {listarMascotas,obtenerFotosDeMascota, RegistrarM, buscarmasco, actualizarMascota, cartaMascotas,EstadoMascota} from '../controllers/mascotas.controller.js';
//import {validarUsuario, validarUsu} from '../../validate/Usuariosvalidate.js'
import { validarToken  } from '../controllers/autenticacion.js'


const rutaMasco = Router();

rutaMasco.get('/cartasMascotas', validarToken,cartaMascotas); 
rutaMasco.get('/listarMasco', validarToken,listarMascotas);   
rutaMasco.get('/estadoMasco/:id_mascota', validarToken,EstadoMascota);   
rutaMasco.post('/registrarMasco' ,validarToken,RegistrarM);
rutaMasco.put('/actualizarMasco/:id',validarToken,actualizarMascota);
rutaMasco.get('/buscarMasco/:id_mascota',validarToken, buscarmasco);
rutaMasco.post('/verfotosmasco' ,obtenerFotosDeMascota);

export default rutaMasco;
