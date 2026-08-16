import {Elysia,status} from "elysia";
import { get_connection } from "./tools";
import z from "zod";
const signup_route=new Elysia({prefix:"/logging"});
signup_route.post("",({body,headers})=>{
    if(!crypto.timingSafeEqual(Buffer.from(headers.authentication),Buffer.from(Bun.env.AUTH0_SECRET!))){
        throw status(403);
    }
    get_connection(async(db)=>{
        const username=body.record.raw_user_meta_data.username || body.record.email.split("@")[0];
        let profile=body.record.raw_user_meta_data.profile;
        if(profile==null){
            profile=`https://api.dicebear.com/9.x/initials/svg?seed=${body.record.email.split("@")[0]}&chars=1`;
        }
        await db`insert into account(uid,username,profile) values(${body.record.id},${username},${profile})`;
    }).then();
},{body:z.object({
    record:z.object({
        id:z.string(),
        email:z.string().max(120),
        raw_user_meta_data:z.object({
            profile:z.string().max(100).optional(),
            username:z.string().max(60).optional(),
        })
    })
}),
headers:z.object({
    authentication:z.string()
})})
export default signup_route;