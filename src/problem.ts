import {z} from "zod";
import {Elysia,status} from "elysia";
import { get_connection } from "./tools";
import auth_middleware from "./auth_middleware";
export const problem_route=new Elysia({prefix:"/problem"});
problem_route.use(auth_middleware).get('/home',async ({set,user})=>{
    return await get_connection(async (db)=>{
        if(!user){
            set.headers["cache-control"]="public, s-maxage=360, stale-while-revalidate=60";
            return await db`select title,difficulty,reaction,id from problem`;
        }
        return await db`select title,difficulty,problem.reaction,id,status from problem left join problem_info 
        on problem.id=problem_info.problem_id and problem_info.uid=${user.user_id}`;
    });
}
).get("/detail",async ({query,set,user})=>{
    return await get_connection(async(db)=>{
        let data=null;
        if(!user){
            set.headers["cache-control"]='public, s-maxage=120, stale-while-revalidate=60';
            data=await db`select title,description,author_name as author,parameter,output,reaction 
            from problem where id=${query.problem_id}`;
        }else{
            data=await db`select title,description,author_name as author,parameter,output,
            problem.reaction as reaction,status,problem_info.reaction as user_reactions  
            from problem left join problem_info 
            on problem.id=problem_info.problem_id 
            where id=${query.problem_id}`;
        }
        if(!data.length){
            throw status(404,"problem not found");
        }
        return data[0];
    });
},{query:z.object({
    problem_id:z.coerce.number()
})}).post("/like",async({user,query})=>{
    if(user==null){throw status(401,"please login to like");}
    return await get_connection(async(db)=>{
        return await db.begin(async(db)=>{
            let res=await db`insert into problem_info(problem_id,uid,status,reaction) values(${query.problem_id},
            ${user.user_id},'none','liked') on conflict(problem_id,uid) do update set reaction='liked' 
            where problem_info.reaction!='liked' returning 1`;
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
            where problem_info.reaction!='disliked' returning 1`;
            if(!res.length){throw status(403,"you had already disliked this post");}
            res=await db`update problem set reaction=reaction-1 where id=${query.problem_id} returning 1`;
            if(!res.length){
                throw status(404,"problem not found");
            }
        });
    });
},{query:z.object({
    problem_id:z.coerce.number()})
}).post("/complete",async({query,user})=>{
    if(!user){
        throw status(401,"please login to save progress");
    }
    if(query.result!="solved" && query.result!="attempted"){
        throw status(422,'invalid status');
    }
    return await get_connection(async(db)=>{
        if(!(await db`select 1 from problem where id=${query.problem_id}`).length){
            throw status(404,"problem not found");
        }
        const cond=query.result=="attempted"?db`where problem_info.status!='solved'`:db``;
        await db`insert into problem_info(problem_id,uid,status,reaction) values(${query.problem_id},
        ${user.user_id},${query.result},'none') on conflict(problem_id,uid) 
        do update set status=excluded.status ${cond}`;
    });
},{
    query:z.object({
        problem_id:z.coerce.number(),
        result:z.string()
    })
});