import { get_connection, get_session } from "./tools";
import {Elysia,status} from "elysia";
import * as jose from "jose"
import {createHash,timingSafeEqual} from "crypto";
import { SHA256 } from "bun";
import {z} from "zod";
export const auth_route=new Elysia({prefix:"/auth"});
auth_route.post("/login",async ({body})=>{
    return await get_connection(async(db)=>{
        const password_hash=Buffer.from(createHash("sha256").update(body.password).digest('hex'));
        const out=await db`select password,uid,priv from account where username=${body.username}`;
        if(out.length==0){
            return status(404,"wrong username or password");
        }
        const correct_pass=Buffer.from(createHash("sha256").update(out[0]["password"]).digest('hex'));
        if(!timingSafeEqual(password_hash,correct_pass)){
            return status(404,"wrong username or password");
        }
        const secret=new TextEncoder().encode(Bun.env.JWT_SECRET ?? "debug jwt key");
        const token=await new jose.SignJWT(
            {aud:"auth",exp:Date.now()+900,"uid":out[0]["uid"],"priv":out[0]["priv"]}).sign(secret);
        return token;
    });
},{
    body:z.strictObject(
        {username:z.string().max(50),
        password:z.string().max(50)}
    )
}).post("/register",async ({body})=>{
    return await get_connection(async (db)=>{
        const password_hash=new SHA256().update(body.password).digest('hex');
        const out=await db`insert into account(username,password) values(${body.username},${password_hash}) on conflict 
        do nothing returning 1`;
        if(!out.length){
            return status(422,"this username has been taken");
        }
    });
},{
    body:z.strictObject({username:z.string().max(50),
    password:z.string().max(50)}).strict()
}).post("/refresh",async ({headers})=>{
    const user=await get_session(headers);
    if(user==null){
        return status(403);
    }
    const secret=new TextEncoder().encode(Bun.env.JWT_SECRET ?? "debug jwt key");
    const token=await new jose.SignJWT(
            {aud:"auth",exp:Date.now()+900,"uid":user.uid,"priv":user.priv}).sign(secret);
        return token;
}); 