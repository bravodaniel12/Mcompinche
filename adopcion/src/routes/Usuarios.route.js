import { Router } from "express"
import  {actualizarUsuario,perfil, listarUsuarios, registrarAdministrador, registrarUsuarios,identificacionget, listarAdministradores, actualizar,checkEmailUnique,eliminarUsuario} from '../controllers/Usuarios.controller.js';
//import {validarUsuario, validarUsu} from '../../validate/Usuariosvalidate.js'
import { validarToken  } from '../controllers/autenticacion.js'


const rutaUsuario = Router();

rutaUsuario.get('/listarUsuarios', validarToken,listarUsuarios);  
rutaUsuario.get('/listarPerfil', validarToken,perfil);  
rutaUsuario.get('/adminis', validarToken,listarAdministradores);  
rutaUsuario.post('/registrarUsuario' ,registrarUsuarios);
rutaUsuario.post('/administrador', registrarAdministrador);
rutaUsuario.put('/actualizar/:identificacion',validarToken,actualizar);
rutaUsuario.put('/actualizarUsuario/:identificacion',validarToken,actualizarUsuario);

rutaUsuario.get('/checkEmailUnique', checkEmailUnique);
rutaUsuario.get('/identificaciongey', identificacionget);

rutaUsuario.delete('/eliminarU/:identificacion', eliminarUsuario);
export default rutaUsuario;
