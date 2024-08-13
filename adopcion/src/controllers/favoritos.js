import { pool } from '../database/conexion.js';
import { validationResult } from 'express-validator';

// Listar todos los historiales médicos
export const listarFavo = async (req, res) => {
    try {
        const adminId = req.usuario;

        if (!adminId) {
            return res.status(403).json({ mensaje: 'No se proporcionó la identificación del administrador en el token' });
        }

        // Consulta SQL para obtener los detalles de las mascotas favoritas
        const [resultados] = await pool.query(`
            SELECT m.*, m.fk_id_genero AS genero, m.nombre AS nombreM, m.foto_principal AS foto_principal, m.id_mascota AS id_mascota, m.descripcion AS descripcion, m.fk_id_raza AS raza, m.fk_id_categoria AS categoria, m.estado AS estado
            FROM favoritos f
            JOIN mascotas m ON f.fk_id_mascota = m.id_mascota
            WHERE f.fk_identificacion = ?
        `, [adminId]);

        res.status(200).json(resultados);
    } catch (error) {
        console.error('Error al listar los favoritos:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};


// Agregar un favorito
export const agregarFavorito = async (req, res) => {
    const { id_mascota } = req.params; // Leer id_mascota de los parámetros de la URL
    const adminId = req.usuario;

    try {
        // Verificar si la mascota ya está en favoritos
        const [favoritoExistente] = await pool.query(
            'SELECT * FROM favoritos WHERE fk_id_mascota = ? AND fk_identificacion = ?',
            [id_mascota, adminId]
        );

        if (favoritoExistente.length > 0) {
            return res.status(400).json({ mensaje: 'La mascota ya está en tus favoritos' });
        }

        // Insertar el nuevo favorito en la base de datos
        await pool.query(
            'INSERT INTO favoritos (fk_id_mascota, fk_identificacion) VALUES (?, ?)',
            [id_mascota, adminId]
        );

        res.status(201).json({ mensaje: 'Mascota añadida a favoritos' });
    } catch (error) {
        console.error('Error al agregar favorito:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};


// Eliminar un favorito existente
export const eliminarFavorito = async (req, res) => {
    try {
        const { id_mascota } = req.params;
        const adminId = req.usuario;

        if (!adminId) {
            return res.status(403).json({ mensaje: 'No se proporcionó la identificación del administrador en el token' });
        }

        // Eliminar el favorito de la base de datos
        const [resultado] = await pool.query('DELETE FROM favoritos WHERE fk_id_mascota = ? AND fk_identificacion = ?', [id_mascota, adminId]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Favorito no encontrado' });
        }

        res.status(200).json({ mensaje: 'Favorito eliminado con éxito' });
    } catch (error) {
        console.error('Error al eliminar el favorito:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};


//mascotas adoptadas
export const listarMascotasAdoptadas = async (req, res) => {
    try {
        const usuarioId = req.usuario;

        if (!usuarioId) {
            return res.status(403).json({ mensaje: 'No se proporcionó la identificación del usuario en el token' });
        }

        // Consulta SQL para obtener los detalles de las mascotas adoptadas
        const [resultados] = await pool.query(`
            SELECT m.*, m.fk_id_genero AS genero, m.nombre AS nombreM, m.foto_principal, m.id_mascota AS id_mascota, m.descripcion AS descripcion, m.fk_id_raza AS raza, m.fk_id_categoria AS categoria, m.estado AS estado
            FROM adopciones a
            JOIN mascotas m ON a.fk_id_mascota = m.id_mascota
            WHERE a.fk_identificacion = ?
        `, [usuarioId]);

        res.status(200).json(resultados);
    } catch (error) {
        console.error('Error al listar las mascotas adoptadas:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};


export const getPetById = async (req, res) => {
    try {
        const petId = req.params.id;

        // Consulta a la base de datos para obtener la mascota por ID
        const [rows] = await pool.query(`
            SELECT m.*, m.fk_id_genero AS genero, m.nombre AS nombreM, m.estado AS estado
            FROM mascotas m
            WHERE m.id_mascota = ?
        `, [petId]);

        // Verifica si se encontró la mascota
        if (rows.length > 0) {
        } else {
            res.status(404).json({ mensaje: 'Mascota no encontrada' });
        }
    } catch (error) {
        console.error('Error al obtener la mascota:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};