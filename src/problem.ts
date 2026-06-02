import {z} from "zod";
import Elysia from "elysia";
import { get_connection } from "./tools";
export const problem_route=new Elysia({prefix:"/problem"});
problem_route.get('/home',async ()=>{
     return await get_connection(async (db)=>{
        return await db`select title,difficulty,reaction,id from problem`;
     });
     return [{title:"easy problem",difficulty:"easy",reaction:3,id:0},
     {title:"medium problem",difficulty:"medium",reaction:-13,id:1},
     {title:"hard problem",difficulty:"hard",reaction:26,id:2}];
}
).get("/detail",async ({query,set})=>{
    set.headers["cache-control"]='public, s-maxage=3600, stale-while-revalidate=60';
    return await get_connection(async(db)=>{
        return await db`select title,description,author_name as author,parameter,output 
        from problem where id=${query.problem_id}`;
    });
    const data=[
        {
            title:"easy problem",
            description:"some really long description here",
            author:"phuc",
            parameter:['x','y'],
            output:[{"x":9,"y":3,"output":12},{"x":4,"y":5,"output":9}]
        },
        {
            
            title:"medium problem",
            description:"some really long description here",
            author:"phuc",
            parameter:['x','y'],
            output:[{"x":9,"y":3,"output":27},{"x":4,"y":5,"output":20}]
        },
        {
            
            title:"hard problem",
            description:"some really long description here",
            author:"phuc",
            parameter:['x','y'],
            output:[{"x":9,"y":3,"output":2},{"x":125,"y":5,"output":3}]
        }
    ];
    return data[query.problem_id];
},{query:z.object({
    problem_id:z.coerce.number()
})});