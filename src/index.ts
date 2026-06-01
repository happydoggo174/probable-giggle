import {Elysia} from "elysia";
import { problem_route } from "./problem";
import { cors } from '@elysia/cors'
const app=new Elysia();
app.use(cors());
app.use(problem_route);
async function start_app(){
    let port=3000; 
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
    }
}
app.get("/",({set})=>{
    set.headers["content-type"]="text/html";
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head></head>
        <body>
        <div style="display:block;text-align:center;font-size:24px">my home page</div>
        <div style="margin-top:12px;dislay:block;text-align:center">some other text</div>
        </body>
    `;
});
export default app
//await start_app();