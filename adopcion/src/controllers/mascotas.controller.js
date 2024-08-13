import {pool} from '../database/conexion.js'
import { validationResult } from "express-validator"
import upload from './carga.Img.js';
import { format } from 'date-fns';

export const cartaMascotas = async (req, res) => {
    try {
        const [mascotas] = await pool.query(`
            SELECT m.*, m.fk_id_genero AS genero, m.nombre AS nombreM, m.foto_principal AS foto, m.id_mascota AS id_mascota, m.descripcion AS descripcion, m.fk_id_raza AS raza, m.fk_id_categoria AS categoria, m.estado AS estado 
            FROM mascotas m
            JOIN usuarios u ON m.admin_id = u.identificacion
        `);

        // Formatea la fecha de publicación
        const formattedMascotas = mascotas.map(mascota => ({
            ...mascota,
            fecha_publicado: format(new Date(mascota.fecha_publicado), 'yyyy-MM-dd') // Ajusta el formato según tus necesidades
        }));

        res.status(200).json(formattedMascotas);
    } catch (error) {
        console.error('Error al obtener las mascotas:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

export const listarMascotas = async (req, res) => {
    try {
        const [mascotas] = await pool.query(`
            SELECT 
                m.foto_principal AS foto,
                m.id_mascota AS id_mascota,
                m.nombre AS nombreM, 
                m.fk_id_genero AS genero, 
                m.descripcion AS descripcion, 
                m.fk_id_raza AS raza, 
                m.fk_id_categoria AS categoria, 
                u.nombre AS usuario_nombre, 
                m.fecha_publicado AS f_publicacion,
                m.desparacitado,
                m.esterilizado,
                m.enfermedad,
                m.discapacidad,
                m.vacuna_rabia,
                m.vacuna_parvovirus,
                m.vacuna_moquillo,
                m.vacuna_leucemia_felina,
                m.vacuna_calicivirus,
                m.vacuna_herpesvirus
            FROM mascotas m
            JOIN usuarios u ON m.admin_id = u.identificacion
        `);

        // Formatear las propiedades booleanas
        const formattedMascotas = mascotas.map(mascota => ({
            ...mascota,
            desparacitado: mascota.desparacitado === 1 ? 'si' : 'no',
            esterilizado: mascota.esterilizado === 1 ? 'si' : 'no',
            enfermedad: mascota.enfermedad === 1 ? 'si' : 'no',
            discapacidad: mascota.discapacidad === 1 ? 'si' : 'no',
            vacuna_rabia: mascota.vacuna_rabia === 1 ? 'si' : 'no',
            vacuna_parvovirus: mascota.vacuna_parvovirus === 1 ? 'si' : 'no',
            vacuna_moquillo: mascota.vacuna_moquillo === 1 ? 'si' : 'no',
            vacuna_leucemia_felina: mascota.vacuna_leucemia_felina === 1 ? 'si' : 'no',
            vacuna_calicivirus: mascota.vacuna_calicivirus === 1 ? 'si' : 'no',
            vacuna_herpesvirus: mascota.vacuna_herpesvirus === 1 ? 'si' : 'no'
        }));

        res.status(200).json(formattedMascotas);
    } catch (error) {
        console.error('Error al obtener las mascotas:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};


export const RegistrarM = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const adminId = req.usuario;

        if (!adminId) {
            return res.status(403).json({ message: 'No se proporcionó la identificación del administrador en el token' });
        }

        console.log('Admin ID:', adminId);

        upload.single('foto_principal')(req, res, async function (err) {
            if (err) {
                console.error('Error al cargar la imagen:', err);
                return res.status(500).json({ message: 'Error al cargar la imagen' });
            }

            const {
                nombre, descripcion, fk_id_raza, fk_id_categoria, fk_id_genero,
                desparacitado, esterilizado, enfermedad, discapacidad,
                vacuna_rabia, vacuna_parvovirus, vacuna_moquillo, vacuna_leucemia_felina,
                vacuna_calicivirus, vacuna_herpesvirus
            } = req.body;

            if (!nombre || !fk_id_raza || !fk_id_genero || !fk_id_categoria || !req.file) {
                return res.status(400).json({ mensaje: "Los campos nombre, fk_id_raza, fk_id_categoria, fk_id_genero y foto_principal son obligatorios" });
            }

            const fotoPrincipal = req.file.filename;

            try {
                await pool.query(
                    "INSERT INTO mascotas (nombre, descripcion, foto_principal, fk_id_raza, fk_id_categoria, fk_id_genero, admin_id, fecha_publicado, estado, desparacitado, esterilizado, enfermedad, discapacidad, vacuna_rabia, vacuna_parvovirus, vacuna_moquillo, vacuna_leucemia_felina, vacuna_calicivirus, vacuna_herpesvirus) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'en adopcion', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [nombre, descripcion, fotoPrincipal, fk_id_raza, fk_id_categoria, fk_id_genero, adminId, desparacitado, esterilizado, enfermedad, discapacidad, vacuna_rabia, vacuna_parvovirus, vacuna_moquillo, vacuna_leucemia_felina, vacuna_calicivirus, vacuna_herpesvirus]
                );

                return res.status(200).json({ mensaje: "Mascota registrada con éxito" });
            } catch (dbError) {
                console.error('Error al registrar la mascota en la base de datos:', dbError);
                return res.status(500).json({ mensaje: 'Error interno del servidor' });
            }
        });
    } catch (error) {
        console.error('Error al registrar la mascota:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

export const ActualizarM = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const adminId = req.usuario;

        if (!adminId) {
            return res.status(403).json({ message: 'No se proporcionó la identificación del administrador en el token' });
        }

        console.log('Admin ID:', adminId);

        upload.single('foto_principal')(req, res, async function (err) {
            if (err) {
                console.error('Error al cargar la imagen:', err);
                return res.status(500).json({ message: 'Error al cargar la imagen' });
            }

            const {
                nombre, descripcion, fk_id_raza, fk_id_categoria, fk_id_genero,
                desparacitado, esterilizado, enfermedad, discapacidad,
                vacuna_rabia, vacuna_parvovirus, vacuna_moquillo, vacuna_leucemia_felina,
                vacuna_calicivirus, vacuna_herpesvirus
            } = req.body;

            const { id_mascota } = req.params;

            if (!id_mascota || (!nombre && !descripcion && !fk_id_raza && !fk_id_categoria && !fk_id_genero && !req.file)) {
                return res.status(400).json({ mensaje: "Debe proporcionar al menos uno de los campos para actualizar" });
            }

            const [mascota] = await pool.query("SELECT * FROM mascotas WHERE id_mascota = ?", [id_mascota]);

            if (mascota.length === 0) {
                return res.status(404).json({ mensaje: "Mascota no encontrada" });
            }

            let fotoPrincipal = req.file ? req.file.filename : mascota[0].foto_principal;

            try {
                await pool.query(
                    `UPDATE mascotas SET
                    nombre = COALESCE(?, nombre), descripcion = COALESCE(?, descripcion), foto_principal = COALESCE(?, foto_principal),
                    fk_id_raza = COALESCE(?, fk_id_raza), fk_id_categoria = COALESCE(?, fk_id_categoria), fk_id_genero = COALESCE(?, fk_id_genero),
                    admin_id = COALESCE(?, admin_id), desparacitado = COALESCE(?, desparacitado), esterilizado = COALESCE(?, esterilizado),
                    enfermedad = COALESCE(?, enfermedad), discapacidad = COALESCE(?, discapacidad),
                    vacuna_rabia = COALESCE(?, vacuna_rabia), vacuna_parvovirus = COALESCE(?, vacuna_parvovirus),
                    vacuna_moquillo = COALESCE(?, vacuna_moquillo), vacuna_leucemia_felina = COALESCE(?, vacuna_leucemia_felina),
                    vacuna_calicivirus = COALESCE(?, vacuna_calicivirus), vacuna_herpesvirus = COALESCE(?, vacuna_herpesvirus)
                    WHERE id_mascota = ?`,
                    [nombre, descripcion, fotoPrincipal, fk_id_raza, fk_id_categoria, fk_id_genero, adminId,
                     desparacitado, esterilizado, enfermedad, discapacidad, vacuna_rabia, vacuna_parvovirus, vacuna_moquillo,
                     vacuna_leucemia_felina, vacuna_calicivirus, vacuna_herpesvirus, id_mascota]
                );

                return res.status(200).json({ mensaje: "Mascota actualizada con éxito" });
            } catch (dbError) {
                console.error('Error al actualizar la mascota en la base de datos:', dbError);
                return res.status(500).json({ mensaje: 'Error interno del servidor' });
            }
        });
    } catch (error) {
        console.error('Error al actualizar la mascota:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

// controlador para listar mascotas con usuarios asociados
export const listarMascotasConUsuarios = async (req, res) => {
    try {
        const [mascotasResult] = await pool.query(
            `SELECT 
                m.*,u.*, m.id_mascota, m.nombre AS mascota, m.fecha_publicado, m.fecha_adoptado AS fecha_adoptadi, m.estado, m.foto_principal,
                u.identificacion, u.nombre AS nombre, u.apellido, u.email, u.telefono, u.foto
            FROM 
                mascotas m
            LEFT JOIN 
                adopciones a ON m.id_mascota = a.fk_id_mascota
            LEFT JOIN 
                usuarios u ON a.fk_identificacion = u.identificacion
            WHERE 
                m.estado IN ('en proceso','adoptadas')`
        );

        if (mascotasResult.length === 0) {
            return res.status(404).json({
                status: 404,
                message: 'No se encontraron mascotas en proceso de adopción o adoptadas'
            });
        }

        res.status(200).json(mascotasResult);
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: 'Error en el sistema: ' + error.message
        });
    }
};
// Cambio de estado de la mascota a "en proceso" y registrar la adopción
export const iniciarAdopcion = async (req, res) => {
    const { id_mascota } = req.params; // Leer id_mascota de los parámetros de la URL
    const adminId = req.usuario; // Obtener identificacion desde req.usuario

    try {
        // Verificar si la mascota existe
        const [mascota] = await pool.query("SELECT * FROM mascotas WHERE id_mascota = ?", [id_mascota]);

        if (mascota.length === 0) {
            return res.status(404).json({ mensaje: 'Mascota no encontrada' });
        }

        // Verificar si la mascota ya está en proceso de adopción
        const [adopcionExistente] = await pool.query(
            'SELECT * FROM adopciones WHERE fk_id_mascota = ? AND fk_identificacion = ?',
            [id_mascota, adminId]
        );

        if (adopcionExistente.length > 0) {
            return res.status(400).json({ mensaje: 'La mascota ya está en proceso de adopción' });
        }

        // Iniciar la transacción
        await pool.query("START TRANSACTION");

        // Cambiar el estado de la mascota a "en proceso"
        await pool.query(
            "UPDATE mascotas SET estado = 'en proceso' WHERE id_mascota = ?",
            [id_mascota]
        );

        // Registrar la adopción en la tabla adopciones
        await pool.query(
            "INSERT INTO adopciones (fk_id_mascota, fk_identificacion) VALUES (?, ?)",
            [id_mascota, adminId]
        );

        // Confirmar la transacción
        await pool.query("COMMIT");

        res.status(201).json({ mensaje: 'Mascota en proceso de adopción' });
    } catch (error) {
        // Revertir la transacción en caso de error
        await pool.query("ROLLBACK");

        console.error('Error al iniciar adopción:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};



/* // cambio de estado de la mascota a en proceso
export const iniciarAdopcion = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id_mascota } = req.params;
        const { identificacion } = req.usuario; // Usar ID del usuario desde el token

        // Iniciar transacción
        await connection.beginTransaction();

        // Verificar si la mascota existe
        const [mascota] = await connection.query("SELECT * FROM mascotas WHERE id_mascota = ?", [id_mascota]);

        if (mascota.length > 0) {
            // Verificar si la mascota ya está registrada en la tabla adopciones
            const [adopcionExistente] = await connection.query("SELECT * FROM adopciones WHERE fk_id_mascota = ?", [id_mascota]);

            if (adopcionExistente.length > 0) {
                // La mascota ya está registrada en la tabla adopciones
                await connection.rollback();
                return res.status(400).json({
                    status: 400,
                    message: 'La mascota ya está registrada en la tabla adopciones'
                });
            }

            // Cambiar el estado a "en proceso"
            const [result] = await connection.query("UPDATE mascotas SET estado = 'en proceso' WHERE id_mascota = ?", [id_mascota]);

            if (result.affectedRows > 0) {
                // Registrar en la tabla adopciones
                const [adopcionResult] = await connection.query("INSERT INTO adopciones (fk_identificacion, fk_id_mascota) VALUES (?, ?)", [identificacion, id_mascota]);
                await connection.commit();
                res.status(200).json({
                    status: 200,
                    message: 'Estado de la mascota cambiado a en proceso y adopción registrada'
                });
            } else {
                await connection.rollback();
                res.status(404).json({
                    status: 404,
                    message: 'No se pudo actualizar el estado de la mascota'
                });
            }
        } else {
            await connection.rollback();
            res.status(404).json({
                status: 404,
                message: 'No se encontró la mascota'
            });
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
}; */


/* // cambio de estado a adoptado o denegado
export const administrarAdopcion = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id_mascota } = req.params;
        const { accion } = req.body;

        const [mascotaResult] = await pool.query("SELECT * FROM adopciones.mascotas WHERE id_mascota = ?", [id_mascota]);
        if (mascotaResult.length === 0) {
            return res.status(404).json({
                status: 404,
                message: 'No se encontró la mascota'
            });
        }

        const mascota = mascotaResult[0];

        const [usuarioResult] = await pool.query("SELECT * FROM adopciones.usuarios WHERE identificacion = ?", [mascota.admin_id]);
        if (usuarioResult.length === 0) {
            return res.status(404).json({
                status: 404,
                message: 'No se encontró el usuario solicitante'
            });
        }

        const usuario = usuarioResult[0];

        if (accion === 'aceptar') {
            const [updateResult] = await pool.query("UPDATE adopciones.mascotas SET estado = 'adoptado', fecha_adoptado = NOW() WHERE id_mascota = ?", [id_mascota]);
            if (updateResult.affectedRows > 0) {
                console.log('Datos del adoptante:', usuario);
                res.status(200).json({
                    status: 200,
                    message: 'La adopción ha sido aceptada',
                    adoptante: usuario
                });
            } else {
                res.status(404).json({
                    status: 404,
                    message: 'No se pudo actualizar el estado de la mascota'
                });
            }
        } else if (accion === 'denegar') {
            const [updateResult] = await pool.query("UPDATE adopciones.mascotas SET estado = 'en adopcion' WHERE id_mascota = ?", [id_mascota]);
            if (updateResult.affectedRows > 0) {
                res.status(200).json({
                    status: 200,
                    message: 'La adopción fue denegada y la mascota está disponible para adopción nuevamente'
                });
            } else {
                res.status(404).json({
                    status: 404,
                    message: 'No se pudo actualizar el estado de la mascota'
                });
            }
        } else {
            res.status(400).json({
                status: 400,
                message: 'Acción no válida'
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: 'Error en el sistema: ' + error.message
        });
    }
};
 */
export const administrarAdopcion = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id_mascota } = req.params;
        const { accion } = req.body;

        // Verificar si la mascota existe
        const [mascotaResult] = await pool.query("SELECT * FROM adopciones.mascotas WHERE id_mascota = ?", [id_mascota]);
        if (mascotaResult.length === 0) {
            return res.status(404).json({ status: 404, message: 'No se encontró la mascota' });
        }

        const mascota = mascotaResult[0];

        // Verificar si el usuario solicitante existe
        const [usuarioResult] = await pool.query("SELECT * FROM adopciones.usuarios WHERE identificacion = ?", [mascota.admin_id]);
        if (usuarioResult.length === 0) {
            return res.status(404).json({ status: 404, message: 'No se encontró el usuario solicitante' });
        }

        const usuario = usuarioResult[0];

        if (accion === 'aceptar') {
            // Aceptar la adopción
            const [updateResult] = await pool.query("UPDATE adopciones.mascotas SET estado = 'adoptado', fecha_adoptado = NOW() WHERE id_mascota = ?", [id_mascota]);
            if (updateResult.affectedRows > 0) {
                console.log('Datos del adoptante:', usuario);
                res.status(200).json({ status: 200, message: 'La adopción ha sido aceptada', adoptante: usuario });
            } else {
                res.status(404).json({ status: 404, message: 'No se pudo actualizar el estado de la mascota' });
            }
        } else if (accion === 'denegar') {
            // Denegar la adopción y eliminar el registro de la tabla adopciones
            const [updateResult] = await pool.query("UPDATE adopciones.mascotas SET estado = 'en adopcion' WHERE id_mascota = ?", [id_mascota]);
            if (updateResult.affectedRows > 0) {
                const [deleteResult] = await pool.query("DELETE FROM adopciones WHERE fk_id_mascota = ?", [id_mascota]);
                if (deleteResult.affectedRows > 0) {
                    res.status(200).json({ status: 200, message: 'La adopción fue denegada, la mascota está disponible para adopción nuevamente y el registro de adopciones ha sido eliminado' });
                } else {
                    res.status(404).json({ status: 404, message: 'No se pudo eliminar el registro de adopciones' });
                }
            } else {
                res.status(404).json({ status: 404, message: 'No se pudo actualizar el estado de la mascota' });
            }
        } else {
            res.status(400).json({ status: 400, message: 'Acción no válida' });
        }
    } catch (error) {
        res.status(500).json({ status: 500, message: 'Error en el sistema: ' + error.message });
    }
};


export const cancelarAdopcion = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id_mascota } = req.params;
        const identificacion = req.usuario; // Usar ID del usuario desde el token

        // Verificar si la mascota existe y está en "en proceso"
        const [mascota] = await pool.query("SELECT * FROM mascotas WHERE id_mascota = ? AND estado = 'en proceso'", [id_mascota]);

        if (mascota.length > 0) {
            // Cambiar el estado a "en adopción" y eliminar la fecha_adoptado
            const [result] = await pool.query("UPDATE mascotas SET estado = 'en adopcion', fecha_adoptado = NULL WHERE id_mascota = ?", [id_mascota]);
            if (result.affectedRows > 0) {
                // Eliminar el registro en la tabla adopciones
                const [deleteResult] = await pool.query("DELETE FROM adopciones WHERE fk_identificacion = ? AND fk_id_mascota = ?", [identificacion, id_mascota]);
                if (deleteResult.affectedRows > 0) {
                    res.status(200).json({
                        status: 200,
                        message: 'Estado de la mascota cambiado a en adopción y registro de adopción eliminado'
                    });
                } else {
                    res.status(404).json({
                        status: 404,
                        message: 'No se pudo eliminar el registro de adopción'
                    });
                }
            } else {
                res.status(404).json({
                    status: 404,
                    message: 'No se pudo actualizar el estado de la mascota'
                });
            }
        } else {
            res.status(404).json({
                status: 404,
                message: 'No se encontró la mascota o no está en estado "en proceso"'
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: 'Error en el sistema: ' + error.message
        });
    }
};



export const eliminarMascota = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id_mascota } = req.params;

        // Iniciar transacción
        await connection.beginTransaction();

        // Verificar si la mascota tiene registros en la tabla adopciones
        const [adopciones] = await connection.query("SELECT * FROM adopciones WHERE fk_id_mascota = ?", [id_mascota]);

        if (adopciones.length > 0) {
            // La mascota tiene registros en la tabla adopciones, no se puede eliminar
            await connection.rollback();
            return res.status(400).json({
                status: 400,
                message: 'No se puede eliminar la mascota porque tiene registros en la tabla adopciones.'
            });
        }

        // Eliminar registros en la tabla favoritos que hacen referencia a la mascota
        await connection.query("DELETE FROM favoritos WHERE fk_id_mascota = ?", [id_mascota]);

        // La mascota no tiene registros en la tabla adopciones, proceder con la eliminación
        const [result] = await connection.query("DELETE FROM mascotas WHERE id_mascota = ?", [id_mascota]);
        await connection.commit();

        if (result.affectedRows > 0) {
            res.status(200).json({
                status: 200,
                message: `La mascota con ID ${id_mascota} ha sido eliminada con éxito y sus registros en favoritos también han sido eliminados.`
            });
        } else {
            res.status(404).json({
                status: 404,
                message: 'Mascota no encontrada.'
            });
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


