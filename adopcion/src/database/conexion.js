import { createPool } from "mysql2/promise";


export const pool = createPool({
    host:'bfmjtmstxcifkfvpi1ht-mysql.services.clever-cloud.com',
    user:'uol8yxfbnk02i6rx',
    password:'5MToDCQ7l60EG1OTCTML',
    port:3306,
    database: 'bfmjtmstxcifkfvpi1ht',
})