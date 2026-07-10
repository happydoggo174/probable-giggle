import Elysia from "elysia";
import { status } from "elysia";
import z from "zod";
import { get_connection } from "./tools";
const account_route=new Elysia({prefix:'/account'});
account_route.post('/register',({body})=>{
    const auth0_secret=body.auth0_secret;
    const expected=Bun.env.AUTH0_SECRET;
    if(expected==undefined){
        throw status(500);
    }
    if(auth0_secret.length!=expected.length || !crypto.timingSafeEqual(Buffer.from(auth0_secret),Buffer.from(expected))){
        throw status(403);
    }
    function isRetryableError(err:Error|any) {
        const msg = err?.message?.toLowerCase() || "";

        return (
            msg.includes("connection") ||
            msg.includes("timeout") ||
            msg.includes("econnreset") ||
            msg.includes("deadlock") ||
            msg.includes("429")
        );
    }
    get_connection(async(db)=>{
        for(let i=0;i<3;i++){
            try{
                await db`insert into account(uid,username,profile) values(${body.uid},${body.username},${body.profile}) 
                on conflict(uid) do nothing`;
                break;
            }catch(e){
                if(!isRetryableError(e)){
                    break;
                }
            }
        }
    }).then(()=>{});
},
    {body:z.object({
        username:z.string().max(50),
        uid:z.string().max(256),
        profile:z.string().max(128),
        auth0_secret:z.string().max(50).default("")})
    }).
get("/detail",async({query})=>{
    return await get_connection(async(db)=>{
        const account=await db`select username,profile from account where uid=${query.uid}`;
        const pagination=((query.last_id!=undefined)?db`and problem.id>${query.last_id}`:db``);
        const r=await db`select title,difficulty,problem.reaction,id,status,comment_count from problem 
        left join problem_info on problem_info.uid=${query.uid} 
        and problem.id=problem_info.problem_id 
        where problem_info.reaction='liked' ${pagination} or problem_info.status='solved' 
        order by problem.id limit 20`
        if(!account.length){
            throw status(404,"account not found");
        }
        return {account:account[0],problem:r};
    });
},{
    query:z.object({
        uid:z.string().max(100),
        last_id:z.number().positive().optional()
    })
},);
export default account_route;