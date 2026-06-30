import {Elysia,status} from "elysia";
import z from "zod";
import { get_connection } from "./tools";
import auth_middleware from "./auth_middleware";
const comment_route=new Elysia({prefix:"/comment"});
comment_route.get("/",async({query})=>{
        return await get_connection(async(db)=>{
            const cursor=query.first_uid?db`and user_id>${query.first_uid}`:db``;
            return await db`select content,username,profile from comment inner join account 
            on comment.user_id=account.uid where problem_id=${query.problem_id} ${cursor}  order by user_id limit 20`;
        });
    },
    {query:z.object({
        problem_id:z.coerce.number().positive(),
        first_uid:z.coerce.number().optional()})
    }
).use(auth_middleware).post("/make",async({body,user})=>{
    if(!user){throw status(401,"please login to comment");}
    return await get_connection(async(db)=>{
        return await db.begin(async(db)=>{
            const resp=await db`insert into comment(problem_id,user_id,content) values(
            ${body.problem_id},${user.user_id},${body.content}) on conflict do nothing returning 1`;
            if(!resp.length){
                throw status(403,"only 1 comment per account");
            }
            const r=await db`update problem set comment_count=comment_count+1 where id=${body.problem_id} returning 1 as done`;
            if(!r.length){
                throw status(404,"problem not found");
            }
        });
    });
},{
    body:z.object({
        problem_id:z.coerce.number().positive(),
        content:z.string().max(250)})})
export default comment_route;