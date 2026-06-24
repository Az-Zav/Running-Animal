const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');

const CANVAS_WIDTH = canvas.width = 1920;
const CANVAS_HEIGHT = canvas.height = 1080;

/*


const playerImage = new Image();
playerImage.src = '../Sprites/Rabbit.png';
const spriteWidth = 256;
const spriteHeight = 256;
let playerState = 'run';

let frameX = 0;
let frameY = 0;
let gameFrame = 0;
const staggerFrame = 9;
const spriteAnimations=[];
const animationStates=[
    {
        name: 'idle',
        frames: 2
    },
    {
        name: 'run',
        frames: 7
    },
    {
        name: 'win',
        frames: 4
    },
    {
        name: 'lose',
        frames: 2
    }
];

animationStates.forEach((state, index)=>{
    let frames = {
        loc: []
    }
    for(let j=0; j<state.frames; j++){
        let positionX = j * spriteWidth;
        let positionY = index * spriteHeight;
        frames.loc.push({x: positionX, y: positionY});
    }
    spriteAnimations[state.name] = frames;
});

console.log(spriteAnimations);

function animate() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    let position = Math.floor(gameFrame/staggerFrame) % spriteAnimations[playerState].loc.length;
    let frameX = spriteWidth   * position;
    let frameY = spriteAnimations[playerState].loc[position].y;
    
    ctx.drawImage(playerImage, frameX , frameY, spriteWidth, spriteHeight, 0, 0, spriteWidth, spriteHeight);
    
    gameFrame++;
    requestAnimationFrame(animate);
}

animate();
*/

//------------------------------------------------
let gameSpeed = 5;

const backgroundLayer1 = new Image();
backgroundLayer1.src = '../Background/Sky.png';
const backgroundLayer2 = new Image();
backgroundLayer2.src = '../Background/Mountains.png';
const backgroundLayer3 = new Image();
backgroundLayer3.src = '../Background/Track.png';
const backgroundLayer4 = new Image();
backgroundLayer4.src = '../Background/Fence.png';


class Layer {
    constructor(image, speedModifier) {
        this.x = 0;
        this.y = 0;
        this.width = 1920;
        this.height = 1080;
        this.image = image;
        this.speedModifier = speedModifier;
        this.speed = gameSpeed * this.speedModifier;
    }

    update(){
        this.speed = gameSpeed * this.speedModifier;
        if (this.x <= - this.width) {
            this.x = 0;
        }
        this.x = Math.floor(this.x - this.speed);
    }
    draw(){
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        ctx.drawImage(this.image, this.x + this.width, this.y, this.width, this.height);

    }
}

const layer1 = new Layer(backgroundLayer1, 0.5);
const layer2 = new Layer(backgroundLayer2, 1);
const layer3 = new Layer(backgroundLayer3, 1.5);
const layer4 = new Layer(backgroundLayer4, 1.5);

const gameObject = [layer1, layer2, layer3, layer4];

function animate() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gameObject.forEach(object => {
        object.update();
        object.draw();
    });
    requestAnimationFrame(animate);
}

animate();
