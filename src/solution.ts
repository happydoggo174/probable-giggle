import {Elysia,status} from "elysia";
import { get_connection } from "./tools";
import auth_middleware from "./auth_middleware";
import z from "zod";
const solution_route=new Elysia({prefix:"/solution"});
solution_route.get("/list",async({query})=>{
    return await get_connection(async(db)=>{
        return await db`select solution_id,title,account.username 
        from solution 
        inner join account 
        on solution.author_id=account.uid 
        where solution.problem_id=${query.problem_id} and solution.solution_id>${query.last_id} 
        order by solution_id 
        limit 20`
    });
},{
    query:z.object({
        problem_id:z.coerce.number().positive(),
        last_id:z.coerce.number().default(-1)    
    })    
})
.get("/detail",async({query})=>{
    return await get_connection(async(db)=>{
        const r=await db`select title,author_id,account.username,account.profile,description,is_plain,equation 
        from solution 
        inner join account
        on solution.author_id=account.uid 
        where solution.solution_id=${query.solution_id}`;
        if(!r.length){
            throw status(404,"solution not found");
        }
        return r[0];
    });
},
{
query:z.object({
    solution_id:z.coerce.number().positive()
})}).use(auth_middleware).post("/make",async({user,body})=>{
    if(!user){throw status(401,"please login to post solution");}
    await get_connection(async(db)=>{
        try{
            await db`insert into solution(problem_id,author_id,title,description,is_plain,equation) 
            values(${body.problem_id},${user.user_id},${body.title},${body.description},${body.plain_content},
            ${body.equation})`;
        }catch(e){
            console.log(e);
            throw status(404,"problem not found");
        }
    });
},{
    body:z.object({
        title:z.string().max(150),
        description:z.string().max(6000),
        plain_content:z.boolean().default(false),
        problem_id:z.coerce.number(),
        equation:z.string().max(2000)
    })
}).delete("/drop",async({user,query})=>{
    if(!user){
        throw status(401,"please login to delete solution");
    }
    await get_connection(async(db)=>{
        const r=await db`select author_id from solution where solution_id=${query.solution_id}`.values();
        if(!r.length){
            throw status(404,"solution not found");
        }
        if(r[0]!=user.user_id){
            throw status(403,"you can't delete othere's solution");
        }
        await db`delete from solution where solution_id=${query.solution_id}`;
    });
},{
    query:z.object({
        solution_id:z.coerce.number()
    })
})
export default solution_route;