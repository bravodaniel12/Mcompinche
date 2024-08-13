import { Router } from "express"
import  {listarMascotas, RegistrarM, ActualizarM, cartaMascotas,listarMascotasConUsuarios,iniciarAdopcion,administrarAdopcion,cancelarAdopcion,eliminarMascota} from '../controllers/mascotas.controller.js';
//import {validarUsuario, validarUsu} from '../../validate/Usuariosvalidate.js'
import { validarToken  } from '../controllers/autenticacion.js'


const rutaMasco = Router();

rutaMasco.get('/cartasMascotas', validarToken,cartaMascotas); 
rutaMasco.get('/listarMasco', validarToken,listarMascotas);     

rutaMasco.post('/registrarMasco' ,validarToken,RegistrarM); 
rutaMasco.put('/actualizarMasco/:id_mascota',validarToken,ActualizarM);

rutaMasco.get('/ListarMasUsu' ,validarToken,listarMascotasConUsuarios); 
rutaMasco.post('/iniciarAdop/:id_mascota' ,validarToken,iniciarAdopcion); 
rutaMasco.post('/cancelar/:id_mascota' ,validarToken,cancelarAdopcion);//
rutaMasco.post('/administrar/:id_mascota' ,validarToken,administrarAdopcion); 

rutaMasco.delete('/mascotaEli/:id_mascota', eliminarMascota);
export default rutaMasco;
