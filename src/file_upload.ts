import {Elysia,status} from "elysia";
import z from "zod";
import auth_middleware from "./auth_middleware";
import { save_file,get_connection } from "./tools";
const file_route=new Elysia({prefix:"/file"});
file_route.use(auth_middleware).post("/upload",async({body,user})=>{
    if(!user){throw status(401);}
    const filename=(await save_file(body.data,[".jpg",".png",".jpeg"],'image/',true,4000000,true)).get_or_raise();
    get_connection(async(db)=>await db`insert into uploaded(uid,time,filename,doc_id) values(${user.user_id},${new Date()},
    ${filename},${body.doc_id})`).then().catch(e=>console.log(e));
    return filename;
},{body:z.object({
    data:z.file().max(4000000),
    doc_id:z.hex().max(16)
})}).post("/commit",async({user,query,body})=>{
    if(!user){throw status(401);}
    await get_connection(async(db)=>{
        await db`delete from uploaded where uid=${user.user_id} and doc_id=${query.doc_id} and 
        filename=ANY(${db.array(body.used_img,"TEXT")})`;
    });
},{query:z.object({
    doc_id:z.hex().max(16)
}),
body:z.object({
    used_img:z.array(z.string().max(200)).max(100)
})});
export default file_route