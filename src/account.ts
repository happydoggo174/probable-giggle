import Elysia from "elysia";
import { status } from "elysia";
import z from "zod";
import { get_connection } from "./tools";
const account_route=new Elysia({prefix:'/account'});
account_route.get("/detail",async({query})=>{
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