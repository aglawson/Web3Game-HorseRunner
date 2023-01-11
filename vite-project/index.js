import { ethers } from 'ethers'
import axios from 'axios';
import {MFABI, TOKEN_ABI, URL, etherscan, mint_url} from './secret';

window.addEventListener("load", function() {
    const relayer = '0x2A0d1f0EE9c5584b1694BCa16879423432770A52';
    const recipient = '0xB64CD0d2fed28E30eeCD7EC1622F78a03Bb5a870';
    const token = '0xE6fa5688a284D5aA9C2ea9D6d0133889BeEF8Cb3';
    let userAddress;
    let signer;
    let provider;
    let forwarder;
    let token_contract;
    let abiCoder;
    let paid = false;
    let num = 0;
    let token_bal = -1;
    let mySound;

    mySound = new sound("./assets/medieval.wav");

    function sound(src) {
        this.sound = document.createElement("audio");
        this.sound.src = src;
        this.sound.setAttribute("preload", "auto");
        this.sound.setAttribute("controls", "none");
        this.sound.style.display = "none";
        document.body.appendChild(this.sound);
        this.play = function(){
          this.sound.play();
        }
        this.stop = function(){
          this.sound.pause();
        }
      }


    if(token_bal == -1) {
        getHRUNBalance();
    }

    let link = etherscan;    


    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 1024; 
    canvas.height = 576;
    let generated = false;
    let paused = false;
    let vomhBal = parseInt(localStorage.getItem('VOMH'));
    vomhBal = 0;
    let gameOn = false;
    let preGame = true;
    //let pauseTime = 0;
    let points = 0;
    let count = 0;
    const gravity = 1;
    const keys = {
        up: {
            pressed : false
        },
        space: {
            pressed: false
        }
    };

    class Player {
        constructor() {
            //this.speed = 10;
            this.position = {
                x: 200,
                y: 0
            }
            this.velocity = {
                x: 0,
                y: 0
            }
            this.width = 150;
            this.cropWidth = 100;
            this.height = 300;
            this.image = document.getElementById("stand-right");
            this.frames = 0;
            this.sprites = {
                stand: {
                    right: document.getElementById("stand-right"),
                    cropWidth: 169,
                    width: 150
                },
                run: {
                    right: document.getElementById("run-right"),
                    cropWidth: 195, 
                    width: 150
                },
                hurt: {
                    right: document.getElementById("hurt-right"),
                    cropWidth: 145,
                    width: 175
                }
            };
            this.currentSprite = this.sprites.stand.right;
            //this.currentCropWidth = 177;
        }

        draw() {
            context.drawImage(
                this.currentSprite,
                this.currentCropWidth * this.frames,
                0,
                this.currentCropWidth,
                400,
                this.position.x,
                this.position.y,
                this.width,
                this.height
            )
        }

        update() {
            let index = 0;
            setTimeout(function () {
                num += 0.50 
            }, 0 + (index++ * 100));

            if(num % 2 == 0 && this.currentSprite == this.sprites.run.right) {
                this.frames++;
            }

            if (this.currentSprite == this.sprites.stand.right) {
                this.frames = 0;
            }

            if(num % 2 && this.currentSprite == this.sprites.hurt.right) {
                this.frames = 0
            }
            // if(this.currentSprite == this.sprites.hurt.right && this.frames == 5){
            //     this.frames = 0;
            // }

            if(this.frames > 5 && this.currentSprite == this.sprites.run.right) {
                this.frames = 0;
            }
            this.draw();
            //this.position.x += this.velocity.x;
            this.position.y += this.velocity.y;
            
            if (this.position.y + this.height + this.velocity.y <= 585) {
                this.velocity.y += gravity;
            } else {
                this.velocity.y = 0;
            }
        }
    }

    class Platform {
        constructor({ x, y, image }) {
            this.position = {
                x,
                y
            }
            this.image = image;
            this.width= image.width;
            this.height = 20;
            this.speed = 12;
        }
        draw() {
            context.drawImage(this.image, this.position.x, this.position.y);
            context.drawImage(this.image, this.position.x + this.width - 2, this.position.y);
            context.drawImage(this.image, this.position.x + 2 * this.width - 4, this.position.y);
        }
        update() {
            this.position.x -= this.speed;
            if (this.position.x < 0 - this.width) this.position.x = 0;
        }
    }

    class Background {
        constructor({ x, y, image }) {
            this.position = {
                x,
                y
            };
            this.image = image;
            this.width= image.width;
            this.height = 20;
            this.speed = 10;
        }
        draw() {
            context.drawImage(this.image, this.position.x, this.position.y);
            context.drawImage(this.image, this.position.x + this.width - 10, this.position.y);
        }
        update() {
            this.position.x -= this.speed;
            if (this.position.x < 15- this.width) {
                this.position.x = 0;
            }
        }
    }

    class Props {
        constructor({ x, y, image }) {
            this.position = {
                x,
                y
            };
            this.image = image;
            this.width= image.width;
            this.height = 20;
            this.speed = 8;
        }
        draw() {
            context.drawImage(this.image, this.position.x, this.position.y);
            context.drawImage(this.image, this.position.x + this.width - 5, this.position.y);
        }
        update() {
            this.position.x -= this.speed;
            if (this.position.x < 0 - this.width) this.position.x = 0;
        }
    }

    class Obstacle {
        constructor({x, y, image, width}) {
            this.position = {
                x, 
                y
            };
            this.image = image;
            this.width = width;
            this.height = image.height;
            this.speed = 12;
        }
        draw() {
            context.drawImage(this.image, this.position.x, this.position.y);
            context.drawImage(this.image, this.position.x + this.width - 5, this.position.y);
        }
        update() {
            this.position.x -= this.speed;
            if(this.position.x < -25 - this.width){
                this.position.x = -100;
                generated = false
            }
        }
    }

    const player = new Player();
    const background = new Background({
        x: -1,
        y: -1,
        image: this.document.getElementsByName('bg')[1]
    });
    // const props = new Props({
    //     x: -1,
    //     y: 20, 
    //     image: document.getElementById("hills")
    // });
    // const platform = new Platform({
    //     x: -1,
    //     y: 460, 
    //     image: document.getElementById("platform")
    // });

    let obs;
    function generateObstacle(x, y, width) {
        if(!generated){
            obs = new Obstacle({
                x: x,
                y: y,
                image: document.getElementById("smallObstacle"),
                width
            });
            generated = true;
        }

        obs.draw();
    }

    function collision(a, b) {
        try{
            if((b.position.x - a.position.x < 100 && a.position.x - b.position.x < 10) && (b.position.y - a.position.y - 65 < b.height)){
                return true;
            }
        } catch {

        }

    }

    function randomIntFromInterval(min, max) { // min and max included 
        return Math.floor(Math.random() * (max - min + 1) + min)
    }

    function animate() {
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        requestAnimationFrame(animate);
        // /public/assets/medieval.wav
        //console.log(player.position.y + player.height + player.velocity.y, canvas.height)

        mySound.play();

        background.draw();
        // props.draw();
        // platform.draw();
        if(paid) {
            obs.position.x = -100;
            paid = false;
            gameOn = true;
        }

        background.image = document.getElementsByName('bg')[Math.floor(points / 200)];
        //console.log(document.getElementsByName('bg').length)
        player.update();

        
        generateObstacle(randomIntFromInterval(1100, 2000), randomIntFromInterval(275, 360), 10);
        if(points > 50) {
            
            if(points > 500) {
                obs.speed = 21 + (points / 200);
            } else {
                obs.speed = 12 + (points / 50);
            }
            //platform.speed = obs.speed / 2;
            //background.speed = obs.speed;

        }
        //if(gameOn || preGame) {
            //if (player.position.y + player.height <= platform.position.y && player.position.y + player.height + player.velocity.y >= 577) {

                //player.velocity.y = 0;
                //player.position.y = 150;
                //keys.space.pressed = false
            //}
        //}
        if(preGame) {
            context.fillText(`Press Space to Start`, canvas.width * 1/2.5, canvas.height * 1/2);
            player.currentSprite = player.sprites.stand.right;
            player.currentCropWidth = player.sprites.stand.cropWidth;
            player.width = player.sprites.stand.width;
        }
        if(paused) {
            player.currentSprite = player.sprites.stand.right;
            player.currentCropWidth = player.sprites.stand.cropWidth;
            player.width = player.sprites.stand.width;
            context.fillText(`PAUSED`, canvas.width * 1/2.2, canvas.height * 1/2);
            count = count;
        } else if(!paused && gameOn) {
            player.currentSprite = player.sprites.run.right;
            player.currentCropWidth = player.sprites.run.cropWidth;
            player.width = player.sprites.run.width;
            setTimeout(function () {
                if(gameOn && !paused) {
                    points++;
                }
            }, 100 + (100 * count++));
        }
        if (gameOn && !paused) {
            background.update();
            //props.update();
            //platform.update();
            obs.update();
        }
        context.fillText(`Jump: Space/Up Arrow`, canvas.width * 1/50, canvas.height * 1/25);
        context.fillText(`Pause: Esc`, canvas.width * 1/50, canvas.height * 1/12);
        context.fillText(`VOMH Balance: ${localStorage.getItem('VOMH') == null ? 0 : localStorage.getItem('VOMH')}`, canvas.width * 3/4, 50);
        context.fillText(`Score: ${points} High Score: ${localStorage.getItem('highscore') == null ? 0 : localStorage.getItem('highscore')}`, canvas.width * 3/4, 20);
        context.font = "18px sans-serif";
        if(collision(player, obs)) {
            player.currentSprite = player.sprites.hurt.right;
            recordScore();
        }
        context.fillText(`Mint Test Tokens (no gas needed): M`, canvas.width * 1/50, canvas.height * 1/8);
        context.fillText(`Buy VOMH w Test Token (no gas needed): B`, canvas.width * 1/50, canvas.height * 1/6);
        context.fillText(`HRUN Balance: ${token_bal == -1 ? 0 : token_bal}`, canvas.width * 3/4, canvas.height * 1/7);
    }
    animate();

    async function buyVOMH(e) {
        await getSigner();
        const success = await signMessage();
        if(success) {
            //const bal = localStorage.getItem('VOMH');
            vomhBal += 1000
            localStorage.setItem('VOMH', vomhBal);
        } else {
            alert('Purchase Failed. Please try again.')
        }
    }

    async function spendVOMH() {
        if(vomhBal >= 100) {
            vomhBal -= 100;
            localStorage.setItem('VOMH', vomhBal);

            paid = true;
        } else {
            localStorage.setItem('VOMH', '0');
        }
    }

    async function getSigner () {
        abiCoder = new ethers.utils.AbiCoder();
        try{
        provider = new ethers.providers.Web3Provider(window.ethereum)
        forwarder = new ethers.Contract(relayer, MFABI, provider);
        await provider.send("eth_requestAccounts", []);
        token_contract = new ethers.Contract(token, TOKEN_ABI, provider);
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();
        let bal = await token_contract.balanceOf(userAddress);
        token_bal = parseInt(bal) / 10**18;

        if(provider.network.chainId != 5) {
            //https://rpc.goerli.dev
            await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{
                chainId: "0x5"
            }]
            });
        }

        // const allowance = await token_contract.allowance(userAddress, recipient);
        // if(parseInt(allowance) < 1000) {
        //     setMessage('Approve Token Spend');
        // } else {
            setMessage('Sign Message');
        //}
    
        } catch{
        getSigner();
        }
    }

    async function signMessage () {
        const nonce = await forwarder.getNonce(userAddress);
        // const allowance = await token_contract.allowance(userAddress, recipient);
        // if(parseInt(allowance) < 1000) {
        //   try{
        //     const approvaltx = await token_contract.connect(signer).approve(recipient, '1000000000000000000000000');
        //     await approvaltx.wait(1);
        //     setMessage('Sign Message');
        //   } catch (error) {
        //     alert(error.message);
        //   }
        // }
    
        let data = abiCoder.encode(['uint256', 'uint256'], ['1000000000000000000', '0']);
        data = data.slice(2,data.length);
        // console.log(data);
        const Req = {
          from: userAddress,
          to: recipient,
          value: 0,
          gas: 100000,
          nonce: nonce,
          data: '0xef48eee6' + data
        }
    
        let message = ethers.utils.solidityKeccak256(
          ['address', 'address', 'uint256', 'uint256', 'uint256', 'bytes'],
          [Req.from, Req.to, Req.value, Req.gas, Req.nonce, Req.data] 
        );
    
        const arrayifyMessage = await ethers.utils.arrayify(message)
        const flatSignature = await signer.signMessage(arrayifyMessage)
        try {
          const execute = await axios.get(
            `${URL}${JSON.stringify(Req)}&signature=${flatSignature}`
          )
          if(execute.data.success) {
            link = etherscan + execute.data.message 
            console.log(link);
            await getHRUNBalance();
            return true;
          } else {
            alert('Tx failed with error: ' + execute.data.message);
            return false;
          }
        } catch(error) {
          alert(error.message);
          return false;
        }
    }

    function recordScore() {
        gameOn = false;

        if(localStorage.getItem('highscore') == undefined) {
            localStorage.setItem('highscore',points.toString());
        } else if(parseInt(localStorage.getItem('highscore')) < points) {
            localStorage.setItem('highscore',points.toString());
        }
        player.currentSprite = player.sprites.hurt.right;
        player.currentCropWidth = player.sprites.hurt.cropWidth;
        player.width = player.sprites.hurt.width;
        player.velocity.y = 0;
        player.update();
        context.fillText(`GAME OVER: Space to Restart or V to spend VOMH and start at current position`, canvas.width * 1/6, canvas.height * 1/2);
    }

    async function getHRUNBalance() {
        await getSigner();
        let bal = await token_contract.balanceOf(userAddress);
        token_bal = parseInt(bal) / 10**18;
    }

    async function mintTokens() {
        await getSigner();

        if(token_bal == 0) {
            const execute = await axios.get(
                `${mint_url}${userAddress}`
            )
            console.log(execute);
            getHRUNBalance();
        } else {
            alert('You already have HRUN');
        }
    }

    addEventListener('keydown', ({code}) => {
        //console.log(code);
        switch(code) {
            case 'Space':
                if(!gameOn && preGame) {
                    gameOn = true;
                    preGame = false;
                    keys.space.pressed = true;
                    player.currentSprite = player.sprites.run.right;
                    player.currentCropWidth = player.sprites.run.cropWidth;
                    player.width = player.sprites.run.width;
                } else if (player.position.y + player.height >= 460 - 1 && !paused && !keys.up.pressed && player.position.y >= 286) {
                    console.log(player.position.y + player.height);
                    player.velocity.y -= 20;
                    keys.space.pressed = true;
                }
                if(!preGame && !gameOn) {
                    this.window.location.reload();
                    //context.reload();
                }
                break;

            case 'ArrowUp':
                if (player.position.y + player.height >= 460 - 1 && !paused && !keys.space.pressed && player.position.y >= 286) {
                    console.log('true');
                    player.velocity.y -= 20;
                    keys.up.pressed = true;
                    console.log(player.position.y);
                }
                break;

            case 'ArrowDown':
                if(player.position.y < 286 && player.velocity.y <= 25) {
                    player.velocity.y = 25;
                }
                break;

            case 'Escape':
                if(!preGame){
                    paused = !paused;
                }
                break;

            case 'KeyB':  // TESTING ONLY
                if(preGame) {
                    buyVOMH();
                }
                break;
            
            case 'KeyV': // TESTING ONLY
                // localStorage.setItem('VOMH', '0');
                if(!paused && !gameOn && !preGame) { 
                    spendVOMH();
                }
                break;

            case 'KeyM': 
                if(preGame && !gameOn) {
                    console.log('minting...');
                    mintTokens();
                }
                break;
        }
    })

    addEventListener('keyup', ({code}) => {
        switch(code) {
            case 'Space':
                keys.space.pressed = false;
                break;
            // case 'ArrowLeft':
            //     console.log('left');
            //     player.velocity.x -= 20;
            //     break;

            // case 'ArrowRight':
            //     console.log('Right');
            //     player.velocity.x += 2;
            //     break;

            case 'ArrowUp':
                //player.velocity.y -= player.speed * 2;
                keys.up.pressed = false;
                break;
        }
    })
})