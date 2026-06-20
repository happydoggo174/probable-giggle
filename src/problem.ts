import {z} from "zod";
import {Elysia,status} from "elysia";
import { get_connection } from "./tools";
import auth_middleware from "./auth_middleware";
import {run_test} from "./testcase";
export const problem_route=new Elysia({prefix:"/problem"});
problem_route.use(auth_middleware).get('/home',async ({set,user})=>{
    return await get_connection(async (db)=>{
        if(!user){
            set.headers["cache-control"]="public, s-maxage=360, stale-while-revalidate=60";
            return await db`select title,difficulty,reaction,id,comment_count from problem`;
        }
        return await db`select title,difficulty,problem.reaction,id,status,comment_count from problem 
        left join problem_info 
        on problem.id=problem_info.problem_id and problem_info.uid=${user.user_id}`;
    });
}
).get("/detail",async ({query,set})=>{
    return await get_connection(async(db)=>{
        const data=await db`select title,description,author_name as author,comment_count,parameter,output,reaction 
        from problem where id=${query.problem_id}`;
        if(!data.length){
            throw status(404,"problem not found");
        }
        set.headers["cache-control"]='public, s-maxage=120, stale-while-revalidate=60';
        return data[0];
    });
},{query:z.object({
    problem_id:z.coerce.number()
})}).get("/status",async({query,user})=>{
    if(!user){throw status(401,"please login to view status");}
    return await get_connection(async(db)=>{
        const stat=await db`select status,reaction from problem_info where problem_id=${query.problem_id} 
        and uid=${user.user_id}`;
        if(!stat.length){
            return {"status":"none","reaction":"none"};
        }
        return stat[0];
    });
},{query:z.object({problem_id:z.coerce.number()})}
).post("/like",async({user,query})=>{
    if(user==null){throw status(401,"please login to like");}
    return await get_connection(async(db)=>{
        return await db.begin(async(db)=>{
            const stat=await db`select reaction from problem_info where problem_id=${query.problem_id} and 
            uid=${user.user_id} for update`;
            let res=await db`insert into problem_info(problem_id,uid,status,reaction) values(${query.problem_id},
            ${user.user_id},'none','liked') on conflict(problem_id,uid) do update set reaction='liked' 
            where problem_info.reaction!='liked' returning 1`;
            if(!res.length){throw status(403,"you had already liked this post");}
            const add=(stat.length && stat[0]["reaction"]=="disliked")?2:1;
            res=await db`update problem set reaction=reaction+${add} where id=${query.problem_id} returning 1`;
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
            const stat=await db`select reaction from problem_info where problem_id=${query.problem_id} and 
            uid=${user.user_id} for update`;
            let res=await db`insert into problem_info(problem_id,uid,status,reaction) values(${query.problem_id},
            ${user.user_id},'none','disliked') on conflict(problem_id,uid) do update set reaction='disliked' 
            where problem_info.reaction!='disliked' returning 1`;
            if(!res.length){throw status(403,"you had already disliked this post");}
            const add=(stat.length && stat[0]["reaction"]=="liked")?2:1;
            res=await db`update problem set reaction=reaction-${add} where id=${query.problem_id} returning 1`;
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
}).delete("/remove",async({query,user})=>{
    if(!user){throw status(401,"please login to delete");}
    return await get_connection(async(db)=>{
        return await db.begin(async(db)=>{
            const r=await db`select author_id from problem where id=${query.problem_id}`;
            if(!r.length){throw status(404,"problem not found");}
            if(!user.has_capabilities("delete post")  && r[0]["author_id"]!=user.user_id){
                throw status(403);
            }
            await Promise.all([
                db`delete from problem where id=${query.problem_id}`,
                db`delete from comment where problem_id=${query.problem_id}`,
                db`delete from problem_info where problem_id=${query.problem_id}`
            ]);
        });
    });
},{query:z.object({
    problem_id:z.coerce.number().positive()})}
).post("/make",async({user,body})=>{
    if(!user){throw status(401,"please login to post");}
    let output=[];
    try{
        output=await run_test(body.function,body.parameter,body.test_case);
    }catch{
        throw status(422,"invaid test case/function");
    }
    return await get_connection(async(db)=>{
        const res=await db`insert into problem(title,author_id,author_name,description,difficulty,
        parameter,output) values(${body.title},${user.user_id},${user.username},${body.description},${body.difficulty},
    ${db.array(body.parameter)},${output}) on conflict do nothing returning 1`;
        if(!res.length){throw status(409);}
    });    
},
    {body:z.object({
        title:z.string().max(80),
        description:z.string().max(400),
        difficulty:z.union([z.string("easy"),z.string("medium"),z.string("hard")]),
        parameter:z.array(z.string().max(30)).max(20),
        function:z.string().max(1000),
        test_case:z.array(z.array(z.number()).max(20)).max(10)
    })});