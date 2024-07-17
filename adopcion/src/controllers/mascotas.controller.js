import {pool} from '../database/conexion.js'
import { validationResult } from "express-validator"
import upload from './carga.Img.js';

export const cartaMascotas = async (req, res) => {
    try {
        const [mascotas] = await pool.query(`
            SELECT g.nombre AS genero, m.nombre AS nombreM, m.foto_principal AS foto
            FROM mascotas m
            JOIN generos g ON m.fk_id_genero = g.id_genero
            JOIN usuarios u ON m.admin_id = u.identificacion
        `);
        res.status(200).json(mascotas);
    } catch (error) {
        console.error('Error al obtener las mascotas:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

export const RegistrarM = async (req, res) => {
    try {
        // Verificar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Obtener la identificación del usuario desde el token
        const adminId = req.usuario;

        if (!adminId) {
            return res.status(403).json({ message: 'No se proporcionó la identificación del usuario en el token' });
        }

        // Manejar la carga de archivos
        upload.array('fotos', 4)(req, res, async function (err) {
            if (err) {
                console.error('Error al cargar las imágenes:', err);
                return res.status(500).json({ message: 'Error al cargar las imágenes' });
            }

            // Obtener los datos del cuerpo de la solicitud
            const { nombre, descripcion, fk_id_raza, fk_id_categoria, fk_id_genero } = req.body;

            // Verificar que todos los campos obligatorios están presentes
            if (!nombre || !fk_id_raza || !fk_id_genero || !fk_id_categoria) {
                return res.status(400).json({ mensaje: "Los campos nombre, fk_id_raza, fk_id_categoria y fk_id_genero son obligatorios" });
            }

            // Obtener la foto principal
            let fotoPrincipal = req.files.length > 0 ? req.files[0].filename : null;

            try {
                // Insertar la nueva mascota en la base de datos
                const [resultado] = await pool.query(
                    "INSERT INTO mascotas (nombre, descripcion, foto_principal, fk_id_raza, fk_id_categoria, fk_id_genero, admin_id, fecha_publicado, estado) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)",
                    [nombre, descripcion, fotoPrincipal, fk_id_raza, fk_id_categoria, fk_id_genero, adminId, 'en adopcion']
                );

                // Obtener el ID de la nueva mascota
                const mascotaId = resultado.insertId;

                // Insertar fotos adicionales en la base de datos
                if (req.files.length > 1) {
                    const fotos = req.files.slice(1).map(file => [mascotaId, file.filename]);
                    await pool.query(
                        "INSERT INTO fotosmascotas (fk_id_mascota, ruta_foto) VALUES ?",
                        [fotos]
                    );
                }

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


export const listarMascotas = async (req, res) => {
    try {
        const [mascotas] = await pool.query(`
            SELECT m.foto_principal AS fotoM, 
                   m.nombre AS nombreMa, 
                   g.nombre AS genero, 
                   m.descripcion AS descripcion, 
                   r.nombre AS raza, 
                   c.nombre AS categoria, 
                   u.nombre AS usuario_nombre, 
                   m.fecha_publicado AS f_publicacion,
                   h.vacunado,
                   h.esterilizado,
                   h.desparasitado,
                   h.enfermedades,
                   h.discapacidad
            FROM mascotas m
            JOIN razas r ON m.fk_id_raza = r.id_raza
            JOIN categorias c ON m.fk_id_categoria = c.id_categoria
            JOIN generos g ON m.fk_id_genero = g.id_genero
            JOIN usuarios u ON m.admin_id = u.identificacion
            LEFT JOIN historialmedico h ON m.id_mascota = h.fk_id_mascota
        `);
        res.status(200).json(mascotas);
    } catch (error) {
        console.error('Error al obtener las mascotas:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};



export const actualizarMascota = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, fk_id_raza, fk_id_categoria, fk_id_genero, foto_principal } = req.body;
    const adminId = req.usuario;

    try {
        const [mascotaExistente] = await pool.query("SELECT * FROM mascotas WHERE id_mascota = ?", [id]);

        if (mascotaExistente.length === 0) {
            return res.status(404).json({ mensaje: 'Mascota no encontrada' });
        }

        if (mascotaExistente[0].admin_id !== adminId) {
            return res.status(403).json({ mensaje: 'No tienes permiso para actualizar esta mascota' });
        }

        const updatedMascota = {
            nombre: nombre || mascotaExistente[0].nombre,
            descripcion: descripcion || mascotaExistente[0].descripcion,
            fk_id_raza: fk_id_raza || mascotaExistente[0].fk_id_raza,
            fk_id_categoria: fk_id_categoria || mascotaExistente[0].fk_id_categoria,
            fk_id_genero: fk_id_genero || mascotaExistente[0].fk_id_genero,
            foto_principal: foto_principal || mascotaExistente[0].foto_principal
        };

        await pool.query(
            "UPDATE mascotas SET nombre = ?, descripcion = ?, fk_id_raza = ?, fk_id_categoria = ?, fk_id_genero = ?, foto_principal = ? WHERE id_mascota = ?",
            [updatedMascota.nombre, updatedMascota.descripcion, updatedMascota.fk_id_raza, updatedMascota.fk_id_categoria, updatedMascota.fk_id_genero, updatedMascota.foto_principal, id]
        );

        res.status(200).json({ mensaje: 'Mascota actualizada con éxito' });
    } catch (error) {
        console.error('Error al actualizar la mascota:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};



export const EstadoMascota = async (req, res) => {
    const { id } = req.params;
    const adminId = req.usuario; // Obtener la identificación del usuario desde el token

    try {
        // Verificar si la mascota existe
        const [mascotaExistente] = await pool.query("SELECT * FROM mascotas WHERE id_mascota = ?", [id]);

        if (mascotaExistente.length === 0) {
            return res.status(404).json({ mensaje: 'Mascota no encontrada' });
        }

        // Verificar si el usuario tiene permiso para cambiar el estado
        if (mascotaExistente[0].admin_id !== adminId) {
            return res.status(403).json({ mensaje: 'No tienes permiso para cambiar el estado de esta mascota' });
        }

        // Cambiar el estado de la mascota a "en proceso"
        await pool.query("UPDATE mascotas SET estado = ? WHERE id_mascota = ?", ['en proceso', id]);

        res.status(200).json({ mensaje: 'Estado de la mascota actualizado a en proceso con éxito' });
    } catch (error) {
        console.error('Error al cambiar el estado de la mascota:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};


export const obtenerFotosDeMascota = async (req, res) => {
    const { id_mascota } = req.params;

    try {
        const [fotos] = await pool.query("SELECT * FROM fotosmascotas WHERE fk_id_mascota = ?", [id_mascota]);

        if (fotos.length === 0) {
            return res.status(404).json({ mensaje: 'No se encontraron fotos para esta mascota' });
        }

        res.status(200).json(fotos);
    } catch (error) {
        console.error('Error al obtener las fotos de la mascota:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};


export const buscarmasco = async (req, res) => {
    const { id_mascota } = req.params;
    try {
        const [mascotas] = await pool.query(`
            SELECT m.*, r.nombre AS raza, c.nombre AS categoria, g.nombre AS genero, u.nombre AS usuario_nombre
            FROM mascotas m
            JOIN razas r ON m.fk_id_raza = r.id_raza
            JOIN categorias c ON m.fk_id_categoria = c.id_categoria
            JOIN generos g ON m.fk_id_genero = g.id_genero
            JOIN usuarios u ON m.admin_id = u.identificacion
            WHERE m.id_mascota = ?
        `, [id_mascota]);

        if (mascotas.length === 0) {
            return res.status(404).json({ mensaje: 'Mascota no encontrada' });
        }

        res.status(200).json(mascotas[0]);
    } catch (error) {
        console.error('Error al obtener la mascota:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};