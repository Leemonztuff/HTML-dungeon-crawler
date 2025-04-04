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
var playerAttack = 10;      // Ataque base del jugador
var playerDefense = 5;      // Defensa base del jugador
var playerItems = {         // Inventario de objetos
    potion: 3,              // Pociones (restauran 30 HP)
    attackBoost: 1,         // Aumenta ataque por 3 turnos
    defenseBoost: 1         // Aumenta defensa por 3 turnos
};
var playerBuffs = {         // Buffs activos
    attack: 0,              // Turnos restantes de buff de ataque
    defense: 0              // Turnos restantes de buff de defensa
};

// CARGA DE IMÁGENES DE BATALLA
var battleBackground = new Image();
battleBackground.src = 'img/battlefield.png';

var playerBattleSprite = new Image();
playerBattleSprite.src = 'img/player_battle.png';

var enemyBattleSprite = new Image();
enemyBattleSprite.src = 'img/enemy_battle.png';

// CARGA DEL SPRITE DEL JUGADOR
var playerSprite = new Image();
playerSprite.src = 'img/player.png';

// MAPA (10x15) - 0: Pared, 1: Puerta, 2: Suelo, 3: Llave
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

// DIBUJA EL MAPA
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
    this.frame = 0;

    this.changeFrame = function(){
        this.frame = (this.frame < 3) ? this.frame + 1 : 0;
    }

    this.draw = function(){
        if(this.counter++ >= this.slowDown){
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
    this.hp = 30;           // HP base del enemigo
    this.maxHp = 30;        // HP máximo
    this.attack = 8;        // Ataque base
    this.defense = 3;       // Defensa base
    this.name = "Enemigo";  // Nombre por defecto
    this.type = Math.floor(Math.random() * 3); // Tipo de enemigo (0-2)

    // Establecer estadísticas según el tipo
    switch(this.type) {
        case 0: // Enemigo débil
            this.name = "Goblin";
            this.hp = 20;
            this.maxHp = 20;
            this.attack = 6;
            this.defense = 2;
            break;
        case 1: // Enemigo estándar
            this.name = "Orco";
            this.hp = 30;
            this.maxHp = 30;
            this.attack = 8;
            this.defense = 3;
            break;
        case 2: // Enemigo fuerte
            this.name = "Troll";
            this.hp = 40;
            this.maxHp = 40;
            this.attack = 10;
            this.defense = 5;
            break;
    }

    this.draw = function(){
        ctx.drawImage(tileMap, 0, 32, 32, 32, this.x*widthF, this.y*heightF, widthF, heightF);
    }

    this.moveLogic = function(x, y){
        // Corregido: Ahora devuelve true si NO puede moverse allí
        return (map[y][x] === 0 || x < 0 || y < 0 || x >= 15 || y >= 10);
    }

    this.move = function(){
        if(inBattle) return;
        
        // Verificar colisión con jugador
        if(this.x === protagonist.x && this.y === protagonist.y){
            protagonist.enemyAttack(this.x, this.y);
            return;
        }
        
        if(this.counter++ >= this.slowDown){
            this.counter = 0;
            let moved = false;
            
            // Guardar posición actual
            const oldX = this.x;
            const oldY = this.y;
            
            switch(this.direction){
                case 0: // Arriba
                    if(!this.moveLogic(this.x, this.y - 1)){
                        this.y--;
                        moved = true;
                    }
                    break;
                case 1: // Abajo
                    if(!this.moveLogic(this.x, this.y + 1)){
                        this.y++;
                        moved = true;
                    }
                    break;
                case 2: // Izquierda
                    if(!this.moveLogic(this.x - 1, this.y)){
                        this.x--;
                        moved = true;
                    }
                    break;
                case 3: // Derecha
                    if(!this.moveLogic(this.x + 1, this.y)){
                        this.x++;
                        moved = true;
                    }
                    break;
            }
            
            // Si se movió, verificar colisión con jugador
            if(moved && this.x === protagonist.x && this.y === protagonist.y){
                protagonist.enemyAttack(this.x, this.y);
            }
            
            // Si no se pudo mover, cambiar dirección
            if(!moved) {
                this.direction = Math.floor(Math.random()*4);
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
    this.direction = 'down';
    this.hp = 100;          // HP actual
    this.maxHp = 100;       // HP máximo
    this.mp = 50;           // MP actual (para magia)
    this.maxMp = 50;        // MP máximo
    this.attack = 10;       // Ataque base
    this.defense = 5;       // Defensa base

    this.draw = function(){
        let sy = 0;
        switch(this.direction){
            case 'up': sy = 96; break;
            case 'left': sy = 32; break;
            case 'right': sy = 64; break;
            default: sy = 0; // down
        }
        ctx.drawImage(playerSprite, 0, sy, 32, 32, this.x*widthF, this.y*heightF, widthF, heightF);
    }

    this.enemyAttack = function(x, y){
        if(this.x === x && this.y === y && !inBattle){
            const enemyObj = getEnemyAt(x, y);
            if(enemyObj) startBattle(enemyObj);
        }
    }

    this.margins = function(x, y){
        // Verifica límites del mapa
        if(x < 0 || y < 0 || x >= 15 || y >= 10) return true;
        return (map[y][x] === 0); // Bloquea movimiento en tiles 0
    }

    // Métodos de movimiento corregidos
    this.up = function(){
        if(!this.margins(this.x, this.y - 1)){
            this.y--;
            this.direction = 'up';
            this.logicObjects();
        }
    }
    this.down = function(){
        if(!this.margins(this.x, this.y + 1)){
            this.y++;
            this.direction = 'down';
            this.logicObjects();
        }
    }
    this.left = function(){
        if(!this.margins(this.x - 1, this.y)){
            this.x--;
            this.direction = 'left';
            this.logicObjects();
        }
    }
    this.right = function(){
        if(!this.margins(this.x + 1, this.y)){
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

    this.dead = function(){
        sonido1.play();
        showDeathMenu();
    }

    this.logicObjects = function(){
        const object = map[this.y][this.x];
        if(object === 3){
            sonido2.play();
            this.key = true;
            keysCollected++;
            map[this.y][this.x] = 2;
            alert('¡Llave obtenida!');
        } else if(object === 1 && !this.key){
            alert("Necesitas la llave");
        } else if(object === 1 && this.key){
            this.win();
        }
        
        // Verificar colisión con enemigos
        for(let i = 0; i < enemy.length; i++){
            if(this.x === enemy[i].x && this.y === enemy[i].y){
                this.enemyAttack(this.x, this.y);
                break;
            }
        }
    }
}

var protagonist;

// Sonidos y música
var sonido1 = new Howl({ src: ['sound/fuego.wav'], loop: false });
var sonido2 = new Howl({ src: ['sound/llave.wav'], loop: false });
var sonido3 = new Howl({ src: ['sound/puerta.wav'], loop: false });
var battleSound = new Howl({ src: ['sound/battle.wav'], loop: false });
var victorySound = new Howl({ src: ['sound/victory.wav'], loop: false });
var defeatSound = new Howl({ src: ['sound/defeat.wav'], loop: false });
var music = new Howl({ src: ['music/music.mp3'], loop: true });
var battleMusic = new Howl({ src: ['music/battle.mp3'], loop: true });

// FUNCIONES DE BATALLA
function getEnemyAt(x, y){
    return enemy.find(e => e.x === x && e.y === y) || null;
}

function startBattle(enemyObj){
    inBattle = true;
    battleEnemy = enemyObj;
    battlePlayerHP = protagonist.hp;
    battleEnemyHP = enemyObj.hp;
    
    // Parar música de exploración y comenzar música de batalla
    music.pause();
    battleMusic.play();
    battleSound.play();
    
    createBattleUI();
}

function createBattleUI(){
    if(document.getElementById("battleUI")) return; // Evita duplicados
    
    const battleDiv = document.createElement("div");
    battleDiv.id = "battleUI";
    battleDiv.style.position = "absolute";
    battleDiv.style.top = "50%";
    battleDiv.style.left = "50%";
    battleDiv.style.transform = "translate(-50%, -50%)";
    battleDiv.style.width = "800px";
    battleDiv.style.height = "500px";
    battleDiv.style.backgroundColor = "#000";
    battleDiv.style.color = "white";
    battleDiv.style.border = "3px solid #333";
    battleDiv.style.borderRadius = "10px";
    battleDiv.style.overflow = "hidden";
    
    // Contenedor para la imagen de fondo y sprites
    const battleScene = document.createElement("div");
    battleScene.id = "battleScene";
    battleScene.style.width = "100%";
    battleScene.style.height = "300px";
    battleScene.style.position = "relative";
    battleScene.style.backgroundImage = "url('img/battlefield.png')";
    battleScene.style.backgroundSize = "cover";
    battleScene.style.backgroundPosition = "center";
    battleScene.style.borderBottom = "2px solid #333";
    
    // Sprite del jugador
    const playerDiv = document.createElement("div");
    playerDiv.style.position = "absolute";
    playerDiv.style.bottom = "50px";
    playerDiv.style.left = "150px";
    playerDiv.style.width = "100px";
    playerDiv.style.height = "150px";
    playerDiv.style.backgroundImage = "url('img/player_battle.png')";
    playerDiv.style.backgroundSize = "contain";
    playerDiv.style.backgroundRepeat = "no-repeat";
    playerDiv.style.zIndex = "2";
    
    // Barra de salud del jugador
    const playerHPContainer = document.createElement("div");
    playerHPContainer.style.position = "absolute";
    playerHPContainer.style.bottom = "20px";
    playerHPContainer.style.left = "120px";
    playerHPContainer.style.width = "160px";
    
    const playerHPLabel = document.createElement("div");
    playerHPLabel.textContent = "Jugador";
    playerHPLabel.style.color = "white";
    playerHPLabel.style.textShadow = "2px 2px 2px black";
    playerHPLabel.style.marginBottom = "5px";
    playerHPContainer.appendChild(playerHPLabel);
    
    const playerHPBarContainer = document.createElement("div");
    playerHPBarContainer.style.width = "100%";
    playerHPBarContainer.style.height = "15px";
    playerHPBarContainer.style.backgroundColor = "#333";
    playerHPBarContainer.style.border = "1px solid #666";
    playerHPBarContainer.style.borderRadius = "5px";
    playerHPBarContainer.style.overflow = "hidden";
    
    const playerHPBar = document.createElement("div");
    playerHPBar.id = "playerHPBar";
    playerHPBar.style.width = "100%";
    playerHPBar.style.height = "100%";
    playerHPBar.style.backgroundColor = "#0c0";
    playerHPBar.style.transition = "width 0.5s";
    
    const playerHPText = document.createElement("div");
    playerHPText.id = "playerHPText";
    playerHPText.textContent = `${battlePlayerHP}/${protagonist.maxHp}`;
    playerHPText.style.fontSize = "12px";
    playerHPText.style.marginTop = "5px";
    playerHPText.style.textAlign = "center";
    playerHPText.style.textShadow = "1px 1px 1px black";
    
    playerHPBarContainer.appendChild(playerHPBar);
    playerHPContainer.appendChild(playerHPBarContainer);
    playerHPContainer.appendChild(playerHPText);
    
    // Sprite del enemigo
    const enemyDiv = document.createElement("div");
    enemyDiv.style.position = "absolute";
    enemyDiv.style.bottom = "50px";
    enemyDiv.style.right = "150px";
    enemyDiv.style.width = "120px";
    enemyDiv.style.height = "170px";
    enemyDiv.style.backgroundImage = "url('img/enemy_battle.png')";
    enemyDiv.style.backgroundSize = "contain";
    enemyDiv.style.backgroundRepeat = "no-repeat";
    enemyDiv.style.zIndex = "2";
    
    // Barra de salud del enemigo
    const enemyHPContainer = document.createElement("div");
    enemyHPContainer.style.position = "absolute";
    enemyHPContainer.style.bottom = "20px";
    enemyHPContainer.style.right = "120px";
    enemyHPContainer.style.width = "160px";
    
    const enemyHPLabel = document.createElement("div");
    enemyHPLabel.id = "enemyNameLabel";
    enemyHPLabel.textContent = battleEnemy ? battleEnemy.name : "Enemigo";
    enemyHPLabel.style.color = "white";
    enemyHPLabel.style.textShadow = "2px 2px 2px black";
    enemyHPLabel.style.marginBottom = "5px";
    enemyHPContainer.appendChild(enemyHPLabel);
    
    const enemyHPBarContainer = document.createElement("div");
    enemyHPBarContainer.style.width = "100%";
    enemyHPBarContainer.style.height = "15px";
    enemyHPBarContainer.style.backgroundColor = "#333";
    enemyHPBarContainer.style.border = "1px solid #666";
    enemyHPBarContainer.style.borderRadius = "5px";
    enemyHPBarContainer.style.overflow = "hidden";
    
    const enemyHPBar = document.createElement("div");
    enemyHPBar.id = "enemyHPBar";
    enemyHPBar.style.width = "100%";
    enemyHPBar.style.height = "100%";
    enemyHPBar.style.backgroundColor = "#f00";
    enemyHPBar.style.transition = "width 0.5s";
    
    const enemyHPText = document.createElement("div");
    enemyHPText.id = "enemyHPText";
    enemyHPText.textContent = battleEnemy ? `${battleEnemyHP}/${battleEnemy.maxHp}` : "30/30";
    enemyHPText.style.fontSize = "12px";
    enemyHPText.style.marginTop = "5px";
    enemyHPText.style.textAlign = "center";
    enemyHPText.style.textShadow = "1px 1px 1px black";
    
    enemyHPBarContainer.appendChild(enemyHPBar);
    enemyHPContainer.appendChild(enemyHPBarContainer);
    enemyHPContainer.appendChild(enemyHPText);
    
    // Añadir elementos a la escena de batalla
    battleScene.appendChild(playerDiv);
    battleScene.appendChild(playerHPContainer);
    battleScene.appendChild(enemyDiv);
    battleScene.appendChild(enemyHPContainer);
    
    // Menú de acciones
    const actionMenu = document.createElement("div");
    actionMenu.id = "actionMenu";
    actionMenu.style.width = "100%";
    actionMenu.style.height = "100px";
    actionMenu.style.padding = "15px";
    actionMenu.style.boxSizing = "border-box";
    actionMenu.style.display = "flex";
    actionMenu.style.justifyContent = "space-between";
    actionMenu.style.borderBottom = "2px solid #333";
    
    const createActionButton = (text, onClick, color) => {
        const button = document.createElement("button");
        button.textContent = text;
        button.style.padding = "10px 20px";
        button.style.margin = "0 5px";
        button.style.backgroundColor = color || "#444";
        button.style.color = "white";
        button.style.border = "none";
        button.style.borderRadius = "5px";
        button.style.fontSize = "16px";
        button.style.cursor = "pointer";
        button.style.flex = "1";
        button.onclick = onClick;
        return button;
    };
    
    // Botones de acción
    actionMenu.appendChild(createActionButton("Atacar", battleAttack, "#b30000"));
    actionMenu.appendChild(createActionButton("Magia", showMagicMenu, "#0000b3"));
    actionMenu.appendChild(createActionButton("Objetos", showItemMenu, "#00b300"));
    actionMenu.appendChild(createActionButton("Huir", battleFlee, "#b38600"));
    
    // Contenedor para submenús (magia, objetos)
    const subMenu = document.createElement("div");
    subMenu.id = "subMenu";
    subMenu.style.width = "100%";
    subMenu.style.height = "100px";
    subMenu.style.padding = "15px";
    subMenu.style.boxSizing = "border-box";
    subMenu.style.display = "none";
    subMenu.style.flexDirection = "column";
    subMenu.style.borderBottom = "2px solid #333";
    
    // Log de batalla
    const battleLog = document.createElement("div");
    battleLog.id = "battleLog";
    battleLog.style.width = "100%";
    battleLog.style.height = "100px";
    battleLog.style.padding = "15px";
    battleLog.style.boxSizing = "border-box";
    battleLog.style.overflowY = "auto";
    battleLog.style.fontSize = "14px";
    battleLog.style.fontFamily = "monospace";
    battleLog.style.lineHeight = "1.5";
    battleLog.innerHTML = `<p>¡Un ${battleEnemy ? battleEnemy.name : "enemigo"} te ataca!</p>`;
    
    // Añadir todo al contenedor principal
    battleDiv.appendChild(battleScene);
    battleDiv.appendChild(actionMenu);
    battleDiv.appendChild(subMenu);
    battleDiv.appendChild(battleLog);
    
    document.body.appendChild(battleDiv);
    
    // Actualizar barras de HP
    updateHealthBars();
}

function updateHealthBars() {
    if (!document.getElementById("playerHPBar")) return;
    
    // Actualizar barra de HP del jugador
    const playerPercentage = Math.max(0, (battlePlayerHP / protagonist.maxHp) * 100);
    document.getElementById("playerHPBar").style.width = `${playerPercentage}%`;
    document.getElementById("playerHPText").textContent = `${battlePlayerHP}/${protagonist.maxHp}`;
    
    // Cambiar color según la salud
    if (playerPercentage <= 20) {
        document.getElementById("playerHPBar").style.backgroundColor = "#f00";
    } else if (playerPercentage <= 50) {
        document.getElementById("playerHPBar").style.backgroundColor = "#ff0";
    } else {
        document.getElementById("playerHPBar").style.backgroundColor = "#0c0";
    }
    
    // Actualizar barra de HP del enemigo
    if (battleEnemy) {
        const enemyPercentage = Math.max(0, (battleEnemyHP / battleEnemy.maxHp) * 100);
        document.getElementById("enemyHPBar").style.width = `${enemyPercentage}%`;
        document.getElementById("enemyHPText").textContent = `${battleEnemyHP}/${battleEnemy.maxHp}`;
        
        // Cambiar color según la salud
        if (enemyPercentage <= 20) {
            document.getElementById("enemyHPBar").style.backgroundColor = "#600";
        } else if (enemyPercentage <= 50) {
            document.getElementById("enemyHPBar").style.backgroundColor = "#b30";
        } else {
            document.getElementById("enemyHPBar").style.backgroundColor = "#f00";
        }
    }
}

function removeBattleUI() {
    const battleDiv = document.getElementById("battleUI");
    if(battleDiv) document.body.removeChild(battleDiv);
}

function showMagicMenu() {
    const actionMenu = document.getElementById("actionMenu");
    const subMenu = document.getElementById("subMenu");
    
    // Ocultar menú principal y mostrar submenú
    actionMenu.style.display = "none";
    subMenu.style.display = "flex";
    subMenu.innerHTML = ""; // Limpiar submenú
    
    // Título
    const title = document.createElement("div");
    title.textContent = "Magia";
    title.style.fontSize = "16px";
    title.style.fontWeight = "bold";
    title.style.marginBottom = "10px";
    subMenu.appendChild(title);
    
    // Contenedor de hechizos
    const spellsContainer = document.createElement("div");
    spellsContainer.style.display = "flex";
    spellsContainer.style.justifyContent = "space-between";
    spellsContainer.style.flex = "1";
    
    // Definir hechizos
    const spells = [
        { name: "Bola de Fuego", mpCost: 15, effect: () => { castFireball(); } },
        { name: "Curación", mpCost: 20, effect: () => { castHeal(); } },
        { name: "Relámpago", mpCost: 25, effect: () => { castLightning(); } }
    ];
    
    // Crear botones para cada hechizo
    spells.forEach(spell => {
        const button = document.createElement("button");
        button.textContent = `${spell.name} (${spell.mpCost} MP)`;
        button.style.padding = "8px 15px";
        button.style.margin = "0 5px";
        button.style.backgroundColor = "#0000b3";
        button.style.color = "white";
        button.style.border = "none";
        button.style.borderRadius = "5px";
        button.style.fontSize = "14px";
        button.style.cursor = "pointer";
        button.style.flex = "1";
        
        // Deshabilitar si no hay suficiente MP
        if (protagonist.mp < spell.mpCost) {
            button.disabled = true;
            button.style.backgroundColor = "#666";
            button.style.cursor = "not-allowed";
        }
        
        button.onclick = spell.effect;
        spellsContainer.appendChild(button);
    });
    
    subMenu.appendChild(spellsContainer);
    
    // Botón para volver
    const backButton = document.createElement("button");
    backButton.textContent = "Volver";
    backButton.style.padding = "8px 15px";
    backButton.style.marginTop = "10px";
    backButton.style.backgroundColor = "#333";
    backButton.style.color = "white";
    backButton.style.border = "none";
    backButton.style.borderRadius = "5px";
    backButton.style.fontSize = "14px";
    backButton.style.cursor = "pointer";
    
    backButton.onclick = function() {
        subMenu.style.display = "none";
        actionMenu.style.display = "flex";
    };
    
    subMenu.appendChild(backButton);
}

function showItemMenu() {
    const actionMenu = document.getElementById("actionMenu");
    const subMenu = document.getElementById("subMenu");
    
    // Ocultar menú principal y mostrar submenú
    actionMenu.style.display = "none";
    subMenu.style.display = "flex";
    subMenu.innerHTML = ""; // Limpiar submenú
    
    // Título
    const title = document.createElement("div");
    title.textContent = "Objetos";
    title.style.fontSize = "16px";
    title.style.fontWeight = "bold";
    title.style.marginBottom = "10px";
    subMenu.appendChild(title);
    
    // Contenedor de objetos
    const itemsContainer = document.createElement("div");
    itemsContainer.style.display = "flex";
    itemsContainer.style.justifyContent = "space-between";
    itemsContainer.style.flex = "1";
    
    // Crear botones para cada objeto
    const createItemButton = (name, count, effect, color) => {
        const button = document.createElement("button");
        button.textContent = `${name} (${count})`;
        button.style.padding = "8px 15px";
        button.style.margin = "0 5px";
        button.style.backgroundColor = color;
        button.style.color = "white";
        button.style.border = "none";
        button.style.borderRadius = "5px";
        button.style.fontSize = "14px";
        button.style.cursor = "pointer";
        button.style.flex = "1";
        
        // Deshabilitar si no hay objetos
        if (count <= 0) {
            button.disabled = true;
            button.style.backgroundColor = "#666";
            button.style.cursor = "not-allowed";
        }
        
        button.onclick = effect;
        return button;
    };
    
    // Añadir botones de objetos
    itemsContainer.appendChild(createItemButton("Poción", playerItems.potion, usePotion, "#00b300"));
    itemsContainer.appendChild(createItemButton("Ataque+", playerItems.attackBoost, useAttackBoost, "#b30000"));
    itemsContainer.appendChild(createItemButton("Defensa+", playerItems.defenseBoost, useDefenseBoost, "#0000b3"));
    
    // Botón para volver
    const backButton = document.createElement("button");
    backButton.textContent = "Volver";
    backButton.style.padding = "8px 15px";
    backButton.style.marginTop = "10px";
    backButton.style.backgroundColor = "#333";
    backButton.style.color = "white";
    backButton.style.border = "none";
    backButton.style.borderRadius = "5px";
    backButton.style.fontSize = "14px";
    backButton.style.cursor = "pointer";
    
    backButton.onclick = function() {
        subMenu.style.display = "none";
        actionMenu.style.display = "flex";
    };
    
    subMenu.appendChild(itemsContainer);
    subMenu.appendChild(backButton);
}

// FUNCIONES DE ITEMS
function usePotion() {
    if(playerItems.potion > 0) {
        const healAmount = 30;
        battlePlayerHP = Math.min(protagonist.maxHp, battlePlayerHP + healAmount);
        playerItems.potion--;
        addToBattleLog(`Usaste una poción y recuperaste ${healAmount} HP!`);
        updateHealthBars();
        enemyTurn();
    }
}

function useAttackBoost() {
    if(playerItems.attackBoost > 0) {
        playerBuffs.attack = 3;
        playerItems.attackBoost--;
        addToBattleLog("¡Ataque aumentado por 3 turnos!");
        enemyTurn();
    }
}

function useDefenseBoost() {
    if(playerItems.defenseBoost > 0) {
        playerBuffs.defense = 3;
        playerItems.defenseBoost--;
        addToBattleLog("¡Defensa aumentada por 3 turnos!");
        enemyTurn();
    }
}

// FUNCIONES DE BATALLA PRINCIPALES
function battleAttack() {
    // Calcular daño con buffs
    let attackPower = playerAttack;
    if(playerBuffs.attack > 0) {
        attackPower = Math.floor(attackPower * 1.5);
    }
    
    const damage = Math.max(1, attackPower - battleEnemy.defense);
    battleEnemyHP = Math.max(0, battleEnemyHP - damage);
    
    addToBattleLog(`Atacas al enemigo por ${damage} de daño!`);
    updateHealthBars();
    
    if(battleEnemyHP <= 0) {
        endBattle(true);
    } else {
        enemyTurn();
    }
}

function enemyTurn() {
    // Reducir duración de buffs
    if(playerBuffs.attack > 0) playerBuffs.attack--;
    if(playerBuffs.defense > 0) playerBuffs.defense--;
    
    // Calcular daño del enemigo
    let defense = playerDefense;
    if(playerBuffs.defense > 0) {
        defense = Math.floor(defense * 1.5);
    }
    
    const damage = Math.max(1, battleEnemy.attack - defense);
    battlePlayerHP = Math.max(0, battlePlayerHP - damage);
    
    addToBattleLog(`El enemigo te ataca por ${damage} de daño!`);
    updateHealthBars();
    
    if(battlePlayerHP <= 0) {
        endBattle(false);
    }
}

function battleFlee() {
    const fleeChance = 0.7; // 70% de probabilidad de huir
    if(Math.random() < fleeChance) {
        addToBattleLog("¡Huyes de la batalla!");
        setTimeout(endBattle, 1500, false);
    } else {
        addToBattleLog("¡No pudiste huir!");
        enemyTurn();
    }
}

function endBattle(victory) {
    if(victory) {
        victorySound.play();
        addToBattleLog("¡Has derrotado al enemigo!");
        // Eliminar enemigo del mapa
        enemy = enemy.filter(e => e !== battleEnemy);
    } else if(battlePlayerHP <= 0) {
        defeatSound.play();
        protagonist.dead();
    } else {
        music.play();
    }
    
    if(battlePlayerHP > 0) {
        protagonist.hp = battlePlayerHP;
        // Restaurar música normal
        battleMusic.pause();
        if(!music.playing()) music.play();
    }
    
    inBattle = false;
    battleEnemy = null;
    removeBattleUI();
}

// FUNCIONES DE MAGIA
function castFireball() {
    if(protagonist.mp >= 15) {
        protagonist.mp -= 15;
        const damage = Math.floor(playerAttack * 1.8 - battleEnemy.defense);
        battleEnemyHP = Math.max(0, battleEnemyHP - damage);
        addToBattleLog(`Lanzas una Bola de Fuego por ${damage} de daño!`);
        updateHealthBars();
        
        if(battleEnemyHP <= 0) {
            endBattle(true);
        } else {
            enemyTurn();
        }
    }
}

function castHeal() {
    if(protagonist.mp >= 20) {
        protagonist.mp -= 20;
        const healAmount = 50;
        battlePlayerHP = Math.min(protagonist.maxHp, battlePlayerHP + healAmount);
        addToBattleLog(`Te curas por ${healAmount} HP!`);
        updateHealthBars();
        enemyTurn();
    }
}

function castLightning() {
    if(protagonist.mp >= 25) {
        protagonist.mp -= 25;
        const damage = Math.floor(playerAttack * 2 - battleEnemy.defense);
        battleEnemyHP = Math.max(0, battleEnemyHP - damage);
        addToBattleLog(`Un Relámpago impacta por ${damage} de daño!`);
        updateHealthBars();
        
        if(battleEnemyHP <= 0) {
            endBattle(true);
        } else {
            enemyTurn();
        }
    }
}

// FUNCIÓN AUXILIAR PARA AÑADIR MENSAJES AL LOG
function addToBattleLog(message) {
    const log = document.getElementById("battleLog");
    const entry = document.createElement("p");
    entry.textContent = message;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight; // Auto-scroll al final
}

// MENÚ DE MUERTE
function showDeathMenu() {
    const deathDiv = document.createElement("div");
    deathDiv.id = "deathMenu";
    deathDiv.style.position = "absolute";
    deathDiv.style.top = "50%";
    deathDiv.style.left = "50%";
    deathDiv.style.transform = "translate(-50%, -50%)";
    deathDiv.style.padding = "20px";
    deathDiv.style.backgroundColor = "#300";
    deathDiv.style.color = "white";
    deathDiv.style.textAlign = "center";
    deathDiv.style.borderRadius = "10px";
    
    deathDiv.innerHTML = `
        <h2>¡Has muerto!</h2>
        <p>Recolectaste ${keysCollected} llaves</p>
        <button onclick="location.reload()">Reintentar</button>
    `;
    
    document.body.appendChild(deathDiv);
}

// INICIALIZACIÓN DEL JUEGO
function startGame(){
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    
    tileMap = new Image();
    tileMap.src = 'img/tileset.png';
    
    protagonist = new player();
    
    // Crear antorchas
    new torch(7,1);
    new torch(8,1);
    
    // Crear enemigos
    enemy.push(new badBoy(3,1));
    enemy.push(new badBoy(7,5));
    enemy.push(new badBoy(12,3));
    
    // Bucle principal
    setInterval(function(){
        if(inBattle) return;
        
        ctx.clearRect(0,0,canvas.width,canvas.height);
        drawMap();
        
        for(var i=0; i<torchImage.length; i++)
            torchImage[i].draw();
        
        for(var i=0; i<enemy.length; i++){
            enemy[i].draw();
            enemy[i].move();
        }
        
        protagonist.draw();
    }, 1000/FPS);
}

// MANEJADORES DE TECLADO
document.addEventListener('keydown', function(event){
    if(inBattle) return;
    
    switch(event.keyCode){
        case 38: case 87: protagonist.up(); break;    // Flecha arriba / W
        case 40: case 83: protagonist.down(); break;  // Flecha abajo / S
        case 37: case 65: protagonist.left(); break;  // Flecha izquierda / A
        case 39: case 68: protagonist.right(); break; // Flecha derecha / D
    }
});

// INICIAR EL JUEGO AL CARGAR
window.onload = function(){
    music.play();
    startGame();
};