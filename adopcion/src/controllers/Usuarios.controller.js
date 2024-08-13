import { pool } from '../database/conexion.js';
import { validationResult } from "express-validator";
import upload from './carga.Img.js';
import bcrypt from 'bcrypt';

export const registrarUsuarios = async (req, res) => {
    try {
        // Validar los errores de la solicitud (por ejemplo, validaciones de express-validator)
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
                telefono, direccion
            } = req.body;

            const foto = req.file ? req.file.filename : null;

            try {
                // Verificar si la identificación ya existe en la base de datos
                const [existingUser] = await pool.query(
                    'SELECT * FROM usuarios WHERE identificacion = ?',
                    [identificacion]
                );

                if (existingUser.length > 0) {
                    return res.status(400).json({
                        status: 400,
                        message: 'La identificación ya está en uso'
                    });
                }

                // Encriptar la contraseña
                const bcryptPassword = await bcrypt.hash(password, 12);

                // Insertar el nuevo usuario en la base de datos
                const [rows] = await pool.query(
                    `INSERT INTO usuarios (identificacion, foto, nombre, apellido, email, password, telefono, pais, direccion, rol) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'colombia', ?, 'usuario')`,
                    [identificacion, foto, nombre, apellido, email, bcryptPassword, telefono, direccion]
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


      //listar perfil
export const perfil = async (req, res) => {
        try {
            // Obtener la identificación del usuario autenticado desde el token
            const identificacion = req.usuario;
    
            // Consulta para obtener la información específica del usuario
            const [result] = await pool.query(`
                SELECT identificacion,nombre, apellido, email, telefono,
                        foto, pais, direccion, password,rol
                FROM usuarios
                WHERE identificacion = ?;
            `, [identificacion]);
    
            // Verificar si se encontró el usuario
            if (result.length > 0) {
                const user = result[0];
    
                // Verificar si el rol es 'administrador' o 'usuario'
                if (user.rol === 'administrador' || user.rol === 'usuario') {
                    res.status(200).json({
                            identificacion: user.identificacion,                    
                            nombre: user.nombre,
                            apellido: user.apellido,
                            email: user.email,
                            telefono: user.telefono,
                            foto: user.foto,
                            pais: user.pais,
                            password: user.password,
                            direccion: user.direccion,
                            rol: user.rol 
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

    //actualizar segun se loguie
    export const actualizar = async (req, res) => {
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
                const userId = req.usuario.identificacion; // Asegúrate de que `req.usuario` contiene `identificacion`
                const { nombre, apellido, email, telefono, direccion, password } = req.body;
    
                if (!nombre && !apellido && !email && !telefono && !req.file && !direccion && !password) {
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
                    telefono: telefono || oldUsuario[0].telefono,
                    foto: req.file ? req.file.filename : oldUsuario[0].foto,
                    direccion: direccion || oldUsuario[0].direccion,
                    password: password ? await bcrypt.hash(password, 12) : oldUsuario[0].password, // Encriptar si hay nueva contraseña
                };
    
                const [result] = await pool.query(
                    `UPDATE usuarios SET nombre=?, apellido=?, email=?, telefono=?, foto=?, direccion=?, password=? WHERE identificacion = ?`,
                    [
                        updatedUsuario.nombre, updatedUsuario.apellido, updatedUsuario.email,
                        updatedUsuario.telefono, updatedUsuario.foto, updatedUsuario.direccion,
                        updatedUsuario.password, identificacion
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


    //el admind actualiza usuarios
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
                pais, direccion
            } = req.body;

            if (!nombre && !apellido && !email && !password && !telefono && !req.file && !pais && !direccion) {
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
                direccion: direccion || oldUsuario[0].direccion,
            };

            const [result] = await pool.query(
                `UPDATE usuarios SET nombre=?, apellido=?, email=?, password=?, telefono=?, foto=?, pais=?, direccion=? WHERE identificacion = ?`,
                [
                    updatedUsuario.nombre, updatedUsuario.apellido, updatedUsuario.email, 
                    updatedUsuario.password, updatedUsuario.telefono, updatedUsuario.foto,
                    updatedUsuario.pais,updatedUsuario.direccion, identificacion
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
    
    export const listarAdministradores = async (req, res) => {
        try {
            // Consulta para obtener la información de todos los administradores
            const [result] = await pool.query(`
                SELECT identificacion, nombre, apellido, email, telefono, foto, pais, direccion, password, rol
                FROM usuarios
                WHERE rol = 'administrador';
            `);

            // Verificar si se encontraron administradores
            if (result.length > 0) {
                res.status(200).json(result);
            } else {
                res.status(404).json({
                    status: 404,
                    message: 'No se encontraron administradores'
                });
            }
        } catch (error) {
            res.status(500).json({
                status: 500,
                message: 'Error en el sistema: ' + error.message
            });
        }
    };

    export const checkEmailUnique = async (req, res) => {
        const { email } = req.query;
    
        if (!email) {
            return res.status(400).json({
                status: 400,
                message: 'Email is required'
            });
        }
    
        try {
            // Consulta para verificar si el correo electrónico ya existe
            const [result] = await pool.query(`
                SELECT email
                FROM usuarios
                WHERE email = ?;
            `, [email]);
    
            // Verificar si se encontró un usuario con el correo electrónico proporcionado
            if (result.length > 0) {
                res.json({ isUnique: false });
            } else {
                res.json({ isUnique: true });
            }
        } catch (error) {
            console.error('Error checking email uniqueness:', error);
            res.status(500).json({
                status: 500,
                message: 'Error en el sistema: ' + error.message
            });
        }
    };

    export const identificacionget = async (req, res) => {
        const { identificacion } = req.query;
    
        if (!identificacion) {
            return res.status(400).json({
                status: 400,
                message: 'is required'
            });
        }
    
        try {
            // Consulta para verificar si el correo electrónico ya existe
            const [result] = await pool.query(`
                SELECT identificacion
                FROM usuarios
                WHERE identificacion = ?;
            `, [identificacion]);
    
            // Verificar si se encontró un usuario con el correo electrónico proporcionado
            if (result.length > 0) {
                res.json({ isUnique: false });
            } else {
                res.json({ isUnique: true });
            }
        } catch (error) {
            console.error('Error checking identificacion uniqueness:', error);
            res.status(500).json({
                status: 500,
                message: 'Error en el sistema: ' + error.message
            });
        }
    };
    export const eliminarUsuario = async (req, res) => {
        const connection = await pool.getConnection();
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
    
            const { identificacion } = req.params;
    
            // Iniciar transacción
            await connection.beginTransaction();
    
            // Verificar si el usuario tiene registros en la tabla adopciones
            const [adopciones] = await connection.query("SELECT * FROM adopciones WHERE fk_identificacion = ?", [identificacion]);
    
            if (adopciones.length > 0) {
                // El usuario tiene registros en la tabla adopciones, no se puede eliminar
                await connection.rollback();
                return res.status(400).json({
                    status: 400,
                    message: 'No se puede eliminar el usuario porque tiene registros en la tabla adopciones'
                });
            } else {
                // El usuario no tiene registros en la tabla adopciones, proceder con la eliminación
                const [result] = await connection.query("DELETE FROM usuarios WHERE identificacion = ?", [identificacion]);
                await connection.commit();
    
                if (result.affectedRows > 0) {
                    res.status(200).json({
                        status: 200,
                        message: 'Usuario eliminado con éxito'
                    });
                } else {
                    res.status(404).json({
                        status: 404,
                        message: 'Usuario no encontrado'
                    });
                }
            }
        } catch (error) {
            await connection.rollback();
            res.status(500).json({
                status: 500,
                message: 'Error en el sistema: ' + error.message
            });
        } finally {
            connection.release();
        }
    };



    export const registrarAdministrador = async (req, res) => {
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
                    telefono, direccion
                } = req.body;
    
                const foto = req.file ? req.file.filename : null;
    
                // Encriptar la contraseña
                const bcryptPassword = await bcrypt.hash(password, 12);
    
                try {
                    const [rows] = await pool.query(
                        `INSERT INTO usuarios (identificacion, foto, nombre, apellido, email, password, telefono, pais, direccion, rol) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, 'colombia', ?, 'administrador')`,
                        [identificacion, foto, nombre, apellido, email, bcryptPassword, telefono, direccion]
                    );
    
                    if (rows.affectedRows > 0) {
                        res.status(200).json({
                            status: 200,
                            message: 'Administrador registrado con éxito: ' + nombre
                        });
                    } else {
                        res.status(403).json({
                            status: 403,
                            message: 'No se registró el administrador'
                        });
                    }
                } catch (dbError) {
                    console.error('Error al registrar el administrador en la base de datos:', dbError);
                    res.status(500).json({ message: 'Error interno del servidor' });
                }
            });
        } catch (error) {
            console.error('Error al registrar el administrador:', error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    };

    /* export const perfilMascota = async (req, res) => {
        try {
            // Obtener el id_mascota de los parámetros de la solicitud
            const { id_mascota } = req.params;

            // Consulta para obtener la identificación del usuario que registró la mascota
            const [result] = await pool.query(`
                SELECT u.identificacion, u.nombre, u.apellido, u.email, u.telefono,
                    u.foto, u.pais, u.direccion, u.password,u.rol
                FROM usuarios u
                JOIN mascotas m ON u.identificacion = m.admin_id
                WHERE m.id_mascota = ?;
            `, [id_mascota]);

            // Verificar si se encontró al usuario
            if (result.length > 0) {
                const user = result[0];

                // Verificar si el rol es 'administrador' o 'usuario'
                if (user.rol === 'administrador' || user.rol === 'usuario') {
                    res.status(200).json({
                        identificacion: user.identificacion,
                        nombre: user.nombre,
                        apellido: user.apellido,
                        email: user.email,
                        telefono: user.telefono,
                        foto: user.foto,
                        pais: user.pais,
                        direccion: user.direccion,
                        rol: user.rol
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
    }; */



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
    