import {z} from "zod";
import {Elysia,status} from "elysia";
import { get_connection } from "./tools";
import auth_middleware from "./auth_middleware";
export const problem_route=new Elysia({prefix:"/problem"});
problem_route.get('/home',async ()=>{
    return await get_connection(async (db)=>{
        return await db`select title,difficulty,reaction,id from problem`;
    });
}
).get("/detail",async ({query,set})=>{
    set.headers["cache-control"]='public, s-maxage=3600, stale-while-revalidate=60';
    return await get_connection(async(db)=>{
        return await db`select title,description,author_name as author,parameter,output,reaction 
        from problem where id=${query.problem_id}`;
    });
},{query:z.object({
    problem_id:z.coerce.number()
})}).use(auth_middleware).post("/like",async({user,query})=>{
    if(user==null){throw status(401,"please login to like");}
    return await get_connection(async(db)=>{
        return await db.begin(async(db)=>{
            let res=await db`insert into problem_info(problem_id,uid,status,reaction) values(${query.problem_id},
            ${user.user_id},'none','liked') on conflict(problem_id,uid) do update set reaction='liked' 
            where problem_info.problem_id=${query.problem_id} and problem_info.uid=${user.user_id} 
            and problem_info.reaction!='liked' returning 1`;
            if(!res.length){throw status(403,"you had already liked this post");}
            res=await db`update problem set reaction=reaction+1 where id=${query.problem_id} returning 1`;
            if(!res.length){
                throw status(404,"problem not found");
            }
        });
    });
},{query:z.object({
    problem_id:z.coerce.number()})
}).post("/dislike",async({user,query})=>{
    if(user==null){throw status(401,"please login to dislike");}
    return await get_connection(async(db)=>{
        return await db.begin(async(db)=>{
            let res=await db`insert into problem_info(problem_id,uid,status,reaction) values(${query.problem_id},
            ${user.user_id},'none','disliked') on conflict(problem_id,uid) do update set reaction='disliked' 
            where problem_info.problem_id=${query.problem_id} and problem_info.uid=${user.user_id} 
            and problem_info.reaction!='disliked' returning 1`;
            if(!res.length){throw status(403,"you had already disliked this post");}
            res=await db`update problem set reaction=reaction-1 where id=${query.problem_id} returning 1`;
            if(!res.length){
                throw status(404,"problem not found");
            }
        });
    });
},{query:z.object({
    problem_id:z.coerce.number()})
});