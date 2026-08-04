import {Elysia,status} from "elysia";
import { createRemoteJWKSet,jwtVerify,JWTPayload } from "jose";
const permission:Map<string,string[]>=new Map([
    ["admin",["delete post","delete knowledge"]]
]);
Object.freeze(permission);
class session{
    user_id:string;
    priv:string;
    constructor(user_id:string,priv:string){
        this.user_id=user_id;
        this.priv=priv;
    }
    has_capabilities(action:string) {
        return permission.get(this.priv)?.indexOf(action)!=-1;    
    }
}
function make_session(payload:JWTPayload){
    const user_id=payload.sub;
    const priv=payload.role;
    if(user_id==undefined || typeof priv!=="string"){
        throw status(403,"invalid jwt claim set");
    }
    let user_priv='user';
    if(priv.length){
        user_priv=priv[0];
    }
    return new session(user_id,user_priv);
}
let jwt_keys:null|ReturnType<typeof createRemoteJWKSet>=null;
const auth_middleware=new Elysia({name:"auth middleware"}).derive({as:"global"},async ({request,headers})=>{
    if (request.method === "OPTIONS") {
        return { user: null };
    }
    const auth_header=headers["authorization"];
    let user=null;
    if(headers.jwt_bypass && Object.hasOwn(Bun.env,"JWT_TEST")){
        if(!headers.username || !headers.uid || !headers.priv){
            throw status(500);
        }
        user=new session(headers.uid,headers.priv);
        return {user};
    }
    if(!auth_header){
        return {user};
    }
    const auth_token=auth_header.split("Bearer ")[1]?.trim();
    if(!auth_token){    
        throw status(403,"mssing auth token value");
    }
    if(!jwt_keys){
        jwt_keys=createRemoteJWKSet(new URL(`https://wjifwflztejubvgibbtj.supabase.co/auth/v1/.well-known/jwks.json`));
    }
    try{
        const {payload} =await jwtVerify(auth_token,jwt_keys);
        user=make_session(payload);
        return {user};
    }catch(e){
        console.log(`error validating token ${e}`);
        throw status(403,"invalid auth token");
    }
});
export default auth_middleware;