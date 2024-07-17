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
          // Manejar errores de carga de archivos
          console.error('Error al cargar la imagen:', err);
          return res.status(500).json({ message: 'Error al cargar la imagen' });
        }
  
        // Extraer los valores del cuerpo de la solicitud
        const {
          identificacion, nombre, apellido, email, password,
          telefono, pais, fk_id_depa, fk_id_ciu, direccion
        } = req.body;
  
        // Obtener la ruta de la imagen cargada
        const foto = req.file ? req.file.filename : null;
  
        // Encriptar la contraseña (asegúrate de descomentar la línea correcta si usas bcrypt)
        // const bcryptPassword = bcrypt.hashSync(password, 12);
  
        try {
          const [rows] = await pool.query(
            `INSERT INTO usuarios (identificacion, nombre, apellido, email, password, telefono, foto, pais, fk_id_depa, fk_id_ciu, direccion) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      // Obtener la identificación del administrador que hace la solicitud desde el token
      const adminId = req.usuario; // Aquí asumimos que la identificación del administrador está incluida en decoded.user
  
      // Consultar la base de datos para obtener la lista de usuarios
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
  
      const [result] = await pool.query("SELECT * FROM usuarios WHERE identificacion=?", [identificacion]);
  
      if (result.length > 0) {
        res.status(200).json(result);
      } else {
        res.status(404).json({
          status: 404,
          message: "No se encontró un usuario con esa identificacion"
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
  
      // Manejar la carga de archivos con Multer
      upload.single('foto')(req, res, async function (err) {
        if (err) {
          // Manejar errores de carga de archivos
          console.error('Error al cargar la imagen:', err);
          return res.status(500).json({ message: 'Error al cargar la imagen' });
        }
  
        const { identificacion } = req.params;
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
        SELECT  
             nombre, apellido, email, telefono,
            foto, pais, fk_id_depa, fk_id_ciu, direccion
        FROM 
            usuarios
        WHERE 
            identificacion = ?;
      `, [identificacion]);
  
      // Verificar si se encontró el usuario
      if (result.length > 0) {
        res.status(200).json({
          status: 200,
          data: result[0]  // Enviar la información del usuario
        });
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
  