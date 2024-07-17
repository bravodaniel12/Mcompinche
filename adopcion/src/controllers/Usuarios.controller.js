import {pool} from '../database/conexion.js'
import { validationResult } from "express-validator"
import upload from './carga.Img.js';
// import bcrypt from 'bcrypt';

export const registrarUsuarios = async (req, res) => {
  try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
      }

      // Manejar la carga de archivos con Multer
      upload.single('foto')(req, res, async function (err) {
          if (err) {
              console.error('Error al cargar la imagen:', err);
              return res.status(500).json({ message: 'Error al cargar la imagen' });
          }

          const {
              identificacion, nombre, apellido, email, password,
              telefono, pais, fk_id_depa, fk_id_ciu, direccion
          } = req.body;

          const foto = req.file ? req.file.filename : null;

          // Encriptar la contraseña (asegúrate de usar bcrypt si es necesario)
          // const bcryptPassword = bcrypt.hashSync(password, 12);

          try {
              const [rows] = await pool.query(
                  `INSERT INTO usuarios (identificacion, nombre, apellido, email, password, telefono, foto, pais, fk_id_depa, fk_id_ciu, direccion, rol) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'usuario')`,
                  [identificacion, nombre, apellido, email, password, telefono, foto, pais, fk_id_depa, fk_id_ciu, direccion]
              );

              if (rows.affectedRows > 0) {
                  res.status(200).json({
                      status: 200,
                      message: 'Se registró con éxito el usuario ' + nombre
                  });
              } else {
                  res.status(403).json({
                      status: 403,
                      message: 'No se registró el usuario'
                  });
              }
          } catch (dbError) {
              console.error('Error al registrar el usuario en la base de datos:', dbError);
              res.status(500).json({ message: 'Error interno del servidor' });
          }
      });
  } catch (error) {
      console.error('Error al registrar el usuario:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
  }
};

  
export const listarUsuarios = async (req, res) => {
  try {
      const adminId = req.usuario; // Asume que el middleware `validarToken` agrega `req.usuario`
      
      // Verificar que el usuario que hace la solicitud es un administrador
      const [adminCheck] = await pool.query("SELECT rol FROM usuarios WHERE identificacion = ?", [adminId]);
      if (adminCheck.length === 0 || adminCheck[0].rol !== 'administrador') {
          return res.status(403).json({ status: 403, message: 'Acceso denegado' });
      }

      const [result] = await pool.query('SELECT * FROM usuarios');
      if (result.length > 0) {
          res.status(200).json(result);
      } else {
          res.status(404).json({
              status: 404,
              message: 'No se encontraron usuarios registrados'
          });
      }
  } catch (error) {
      res.status(500).json({
          status: 500,
          message: 'Error en el sistema',
          error: error.message
      });
  }
};

  

export const buscarUsuario = async (req, res) => {
  try {
      const { identificacion } = req.params;
      const userId = req.usuario;

      const [userCheck] = await pool.query("SELECT rol FROM usuarios WHERE identificacion = ?", [userId]);
      if (userCheck.length === 0 || (userCheck[0].rol !== 'administrador' && userId !== identificacion)) {
          return res.status(403).json({ status: 403, message: 'Acceso denegado' });
      }

      const [result] = await pool.query("SELECT * FROM usuarios WHERE identificacion=?", [identificacion]);
      if (result.length > 0) {
          res.status(200).json(result);
      } else {
          res.status(404).json({
              status: 404,
              message: "No se encontró un usuario con esa identificación"
          });
      }
  } catch (error) {
      res.status(500).json({
          status: 500,
          message: 'Error en el sistema: ' + error
      });
  }
};

  
export const actualizarUsuario = async (req, res) => {
  try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
      }

      upload.single('foto')(req, res, async function (err) {
          if (err) {
              console.error('Error al cargar la imagen:', err);
              return res.status(500).json({ message: 'Error al cargar la imagen' });
          }

          const { identificacion } = req.params;
          const userId = req.usuario;
          const {
              nombre, apellido, email, password, telefono,
              pais, fk_id_depa, fk_id_ciu, direccion
          } = req.body;

          if (!nombre && !apellido && !email && !password && !telefono && !req.file && !pais && !fk_id_depa && !fk_id_ciu && !direccion) {
              return res.status(400).json({ message: 'Al menos uno de los campos debe estar presente en la solicitud para realizar la actualización.' });
          }

          const [oldUsuario] = await pool.query("SELECT * FROM usuarios WHERE identificacion = ?", [identificacion]);

          if (oldUsuario.length === 0) {
              return res.status(404).json({
                  status: 404,
                  message: 'Usuario no encontrado',
              });
          }

          // Verificar permisos
          const [userCheck] = await pool.query("SELECT rol FROM usuarios WHERE identificacion = ?", [userId]);
          if (userCheck.length === 0 || (userCheck[0].rol !== 'administrador' && userId !== identificacion)) {
              return res.status(403).json({ status: 403, message: 'Acceso denegado' });
          }

          const updatedUsuario = {
              nombre: nombre || oldUsuario[0].nombre,
              apellido: apellido || oldUsuario[0].apellido,
              email: email || oldUsuario[0].email,
              password: password || oldUsuario[0].password,
              telefono: telefono || oldUsuario[0].telefono,
              foto: req.file ? req.file.filename : oldUsuario[0].foto,
              pais: pais || oldUsuario[0].pais,
              fk_id_depa: fk_id_depa || oldUsuario[0].fk_id_depa,
              fk_id_ciu: fk_id_ciu || oldUsuario[0].fk_id_ciu,
              direccion: direccion || oldUsuario[0].direccion,
          };

          const [result] = await pool.query(
              `UPDATE usuarios SET nombre=?, apellido=?, email=?, password=?, telefono=?, foto=?, pais=?, fk_id_depa=?, fk_id_ciu=?, direccion=? WHERE identificacion = ?`,
              [
                  updatedUsuario.nombre, updatedUsuario.apellido, updatedUsuario.email, 
                  updatedUsuario.password, updatedUsuario.telefono, updatedUsuario.foto,
                  updatedUsuario.pais, updatedUsuario.fk_id_depa, updatedUsuario.fk_id_ciu,
                  updatedUsuario.direccion, identificacion
              ]
          );

          if (result.affectedRows > 0) {
              res.status(200).json({
                  status: 200,
                  message: "El usuario ha sido actualizado.",
              });
          } else {
              res.status(404).json({
                  status: 404,
                  message: "No se pudo actualizar el usuario, inténtalo de nuevo.",
              });
          }
      });
  } catch (error) {
      res.status(500).json({
          status: 500,
          message: "Error en el sistema: " + error.message,
      });
  }
};

  
//listar perfil
export const perfil = async (req, res) => {
  try {
      // Obtener la identificación del usuario autenticado desde el token
      const identificacion = req.usuario;

      // Consulta para obtener la información específica del usuario
      const [result] = await pool.query(`
          SELECT nombre, apellido, email, telefono,
                 foto, pais, fk_id_depa, fk_id_ciu, direccion, rol
          FROM usuarios
          WHERE identificacion = ?;
      `, [identificacion]);

      // Verificar si se encontró el usuario
      if (result.length > 0) {
          const user = result[0];

          // Verificar si el rol es 'administrador' o 'usuario'
          if (user.rol === 'administrador' || user.rol === 'usuario') {
              res.status(200).json({
                  status: 200,
                  data: {
                      nombre: user.nombre,
                      apellido: user.apellido,
                      email: user.email,
                      telefono: user.telefono,
                      foto: user.foto,
                      pais: user.pais,
                      fk_id_depa: user.fk_id_depa,
                      fk_id_ciu: user.fk_id_ciu,
                      direccion: user.direccion
                  }
              });
          } else {
              res.status(403).json({
                  status: 403,
                  message: 'Acceso denegado'
              });
          }
      } else {
          res.status(404).json({
              status: 404,
              message: 'No se encontró la información del usuario'
          });
      }
  } catch (error) {
      res.status(500).json({
          status: 500,
          message: 'Error en el sistema: ' + error.message
      });
  }
};

  


  /* export const desactivarUsuario = async (req, res) => {
    try {
        const { identificacion } = req.params;

        // Obtener el estado actual del usuario
        const [currentUser] = await pool.query("SELECT estado FROM usuarios WHERE identificacion=?", [identificacion]);
        if (currentUser.length === 0) {
            return res.status(404).json({
                'status': 404,
                'message': 'No se encontró el usuario con la identificación proporcionada'
            });
        }

        const estadoActual = currentUser[0].estado;
        let nuevoEstado = '';

        // Determinar el nuevo estado
        if (estadoActual === 'activo') {
            nuevoEstado = 'inactivo';
        } else {
            nuevoEstado = 'activo';
        }

        // Actualizar el estado del usuario en la base de datos
        const [result] = await pool.query("UPDATE usuarios SET estado=? WHERE identificacion=?", [nuevoEstado, identificacion]);

        // Actualizar el estado de la tabla de programación según el nuevo estado del usuario
        if (nuevoEstado === 'inactivo') {
            // Desactivar la tabla de programación si el usuario se desactiva
            await pool.query("UPDATE programacion SET estado='inactivo' WHERE fk_identificacion=?", [identificacion]);
        } else {
            // Activar la tabla de programación si el usuario se activa
            await pool.query("UPDATE programacion SET estado='activo' WHERE fk_identificacion=?", [identificacion]);
        }

        if (result.affectedRows > 0) {
            return res.status(200).json({
                'status': 200,
                'message': `Se actualizó con éxito el estado a ${nuevoEstado}`
            });
        } else {
            return res.status(404).json({
                'status': 404,
                'message': 'No se pudo actualizar el estado del usuario'
            });
        }
    } catch (error) {
        res.status(500).json({
            'status': 500,
            'message': 'Error en el sistema: ' + error
        });
    }
}; */
  