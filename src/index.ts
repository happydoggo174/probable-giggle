import {Elysia} from "elysia";
import { problem_route } from "./problem";
import  comment_route from "./comment";
import { cors } from '@elysiajs/cors'
import { close_db,get_connection } from "./tools";
import account_route from "./register";
import knowledge_route from "./knowledge";
import z from "zod";
const app=new Elysia();
app.use(cors());
app.use(problem_route).use(comment_route).use(account_route).use(knowledge_route);
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
app.get("/",({set,headers})=>{
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
},).post("/logging",({body,headers})=>{
    try{
        if(!crypto.timingSafeEqual(Buffer.from(headers.authentication|| ""),Buffer.from(Bun.env.AUTH0_SECRET!))){
            console.log("invalid auth");
            throw 0;
        } 
    }catch(e){
        console.log(e);
    }
    console.log("logging called");
    get_connection(async(db)=>{
        const username=body.record.raw_user_meta_data.username || body.record.email.split("@")[0];
        let profile=body.record.raw_user_meta_data.profile;
        if(profile==null){
            profile=`https://api.dicebear.com/9.x/initials/svg?seed=${body.record.email.split("@")[0]}&chars=1`;
        }
        await db`insert into account(uid,username,profile) values(${body.record.id},${username},${profile})`;
        console.log("done");
    }).then();
    return "working";
},{body:z.object({
    record:z.object({
        id:z.string(),
        email:z.string().max(120),
        raw_user_meta_data:z.object({
            priv:z.string(),
            profile:z.string().max(100).optional(),
            username:z.string().max(60),
        })
    })
}),
});
if(Bun.env.LISTEN=='true'){
    await start_app();
}