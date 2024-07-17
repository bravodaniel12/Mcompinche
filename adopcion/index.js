import express  from 'express' 
import  body_parser from 'body-parser'
import cors from 'cors'
import rutaValidacion from './src/routes/autenticacion.js'
import rutaUsuario from './src/routes/Usuarios.route.js'
import rutaHmedico from './src/routes/hmedico.route.js'
import rutaMasco from './src/routes/mascotas.js'
import rutafavoritos from './src/routes/favoritos.route.js'
import rutaubi from './src/routes/ubicacion.route.js'

import fileupload from 'express-fileupload'

//servidor
const servidor = express()


servidor.use(cors())
servidor.use(body_parser.json())
servidor.use(body_parser.urlencoded({extended: false}))

servidor.listen(3000, () =>{
    console.log("esta funcionando en el puerto 3000")
})

//ruta
servidor.use(rutaValidacion)
servidor.use(rutaUsuario)
servidor.use(rutaHmedico)
servidor.use(rutaMasco)
servidor.use(rutafavoritos)
servidor.use(rutaubi)

// imagenes
servidor.use(fileupload({
    createParentPath:true
}))

//carpetas documentacion
servidor.set('view engine', 'ejs');
servidor.set('views','./views');
servidor.get('/documents',(req,res)=>{
    res.render('document.ejs');
})
servidor.use(express.static('./public'));

