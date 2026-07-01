import {Elysia} from "elysia";
import { problem_route } from "./problem";
import  comment_route from "./comment";
import { cors } from '@elysiajs/cors'
import { close_db,get_connection } from "./tools";
import register_route from "./register";
import z from "zod";
const app=new Elysia();
app.use(cors());
app.use(problem_route).use(comment_route).use(register_route);
app.onStop(async()=>{
    await close_db();
});
async function start_app(){
    const port=parseInt(Bun.env.PORT ?? "3000");    
    console.log(`binding to port ${ port}`);
    app.listen({port:port,hostname:"0.0.0.0"});
    return;
    /*let port= Bun.env.PORT|| 3000; 
    try{
        app.listen(port);
    }catch{
        port=3001;
        app.listen(port);
    }
    const nginx_path=Bun.env.NGINX_CONFIG_PATH; 
    if(nginx_path){
        await Bun.write(nginx_path,`proxy_pass http://localhost:${port};`);
        await Bun.$`"sudo -S nginx -s reload`;
        const old_port=(port==3000)?3001:3000;
        await Bun.$`pkill -INT -f ":${old_port} -"`;
    }*/
}
app.get("/",({set,query})=>{
    set.headers["content-type"]="text/html";
    if(query.time && query.ip){
        get_connection(async(db)=>{
            await db`insert into access_log(time,address) values(${query.time},${query.ip})`
        });
    }
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head></head>
        <body>
        <div style="display:block;text-align:center;font-size:24px">my home page</div>
        <div style="margin-top:12px;dislay:block;text-align:center">some other text</div>
        </body>
    `;
},{query:z.object({
    time:z.string().optional(),
    ip:z.string().optional()
})})
if(Bun.env.LISTEN=='true'){
    await start_app();
}