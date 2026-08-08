import {Elysia,status} from "elysia";
import z from "zod";
import auth_middleware from "./auth_middleware";
import { save_file } from "./tools";
const file_route=new Elysia({prefix:"/file"});
file_route.use(auth_middleware).post("/upload",async({body,user})=>{
    if(!user){throw status(401);}
    return (await save_file(body.data,[".jpg",".png",".jpeg"],'image/',true,4000000,true)).get_or_raise();
},{body:z.object({
    data:z.file().max(4000000)
})});
export default file_route