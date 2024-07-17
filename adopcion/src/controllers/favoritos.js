import { pool } from '../database/conexion.js';
import { validationResult } from 'express-validator';

// Listar todos los historiales médicos
export const listarFavo = async (req, res) => {
    
        try {
            const adminId = req.usuario;
    
            if (!adminId) {
                return res.status(403).json({ mensaje: 'No se proporcionó la identificación del administrador en el token' });
            }
    
            const [resultados] = await pool.query('SELECT f.fk_id_mascota, m.nombre FROM favoritos f JOIN mascotas m ON f.fk_id_mascota = m.id_mascota WHERE f.fk_identificacion = ?', [adminId]);
    
            res.status(200).json(resultados);
        } catch (error) {
            console.error('Error al listar los favoritos:', error);
            res.status(500).json({ mensaje: 'Error interno del servidor' });
        }
    };

// Agregar un favorito
export const agregarFavorito = async (req, res) => {
    const { fk_id_mascota } = req.body;
    const adminId = req.usuario;

    try {
        // Verificar si la mascota ya está en favoritos
        const [favoritoExistente] = await pool.query(
            'SELECT * FROM favoritos WHERE fk_id_mascota = ? AND fk_identificacion = ?',
            [fk_id_mascota, adminId]
        );

        if (favoritoExistente.length > 0) {
            return res.status(400).json({ mensaje: 'La mascota ya está en tus favoritos' });
        }

        // Insertar el nuevo favorito en la base de datos
        await pool.query(
            'INSERT INTO favoritos (fk_id_mascota, fk_identificacion) VALUES (?, ?)',
            [fk_id_mascota, adminId]
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
