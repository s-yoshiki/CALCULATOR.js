

var CALCULATOR = function(){

	CALCULATOR.prototype.convert = function(x){
		x = x.split("pi").join("3.141592653589793");
		x = x.split("π").join("3.141592653589793");
    	x = x.split("e").join("2.718281828459045");
    	return x;
	}

	CALCULATOR.prototype.calculate = function(s){
		s = this.convert(s);
		return calc(parse(s));
	};

	var P_BPM=0;
	var P_BMD=1;
	var P_UPM=2;
	var P_POW=3;
	var P_FUN=4;
	var P_LHB=5;
	var P_CST=6;

	if (!Array.map) {
		if (!Array.prototype.map) {
			Array.prototype.map = function (callback, thisObject) {
				var length = this.length;
				var result = new Array(length);
				for (var i = 0; i < length; i++){
					result[i] = callback.call(thisObject, this[i], i, this);
				}
				return result;
			};
		}
		Array.map = function (array, callback, thisObject) {
			return Array.prototype.map.call(array, callback, thisObject);
	  	};
	}

	function Operator(name, fun, priority){
		this.name=name;
		this.fun=fun;
		this.priority=priority;
	}

	Operator.prototype.toString=function(){
    	return this.name;
	};
	Operator.prototype.call=function(){
    	if (this.priority==P_CST){
        	return this.fun;
     	}else if(this.is_unary()){
        	return this.fun(arguments[0]);
     	}else{
        	return this.fun(arguments[0], arguments[1]);
        }
	};
	Operator.prototype.is_higher=function(other){
    	return other===null || this.priority > other.priority || (this.is_reverse() && this.priority===other.priority);
    };
	Operator.prototype.is_const=function(){
    	return this.priority == P_CST;
	};
	Operator.prototype.is_func=function(){
    	return this.priority == P_FUN;
	};
	Operator.prototype.is_unary=function(){
    	return this.priority == P_UPM || this.priority == P_FUN;
	};
	Operator.prototype.is_lhb=function(){
    	return this.priority == P_LHB;
	};
	Operator.prototype.is_reverse=function(){
		return this.priority == P_FUN ||this.priority == P_POW ||this.priority == P_UPM;
	};

	LS_OP = {};
	LS_OP['+'] = new Operator('+', function (x,y){
		return x+y;
	}, P_BPM);
	LS_OP['-'] = new Operator('-', function (x,y){
		return x-y;
	}, P_BPM);
	LS_OP['*'] = new Operator('*', function (x,y){
		return x*y;
	}, P_BMD);
	LS_OP['/'] = new Operator('/', function (x,y){
		return x/y;
	}, P_BMD);
	LS_OP['%'] = new Operator('%', function (x,y){
		return x%y;
	}, P_BMD);
	LS_OP['**'] = new Operator('**', Math.pow, P_POW);
	LS_OP['^'] = LS_OP['**'];
	LS_OP.exp= new Operator('exp', Math.exp, P_FUN);
	LS_OP['!']= new Operator('!', fact, P_LHB);
	LS_OP.P= new Operator('P', permutation, P_BMD);
	LS_OP.C= new Operator('C', combination, P_BMD);
	LS_OP.e= new Operator('e', Math.E, P_CST);
	LS_OP.log= new Operator('log', log10, P_FUN);
	LS_OP.In= new Operator('log', Math.log, P_FUN);
	LS_OP.sin= new Operator('sin', sin, P_FUN);
	LS_OP.cos= new Operator('cos', cos, P_FUN);
	LS_OP.tan= new Operator('tan', tan, P_FUN);
	LS_OP.asin= new Operator('asin', asin, P_FUN);
	LS_OP.acos= new Operator('acos', acos, P_FUN);
	LS_OP.atan= new Operator('atan', atan, P_FUN);
	LS_OP.pi = new Operator("pi",Math.PI,P_CST);
	LS_OP['π']=LS_OP['pi'];
	LS_OP['t√']=new Operator('t√',sqrtT,P_FUN);
	LS_OP['√']=new Operator('√',Math.sqrt,P_FUN);

	function add_backslash(s){
		var s1='';
		var ls=s.split('');
		for (var i=0, n=ls.length; i<n; ++i){
			var c=ls[i];
			s1+= (c.match(/\W/)? '\\' : '') + c;
		}
		return s1;
	}

	function make_regstr_each(s0){
		var op=LS_OP[s0];
		return add_backslash(s0) +(op.is_const()?'(?=\\W|$)':op.is_func()?'(?=\\s|\\()':'');
	}

	var ROBJ= function(){
	var ls= [];
	for (var s in LS_OP){
		ls.push(s);
	}
	ls.sort(function(x,y){
		return y.length - x.length;
	});
	return new RegExp('(\\()|(\\d+(?:\\.\\d+)?)|('+ls.map(make_regstr_each).join('|')+')');
	}();

	function find_corresponding(s0){
		var count=0;
		for (var i=0, n=s0.length; i<n; ++i){
			var c=s0.charAt(i);
			if(c=='(')
				++count;
			else if(c==')')
				--count;
			if(count===0) 
				return i;
		}
		//return -1;
		throw Error('cannot parse input');
	}
	function parse(s0){
		var ls=[];
		while(1){
		s0=s0.replace(/^\s+|\s+$/, '');
			if (! s0)
				break;
			var mobj=s0.match(ROBJ);
			if(! mobj)
				throw Error('cannot parse input');
			if(mobj[1]){
				var idx=find_corresponding(s0);
				ls.push(parse(s0.slice(1, idx)));
				s0=s0.substring(idx+1);
			}else{
				if(mobj[2])
					ls.push(parseFloat(mobj[2]));
				else{
					var sop=mobj[3];
					if ((sop=='+' || sop=='-') && (ls.length===0 || (ls[ls.length-1].constructor==Operator && ! ls[ls.length-1].is_lhb())))
						sop='@'+sop;
					ls.push(LS_OP[sop]);
				}
				s0 = s0.substring(mobj[0].length);
			}
		}
		return ls;
	}

	function find_op(ls){
		var op=null;
		var idx=-1;
		for(var i=0, n=ls.length; i<n; ++i){
			var item=ls[i];
			if(item.constructor == Operator && item.is_higher(op)){
				idx=i;
				op=item;
			}
		}
		return idx;
	}

	function append_result(ls_before, result, ls_after){
		ls_before.push(result);
		return ls_before.concat(ls_after);
	}

	function calc(ls){
		switch(ls.constructor){
			case Number: return ls;
			case Operator: return ls.call();
			case Array:
				if(ls.length==1)
					return calc(ls[0]);
				else if(ls.length>1){
					var op_idx=find_op(ls);
					var op=ls[op_idx];
				if(op.is_const())
					return calc(append_result(ls.slice(0,op_idx), op.call(), ls.slice(op_idx+1)));
				else if(op.is_lhb() && op_idx > 0)
					return calc(append_result(ls.slice(0,op_idx-1),op.call(calc(ls[op_idx-1])),ls.slice(op_idx+1)));
				else if(op.is_unary() && op_idx < ls.length-1)
					return calc(append_result(ls.slice(0,op_idx),op.call(calc(ls[op_idx+1])),ls.slice(op_idx+2)));
				else if(op_idx>0 && op_idx<ls.length-1)
					return calc(append_result(ls.slice(0,op_idx-1),op.call(calc(ls[op_idx-1]), calc(ls[op_idx+1])),ls.slice(op_idx+2)));
				else
					throw Error('cannot calculate!');
				}break;
		default:
			throw Error('cannot calculate!');
		}
	}

	function exp(n){
	return Math.exp(n);
	}
	function abs(n){
	return Math.abs(n);
	}
	function xxp(n){
	return Math.exp(n);
	}
	function log(n){
	return Math.log(n);
	}
	function In(n){
	return Math.log(n);
	}
	function floor(n){
	return  Math.floor(n);
	}
	function ceil(n){
	return Math.ceil(n);
	}
	function round(n){
	return Math.round(n);
	}
	function abs(n){
	return Math.abs(n);
	}
	function max(n,m){
	return Math.max(n,m);
	}
	function min(n,m){
	return Math.min(n,m);
	}
	function rand(num){
	return Math.floor(Math.random() * num);
	}
	function sqrt(n){
	n = Math.sqrt(n);
	return n;
	}
	function pow(n,m){
	var a=Math.pow(n,m);
	return a;
	}
	function deg(n){
	return n*(180/Math.PI);
	}
	function rad(n){
	return n*(Math.PI/180);
	}
	function sin(n){
	return Math.sin(n*Math.PI/180);
	}
	function cos(n){
	return Math.cos(n*Math.PI/180);
	}
	function tan(n){
	return Math.tan(n*Math.PI/180);
	}
	function asin(n){
	return Math.asin(n)*(180/Math.PI);
	}
	function acos(n){
	return Math.acos(n)*(180/Math.PI);
	}
	function atan(n){
	return Math.atan(n)*(180/Math.PI);
	}
	function sqrtT(n){
	return Math.pow(n,1/3);
	}
	function log10(n){
	return Math.log(n)/Math.log(10);
	}
	function fact(x) {
	if (x <= 1){
	return 1;
	}else{
	return (x * fact(x-1));
	}
	}
	function permutation(n, m){
	if(n>=m){
	return fact(n)/fact(n-m);
	}else{
	return 0;
	}
	}
	function combination(n,m){
	if(n>=m){
	return permutation(n,m)/fact(m);
	}else{
	return 0;
	}
	}
};