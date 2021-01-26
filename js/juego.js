var canvas;
var ctx;
var FPS = 50;

var widthF = 50;
var heightF = 50;

var enemy = [];

var torchImage = [];

var tileMap;

var map = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,2,2,0,0,0,2,2,2,2,0,0,2,2,0],
    [0,0,2,2,2,2,2,0,0,2,0,0,2,0,0],
    [0,0,2,0,0,0,2,2,0,2,2,2,2,0,0],
    [0,0,2,2,2,0,0,2,0,0,0,2,0,0,0],
    [0,2,2,0,0,0,2,2,2,2,2,2,0,0,0],
    [0,0,2,0,0,0,2,0,2,0,0,2,2,2,0],
    [0,2,2,2,0,0,2,0,0,0,1,0,0,2,0],
    [0,0,2,2,3,0,2,2,2,2,2,2,2,2,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

function drawMap(){

    for(y=0;y<10;y++){
        for(x=0;x<15;x++){

            var tile = map[y][x];
            // ctx.fillStyle = color;
            // ctx.fillRect(x * widthF , y * widthF , heightF , widthF );
            ctx.drawImage(tileMap, tile*32,0,32,32,widthF*x,heightF*y,widthF,heightF);
        }
    }
}

var torch = function(x,y){
    this.x = x;
    this.y = y;

    this.slowDown = 10;
    this.counter = 0;
    this.frame = 0; //0-3

    this.changeFrame = function(){
        if(this.frame < 3) {
            this.frame++;
        } else {
            this.frame = 0;
        }
    }

    this.draw = function(){

        if(this.counter < this.slowDown){
            this.counter++;
        }
        else{
            this.counter = 0;
            this.changeFrame();
        }
        ctx.drawImage(tileMap,this.frame*32,64,32,32,widthF*x,heightF*y,widthF,heightF);
    }

}

// CLASE ENEMIGO //
var badBoy = function(x,y){
    this.x = x;
    this.y = y;

    this.direction = Math.floor(Math.random()*4);

    this.slowDown = 50;
    this.frame = 0;

    this.draw = function(){
        ctx.drawImage(tileMap,0,32,32,32,this.x*widthF,this.y*heightF,widthF,heightF);
    }

    this.moveLogic = function(x,y){
        var crash = false;

        if(map[y][x]==0){
            crash = true;
        }

        return crash;
    }

    this.move = function(){

        protagonist.enemyAttack(this.x,this.y);

        if(this.counter < this.slowDown){
            this.counter ++;
        }

        else {

            this.counter = 0;

            // ARRIBA //
            if(this.direction == 0){
                if(this.moveLogic(this.x, this.y - 1)== false){
                    this.y--;
                }
                else {
                    this.direction = Math.floor(Math.random()*4);
                }
            }

            // ABAJO //
            if(this.direction == 1){
                if(this.moveLogic(this.x, this.y + 1)== false){
                    this.y++;
                }
                else {
                    this.direction = Math.floor(Math.random()*4);
                }
            }

            // IZQUIERDA //
            if(this.direction == 2){
                if(this.moveLogic(this.x - 1, this.y)== false){
                    this.x--;
                }
                else {
                    this.direction = Math.floor(Math.random()*4);
                }
            }

            // IZQUIERDA //
            if(this.direction == 3){
                if(this.moveLogic(this.x + 1, this.y)== false){
                    this.x++;
                }
                else {
                    this.direction = Math.floor(Math.random()*4);
                }
            }
        }
    }

}

// OBJETO DEL JUGADOR //
var player = function(){
    this.x = 1;
    this.y = 1;
    this.color = '#820c01';
    this.key = false;

    this.draw = function(){
        ctx.drawImage(tileMap,32,32,32,32,this.x*widthF,this.y*heightF,widthF,heightF);
    }

    this.enemyAttack = function(x,y){
        if(this.x == x && this.y == y){
            alert('You are dead');
            this.dead();
        }
    }

    this.margins = function(x,y){
        var stop = false;

        if(map[y][x] == 0){
            stop = true;
        }

        return(stop);
    }

    this.up = function(){
        if(this.margins(this.x, this.y-1)==false){
        this.y--;
        this.logicObjects();
        }
    }

    this.down = function(){
        if(this.margins(this.x, this.y+1)==false){
        this.y++;
        this.logicObjects();
        }
    }

    this.left = function(){
        if(this.margins(this.x-1, this.y)==false){
        this.x--;
        this.logicObjects();
        }
    }

    this.right = function(){
        if(this.margins(this.x+1, this.y)==false){
        this.x++;
        this.logicObjects();
        }
    }

    this.win = function(){

        sonido3.play();
        alert("You've won");
        this.x = 1;
        this.y = 1;
        this.key = false; // El jugador ya no tiene la llave
        map[8][3] = 3; // Volvemos a poner la llave en su lugar
    }

    this.dead = function(){

        sonido1.play();
        console.log("You lost");
        this.x = 1;
        this.y = 1;
        this.key = false;
        map[8][3] = 3;
    }

    this.logicObjects = function(){
        var object = map[this.y][this.x];
        // OBTENER LA LLAVE //
        if(object == 3){

            sonido2.play();

            this.key = true;
            map[this.y][this.x] = 2;
            alert('You got the key!!!');
        }

        // ABRIMOS LA PUERTA //
        if(object == 1){
            if(this.key == true)
            this.win();
        else{
                alert("You don't have the key")
            }
        }
    }
}

var protagonist;

var sound1, sound2, sound3;

var music;

sonido1 = new Howl({
    src: ['sound/fuego.wav'],
    loop: false
});

sonido2 = new Howl({
    src: ['sound/llave.wav'],
    loop: false
});

sonido3 = new Howl({
    src: ['sound/puerta.wav'],
    loop: false
});

music = new Howl({
    src: ['music/music.mp3'],
    loop: true
});


function start(){

    music.play();

    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    tileMap = new Image();
    tileMap.src = 'img/tilemap.png'

    // CREAMOS AL JUGADOR //
    protagonist = new player();

    // CREAMOS UNA ANTORCHA //
    torchImage.push(new torch(0,0));
    torchImage.push(new torch(0,9));
    torchImage.push(new torch(14,9));
    torchImage.push(new torch(14,0));
    torchImage.push(new torch(9,7));
    torchImage.push(new torch(11,7));

    // CREAMOS A LOS ENEMIGOS //
    enemy.push(new badBoy(3,5));
    enemy.push(new badBoy(13,8));
    enemy.push(new badBoy(7,7));

    //LECTURA DEL TECLADO //
    document.addEventListener('keydown', function(key){
        if(key.keyCode == 38){
            protagonist.up();
        }
        if(key.keyCode == 40){
            protagonist.down();
        }
        if(key.keyCode == 37){
            protagonist.left();
        }
        if(key.keyCode == 39){
            protagonist.right();
        }
    })


    setInterval(function(){
        principal();
    },1000/FPS);
}

function eraseCanvas(){
    canvas.width=750;
    canvas.height=500;
}

function principal(){
    eraseCanvas();
    drawMap();
    protagonist.draw();

    for(c=0; c<enemy.length; c++){
        enemy[c].move();
        enemy[c].draw();
    };

    for(c=0; c<torchImage.length; c++){
        torchImage[c].draw();
    }
}