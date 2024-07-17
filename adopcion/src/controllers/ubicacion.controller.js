import {pool} from '../database/conexion.js'
import { validationResult } from "express-validator"

// Endpoint para obtener todos los departamentos
export const obtenerDepartamentos = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM departamentos');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor: ' + error.message });
    }
};

// Endpoint para obtener ciudades por departamento
export const obtenerCiudadesPorDepartamento = async (req, res) => {
    const { departamento_id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM ciudades WHERE departamento_id = ?', [departamento_id]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor: ' + error.message });
    }
};
