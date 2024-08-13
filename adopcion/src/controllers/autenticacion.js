import { pool } from "../database/conexion.js";
import Jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';

export const validar = async (req, res) => {
    try {
        let { email, password } = req.body;
        let sql = `SELECT * FROM usuarios WHERE BINARY email = ?`;

        const [rows] = await pool.query(sql, [email]);
        
        if (rows.length > 0) {
            const user = rows[0];
            // Comparar la contraseña proporcionada con la contraseña encriptada
            const match = await bcrypt.compare(password, user.password);

            if (match) {
                // Incluir la identificación del usuario en el token JWT
                let token = Jwt.sign({ user: user.identificacion },"secretosuperlargo12345", { expiresIn: "2h" });
                return res.status(200).json({ 'user': user, 'token': token, message: 'Token generado con éxito' });
            } else {
                return res.status(404).json({ "message": "Contraseña incorrecta" });
            }
        } else {
            return res.status(404).json({ "message": "Usuario no encontrado" });
        }
    } catch (error) {
        res.status(500).json({ status: 500, message: 'Error del servidor: ' + error });
    }
};



//verificar
export const validarToken = async (req, res, next) => {
    try {
        let tokenClient = req.headers['token'];

        if (!tokenClient) {
            return res.status(403).json({ message: 'Token es requerido' });
        } else {
            Jwt.verify(tokenClient, "secretosuperlargo12345", (error, decoded) => {
                if (error) {
                    return res.status(403).json({ message: 'Token es inválido o ha expirado' });
                } else {
                    // Decodificar el token y establecer req.usuario
                    req.usuario = decoded.user;
                    next();
                }
            });
        }
    } catch (error) {
        return res.status(500).json({ status: 500, message: 'Error del servidor: ' + error.message });
    }
};




// import { pool } from "../database/conexion.js";
// import  jwt  from "jsonwebtoken";
// import bcrypt from "bcrypt";

// export const validar = async (req, res) => {
//     try {
//       let { email, password } = req.body;
//       const sql = `SELECT * FROM usuarios WHERE email = ?`;
//       const [rows] = await pool.query(sql, [email]);
  
//       if (rows.length === 0) {
//         return res.status(401).json({ message: "Usuario no registrado" });
//       }
  
//       const user = rows[0]; // Obtener el primer usuario de los resultados
//       const validPassword = await bcrypt.compare(password, user.password);
  
//       if (!validPassword) {
//         return res.status(401).json({ message: "Contraseña incorrecta" });
//       }
  
//       const token = jwt.sign({ user }, process.env.AUT_SECRET, {
//         expiresIn: process.env.AUT_EXPIRE,
//       });
  
//       res.status(200).json({ user, token, message: 'Token generado con éxito' });
//     } catch (error) {
//       res.status(500).json({ status: 500, message: 'Error del servidor' + error });
//     }
//   };
// //verificar
// export const validarToken = async (req, res, next) => {
//     try {
//       let tokenClient = req.headers['token'];
  
//       if (!tokenClient) {
//         return res.status(403).json({ message: 'Token es requerido' });
//       } else {
//         jwt.verify(tokenClient, process.env.AUT_SECRET, (error, decoded) => {
//           if (error) {
//             return res.status(403).json({ message: 'Token inválido o expirado' });
//           } else {
//             next();
//           }
//         });
//       }
//     } catch (error) {
//       return res.status(500).json({ status: 500, message: 'Error del servidor' + error });
//     }
//   };