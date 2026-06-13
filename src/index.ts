import {Elysia,status} from "elysia";
import { problem_route } from "./problem";
import  comment_route from "./comment";
import { cors } from '@elysiajs/cors'
import { close_db } from "./tools";
import z from "zod";
import { get_connection } from "./tools";
const app=new Elysia();
app.use(cors());
app.use(problem_route).use(comment_route);
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
}).post("/register",async({body})=>{
    const auth0_secret=body.auth0_secret;
    const expected=Bun.env.AUTH0_SECRET;
    if(expected==undefined){
        throw status(500);
    }
    let found=true;
    for(let i=0;i<expected.length;i++){
        if(expected[i]!=auth0_secret[i]){
            found=false;
        }
    }
    if(!found){
        throw status(403);
    }
    function isRetryableError(err:Error) {
        const msg = err?.message?.toLowerCase() || "";

        return (
            msg.includes("connection") ||
            msg.includes("timeout") ||
            msg.includes("econnreset") ||
            msg.includes("deadlock") ||
            msg.includes("429")
        );
    }
    return await get_connection(async(db)=>{
        db`insert into account(uid,username,profile) values(${body.uid},${body.username},${body.profile}) 
        on conflict(uid) do nothing`.then(()=>{}).catch(async(err)=>{
            if(isRetryableError(err)){
                await db`insert into account(uid,username,profile) values(${body.uid},${body.username},${body.profile}) 
                on conflict(uid) do nothing`;
            }
        });
    });
},
    {body:z.object({
        username:z.string().max(50),
        uid:z.string().max(256),
        profile:z.string().max(128),
        auth0_secret:z.string().max(50).default("")})
    });
if(Bun.env.LISTEN=='true'){
    await start_app();
}