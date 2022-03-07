var c=document.querySelector('canvas');
var ctx=c.getContext('2d')
var cW=500,cH=500
cW=window.innerWidth*0.9
cH=window.innerHeight*0.9

c.width=cW
c.height=cH
//150 180
var panW=0.28*cW,panH=0.23*cH

window.onresize=()=>{
    cW=window.innerWidth*0.9
    cH=window.innerHeight*0.9
    panW=0.28*cW
    panH=0.23*cH
    c.width=cW
    c.height=cH
}

//2
var g=2
var terminalVel=35

var debug={
    moveBox:false,
    showY:true,
    gridY:true,
    showExtraBounds:false
}
var game={
    scrollX:false
}
/**@type {Entity[]} */
var entities=[]
/**@type {Platform[]} */
var platforms=[]

function v(x,y){
    return new class Vector{
        constructor(){
            this.x=x
            this.y=y
        }
        /**@param {Vector|number} x */
        add(x=v(0,0),y=0){
            if(x.constructor.name==='Vector'){
                this.x+=x.x
                this.y+=x.y
            }else{
                this.x+=x
                this.y+=y
            }
            return this
        }
    }
}

function isEnt(a){
    if(typeof a==='object'){
        if(['Entity','Platform'].includes(a.constructor.name)||
            ['Entity','Platform'].includes(a.__proto__.constructor.name)||
            ['Entity','Platform'].includes(a.__proto__.__proto__.constructor.name)){
            return true
        }
    }
    return false
}

/**Collision between two rects */
function isCollide(a,b){
    if(a.hasCollision!==undefined)
        if(!a.hasCollision)
            return false;
    if(b.hasCollision!==undefined)
        if(!b.hasCollision)
            return false;
    var boxCol=!(((a.y+a.height)<(b.y))||
    (a.y>(b.y+b.height))||
    ((a.x+a.width)<b.x)||
    (a.x>(b.x+b.width)))

    return boxCol
}

function deepCol(a,b){
    if(isCollide(a,b)){
        return colExtra(a,b)
    }
    return false
}

function collide(r1,r2){
    var dx=(r1.x+r1.width/2)-(r2.x+r2.width/2);
    var dy=(r1.y+r1.height/2)-(r2.y+r2.height/2);
    var width=(r1.width+r2.width)/2;
    var height=(r1.height+r2.height)/2;
    var crossWidth=width*dy;
    var crossHeight=height*dx;
    var collision='none';
    //
    if(Math.abs(dx)<=width && Math.abs(dy)<=height){
      if(crossWidth>crossHeight){
        collision=(crossWidth>(-crossHeight))?'bottom':'left';
      }else{
        collision=(crossWidth>-(crossHeight))?'right':'top';
      }
    }
    return(collision);
  }
  

/**
 * @param {Entity} a
 * @param {Entity} b
 */
function colExtra(a,b){
    var bBoxes=getBB(b)
    var o={}
    for(bName in bBoxes){
        
        o[bName]=isCollide(a,bBoxes[bName])
        
    }
    //console.log(collide(a,b))
    return o
}

function getBB(b){
    /*
    var n=Math.max(b.width,b.height)
    var percent=0.02,
        dPercent=0.02
    while(n>=100){
        n-=100
        percent-=(dPercent/=2)
    }
    percent=0
    console.log(percent)
    */
    //var percent=0.1
    var n=Math.max(b.width,b.height)
    if(n>15)
        n=15
    return {
        top:{
            x:b.x,
            y:b.y,
            height:n,//b.height*percent,
            width:b.width
        },
        bottom:{
            x:b.x,
            y:b.y+b.height-n,//-b.height*percent,
            height:n,//b.height*percent,
            width:b.width
        },
        left:{
            x:b.x,
            y:b.y,
            width:n,//b.width*percent,
            height:b.height
        },
        right:{
            x:b.x+b.width-n,//-b.width*percent,
            y:b.y,
            width:n,//b.width*percent,
            height:b.height
        }
    }
}

var center=v(0,0)

document.addEventListener('keydown',e=>{
    eventHelper(e,true)
    if(e.key==='w'||e.key==='ArrowUp'){
        if(player.can.jump){
            if(--player.numJumps<=0){
                player.can.jump=false
            }
            //Jumps in the air are less effective
            /*
            if(player.isJumping)
                player.dy=Player.jumpVel*0.7
            else
                player.dy=Player.jumpVel
                */
            player.dy=Player.jumpVel*(player.numJumps+1)/player.maxJumps
            //console.log((player.numJumps+1)/player.maxJumps)
            player.isJumping=true
            
            
        }
    }
})
document.addEventListener('keyup',e=>{
    eventHelper(e,false)
})

function eventHelper(event,bool){
    if(event.key==='a'||event.key==='ArrowLeft'){
        player.can.goLeft=bool
    }else if(event.key==='d'||event.key==='ArrowRight'){
        player.can.goRight=bool
    }
}

class Entity{
    constructor(x=0,y=0,width=0,height=0,color='rgba(0,0,0,0)',hasGravity=false,addToArr=true){
        this.x=x-width/2
        this.y=y-height/2
        /**Local x */
        this.lx=this.x+width/2+center.x
        /**Local y */
        this.ly=this.y+height/2+center.y
        this.width=width
        this.height=height
        this.color=color
        /**Tells if the entity is invisible */
        this.hidden=false
        /**Tells if it can fall due to gravity */
        this.hasGravity=hasGravity
        /**Tells if it can collide with stuff */
        this.hasCollision=true
        this.inView()
        this.dy=0
        if(addToArr)
            entities.push(this)
    }
    isCollide(other){
        return isCollide(this,other)
    }
    inView(){
        var temp=this.hasCollision;
        this.hasCollision=true;
        var ret=isCollide(this,{width:cW,height:cH,x:-cW/2-center.x,y:-cH/2-center.y})
        if(!ret)
            this.isInView=ret
        this.hasCollision=temp;
        return ret
    }
    draw(){
        if(!this.hidden&&this.inView()){
            ctx.fillStyle=this.color
            ctx.fillRect(this.x+center.x+cW/2,this.y+center.y+cH/2,this.width,this.height)
            if(ctx.strokeStyle!=='#000000')
                ctx.strokeStyle='#000000'
            ctx.strokeRect(this.x+center.x+cW/2,this.y+center.y+cH/2,this.width,this.height)
        }
    }
    move(){
        
    }
    gravityMove(){
        if(this.hasGravity){
            if(this.dy!==terminalVel)
                this.dy+=g
            if(this.dy>terminalVel)
                this.dy=terminalVel
            this.y+=this.dy
        }

    }
    gravity(bool){
        this.hasGravity=bool
        return this
    }
    setPosition(x,y){
        this.x=x+this.width/2
        this.y=y+this.height/2
        return this
    }
}

class Player extends Entity{
    constructor(){
        super(0,-11,20,20,'silver',true)
        this.speed=7.5
        this.isJumping=false
        this.numJumps=3;
        this.maxJumps=3;
        this.can={
            goLeft:false,
            goRight:false,
            jump:true
        }
        this.maxY=this.y;
    }
    static jumpVel=-20
    scrollIntoView(){
        
        var l=lc(player.x+player.width/2,player.y+player.height/2)
        var dx=0,dy=0
        if(l.x>panW){
            dx=player.x+center.x+this.width/2-panW
            //console.log("Right",dx)
            
            center.x-=dx
        }if(l.x<-panW){
            dx=player.x+center.x+this.width/2+panW
            //console.log("Left",dx)
            center.x-=dx
        }if(l.y>panH){
            dy=player.y+center.y+this.height/2-panH
            //console.log("Down",dy)
            center.y-=dy
        }if(l.y<-panH){ 
            dy=player.y+center.y+this.height/2+panH
            //console.log("Up")
            center.y-=dy
        }
        return v(dx,dy)
    }
    scollToCenter(xy='y'){
        
        var nf=15,df=200/nf,
            fcount=1
        
        if(xy==='x'){
            var dx=center.x+this.x-this.width/2;
            (function f(){
                setTimeout(()=>{
                    center.x-=(dx/nf)
                    if(fcount++<nf)
                        f()
                },df)
            })()
        }else if(xy==='y'){
            var dy=center.y+this.y-this.height/2;
            (function f(){
                setTimeout(()=>{
                    center.y-=(dy/nf)
                    if(fcount++<nf)
                        f();
                },df)
            })()
        }
    }
    move(){
        this.lx=this.x+center.x+this.width/2
        this.ly=this.y+center.y+this.height/2

        var dx=0;
        if(this.can.jump){
            //dy-=this.speed
        }
        if(this.can.goLeft){
            dx-=this.speed;
        }if(this.can.goRight){
            dx+=this.speed;
        }
        this.x+=dx;
        //Move down based on gravity only if jumping
        if(player.isJumping){
            this.gravityMove();
        }
        var hasCollided=false;
        Platform.inView().forEach(plat=>{

            var dc=deepCol(player,plat);
            if(dc){
                if(dc.top){
                    this.y=plat.y+1-this.height;
                    this.dy=0;
                    
                    this.can.jump=true;
                    this.lx=this.x+center.x+this.width/2;
                    this.ly=this.y+center.y+this.height/2;
                    if(this.isJumping){
                        this.scollToCenter('y');
                        if(game.scrollX)
                            this.scollToCenter('x');
                    }
                    this.isJumping=false;
                    this.numJumps=this.maxJumps;
                    hasCollided=true;

                }else if(dc.bottom){
                    this.y=plat.y+plat.height;
                    this.dy=0;
                }else if(dc.left||dc.right){
                    this.x-=dx;
                }
            }
            
            

        })
        //Falling off side
        if(!hasCollided&&!this.isJumping){
            this.isJumping=true;
            //Maybe one less jump when walking off of a platform
            this.numJumps--;

            this.dy=0;
        }
        //Camera Movement
        this.scrollIntoView();
        /*
        if((dx>0&&this.lx>panW)||(dx<0&&this.lx<-panW))
            center.x-=dx;
        if((this.dy>0&&this.ly>panH)||(this.dy<0&&this.ly<-panH))
            center.y-=this.dy;
        */
       if(this.y<this.maxY){
           this.maxY=this.y;
       }
    }
}

class Line{
    constructor(x1,y1,x2,y2){
        this.p1=v(x1,y1);
        this.p2=v(x2,y2);
    }
    static fromRect(r){
        return [
            new Line(r.x,r.y,r.x+r.width,r.y),
            new Line(r.x,r.y,r.x,r.y+r.height),
            new Line(r.x,r.y+r.height,r.x+r.width,r.y+r.height),
            new Line(r.x+r.width,r.y,r.x+r.width,r.y+r.height)
        ]
    }
    static pointOnSegment(p,q,r){
        if(q.x<=Math.max(p.x,r.x) && q.x>=Math.max(p.x,r.x)&&
            q.y<=Math.max(p.y,r.y) && q.y>=Math.max(p.y,r.y)){
                return true
        }
        return false
    }
    static orientation(p,q,r){
        var val = (q.y-p.y) * (r.x - q.x) - 
                (q.x - p.x) * (r.y-q.y)
        if(val===0) return 0
        return (val>0)?1:2
    }
    static doIntersect(p1,q1,p2,q2){
        var o1=Line.orientation(p1,q1,p2),
            o2=Line.orientation(p1,q1,q2),
            o3=Line.orientation(p2,q2,p1),
            o4=Line.orientation(p2,q2,q1)
        if(o1!==o2&&o3!==o4)
            return true
        
        if(o1===0&&Line.pointOnSegment(p1,p2,q1)) return true;
        if(o2===0&&Line.pointOnSegment(p1,q2,q1)) return true;
        if(o3===0&&Line.pointOnSegment(p2,p1,q2)) return true;
        if(o4===0&&Line.pointOnSegment(p2,q1,q2)) return true;

        return false;

    }
}

class Platform extends Entity{
    constructor(x,y,width,height,color){
        super(x,y+height/2,width,height,color,false,false);
        platforms.push(this);
        this.hasCollision=true; 
    }
    static inView(){
        return platforms.filter(plat=>plat.inView())
    }
    //move(){this.gravity(true);this.gravityMove()}
}
class HollowPlatForm extends Platform{
    constructor(x,y,width,height,color){
        super(x,y,width,height,color);
    }
    move(){
        if(player.y>this.y){
            this.hasCollision=false;
        }
        else{
            this.hasCollision=true;
        }
    }
}

var player=new Player(0,0,20,20,'blue');
//var e2=new Entity(0,0,10,10,'green')

function gc(x,y){
    return v(center.x-x,center.y-y);
}
/**Point based on where screen is positioned */
function lc(x,y){
    return v(x+center.x,y+center.y);
}
function onScreen(v){
    var l=lc(v.x,v.y);

}

var drawAfter=[()=>{},
    /*()=>{
        var lines=Line.fromRect(player);
        lines.forEach(l=>{
            ctx.strokeStyle='peru';
            ctx.beginPath();
            ctx.moveTo(l.p1.x+center.x+cW/2,l.p1.y+center.y+cH/2);
            ctx.lineTo(l.p2.x+center.x+cW/2,l.p2.y+center.y+cH/2);
            ctx.stroke();
            ctx.closePath();
            ctx.strokeStyle='black';
        })
        console.log(lines);
    }*/
]

function onTick(){
    //Orange
    ctx.fillStyle='skyblue';
    var dy=(cH/2)+center.y;
    ctx.fillRect(0,0,cW,dy);
    ctx.fillStyle='grey';
    ctx.fillRect(0,dy,cW,cH-dy);

    if(debug.gridY){

    }

    
    platforms.forEach(plat=>{
        if(debug.showExtraBounds){
            var bb=getBB(plat);
            var col=['red','green','blue','yellow'],
                index=0;
            for(boxName in bb){
                var box=bb[boxName];
                var l=lc(box.x,box.y);
                ctx.fillStyle=col[index++];
                ctx.fillRect(l.x+cW/2,l.y+cH/2,box.width,box.height);
            }
        }
        plat.move()
        plat.draw();
    })

    for(let i=0;i<entities.length;i++){
        if(entities[i].toRemove){
            entities.splice(i--,1)
        }else{
            entities[i].move();
            entities[i].draw();
        }
    }

    
    //ctx.fillStyle='peru';
    //ctx.fillRect(center.x-4+cW/2,center.y-4+cH/2,8,8);
    if(debug.moveBox)
        ctx.strokeRect(cW/2-panW,cH/2-panH,2*panW,2*panH);
    if(debug.showY){
        ctx.fillStyle='red';
        ctx.fillText(player.y,10,10);
        ctx.fillText(player.x,10,20);
    }
    drawAfter.forEach(d=>d());
    
    
    //console.log(o);
    
}

class Pickup extends Entity{
    constructor(x,y,width,height,color,onGrab=()=>{}){
        super(x,y,width,height,color,true,true);
        this.onGrab=onGrab
    }    
    move(){
        if(this.isCollide(player)){
            this.onGrab()
            this.toRemove=true;
        }else{
            var gm=true
            platforms.forEach(p=>{
                if(this.isCollide(p)){
                    gm=false
                    this.y=p.y-this.height
                }
            })
            if(gm)  
                this.gravityMove()
        }
    }
}

//new Platform(0,0,500,10,'green');

new Platform(0,0,150,150,'silver');
new Platform(0,175,50000,terminalVel+20,'rgba(0,0,0,0.2)');

/*
new Platform(125,-200,50,20,"black");
new Platform(-125,-200,50,20,"black");
new Platform(0,-125,100,20,"black");
new Platform(-25,-115,25,40,"black");
new Platform(150,0,50,25,"green");
new Platform(150,0,25,25000,'green');
*/

new Platform(90,45,30,20,'blue')
new Platform(90,90,30,20,'blue')

function intRange(start,end){    
    return Math.floor(Math.random()*(Math.abs(end-start)))+Math.min(start,end)
}
var last=0,
    max=5000
for(let i=0;i<max;i+=85){
    new Platform(-95+(last+=intRange(-48,5)),-i,30,25,'blue')
}
console.log(last,max)
new Platform(last-360,-max,500,40,'peru')

var last=0,
    max=5000
//for(let i=0;i<max;i+=70)new Platform(-95,-i,25,15,'blue')


last=0
for(let i=150;i<100000;i+=intRange(120,180))
    new Platform(i,last+=intRange(-45,5),intRange(45,70),30,'red')

var hp=new HollowPlatForm(0,-200,100,100,'peru')


setInterval(()=>{
    onTick();
},1000/40)

new Pickup(50,-50,10,10,'blue',()=>{player.maxJumps++})