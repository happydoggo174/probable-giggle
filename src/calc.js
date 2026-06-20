const ops={
    '+':0,
    "-":0,
    "*":1,
    "/":1,
    "%":1,
    "^":2,
    "√":2,
    "!":3
};
const func=new Set(["sin","cos","tan","asin","acos","atan","min","max","log","ln","abs","gamma"]);
function deg_to_rad(angle){
    return angle*(Math.PI/180);
}
function rad_to_degree(angle){
    return angle*(180/Math.PI);
}
function assert_fail(cond,fail_msg){
    if(cond){
        throw new Error(fail_msg);
    }
}
/**
 * 
 * @param {string} expr
 */
export function* parse(expr){
    let num=0;
    let val="";
    let frac=0;
    let is_frac=false;
    let has_num=false;
    let is_abs=false;
    let digit=0;
    let br=0;
    const ops=new Set(["+","-","*","/","%","^","√","|","!","(",")",","]);
    function merge_number(){
        has_num=false;
        if(digit>0){
            num+=frac/Math.pow(10,digit);
            digit=0;
            frac=0;
        }
        const n=num;
        num=0;
        return n;
    }
    for(let i=0;i<expr.length;i++){
        if(expr[i]==" " || expr[i]=="\n"){
            continue;
        }
        if(expr[i]=="("){
            br++;
        }
        if(expr[i]==")"){
            assert_fail((--br)<0,"a closing parenthesis is missing");
        }
        if(expr[i]=="."){
            is_frac=true;
            continue;
        }
        if(expr.charCodeAt(i)>=48 && expr.charCodeAt(i)<=57){
            has_num=true;
            if(val!=''){
                yield* [val,'*'];
                val="";
            }
            const extra=expr.charCodeAt(i)-48;
            if(is_frac){
                digit++;
                frac=frac*10+extra;
            }else{
                num=num*10+extra;//handle number
            }
        }else{
            is_frac=false;
            if(ops.has(expr[i])){
                if(expr[i]=="|"){
                    if(has_num){
                        yield merge_number();
                    }
                    if(val!=""){
                        yield val;
                        val="";                    
                    }
                    yield is_abs?")":"abs(";
                    is_abs=!is_abs;
                    continue;
                }
                if(expr[i]=="(" && func.has(val)){
                    //function case
                    if(has_num){
                        yield* [merge_number(),"*"];
                    }
                    yield val+"(";
                    val="";
                    continue;
                }
                if(val!=""){
                    yield val;
                    val="";
                }
                if(has_num){
                    yield merge_number();
                    if(expr[i]=="("){
                        yield "*";
                    }
                }
                yield expr[i];
            }else{
                if(has_num){
                    yield* [merge_number(),"*"];
                }
                val+=expr[i];
            }
        }
    }
    if(has_num){
        yield merge_number();
    }
    if(val!=""){
        yield val;
    }
}
class operation{
    /**
     * 
     * @param {string} exp 
     * @param {Number} pri 
     */
    constructor(exp,pri){
        /**@type {string}*/
        this.exp=exp;
        /***@type {Number}*/
        this.pri=pri;
    }
};
function gamma(x) {
    // Coefficients for the Lanczos approximation (g = 5, n = 7)
    const p = [
        0.99999999999980993,
        676.5203681218851,
       -1259.1392167224028,
        771.32342877765313,
       -176.61502916214059,
        12.507343278686905,
       -0.13857109526572012,
        9.9843695780195716e-6,
        1.5056327351493116e-7
    ];

    const g = 7;

    // Handle negative integers and zero (factorial is undefined or asymptotes)
    if (x < 0.5) {
        // Reflection formula for negative numbers
        return Math.PI / (Math.sin(Math.PI * x) * gamma(1 - x));
    }

    x -= 1;
    let a = p[0];
    const t = x + g + 0.5;

    for (let i = 1; i < p.length; i++) {
        a += p[i] / (x + i);
    }

    return Math.sqrt(2 * Math.PI) * Math.pow(t, x + 0.5) * Math.exp(-t) * a;
}
function factorial(n){
    assert_fail(n<0 && Number.isInteger(n),"can't factorial a negative integer");
    if(!n){return 1;}
    const res=gamma(n+1);
    return Number.isInteger(n)?Math.round(res):res;
}
/**
 * @param {list<operation>} expr 
 * @param {list<Number>} val
 * @param {Number} top
 */
function drain(expr,val,top){
    while(expr.length>0 && expr[expr.length-1].pri>=top){
        const curr=expr.pop();
        let res=0;
        switch(curr.exp){
            case "+":
                assert_fail(val.length<2,"insufficent add parameter");
                res=val[val.length-2]+val.pop();
                val[val.length-1]=res;
            break;
            case '-':
                assert_fail(!val.length,"insufficent subtraction parameter");
                if(val.length==1){
                    val[0]=-val[0];
                }else{
                    res=val[val.length-2]-val.pop();
                    val[val.length-1]=res;
                }
            break;
            case '*':
                assert_fail(val.length<2,"insufficent multiplication parameter");
                res=val[val.length-2]*val.pop();
                val[val.length-1]=res;
            break;
            case '/':
                assert_fail(val.length<2,"insufficent division parameter");
                const right=val.pop();
                if(right==0){
                    throw new Error("can't divide by zero");
                }
                val[val.length-1]=val[val.length-1]/right;
            break;
            case '%':
                assert_fail(val.length<2,"insufficent modulo parameter");
                res=val[val.length-2]%val.pop();
                val[val.length-1]=res;
            break;
            case '^':
                assert_fail(val.length<2,"insufficent pow parameter");
                res=Math.pow(val[val.length-2],val.pop());
                val[val.length-1]=res;
            break;
            case "√":
                assert_fail(!val.length,"insufficent square root parameter");   
                assert_fail(val[val.length-1]<0,"imaginary number is not supported yet");
                val[val.length-1]=Math.sqrt(val[val.length-1]);
            break;
            case '!':
                assert_fail(!val.length,"insufficent factorial parameter");
                val[val.length-1]=factorial(val[val.length-1]);
            break;
        }
    }
    return val[val.length-1];
}
function calculate_function(token,itr,param){
    const args=[];
    const opt={stop_from:","};
    let i=0;
    while(opt.stop_at!=")"){
        args.push(calculate_internal(itr,param,opt));
        assert_fail(opt.eof,`missing closing parenthesis for function ${token}`);
        assert_fail((++i)>=128,`too much argument for function ${token}`);
    }
    let out=NaN;
    switch(token){
        case "sin":
            assert_fail(args.length!=1,"wrong number of argument for sin");
            out=Math.sin(deg_to_rad(args[0]));
        break;
        case "cos":
            assert_fail(args.length!=1,"wrong number of argument for cos");
            out=Math.cos(deg_to_rad(args[0]));
        break;
        case "tan":
            assert_fail(args.length!=1,"wrong number of argument for tan");
            assert_fail((args[0]-90)%180==0,`tan of ${args[0]} is undefined`);
            out=Math.tan(deg_to_rad(args[0]));
        break;
        case "min":
            assert_fail(!args.length,"min can't be called on an empty list of numbers");
            out=Math.min(...args);
        break;
        case "max":
            assert_fail(!args.length,"max can't be called on an empty list of numbers");
            out=Math.max(...args);
        break;
        case "log":
        case "ln":
            assert_fail(!args.length,"log require a number");
            assert_fail(args[0]<=0,"log parameter have to be bigger than zero");
            if(token=="ln"){
                out=Math.log(args[0]);
            }else{
                if(args.length==2){
                    assert_fail(args[1]<=0,"exponent must be larger than zero");
                    assert_fail(args[1]==1 && args[0]!=1,"log with base 1 is undefined for number other than 1");
                    out=Math.log(args[1])/Math.log(args[0]);
                }else{
                    out=Math.log10(args[0]);
                }
            }
        break;
        case "abs":
            assert_fail(!args.length,"abs can't be called without argument");
            out=Math.abs(args[0]);
        break;
        case "gamma":
            assert_fail(!args.length,"gamma require at least one number");
            assert_fail(args[0]<=0 && Number.isInteger(args[0]),"input for gamma can't be zero or negative integer");
            out=gamma(args[0]);
        break;
        case "asin":
            assert_fail(!args.length,"asin require a value");
            assert_fail(args[0]<-1 || args[0]>1,"asin input must go from -1 to 1");
            out=rad_to_degree(Math.asin(args[0]));
        break;
        case "acos":
            assert_fail(!args.length,"acos require a value");
            assert_fail(args[0]<-1 || args[0]>1,"acos input must go from -1 to 1");
            out=rad_to_degree(Math.acos(args[0]));
        break;
        case "atan":
            assert_fail(!args.length,"atan require a value");
            out=rad_to_degree(Math.atan(args[0]));
        break;
        default:
            throw new Error(`unknown function ${token}`);
    }
    if(Number.isNaN(out)){
        throw new Error(`undefined result for function ${token}`);
    }
    return out;
}
function calculate_internal(itr,param,options){
    const exp=[];
    const val=[];
    options.eof=true;
    for(let token=itr.next();!token.done;token=itr.next()){
        options.eof=false;
        token=token.value;
        if(typeof(token)==="number"){
            val.push(token);
            continue;
        }
        if(token=="("){
            val.push(calculate_internal(itr,param,{}));
            continue;
        }
        if(token.endsWith("(")){
            val.push(calculate_function(token.slice(0,-1),itr,param));
            continue;
        }
        if(token==')' || token==options.stop_from){
            options.stop_at=token;
            break;
        }
        if(ops[token]!=undefined){
            const pri=ops[token];
            if(exp.length>0 && exp[exp.length-1].pri>=pri){   
                drain(exp,val,pri);
            }
            exp.push(new operation(token,pri));
        }else{
            if(!Object.hasOwn(param,token)){
                throw new Error(`unknown parameter ${token}`);
            }
            val.push(param[token]);
        }
    }
    if(exp.length){
        drain(exp,val,-1);
    }
    if(!val.length){
        return 0;
    }
    return val[0];
}
/**
 * 
 * @param {string} expr 
 * @param {Object} param 
 */
export function calculate(expr,param){
    const out=calculate_internal(parse(expr),param,{});
    const budget=14-(Math.ceil(Math.log10(Math.abs(out)))+1);
    if(budget<=0){return Math.round(out);}
    const rounder=Math.pow(10,budget);
    const output=Math.round((out+Number.EPSILON)*rounder)/rounder;
    return output;
}