const WIDTH = 600;
const HEIGHT = 640;
const CELLSIZE = 20;
const CENTSPEED = 4;
const SPIDERSPEED = 4;
const FLEASPEED = 5;
const SCORPSPEED = 3;
const MAXXCOL = WIDTH - CELLSIZE;
const MAXYROW = HEIGHT - (CELLSIZE * 2);
const BULLETSPEED = -20;
const CENTIMGS = ["img/centipedeBody0.png", "img/centipedeBody1.png", "img/centipedeBody2.png", "img/centipedeBody3.png"];
const HEADIMGS = ["img/centipedeHead0.png", "img/centipedeHead0.png", "img/centipedeHead0.png", "img/centipedeHead0.png"];
const MUSHIMGS = ["img/mushroom0.png", "img/mushroom1.png", "img/mushroom2.png", "img/mushroom3.png"]
const MUSHPIMGS = ["img/mushpoison0.png", "img/mushpoison1.png", "img/mushpoison2.png", "img/mushpoison3.png"]
const SPIDERIMGS = ["img/spider0.png", "img/spider1.png", "img/spider2.png", "img/spider3.png"]
const SCORPIMGS = ["img/scorpion0.png", "img/scorpion1.png", "img/scorpion2.png", "img/scorpion3.png"]
const SCORPFIMGS = ["img/scorpionf0 (1).png", "img/scorpionf1.png", "img/scorpionf2.png", "img/scorpionf3.png"]
const FLEAIMGS = ["img/flea0.png", "img/flea1.png"]

var game = {
    frame: 0,
    score: 0,
    lives: 3,
    objects: [],
    mushrooms: [],
    centipedes: [],
    highscores: [],
    refreshing: false,
    startGame: function () {
        console.log("start game");
        this.canvas = document.getElementById("game");
        this.canvas.height = HEIGHT;
        this.canvas.width = WIDTH;
        this.ctx = this.canvas.getContext("2d");
        this.scorelabel = new TextObject("00", 100, CELLSIZE, "red");

        let highs = JSON.parse(localStorage.getItem("highscores"));
        this.highscores = highs ?? [new HighScore("...", 0)];
        this.highscore = new TextObject(this.highscores[0].score, WIDTH / 2, CELLSIZE, "red");

        this.spiderScore = new TextObject("", 0, "blue", "12pt");
        this.player = new Player(["img/player.png"], WIDTH / 2, HEIGHT - CELLSIZE * 4);
        this.spider = new Spider(SPIDERIMGS);
        this.spider.spiderSound = document.getElementById("spider");
        let spsrc = document.createElement("source")
        spsrc.src = "Centipede_Spider_Sound.ogg"
        this.flea = new Flea(FLEAIMGS);
        this.explosion = new Explosion("img/explosion_alpha.png", 128, 128, 24);
        this.mushRefresh = new Explosion("img/mushrefresh.png", 20, 20, 8);
        this.mushRefresh.mushSound = document.getElementById("refresh");
        this.scorpion = new Scorpion(SCORPIMGS.concat(SCORPFIMGS));

        this.canvas.addEventListener("mousemove", function(e) {
            game.canvas.style.cursor = "none";
            game.player.update(e.offsetX, e.offsetY);
        });
        this.canvas.addEventListener("click", function(e) {
            game.player.fire(e.offsetX, e.offsetY);
        })
        this.scorpionInterval = setInterval(this.runScorpion, 1000);
        this.spiderInterval = setInterval(this.runSpider, 10000);
        this.update();
        this.interval = setInterval(this.update, 20);
    },
    update: function () {
        game.frame++;
        if (game.centipedes.length == 0){
            game.makeCents(12);
        }

        game.ctx.fillStyle = "black";
        game.ctx.fillRect(0, 0, WIDTH, HEIGHT);
        game.scorelabel.text = game.score;
        game.scorelabel.draw(game.ctx);
        game.highscore.draw(game.ctx);
        game.spiderScore.draw(game.ctx);

        for (i = 0; i < game.lives; i++){
            game.ctx.drawImage(game.player.images[0], game.scorelabel.x + 100 + i * CELLSIZE, 2, CELLSIZE - 4, CELLSIZE - 4)
        }
        if (!game.scorpion.dead && !game.player.bullet.dead && game.player.bullet.collideWith(game.scorpion)) {
            game.score += game.scorpion.hit();
            game.player.bullet.dead = true;
        }
        if (!game.flea.dead && !game.player.bullet.dead && game.flea.collideWith(game.player.bullet)) {
            game.score += game.flea.hit();
            game.player.bullet.dead = true;
        }
        if (!game.spider.dead && !game.player.bullet.dead && game.spider.collideWith(game.player.bullet)){
            game.spiderScore.text = game.spider.hit();
            game.player.bullet.dead = true;

            game.score += game.spiderScore.text;
            game.spiderScore.x = game.spider.x;
            game.spiderScore.y = game.spider.y;
        
            setTimeout(() => {
                game.spiderScore.text = "";}, 1000);
        }

        game.mushrooms.forEach(mushroom => {
            mushroom.draw(game.ctx);
            if (!game.player.bullet.dead && mushroom.collideWith(game.player.bullet)) {
                game.player.bullet.dead = true;
                mushroom.imgindex++;
                if (mushroom.imgindex > 3 + mushroom.poisoned) {
                    mushroom.dead = true;
                    game.score += 1;
                }
            }
            if (!game.spider.dead && mushroom.collideWith(game.spider)) {
                mushroom.dead = true;
            }
            if (!game.scorpion.dead &&  !mushroom.poisoned && game.scorpion.collideWith(mushroom)) {
                mushroom.poisoned = 4;
                mushroom.imgindex += 4;
            }
        });
        for (let i = game.mushrooms.length - 1; i >= 0; i--) {
            if (game.mushrooms[i].dead) {game.mushrooms.splice(i, 1);}
        }
        let setHead = false;
        if (game.refreshing) {
            for (let i = 0; i < game.mushrooms.length; i++) {
                game.refreshing = false;
                console.log(game.mushrooms[i]);
                if (game.mushrooms[i].imgindex > 0) {
                    game.refreshing = true;
                    if (game.mushRefresh.dead) {
                        game.mushRefresh.dead = false;
                        game.mushRefresh.x = game.mushrooms[i].x;
                        game.mushRefresh.y = game.mushrooms[i].y;
                        game.mushRefresh.mushSound.play();
                        break;
                    }
                    game.mushRefresh.update(game.frame);
                    game.mushRefresh.draw(game.ctx);
                    if (game.mushRefresh.dead) {
                        game.mushrooms[i].imgindex = 0;
                        game.mushrooms[i].poisoned = 0;
                        game.score += 5;
                        game.refreshing = false
                    }else {
                        break;
                    }
                }
            };
            if (!game.refreshing) {
                game.killPlayer();
            }

        } else if (game.player.exploding) {
            console.log("exploding")
            game.explosion.update(game.frame);
            game.explosion.draw(game.ctx);
            if (game.explosion.dead) {
                game.player.exploding = false;
                game.explosion.frameIndex = 0;
                //game.killPlayer();
                game.refreshing = true;
            }
        } else {
            game.centipedes.forEach(centipede => {
                if (setHead) {
                    centipede.head = CENTIMGS.length;
                    centipede.imgindex = 4;
                    setHead = false;
                }
                centipede.update(game.frame);
                centipede.draw(game.ctx);
                game.mushrooms.forEach(mushroom => {
                    if (centipede.turning == 0 && centipede.collideWith(mushroom)) {
                        if ((centipede.x < mushroom.x && centipede.speedX > 0) || (centipede.x > mushroom.x && centipede.speedX < 0)) {
                            centipede.turn();
                            if (mushroom.poisoned) {
                                centipede.poisoned = 1;
                            }
                        }
                    }
                });
                game.centipedes.forEach(segment => {
                    if(!centipede.turning && centipede != segment ) {
                        if (centipede.y == segment.y && centipede.collideWith(segment)) {
                            centipede.turn();
                        }
                    }
                })
                if (!game.player.bullet.dead && centipede.collideWith(game.player.bullet)) {
                    game.player.bullet.dead = true;
                    centipede.dead = true;
                    let cx = (centipede.x % 20 < 10) ? centipede.x - centipede.x % 20 : centipede.x + (20 - centipede.x % 20);
                    let cy = (centipede.y % 20 < 10) ? centipede.y - centipede.y % 20 : centipede.y + (20 - centipede.y % 20);
                    game.mushrooms.push(new GameObject(MUSHIMGS.concat(MUSHPIMGS), cx, cy))
                    if (!centipede.head) {
                        game.score += 10;
                    } else {
                        game.score += 100;
                    }
                    setHead = true;
                }
                if (centipede.collideWith(game.player)) {
                    game.hitPlayer();
                }
            });
            for (let i = game.centipedes.length - 1; i >= 0; i--) {
                if (game.centipedes[i].dead) {game.centipedes.splice(i, 1);}
            }
            game.player.draw(game.ctx);
            game.player.bullet.update();
            game.player.bullet.draw(game.ctx);
            game.spider.update(game.frame);
            game.spider.draw(game.ctx);
            game.flea.update(game.frame);
            game.flea.draw(game.ctx);
            game.scorpion.update(game.frame);
            game.scorpion.draw(game.ctx);
            
        }
        if (!game.spider.dead && game.spider.collideWith(game.player)) {
            game.spider.die();
            game.hitPlayer();
        }
        if (!game.flea.dead && game.flea.collideWith(game.player)) {
            game.flea.die();
            game.hitPlayer();
        }
        if (!game.scorpion.dead && game.scorpion.collideWith(game.player)) {
            game.scorpion.die();
            game.hitPlayer();
        }
        if (game.mushrooms.length < 30) {
            game.runFlea();
        }
        if (game.mushrooms.length < 30 || game.flea.restart || game.centipedes.length <= 2) {
            game.runFlea();
            game.flea.restart = false;
        }
        if (!game.flea.dead && game.flea.y % CELLSIZE == 0) {
            game.makeMushroom();
        }

    },
    makeCents: function(segs) {
        var imgs = CENTIMGS.concat(HEADIMGS);
        var head = CENTIMGS.length;
        for (let i = 0; i < segs; i++){
            game.centipedes[i] = new CentSegment(imgs, CENTSPEED + (i * CELLSIZE), 0, head, -CENTSPEED, 0);
            //imgs = CENTIMGS;
            head = 0;      
        }
    },

    hitPlayer: function () {
        game.player.exploding = true;
        game.explosion.x = game.player.x;
        game.explosion.y = game.player.y;
        game.spider.die();
        game.flea.die();
        game.scorpion.die();
        game.explosion.dead = false;
        var deathSound = document.getElementById("deathSound");
        deathSound.currentTime = 0;
        deathSound.play();
    },

    killPlayer: function () {
        if (game.lives > 0) {
            game.lives--;
            game.centipedes = [];
        }else {
            console.log("game over");
            clearInterval(game.interval);
            game.spider.spiderSound.pause();
            clearInterval(game.spiderInterval);
            if (game.highscores.length  < 8 ||  game.score >= game.highscores[game.highscores.length - 1].score) {
                let inits = prompt("Enter your initials:");
                let hs = new HighScore(inits ?? "...", game.score);
                if (game.highscores.length == 8) {
                    game.highscores.pop();
                }
                game.highscores.push(hs);
                game.highscores.sort((a, b) => {return b.score - a.score});
                localStorage.setItem("highscores", JSON.stringify(game.highscores));

                game.ctx.fillStyle = "black";
                game.ctx.fillRect(0, 0, WIDTH, HEIGHT);

                game.scorelabel.text = game.score;
                game.scorelabel.draw(game.ctx);
                game.highscore.text = game.highscores[0].score;
                game.highscore.draw(game.ctx)
                game.mushrooms.forEach(mushroom => {
                    if (!(mushroom.x > 180 && mushroom.x < 420 && mushroom.y > 40 && mushroom.y < 340)) {
                        mushroom.draw(game.ctx);
                    }
                });
                let hitext = new TextObject("HIGH SCORES", 180, 40, "red");
                hitext.draw(game.ctx);
                for (let i = 0; i < game.highscores.length; i++){
                    hitext.text = "      ".substring(0, 6 - game.highscores[i].score.toString.length) + game.highscores[i].score + " " + game.highscores[i].initials;
                    hitext.y += 20;
                    hitext.draw(game.ctx)
                }
                hitext.text = "BOUNS EVERY 12000";
                hitext.y += 40;
                hitext.draw(game.ctx)
                hitext.text = "GAME OVER";
                hitext.y += 40;
                hitext.draw(game.ctx);
            }
        }  
    },

    makeMushroom: function () {
        if (Math.random() < 0.333) {
            game.mushrooms.push(new GameObject(MUSHIMGS.concat(MUSHPIMGS), game.flea.x, game.flea.y))
        }
    },

    runSpider: function () {
        if (game.spider.dead && !game.refreshing && !game.exploding) {
            let side = Math.floor(Math.random() * 2)
            let y = Math.floor(Math.random() * 200) + HEIGHT - (CELLSIZE * 12);
            if (side == 0) {
                game.spider.speedX = -SPIDERSPEED;
                game.spider.x = WIDTH;
                game.spider.speedY = (y > HEIGHT - (CELLSIZE * 6))? -SPIDERSPEED: SPIDERSPEED;
            } else {
                game.spider.x = WIDTH;
                game.spider.speedX = -SPIDERSPEED;
                game.spider.y = y;
                game.spider.speedY = (y > HEIGHT - (CELLSIZE * 6))? -SPIDERSPEED: SPIDERSPEED;
                console.log("left");
            }
            game.spider.startdir = game.spider.speedX
            game.spider.dead = false;
            
            game.spider.spiderSound.play();
        }
    },

    runFlea: function () {
        if (game.flea.dead) {
            game.flea.x = Math.floor(Math.random() * 30) * 20;
            game.flea.y = -CELLSIZE;
            game.flea.speedY = FLEASPEED;
            game.flea.dead = false;
            game.flea.restart = false;
        }
    },

    runScorpion: function() {
        if (game.scorpion.dead) {
            const side = Math.floor(Math.random() * 2);
            if (side === 0) {
                game.scorpion.x = -CELLSIZE;
                game.scorpion.speedX = SCORPSPEED;
            } else {
                game.scorpion.x = WIDTH;
                game.scorpion.speedX = -SCORPSPEED;
            }
            game.scorpion.y = Math.floor(Math.random() * 15) * 20 + 40;
            game.scorpion.dead = false;
        }
    },

    checkMushrooms: function(x, y) {
        for (let i = 0; i < game.mushrooms.length; i++) {
            if (game.mushrooms[i].x === x && game.mushrooms[i].y === y) {
                return true;
            }
        }
        return false;
    },
    pauseGame: function() {
        clearInterval(this.interval);
        document.getElementById("pauseButton").disabled = true;
        document.getElementById("resumeButton").disabled = false;
    },
    resumeGame: function() {
        this.interval = setInterval(this.update, 20);
        document.getElementById("pauseButton").disabled = false;
        document.getElementById("resumeButton").disabled = true;
    },
};

function HighScore (initials, score) {
    this.initials = initials;
    this.score = score;
}

function TextObject (text, x, y, color, size) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = (size === undefined)? "20pt": size;
    this.draw = function (ctx) {
        ctx.fillStyle= this.color
        ctx.font = this.size + " Arial";
        ctx.fillText(this.text, this.x, this.y);
    }
}

class GameObject {
    constructor(images, x, y){
        this.images = [];
        for (let i = 0; i < images.length; i++){
            this.images[i] = new Image();
            this.images[i].src = images[i];
        }
        this.x = x;
        this.y = y;
        this.speedX = 0;
        this.speedY = 0;
        this.imgindex = 0;
        this.dead = false;
        this.poisoned = 0;
    }
    update() {
        if (!this.dead) {
            this.x += this.speedX;
            this.y += this.speedY;
        }
    }
    draw(ctx) {
        if (!this.dead) {
            ctx.drawImage(this.images[this.imgindex], this.x, this.y, this.images[0].width, CELLSIZE);
        }
    }
    collideWith(obj) {
        if (this.distance(obj) < this.images[0].width / 2 + obj.images[0].width / 2) {
            return true;
        }
        return false;
    }
    distance(obj) {
        const a = (obj.x + obj.images[0].width / 2) - (this.x + this.images[0].width / 2);
        const b = obj.y - this.y;
        const asquared = a * a;
        const bsquared = b * b;

        return Math.sqrt(asquared + bsquared);
    }
}

class CentSegment  extends GameObject {
    constructor(image, x, y, head, speedX, speedY) {
        super(image, x, y);
        this.head = head;
        this.speedX = speedX;
        this.speedY = speedY;
        this.turning = 0;
        this.dir = 1;
    }
    hitWall() {
        if (this.x <= 0 || this.x > MAXXCOL) {
            return true;
        }
        return false;
    }    
    turn() {
        if (this.turning == 0) {
            if (this.y >= HEIGHT - CELLSIZE || this.y <= CELLSIZE && this.dir == -1) {
                this.dir *= -1;
                this.poisoned = 0;
            }
            this.speedX *= -1;
            this.y += CELLSIZE / 5 * this.dir;
            //this.speedY = CELLSIZE / 5
            this.turning = 4;
        }
    }
    update(frame) {
        super.update();
        if (this.turning) {
            this.turning -= 1;
            this.y += CELLSIZE / 5 * this.dir;
        }
        if (frame % CENTSPEED === 0) {
            this.imgindex++;
            if (this.imgindex >= CENTIMGS.length + this.head) {
                this.imgindex = this.head;
            }
        }
        if (this.hitWall() || this.poisoned) {
            this.turn();
        }
    }
    draw(ctx) {
        if (this.y > 0) {
            if (this.turning) {
                ctx.save();
                ctx.translate(this.x + CELLSIZE, this.y - CELLSIZE );
                ctx.rotate(Math.PI * 0.5);
                ctx.drawImage(this.images[this.imgindex], CELLSIZE, 0, CELLSIZE, CELLSIZE);
                ctx.restore();
            } else if (this.speedX < 0) {
                ctx.save();
                ctx.translate(this.x + CELLSIZE, this.y + CELLSIZE / 2);
                ctx.rotate(Math.PI);
                ctx.drawImage(this.images[this.imgindex], 0, -CELLSIZE / 2, CELLSIZE, CELLSIZE);
                ctx.restore();
            } else {
                super.draw(ctx);
            }
        }
    }
}

class Player extends GameObject {
    constructor(image, x, y) {
        super(image, x, y);
        this.bullet = new Bullet(["img/bullet.png"], this.x + CELLSIZE / 2, this.y)
        this.shotSound = document.getElementById("shotSound");
        this.exploding = false;
    }
    update (x, y) {
        var min = HEIGHT - CELLSIZE * 6
        this.x = x;
        this.y = (y < min)?  min:  y;
    }
    fire(x, y) {
        if (this.bullet.dead && x > 0 && x < WIDTH && y < HEIGHT) {
            this.bullet.x = x + CELLSIZE / 2;
            this.bullet.y = this.y;
            this.bullet.dead = false;
            this.shotSound.currentTime = 0;//reset the audio to the beginning
            this.shotSound.play();
        }
    }
}

class Bullet extends GameObject {
    constructor(image, x, y) {
        super(image, x, y);
        //this.dead = true;
        this.speedY = BULLETSPEED;
    }
    update() {
        super.update();
        if (this.y < 0) {
            this.dead = true;
        }
    }
}

class Explosion {
    constructor (image, width, height, framecount) {
        this.image = new Image();
        this.image.src = image;
        this.dead = true;
        this.x = 0;
        this.y = 0;
        this.frameIndex = 0
        this.width = width;
        this.height = height;
        this.framecount = framecount - 1;
    }
    update (frame) {
        if (frame % 3 === 0) {
            this.frameIndex++;
            if (this.frameIndex == this.framecount) {
                this.dead = true;
                this.frameIndex = 0;
            }
        }
    }
    draw (ctx) {
        console.log(this.x, this.y)
        ctx.drawImage(this.image, this.frameIndex * this.width, 0, this.width, this.height, this.x, this.y, CELLSIZE, CELLSIZE);
    }
}

class Spider extends GameObject {
    constructor(images) {
        super(images, -30, 500);
        this.dead = true;
        this.startdir = 0;
    }
    run () {
        if (this.dead) {
            this.y = HEIGHT - CELLSIZE * 12;
            this.speedX = CENTSPEED;
            this.dead = false;
        }
        console.log(game.spider.dead);
    }
    update(frame) {
        if (!this.dead) {
            if (Math.random() < 0.05) {
                this.changeDirection();
            }

            if (this.y > HEIGHT - 2 * CELLSIZE || this.y < HEIGHT - 12 * CELLSIZE) {
                this.changeDirection();
            }
            if (frame % FLEASPEED === 0) {
                this.imgindex++;
                if (this.imgindex >= SPIDERIMGS.length) {
                    this.imgindex = 0;
                }
            }
            super.update();
        }
    }
    changeDirection() {
        if (Math.random() < 0.5) {
            this.speedX = this.startdir;
        }else {
            this.speedX = 0;
        }
        this.speedY = (Math.random() < 0.5) ? -CELLSIZE / 5 : CELLSIZE / 5;
    }
    adjustPosition() {
        const spiderWidth = CELLSIZE;
        
        if (this.x < 0) {
            this.x = 0;
            this.changeDirection();
        } else if (this.x > MAXXCOL - spiderWidth) {
            this.x = MAXXCOL - spiderWidth;
            this.changeDirection();
        }
    }
    hit () {
        this.die();
        const distanceFromPlayer = Math.abs(game.spider.y - (HEIGHT - CELLSIZE * 4));
        if (distanceFromPlayer <= CELLSIZE * 4) {
            return 900;
        } else if (distanceFromPlayer <= CELLSIZE * 8) {
            return 600;
        } else {
            return 300;
        }
    }
    die () {
        this.dead = true;
        this.spiderSound.pause()    
    }
}
class Flea extends GameObject {
    constructor(images){
        super(images)
        this.dead = true;
        this.hits = 0;
    }
    update (frame) {
        if (this.y > MAXYROW) {
            this.dead = true;
        }
        if (frame % FLEASPEED === 0) {
            this.imgindex++;
            if (this.imgindex >= this.images.length) {
                this.imgindex = 0;
            }
       }
       super.update()
    }
    hit () {
        this.hits++;
        if (this.hits == 2) {
            this.die();
            if (Math.random() < 0.75) {
                this.restart = true;
            }
            return 200;
        }
        return 0;
    }
    die () {
        this.dead = true;
        this.hits = 0;
    }
}
class Scorpion extends GameObject {
    constructor(images) {
        super(images);
        this.dead = true;
    }
    update (frame) {
        if (!this.dead) {
            if (frame % SCORPSPEED === 0) {
                this.imgindex++;
                let max = (this.speedX > 0)? 4: 0;
                if (this.imgindex >= SCORPIMGS.length + max) {
                    this.imgindex = max;
                }
            }
            if (this.x < -CELLSIZE || this.x > WIDTH) {
                this.dead = true;
            }
        }
        super.update(frame)
    }
    collideWith(obj) {
        return (this.distance(obj) < CENTSPEED);
    }
    hit() {
        this.die();
        return 1000;
    }
    die () {
        this.dead = true;
    }
    
}
setTimeout(function () {
    game.startGame();
}, 100);

for (let i = 0; i < 30; i++) {
    let x, y;
    do {
        x = Math.floor(Math.random() * 30) * 20;
        y = Math.floor(Math.random() * 30) * 20 + 20;
    } while (game.checkMushrooms(x, y));
    game.mushrooms.push(new GameObject(MUSHIMGS.concat(MUSHPIMGS), x, y));
}