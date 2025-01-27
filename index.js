class GameOfLife{
    constructor(elementId, buttons, title, zoomInput){
        let gameContainer = document.getElementById('game-container');
        this.canvas = document.createElement('canvas');
        this.canvas.setAttribute('id', elementId);
        gameContainer.appendChild(this.canvas);
        this.canvas.width = gameContainer.getBoundingClientRect().width;
        this.canvas.height = gameContainer.getBoundingClientRect().height;

        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.animation = null;
        this.animationSpeed = 250;

        this.gridSize = parseInt(zoomInput.value);
        this.blurSize = 0;
        this.translateX = 0;
        this.translateY = 0;

        this.prevPosition = {};
        this.dragging = false;
        this.draggingEnabled = false;

        this.entries = new Set();

        this._whiteContext();
        this.ctx.font = "bold 80px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif";

        this.title = title;
        this.zoomInput = zoomInput;
        this.buttons = buttons;
        this.startButton = buttons.querySelector('#start-button')
        this.pauseButton = buttons.querySelector('#pause-button')
        this.restartButton = buttons.querySelector('#restart-button');

        this.addEventListeners();

        this.updateState('before_play');
    }

    addEventListeners = () => {
        this.startButton.onclick = () => this.updateState('animating');
        this.pauseButton.onclick = () => this.updateState('paused');
        this.restartButton.onclick = () => this.updateState('before_play');

        this.zoomInput.addEventListener('input', (e) => {
            this.gridSize = parseInt(e.target.value);
            window.requestAnimationFrame(this.draw);
        });
    }

    updateState = (state) => {
        this.state = state;

        if (state === 'before_play'){
            this.entries = new Set();
            this.disableDragging();
            this.pauseAnimation();
            this.buttons.classList.add('hide');
            this.title.classList.remove('hide');
            this.pauseButton.classList.add('hide');
            this.restartButton.classList.add('hide');
            this.startButton.classList.add('hide');

            const startGameTap = () => {
                this.title.classList.add('hide');
                this.updateState('drawing');
                this.buttons.classList.add('show');
                this.canvas.removeEventListener('click', startGameTap);
            }
            
            this.canvas.addEventListener('click', startGameTap);
        }
        else if (state === 'drawing'){
            this.disableDragging();
            this.pauseAnimation();
            this.drawingListeners();
            this.pauseButton.classList.add('hide');
            this.restartButton.classList.add('hide');
            this.startButton.classList.add('hide');
        }
        else if (state === 'paused'){
            this.pauseAnimation();
            this.enableDragging();
            this.pauseButton.classList.add('hide');
            this.restartButton.classList.remove('hide');
            this.startButton.classList.remove('hide');
        }
        else if (state === 'animating'){
            this.enableDragging();
            this.animate();
            this.pauseButton.classList.remove('hide');
            this.restartButton.classList.add('hide');
            this.startButton.classList.add('hide');
        }
        else if (state === 'game_over'){
            this.pauseAnimation();
            this.enableDragging();
            this.pauseButton.classList.add('hide');
            this.restartButton.classList.remove('hide');
            this.startButton.classList.add('hide');
        }

        window.requestAnimationFrame(this.draw);
    }

    _whiteContext = () => {
        this.ctx.strokeStyle = 'rgb(200 200 200 / 10%)';
        this.ctx.shadowColor = '#66FF66A0';
        this.ctx.fillStyle = '#66FF66A0';
        this.ctx.shadowBlur = 30;
    }

    draw = () => {
        this.ctx.clearRect(0, 0, this.width, this.height);

        //horizontal
        let i = Math.floor(this.translateY % this.gridSize);
        while (i <= this.height){
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.width, i);
            this.ctx.stroke();
            i += this.gridSize;
        }

        //vertical
        i = Math.floor(this.translateX % this.gridSize);
        while (i <= this.width){
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.height);
            this.ctx.stroke();
            i += this.gridSize;
        }

        //first, determine the visible coordinates
        let startSqX = Math.floor(-this.translateX / this.gridSize);
        let endSqX = startSqX + Math.floor(this.width / this.gridSize) + 1;

        let startSqY = Math.floor(-this.translateY / this.gridSize);
        let endSqY = startSqY + Math.floor(this.height / this.gridSize) + 1;

        let numCells = (endSqX - startSqX) * (endSqY - startSqY);

        //for performance reasons
        if (numCells < this.entries.size){
            for (let i = startSqX; i <= endSqX; i++){
                for (let j = startSqY; j <= endSqY; j++){
                    if (this.entries.has(JSON.stringify([i, j]))){
                        let startX = Math.floor(this.translateX + (this.gridSize * i));
                        let startY = Math.floor(this.translateY + (this.gridSize * j));
    
                        this.ctx.fillRect(startX, startY, this.gridSize, this.gridSize);
                    }
                }
            }
        }
        else {
            for (let entry of this.entries){
                let [x, y] = JSON.parse(entry);

                if (x >= startSqX && x <= endSqX && y >= startSqY && y <= endSqY){
                    let startX = Math.floor(this.translateX + (this.gridSize * x));
                    let startY = Math.floor(this.translateY + (this.gridSize * y));
    
                    this.ctx.fillRect(startX, startY, this.gridSize, this.gridSize);
                }
            }
        }
    }

    drawingListeners = () => {
        this.canvas.onclick = (e) => {
            const rect = this.canvas.getBoundingClientRect();

            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            let xSq = Math.floor((-this.translateX + x) / this.gridSize);
            let ySq = Math.floor((-this.translateY + y) / this.gridSize);

            let key = JSON.stringify([xSq, ySq]);

            if (this.entries.has(key)){
                this.entries.delete(key);
            }
            else{
                this.entries.add(key);
            }

            if (this.entries.size >= 1){
                this.startButton.classList.remove('hide');
            }
            else{
                this.startButton.classList.add('hide');
            }

            window.requestAnimationFrame(this.draw);
        }   
    }

    disableDragging = () => {
        this.draggingEnabled = false;
        this.dragging = false;
        this.prevPosition = {};

        this.canvas.onmousedown =
        this.canvas.onmousemove =
        this.canvas.onmouseup = 
        this.canvas.ontouchstart = 
        this.canvas.ontouchmove = 
        this.canvas.ontouchend = 
        this.canvas.ontouchcancel = null;
    }

    enableDragging = () => {
        this.draggingEnabled = true;

        this.canvas.onmousedown = this.canvas.ontouchstart = (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();

            if (e.touches && e.touches[0]){
                e.clientX = e.touches[0].clientX;
                e.clientY = e.touches[0].clientY;
            }

            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.prevPosition = {x: x, y: y};
            this.dragging = true;
            window.requestAnimationFrame(this.draw)
        }

        this.canvas.onmousemove = this.canvas. ontouchmove = (e) => {
            e.preventDefault();
            if (!this.dragging || !this.prevPosition)
                return;

            if (e.touches && e.touches[0]){
                e.clientX = e.touches[0].clientX;
                e.clientY = e.touches[0].clientY;
            }

            const rect = this.canvas.getBoundingClientRect();

            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;

            this.translate(currentX - this.prevPosition.x, currentY - this.prevPosition.y);
            this.prevPosition = {x: currentX, y: currentY};
        }

        this.canvas.onmouseup = this.canvas.ontouchend = this.canvas.ontouchcancel = (e) => {
            e.preventDefault();
            this.dragging = false;
            this.prevPosition = {};
            window.requestAnimationFrame(this.draw)
        }
    }

    animate = () => {
        this.canvas.onclick = null;
        clearInterval(this.animation);
        this.animation = setInterval(this.animationStep, this.animationSpeed);
    }

    animationStep = () => {
        let deadNeighbors = new Map();
        let markedForDeletion = new Set();

        for (let entry of this.entries){
            let [x, y] = JSON.parse(entry);

            let numOfNeighbors = 0;
            for (let i = x - 1; i <= x + 1; i++){
                for (let j = y - 1; j <= y + 1; j++){
                    if (i == x && j == y)
                        continue;

                    let key = JSON.stringify([i, j]);

                    if (this.entries.has(key)){
                        numOfNeighbors++;
                    }
                    else{
                        if (deadNeighbors.has(key)){
                            deadNeighbors.set(key, deadNeighbors.get(key) + 1);
                        }
                        else{
                            deadNeighbors.set(key, 1);
                        }
                    }

                }
            }

            if (numOfNeighbors < 2 || numOfNeighbors > 3){
                markedForDeletion.add(entry);
            }
        }

        let changed = markedForDeletion.size > 0;

        for (let [neigh, numNeighbors] of deadNeighbors){
            if (numNeighbors === 3){
                this.entries.add(neigh);
                changed = true;
            }
        }

        if (!changed){
            if (this.entries.size == 0){
                this.updateState('before_play');
            }
            else{
                this.updateState('game_over');
            }
        }
        else{
            this.entries = this.entries.difference(markedForDeletion);
        }
        
        window.requestAnimationFrame(this.draw);
    }

    pauseAnimation = () => {
        clearInterval(this.animation);
    }

    translate = (x, y) => {
        this.translateX += x;
        this.translateY += y;
  
        window.requestAnimationFrame(this.draw);
    }

    scale = (x, y, scale) => {

    }
}

window.onload = () => {
    const title = document.getElementById('game-title');
    const buttons = document.getElementById('buttons');
    const zoomInput = document.getElementById('zoom-input')

    const game = new GameOfLife('game-of-life', buttons, title, zoomInput);
}