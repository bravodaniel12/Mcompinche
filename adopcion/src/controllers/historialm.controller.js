import { pool } from '../database/conexion.js';
import { validationResult } from 'express-validator';

// Listar todos los historiales médicos
export const listarHistoriales = async (req, res) => {
    try {
        const [resultados] = await pool.query('SELECT * FROM historialmedico');
        res.status(200).json(resultados);
    } catch (error) {
        console.error('Error al listar los historiales médicos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Registrar un nuevo historial médico
export const registrarHistorial = async (req, res) => {
    try {
        // Verificar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Obtener la identificación del administrador desde el token
        const adminId = req.usuario;

        if (!adminId) {
            return res.status(403).json({ mensaje: 'No se proporcionó la identificación del administrador en el token' });
        }

        // Obtener datos del cuerpo de la solicitud
        const { fk_id_mascota, vacunado, esterilizado, desparasitado, enfermedades, discapacidad } = req.body;

        // Asignar valores por defecto si no se proporcionan
        const enfermedadesFinal = enfermedades ? enfermedades : 'Ninguna';
        const discapacidadFinal = discapacidad ? discapacidad : 'Ninguna';

        // Verificar que la mascota pertenece al usuario que está registrando el historial
        const [mascotaExistente] = await pool.query('SELECT * FROM mascotas WHERE id_mascota = ? AND admin_id = ?', [fk_id_mascota, adminId]);

        if (mascotaExistente.length === 0) {
            return res.status(403).json({ mensaje: 'No tienes permiso para registrar el historial médico para esta mascota' });
        }

        // Insertar el nuevo historial médico en la base de datos
        const [resultado] = await pool.query(
            'INSERT INTO historialmedico (fk_id_mascota, vacunado, esterilizado, desparasitado, enfermedades, discapacidad) VALUES (?, ?, ?, ?, ?, ?)',
            [fk_id_mascota, vacunado, esterilizado, desparasitado, enfermedadesFinal, discapacidadFinal]
        );

        res.status(201).json({ id_historial: resultado.insertId });
    } catch (error) {
        console.error('Error al registrar el historial médico:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

// Actualizar un historial médico existente
export const actualizarHistorial = async (req, res) => {
    const { id_historial } = req.params;
    const { vacunado, esterilizado, desparasitado, enfermedades, discapacidad } = req.body;

    try {
        // Obtener la identificación del administrador desde el token
        const adminId = req.usuario;

        if (!adminId) {
            return res.status(403).json({ mensaje: 'No se proporcionó la identificación del administrador en el token' });
        }

        // Asignar valores por defecto si no se proporcionan
        const enfermedadesFinal = enfermedades ? enfermedades : 'Ninguna';
        const discapacidadFinal = discapacidad ? discapacidad : 'Ninguna';

        // Verificar que el historial médico pertenece a una mascota del usuario
        const [historialExistente] = await pool.query(
            'SELECT h.* FROM historialmedico h JOIN mascotas m ON h.fk_id_mascota = m.id_mascota WHERE h.id_historial = ? AND m.admin_id = ?',
            [id_historial, adminId]
        );

        if (historialExistente.length === 0) {
            return res.status(403).json({ mensaje: 'No tienes permiso para actualizar este historial médico' });
        }

        // Actualizar el historial médico en la base de datos
        const [resultado] = await pool.query(
            'UPDATE historialmedico SET vacunado = ?, esterilizado = ?, desparasitado = ?, enfermedades = ?, discapacidad = ? WHERE id_historial = ?',
            [vacunado, esterilizado, desparasitado, enfermedadesFinal, discapacidadFinal, id_historial]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Historial médico no encontrado' });
        }

        res.status(200).json({ mensaje: 'Historial médico actualizado con éxito' });
    } catch (error) {
        console.error('Error al actualizar el historial médico:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

// Buscar un historial médico por ID
export const buscarHistorial = async (req, res) => {
    const { id_historial } = req.params;

    try {
        const [resultados] = await pool.query('SELECT * FROM historialmedico WHERE id_historial = ?', [id_historial]);

        if (resultados.length === 0) {
            return res.status(404).json({ mensaje: 'Historial médico no encontrado' });
        }

        res.status(200).json(resultados[0]);
    } catch (error) {
        console.error('Error al buscar el historial médico:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};
