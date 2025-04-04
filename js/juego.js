// VARIABLES GLOBALES
var canvas, ctx;
var FPS = 50;
var widthF = 50;
var heightF = 50;
var enemy = [];
var torchImage = [];
var tileMap;
var inBattle = false;       // Modo batalla activado
var battleEnemy = null;     // Enemigo en batalla
var battlePlayerHP = 100;
var battleEnemyHP = 30;
var keysCollected = 0;      // Llaves recogidas

// CARGA DEL SPRITE DEL JUGADOR (archivo independiente)
var playerSprite = new Image();
playerSprite.src = 'img/player.png'; // Asegúrate de tener esta imagen con los frames en orden vertical

// MAPA (10x15)
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

// DIBUJA EL MAPA (modo exploración)
function drawMap(){
    for(var y=0; y<10; y++){
        for(var x=0; x<15; x++){
            var tile = map[y][x];
            ctx.drawImage(tileMap, tile*32, 0, 32, 32, widthF*x, heightF*y, widthF, heightF);
        }
    }
}

// OBJETO TOCHA
var torch = function(x, y){
    this.x = x;
    this.y = y;
    this.slowDown = 10;
    this.counter = 0;
    this.frame = 0; // 0-3

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
        } else {
            this.counter = 0;
            this.changeFrame();
        }
        ctx.drawImage(tileMap, this.frame*32, 64, 32, 32, widthF*this.x, heightF*this.y, widthF, heightF);
    }
}

// CLASE ENEMIGO
var badBoy = function(x, y){
    this.x = x;
    this.y = y;
    this.direction = Math.floor(Math.random()*4);
    this.slowDown = 50;
    this.counter = 0;
    this.frame = 0;

    this.draw = function(){
        ctx.drawImage(tileMap, 0, 32, 32, 32, this.x*widthF, this.y*heightF, widthF, heightF);
    }

    this.moveLogic = function(x, y){
        return (map[y][x] == 0);
    }

    this.move = function(){
        if(inBattle) return; // No moverse en modo batalla
        protagonist.enemyAttack(this.x, this.y);
        if(this.counter < this.slowDown){
            this.counter++;
        } else {
            this.counter = 0;
            // Movimiento según dirección
            if(this.direction == 0){
                if(!this.moveLogic(this.x, this.y - 1)){
                    this.y--;
                } else {
                    this.direction = Math.floor(Math.random()*4);
                }
            } else if(this.direction == 1){
                if(!this.moveLogic(this.x, this.y + 1)){
                    this.y++;
                } else {
                    this.direction = Math.floor(Math.random()*4);
                }
            } else if(this.direction == 2){
                if(!this.moveLogic(this.x - 1, this.y)){
                    this.x--;
                } else {
                    this.direction = Math.floor(Math.random()*4);
                }
            } else if(this.direction == 3){
                if(!this.moveLogic(this.x + 1, this.y)){
                    this.x++;
                } else {
                    this.direction = Math.floor(Math.random()*4);
                }
            }
        }
    }
}

// OBJETO DEL JUGADOR
var player = function(){
    this.x = 1;
    this.y = 1;
    this.color = '#820c01';
    this.key = false;
    this.direction = 'down'; // 'up', 'down', 'left', 'right'

    this.draw = function(){
        var sx = 0, sy = 0;
        // Asumimos que en player.png los frames están en filas:
        // fila 0: down, fila 1: left, fila 2: right, fila 3: up
        if(this.direction === 'down'){
            sy = 0;
        } else if(this.direction === 'left'){
            sy = 32;
        } else if(this.direction === 'right'){
            sy = 64;
        } else if(this.direction === 'up'){
            sy = 96;
        }
        // Aquí se puede incorporar animación cambiando 'sx' si se tiene más de un frame por dirección
        sx = 0;
        ctx.drawImage(playerSprite, sx, sy, 32, 32, this.x*widthF, this.y*heightF, widthF, heightF);
    }

    // Al chocar con un enemigo se inicia la batalla
    this.enemyAttack = function(x, y){
        if(this.x == x && this.y == y && !inBattle){
            var enemyObj = getEnemyAt(x, y);
            if(enemyObj){
                startBattle(enemyObj);
            }
        }
    }

    // Comprueba si se puede mover a una posición (no hay muro)
    this.margins = function(x, y){
        return (map[y][x] == 0);
    }

    this.up = function(){
        if(!this.margins(this.x, this.y-1)){
            this.y--;
            this.direction = 'up';
            this.logicObjects();
        }
    }
    this.down = function(){
        if(!this.margins(this.x, this.y+1)){
            this.y++;
            this.direction = 'down';
            this.logicObjects();
        }
    }
    this.left = function(){
        if(!this.margins(this.x-1, this.y)){
            this.x--;
            this.direction = 'left';
            this.logicObjects();
        }
    }
    this.right = function(){
        if(!this.margins(this.x+1, this.y)){
            this.x++;
            this.direction = 'right';
            this.logicObjects();
        }
    }

    this.win = function(){
        sonido3.play();
        alert("You've won");
        this.x = 1;
        this.y = 1;
        this.key = false;
        map[8][3] = 3;
    }

    // Nuevo manejo de muerte: se invoca en batalla
    this.dead = function(){
        sonido1.play();
        showDeathMenu();
    }

    // Lógica para recoger llave o abrir puerta
    this.logicObjects = function(){
        var object = map[this.y][this.x];
        if(object == 3){
            sonido2.play();
            this.key = true;
            keysCollected++;
            map[this.y][this.x] = 2;
            alert('You got the key!!!');
        }
        if(object == 1){
            if(this.key){
                this.win();
            } else {
                alert("You don't have the key");
            }
        }
    }
}

var protagonist;

// Sonidos y música con Howler.js
var sonido1 = new Howl({ src: ['sound/fuego.wav'], loop: false });
var sonido2 = new Howl({ src: ['sound/llave.wav'], loop: false });
var sonido3 = new Howl({ src: ['sound/puerta.wav'], loop: false });
var music = new Howl({ src: ['music/music.mp3'], loop: true });

// FUNCIONES DE BATALLA
function getEnemyAt(x, y){
    for(var i=0; i<enemy.length; i++){
        if(enemy[i].x == x && enemy[i].y == y)
            return enemy[i];
    }
    return null;
}

function startBattle(enemyObj){
    inBattle = true;
    battleEnemy = enemyObj;
    battlePlayerHP = 100;
    battleEnemyHP = 30;
    // Opcional: remover el enemigo de la exploración
    createBattleUI();
}

function createBattleUI(){
    var battleDiv = document.createElement("div");
    battleDiv.id = "battleUI";
    battleDiv.style.position = "absolute";
    battleDiv.style.top = "60%";
    battleDiv.style.left = "50%";
    battleDiv.style.transform = "translate(-50%, -50%)";
    battleDiv.style.backgroundColor = "rgba(0,0,0,0.7)";
    battleDiv.style.padding = "10px";
    battleDiv.style.borderRadius = "8px";
    battleDiv.style.textAlign = "center";
    battleDiv.style.zIndex = "1000";
    battleDiv.innerHTML = "<button id='btnAttack'>Ataque</button> " +
                          "<button id='btnMagic'>Magia</button> " +
                          "<button id='btnItem'>Objeto</button> " +
                          "<button id='btnFlee'>Huir</button>";
    document.body.appendChild(battleDiv);
    
    document.getElementById("btnAttack").addEventListener("click", battleAttack);
    document.getElementById("btnMagic").addEventListener("click", battleMagic);
    document.getElementById("btnItem").addEventListener("click", battleItem);
    document.getElementById("btnFlee").addEventListener("click", battleFlee);
}

function removeBattleUI(){
    var battleDiv = document.getElementById("battleUI");
    if(battleDiv){
        document.body.removeChild(battleDiv);
    }
}

function battleAttack(){
    var damage = Math.floor(Math.random()*6) + 1;
    battleEnemyHP -= damage;
    alert("Atacas y haces " + damage + " de daño");
    if(battleEnemyHP <= 0){
        alert("¡Enemigo derrotado!");
        endBattle(true);
    } else {
        enemyTurn();
    }
}

function battleMagic(){
    var damage = Math.floor(Math.random()*4) + 2;
    battleEnemyHP -= damage;
    alert("Lanzas magia y haces " + damage + " de daño");
    if(battleEnemyHP <= 0){
        alert("¡Enemigo derrotado!");
        endBattle(true);
    } else {
        enemyTurn();
    }
}

function battleItem(){
    var heal = Math.floor(Math.random()*6) + 3;
    battlePlayerHP += heal;
    if(battlePlayerHP > 100) battlePlayerHP = 100;
    alert("Usas un objeto y recuperas " + heal + " puntos de vida");
    enemyTurn();
}

function battleFlee(){
    if(Math.random() < 0.5){
        alert("No logras huir. ¡El enemigo te ataca!");
        enemyTurn();
    } else {
        alert("Huyes de la batalla.");
        endBattle(false, true);
    }
}

function enemyTurn(){
    var damage = Math.floor(Math.random()*6) + 1;
    battlePlayerHP -= damage;
    alert("El enemigo ataca y te hace " + damage + " de daño");
    if(battlePlayerHP <= 0){
        battlePlayerHP = 0;
        alert("¡Has sido derrotado!");
        protagonist.dead();
    }
}

function endBattle(victory, fled){
    removeBattleUI();
    inBattle = false;
    battleEnemy = null;
    if(victory && !fled){
        // Elimina el enemigo derrotado de la exploración
        for(var i=0; i<enemy.length; i++){
            if(enemy[i].x == protagonist.x && enemy[i].y == protagonist.y){
                enemy.splice(i, 1);
                break;
            }
        }
    }
    // Regresa al modo exploración
}

// MENÚ DE MUERTE CON ANIMACIÓN DE DESVANECIMIENTO
function showDeathMenu(){
    var fadeDiv = document.createElement("div");
    fadeDiv.id = "fadeDiv";
    fadeDiv.style.position = "absolute";
    fadeDiv.style.top = "0";
    fadeDiv.style.left = "0";
    fadeDiv.style.width = "100%";
    fadeDiv.style.height = "100%";
    fadeDiv.style.backgroundColor = "black";
    fadeDiv.style.opacity = "0";
    fadeDiv.style.zIndex = "2000";
    document.body.appendChild(fadeDiv);
    
    var opacity = 0;
    var fadeInterval = setInterval(function(){
        opacity += 0.05;
        fadeDiv.style.opacity = opacity;
        if(opacity >= 1){
            clearInterval(fadeInterval);
            var deathDiv = document.createElement("div");
            deathDiv.id = "deathMenu";
            deathDiv.style.position = "absolute";
            deathDiv.style.top = "50%";
            deathDiv.style.left = "50%";
            deathDiv.style.transform = "translate(-50%, -50%)";
            deathDiv.style.backgroundColor = "rgba(255,255,255,0.9)";
            deathDiv.style.padding = "20px";
            deathDiv.style.borderRadius = "8px";
            deathDiv.style.textAlign = "center";
            deathDiv.style.zIndex = "2100";
            deathDiv.innerHTML = "<h2>Has muerto</h2>" +
                                 "<button id='btnRestart'>Reiniciar</button> " +
                                 "<button id='btnExit'>Salir</button>";
            document.body.appendChild(deathDiv);
            
            document.getElementById("btnRestart").addEventListener("click", function(){
                location.reload();
            });
            document.getElementById("btnExit").addEventListener("click", function(){
                window.close();
            });
        }
    }, 50);
}

// DIBUJO DEL HUD EN MODO EXPLORACIÓN
function drawHUD(){
    ctx.fillStyle = "white";
    ctx.font = "16px Roboto, sans-serif";
    ctx.fillText("Vida: 100", 10, 20);
    ctx.fillText("Llaves: " + keysCollected, 10, 40);
}

// BUCLE PRINCIPAL DEL JUEGO (exploración y batalla)
function principal(){
    if(inBattle){
        battleLoop();
    } else {
        eraseCanvas();
        drawMap();
        protagonist.draw();
        for(var c=0; c<enemy.length; c++){
            enemy[c].move();
            enemy[c].draw();
        }
        for(var c=0; c<torchImage.length; c++){
            torchImage[c].draw();
        }
        drawHUD();
    }
}

// BUCLE DE BATALLA: Dibuja la pantalla de combate
function battleLoop(){
    eraseCanvas();
    ctx.fillStyle = "#333";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dibuja el área de combate: jugador a la izquierda, enemigo a la derecha
    ctx.drawImage(playerSprite, 0, 0, 32, 32, 50, 150, 100, 100);
    ctx.drawImage(tileMap, 0, 32, 32, 32, canvas.width-150, 150, 100, 100);
    
    // Barra de vida del jugador
    ctx.fillStyle = "red";
    ctx.fillRect(50, 260, (battlePlayerHP/100)*100, 10);
    ctx.strokeStyle = "white";
    ctx.strokeRect(50, 260, 100, 10);
    ctx.fillStyle = "white";
    ctx.fillText("Jugador", 50, 250);
    
    // Barra de vida del enemigo
    ctx.fillStyle = "red";
    ctx.fillRect(canvas.width-150, 260, (battleEnemyHP/30)*100, 10);
    ctx.strokeStyle = "white";
    ctx.strokeRect(canvas.width-150, 260, 100, 10);
    ctx.fillStyle = "white";
    ctx.fillText("Enemigo", canvas.width-150, 250);
}

// BORRA EL CANVAS
function eraseCanvas(){
    canvas.width = 750;
    canvas.height = 500;
}

// INICIALIZACIÓN DEL JUEGO
function start(){
    music.play();
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    tileMap = new Image();
    tileMap.src = 'img/tilemap.png';
    
    // Crea al jugador
    protagonist = new player();
    
    // Crea las torchas
    torchImage.push(new torch(0,0));
    torchImage.push(new torch(0,9));
    torchImage.push(new torch(14,9));
    torchImage.push(new torch(14,0));
    torchImage.push(new torch(9,7));
    torchImage.push(new torch(11,7));
    
    // Crea los enemigos
    enemy.push(new badBoy(3,5));
    enemy.push(new badBoy(13,8));
    enemy.push(new badBoy(7,7));
    
    // Captura del teclado (modo exploración)
    document.addEventListener('keydown', function(key){
        if(inBattle) return;
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
    });
    
    setInterval(principal, 1000/FPS);
}
