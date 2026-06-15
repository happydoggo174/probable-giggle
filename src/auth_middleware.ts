import {Elysia,status} from "elysia";
import { createRemoteJWKSet,jwtVerify,JWTPayload } from "jose";
class session{
    username:string;
    user_id:string;
    priv:string;
    constructor(username:string,user_id:string,priv:string){
        this.username=username;
        this.user_id=user_id;
        this.priv=priv;
    }
    has_capabilities(action:string) {
        return this.priv==="admin";    
    }
}
function make_session(payload:JWTPayload){
    const username = payload[`https://api.gomath.com/username`] || '';
    const user_id=payload.sub;
    if(typeof username!="string" || user_id==undefined){
        throw status(403,"invalid jwt claim set");
    }
    const user_priv='user';
    return new session(username,user_id,user_priv);
}
let jwt_keys:null|ReturnType<typeof createRemoteJWKSet>=null;
const AUTH0_DOMAIN=Bun.env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE=Bun.env.AUTH0_AUDIENCE;
const auth_middleware=new Elysia({name:"auth middleware"}).derive({as:"global"},async ({request,headers})=>{
    if (request.method === "OPTIONS") {
        return { user: null };
    }
    const auth_header=headers["authorization"];
    let user=null;
    if(headers.jwt_bypass && Bun.env.JWT_TEST){
        if(!headers.username || !headers.uid || !headers.priv){
            throw status(500);
        }
        user=new session(headers.username,headers.uid,headers.priv);
        return {user};
    }
    if(!auth_header){
        return {user};
    }
    const auth_token=auth_header.split("Bearer ")[1]?.trim();
    if(!auth_token){
        throw status(403,"invalid auth token");
    }
    if(!jwt_keys){
        jwt_keys=createRemoteJWKSet(new URL(`https://${AUTH0_DOMAIN}/.well-known/jwks.json`));
    }
    try{
        const {payload} =await jwtVerify(auth_token,jwt_keys,{issuer:`https://${AUTH0_DOMAIN}/`,audience:AUTH0_AUDIENCE});
        user=make_session(payload);
        return {user};
    }catch(e){
        console.log(`error validating token ${e}`);
        throw status(403,"invalid auth token");
    }
});
export default auth_middleware;