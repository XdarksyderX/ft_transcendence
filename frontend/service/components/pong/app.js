//frame id
let id;
let aiIntervalId;

// Board
let board;
let context;

// Variables provided by user (initialized in global scope)
let playAI;
let msAIcalcRefresh;
let startSpeed;
let speedUpMultiple;
let playerHeight = 50;
let playerSpeed;
let allowPowerUp;
let boardWidth = 700; // Added values to now as they´re used in first version of onlinepong
let boardHeight = 500;
let pointsToWin;
let ballSide = 10;

// Depend on user provided variables
let xMargin; // Margin from paddle to side of board
let playerWidth = 12; // HARDCODED FOR ONLINE PONG
let yMax;
 
const   serveSpeedMultiple = 0.3;

// To set in the global scope
let ball = {};
let Lplayer = {};
let Rplayer = {};
let keyState = {};

let AImargin;
let predictedY;

const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--lorange').trim();
const lightColor = getComputedStyle(document.documentElement).getPropertyValue('--light').trim();
const dangerColor = getComputedStyle(document.documentElement).getPropertyValue('--danger').trim();

function initInstructionsTooltip() 
{
    const tooltipTriggerEl = document.querySelector('[data-bs-toggle="tooltip"]');
    const explanation = "Powerups can only be used once a point";
    
    if (tooltipTriggerEl)
    {
        tooltipTriggerEl.setAttribute('title', explanation);
        new bootstrap.Tooltip(tooltipTriggerEl);
    }
}

function reShowMenu()
{
    document.getElementById("board").hidden = true; // Hide board
    document.getElementById("neonFrame").hidden = true; // Hide frame
    document.getElementById("customizationMenu").hidden = false; // Show menu
    document.getElementById("instructions").hidden = false; // Show instructions
}

export async function initializePongEvents()
{
    // Check for an online match
    try 
    {
        const response = await fetch("http://localhost:5052/match/in-progress/", { credentials: "include" }); // CHANGE TO MAKE WORK 
        if (!response.ok) throw new Error("Failed to fetch online match");
        
        const data = await response.json();
        if (data && data.game_key) 
        {
            console.log("Online match found. Connecting...");
            return connectToOnlineGame(data.game_key);
        }
    }
    catch (error)
    {
        console.warn("No online match found, starting local game.", error);
    }

    // No online match found → Start Local Game
    startLocalGame();
}

// ONLINE CODE START
function connectToOnlineGame(gameKey)
{
    const socket = new WebSocket(`ws://localhost:5050/ws/game/${gameKey}/`);

    // init board
    board = document.getElementById("board");
    board.width = boardWidth;
    board.height = boardHeight;
    context = board.getContext("2d");

    socket.onopen = () =>
    {
        console.log("WebSocket connected to game:", gameKey);
        socket.send(JSON.stringify({ action: "ready" })); // Send "ready" signal
    };

    socket.onmessage = (event) =>
    {
        const message = JSON.parse(event.data);
        console.log("Received WebSocket message:", message);
        if (message.status === "game_starting") 
        {
            console.log("Game is starting!");
            // Attach key_hooks
            document.addEventListener("keydown", (event) => keyDownHandlerOnline(event, socket));
            document.addEventListener("keyup", (event) => keyUpHandlerOnline(event, socket));
            hideMenu();
        }
        else if (message.status === "game_update") 
            updateGameState(message.state);
            
    };

    window.addEventListener("beforeunload", () => 
    {
        if (socket.readyState === WebSocket.OPEN) 
            socket.send(JSON.stringify({ action: "move", direction: "STOP" })); // Send player STOP upon disconnection
    });

    socket.onclose = () => 
    {
        console.log("WebSocket Closed.");
        
        // Remove event listeners to avoid issues on reconnection
        document.removeEventListener("keydown", keyDownHandlerOnline); // Dont know how to handle reinstating keyhooks on reconnection but leaving it like this for now
        document.removeEventListener("keyup", keyUpHandlerOnline);
    };

    socket.onerror = (error) => console.error("WebSocket Error:", error);
}

function updateGameState(state)
{
    if (!state || !state.players || !state.ball)
        return; // Ensure valid data

    // Update player positions
    if (state.players.player1) 
    {
        Lplayer.x = state.players.player1.x;
        Lplayer.y = state.players.player1.y;
        Lplayer.score = state.players.player1.score;
    }
    
    if (state.players.player2) 
    {
        Rplayer.x = state.players.player2.x;
        Rplayer.y = state.players.player2.y;
        Rplayer.score = state.players.player2.score;
    }

    // Update ball position
    ball.x = state.ball.x;
    ball.y = state.ball.y;

    // Render the updated positions
    renderGame();
}

function renderGame()
{
    // Clear the board
    context.clearRect(0, 0, board.width, board.height);

    // Draw center dashed line
    context.fillStyle = accentColor;
    for (let i = 10; i < board.height; i += 25)
        context.fillRect(board.width / 2 - 10, i, 5, 5);
    // Draw ball
    context.fillRect(ball.x, ball.y, ballSide, ballSide);

    // Draw scores
    context.fillStyle = lightColor; 
    context.font = "45px 'ROG LyonsType Regular'";
    context.fillText(Lplayer.score, board.width / 5, 45);
    context.fillText(Rplayer.score, board.width / 5 * 4 - 45, 45);

    // Draw paddles
    context.fillRect(Lplayer.x, Lplayer.y, playerWidth, playerHeight);
    context.fillRect(Rplayer.x, Rplayer.y, playerWidth, playerHeight);
}

function keyDownHandlerOnline(event, socket)
{
    if (["KeyW", "KeyS", "ArrowUp", "ArrowDown"].includes(event.code)) 
        event.preventDefault(); // Avoid page moving up & down when using arrows

    if (socket.readyState !== WebSocket.OPEN) 
        return; // Prevent sending messages if WebSocket is closed

    let direction = null;

    if (event.code == "KeyW") 
    {
        keyState.w = true;
        direction = "UP"; // Equivalent to Lplayer.speed = -playerSpeed;
    }
    else if (event.code == "KeyS")
    {
        keyState.s = true;
        direction = "DOWN"; // Equivalent to Lplayer.speed = playerSpeed;
    }
    else if (event.code == "ArrowUp")
    {
        keyState.up = true;
        direction = "UP"; // Equivalent to Rplayer.speed = -playerSpeed;
    }
    else if (event.code == "ArrowDown")
    {
        keyState.down = true;
        direction = "DOWN"; // Equivalent to Rplayer.speed = playerSpeed;
    }

    if (direction !== null)
        socket.send(JSON.stringify({ action: "move", direction: direction }));
}

function keyUpHandlerOnline(event, socket)
{
    if (["KeyW", "KeyS", "ArrowUp", "ArrowDown"].includes(event.code)) 
        event.preventDefault();

    if (socket.readyState !== WebSocket.OPEN) 
        return; // Prevent sending messages if WebSocket is closed

    let direction = "STOP"; // Default when key is released

    if (event.code == "KeyW")
    {
        keyState.w = false;
        if (keyState.down || keyState.s)
            direction = "DOWN"; // If Down is still pressed, move down
    } 
    else if (event.code == "KeyS")
    {
        keyState.s = false;
        if (keyState.w)
            direction = "UP"; // If Up is still pressed, move up
    }
    else if (event.code == "ArrowUp")
    {
        keyState.up = false;
        if (keyState.down || keyState.s) 
            direction = "DOWN"; // If Down is still pressed, move down
    } 
    else if (event.code == "ArrowDown")
    {
        keyState.down = false;
        if (keyState.up || keyState.w)
            direction = "UP"; // If Up is still pressed, move up
    }

    socket.send(JSON.stringify({ action: "move", direction: direction }));
}
// ONLINE CODE END

function startLocalGame() 
{
    let gameConfig =
    {
        playerHeight: 50,
        startSpeed: 7.5,
        playerSpeed: 5,
        speedUpMultiple: 1.02,
        pointsToWin: 3,
        ballSide: 10,
        boardWidth: 700,
        boardHeight: 500,
        allowPowerUp: false,
        playAI: false,
        msAIcalcRefresh: 1000
    };

    initInstructionsTooltip();

    document.getElementById("startGameButton").addEventListener("click", () => 
    {
        applySettings(gameConfig);
        startGame(gameConfig);
    });
}

function applySettings(gameConfig)
{
    gameConfig.playerHeight = parseFloat(document.getElementById("playerSize").value);
    gameConfig.startSpeed = parseFloat(document.getElementById("ballSpeed").value);
    gameConfig.playerSpeed = parseFloat(document.getElementById("playerSpeed").value);
    gameConfig.speedUpMultiple = parseFloat(document.getElementById("ballSpeedUp").value);
    gameConfig.pointsToWin = parseInt(document.getElementById("pointsToWin").value);
    gameConfig.ballSide = parseFloat(document.getElementById("ballSize").value);
    gameConfig.allowPowerUp = document.getElementById("allowFreezeFlip").checked;
	gameConfig.playAI = document.getElementById("AIopponent").checked;

    let boardSize = document.getElementById("boardSize").value;
    switch (boardSize)
	{
        case "small":
            gameConfig.boardWidth = 500;
            gameConfig.boardHeight = 400;
            break;
        case "normal":
            gameConfig.boardWidth = 700;
            gameConfig.boardHeight = 500;
            break;
        case "big":
            gameConfig.boardWidth = 900;
            gameConfig.boardHeight = 700;
            break;
        default:
            gameConfig.boardWidth = 700;
            gameConfig.boardHeight = 500;
            break;
    }

	let AIdifficulty = document.getElementById("AIdifficulty").value;
	switch (AIdifficulty)
	{
		case "easy":
			gameConfig.msAIcalcRefresh = 1200;
			break;
		case "normal":
			gameConfig.msAIcalcRefresh = 1000;
			break;
		case "hard":
			gameConfig.msAIcalcRefresh = 750;	
			break;
		case "impossible":
			gameConfig.msAIcalcRefresh = 100;
			break;
		default:
			gameConfig.msAIcalcRefresh = 1000;
			break;
	}
}

function hideMenu()
{
    // Hide menu and show game
    document.getElementById("customizationMenu").hidden = true;
    document.getElementById("instructions").hidden = true;
    document.getElementById("board").hidden = false;
    document.getElementById("neonFrame").hidden = false;
}

function startGame(gameConfig)
{ 
    hideMenu();
    initGame(gameConfig); // To restart all values that are changed in previous games & apply settings changes

    if (playAI) 
    {
        predictedY = predictFinalYPos(ball); // Calls fn instantly so AI doesn't concede the serve
    
        if (aiIntervalId) 
            clearInterval(aiIntervalId);
    
        aiIntervalId = setInterval(function () 
        {
            predictedY = predictFinalYPos();
        }, msAIcalcRefresh);
    }

    requestAnimationFrame(update); // Start game loop
    document.addEventListener("keydown", keyDownHandler);
    document.addEventListener("keyup", keyUpHandler);
	
	// Stop the game when the back/forward button is clicked
	window.addEventListener("popstate", () => {stop()});
}

function initGame(gameConfig)
{
	playerHeight = gameConfig.playerHeight;
    startSpeed = gameConfig.startSpeed;
    playerSpeed = gameConfig.playerSpeed;
    speedUpMultiple = gameConfig.speedUpMultiple;
    pointsToWin = gameConfig.pointsToWin;
    ballSide = gameConfig.ballSide;
    boardWidth = gameConfig.boardWidth;
    boardHeight = gameConfig.boardHeight;
    allowPowerUp = gameConfig.allowPowerUp;
	playAI = gameConfig.playAI;
	msAIcalcRefresh = gameConfig.msAIcalcRefresh;

    // Set up game elements
    board = document.getElementById("board");
    board.width = boardWidth;
    board.height = boardHeight;
    context = board.getContext("2d");

    // To avoid the ball transvering the paddle
    // The paddle and margin are a little bit wider
    xMargin = ballSide * 1.2;
    playerWidth = ballSide * 1.2;

    // To avoid paddle moving out of bounds
    yMax = boardHeight - playerHeight;

    keyState = 
    {
        w: false,
        s: false,
        up: false,  // ArrowUp
        down: false, // ArrowDown
        lPowerUpUsed : false,
        rPowerUpUsed : false,
        powerUpInUse : false
    };
    
    // Left player
    Lplayer =
    {
        x : xMargin,
        y : boardHeight/2 - playerHeight/2,
        width : playerWidth,
        height : playerHeight,
        speed : 0,
        score: 0
    };

    // Right player
    Rplayer =
    {
        x : boardWidth - playerWidth - xMargin,
        y : boardHeight/2 - playerHeight/2,
        width : playerWidth,
        height : playerHeight,
        speed : 0,
        score : 0
    };

    let startRadAngle = getRandomBetween((-Math.PI/4), (Math.PI/4));

    let xStartVel = startSpeed * Math.cos(startRadAngle) * getRandomEitherOr(-1, 1);
    let yStartVel = startSpeed * Math.sin(startRadAngle);

    ball = 
    {
        x : boardWidth / 2 - ballSide / 2,
        y : boardHeight / 2 - ballSide / 2,
        width : ballSide,
        height : ballSide,
        xVel : xStartVel,
        yVel : yStartVel,
        speed : startSpeed,
        serve : true
    };

    resetGame(getRandomEitherOr(-1, 1));
    Lplayer.y = boardHeight/2 - playerHeight/2;
    Rplayer.y = boardHeight/2 - playerHeight/2;

    board = document.getElementById("board");
    board.width = boardWidth;
    board.height = boardHeight;
    context = board.getContext("2d");

    // draw players
    context.fillStyle = lightColor;
    context.fillRect(Lplayer.x, Lplayer.y, Lplayer.width, Lplayer.height);
    context.fillRect(Rplayer.x, Rplayer.y, Rplayer.width, Rplayer.height);
}

function update()
{
    id = requestAnimationFrame(update);
    context.clearRect(0, 0, board.width, board.height);
    context.fillStyle = lightColor;
    
    Lplayer.y += Lplayer.speed;
    Rplayer.y += Rplayer.speed;

    fixOutOfBounds(Lplayer, yMax);
    fixOutOfBounds(Rplayer, yMax);

    context.fillRect(Lplayer.x, Lplayer.y, Lplayer.width, Lplayer.height);
    context.fillRect(Rplayer.x, Rplayer.y, Rplayer.width, Rplayer.height);

    // ball
    if (keyState.powerUpInUse)
        context.fillStyle = dangerColor;
    else
        context.fillStyle = accentColor;

    if (ball.serve && !keyState.powerUpInUse)
    {
        ball.x += ball.xVel * serveSpeedMultiple;
        ball.y += ball.yVel * serveSpeedMultiple;
    }
    else if (!keyState.powerUpInUse)
    {
        ball.x += ball.xVel;
        ball.y += ball.yVel;
    }
    context.fillRect(ball.x, ball.y, ball.width, ball.height);

    if (ball.xVel < 0)
        handlePaddleHit(Lplayer);
    else
    {
        if (handlePaddleHit(Rplayer))
            ball.xVel *= -1;
    }
        
    // Bounce of top & bottom
    if (ball.y <= 0 || (ball.y + ball.height >= board.height))
        ball.yVel *= -1;

    if (playAI)
        simulateAIInput();

    // Point scored, player who conceded serves
    if (ball.x < 0)
    {
        Rplayer.score++;
        resetGame(-1);
    }
    else if (ball.x + ball.width > board.width)
    {
        Lplayer.score++;
        resetGame(1);
    }

    for (let i = 10; i < board.height; i+=25)
        context.fillRect(board.width/2 - 10, i, 5, 5);

    context.fillStyle = lightColor; // score
    context.font = "45px 'ROG LyonsType Regular'";
    context.fillText(Lplayer.score, board.width/5, 45);
    context.fillText(Rplayer.score, board.width/5 * 4 -45, 45);

    if (Rplayer.score == pointsToWin || Lplayer.score == pointsToWin)
    {
        stop();
        predictedY = boardHeight / 2; // reset to middle for next game
        endMatch(Lplayer.score, Rplayer.score);
    }
}

function endMatch(LplayerScore, RplayerScore)
{
    // Clear the canvas
    context.clearRect(0, 0, board.width, board.height);

	let message;
    // Set message based on the outcome
    if (playAI)
    {
	    if (LplayerScore > RplayerScore)
		    message = "You won!";
	    else
		    message = "You lost :(";
    }
    else
    {
        if (LplayerScore > RplayerScore)
		    message = "Left player won!";
	    else
		    message = "Right player won!";
    }

    // Display the message on the board
    context.fillStyle = accentColor;
    context.font = "45px 'ROG LyonsType Regular'";
    context.textAlign = "center";
    context.fillText(message, board.width / 2, board.height / 2);

    // Wait 1.5s before showing menu again
    setTimeout(() => { reShowMenu();}, 1500);
}

function stop() 
{
	if (id)
		cancelAnimationFrame(id);
    if (aiIntervalId) 
        clearInterval(aiIntervalId);
}

function fixOutOfBounds(player, yMax)
{
    if (player.y < 0)
        player.y = 0;
    else if (player.y > yMax)
        player.y = yMax;
}

function keyDownHandler(event, isAI = false)
{
    if (!isAI && ["KeyW", "KeyS", "ArrowUp", "ArrowDown", "KeyD", "ArrowLeft"].includes(event.code)) 
        event.preventDefault(); // To avoid page moving up & down when using arrows

    if (event.code == "KeyW")
    {
        Lplayer.speed = -playerSpeed;
        keyState.w = true;
    }
    else if (event.code == "KeyS")
    {
        Lplayer.speed = playerSpeed;
        keyState.s = true;
    }
    else if (event.code == "ArrowUp" && (isAI || !playAI)) // To avoid tampering with AI
    {
        Rplayer.speed = -playerSpeed;
        keyState.up = true;
    }
    else if (event.code == "ArrowDown" && (isAI || !playAI))
    {
        Rplayer.speed = playerSpeed;
        keyState.down = true;
    }
    else if (event.code == "KeyD")
    {
        if (allowPowerUp && ball.xVel > 0 && !keyState.lPowerUpUsed)
        {
            keyState.lPowerUpUsed = true;
            freezeAndChangeDir();
        }
    }  
    else if (event.code == "ArrowLeft")
    {
        if (allowPowerUp && ball.xVel < 0 && !keyState.rPowerUpUsed && (isAI || !playAI))
        {
            keyState.rPowerUpUsed = true;
            freezeAndChangeDir();
        }
    }
}

// Player stops when button is released/no longer pressed down
function keyUpHandler(event, isAI = false)
{
    if (!isAI && ["KeyW", "KeyS", "ArrowUp", "ArrowDown", "KeyD", "ArrowLeft"].includes(event.code)) 
        event.preventDefault(); // To avoid page moving up & down when using arrows

    if (event.code == "KeyW")
    {
        keyState.w = false;
        if (keyState.s == true)
            Lplayer.speed = playerSpeed;
        else
            Lplayer.speed = 0;
    }
    else if (event.code == "KeyS")
    {
        keyState.s = false;
        if (keyState.w == true)
            Lplayer.speed = -playerSpeed;
        else
            Lplayer.speed = 0;
    }
    else if (event.code == "ArrowUp" && (isAI || !playAI)) // To avoid tampering with AI
    {
        keyState.up = false;
        if (keyState.down == true)
            Rplayer.speed = playerSpeed;
        else
            Rplayer.speed = 0;
    }
    else if (event.code == "ArrowDown" && (isAI || !playAI))
    {
        keyState.down = false;
        if (keyState.up == true)
            Rplayer.speed = -playerSpeed;
        else
            Rplayer.speed = 0;
    }
}

function freezeAndChangeDir()
{
    keyState.powerUpInUse = true;

    ball.yVel *= -1;
    setTimeout(() => 
    {
        keyState.powerUpInUse = false;
    }, 750);
}

function handlePaddleHit(player)
{
    if (keyState.powerUpInUse) // To avoid glitch with multiple speed ups at once
        return ;

    if ((ball.x < player.x + player.width) &&  // The ball's top left corner doesn't reach the paddles top right corner
        (ball.x + ball.width > player.x) &&    // The ball's top right corner passes the paddles top left corner
        (ball.y < player.y + player.height) && // The ball's top left corner doesn't reach the paddles bottom left corner
        (ball.y + ball.height > player.y))     // The ball's bottom left corner passes the paddles top left corner
    {
        // Position of the middle of the ball in relation to the middle of the paddle (-playerHeight/2 - ballSide/2 & playerHeight/2 + ballside/2)
        let collisionPoint = ball.y - player.y - playerHeight/2 + ballSide/2;
        if (collisionPoint > playerHeight/2)
            collisionPoint = playerHeight/2;
        else if (collisionPoint < -playerHeight/2)
            collisionPoint = -playerHeight/2;

        // Convert to index between -1 & 1
        collisionPoint /= playerHeight/2;

        // Rebound angle, depends on where it hits the paddle
        // Max 45 deg, min -45 deg if it hits the edges
        let radAngle = (Math.PI/4) * collisionPoint;

        // Speed increases with every hit
        if (ball.speed < 20) // Max speed to avoid ball going through paddle glitch
            ball.speed *= speedUpMultiple;

        // x & y component calc, x speed is later flipped if necessary for the ball to bounce
        ball.xVel = ball.speed * Math.cos(radAngle);
        ball.yVel = ball.speed * Math.sin(radAngle);
        ball.serve = false;
        return true;
    }
    return false;
}

function resetGame(direction)
{
    let startRadAngle = getRandomBetween((-Math.PI/4), (Math.PI/4));
    let xStartVel = startSpeed * Math.cos(startRadAngle) * direction;
    let yStartVel = startSpeed * Math.sin(startRadAngle);

    ball = 
    {
        x : boardWidth / 2 - ballSide / 2,
        y : boardHeight / 2 - ballSide / 2,
        width : ballSide,
        height : ballSide,
        xVel : xStartVel,
        yVel : yStartVel,
        speed : startSpeed,
        serve : true
    }

    keyState.lPowerUpUsed = false;
    keyState.rPowerUpUsed = false;
}

function getRandomBetween(min, max) 
{
    return (Math.random() * (max - min) + min);
}

function getRandomEitherOr(value1, value2)
{
    if (Math.random() > 0.5)
        return (value1);
    else
        return (value2);
}

function predictFinalYPos()
{
    // AImargin is used in simulateAIinput
    // The calculation is put into this function 
    // to avoid constant recalculation of a random value and thus the AI jittering
    // Randomness (AImargin) makes the AI hit at different angles
    // If you want it to sometimes miss, change the min value to negative
    // For it to regularly miss, the multiple has to be -0.3 or below
    // If getRandom returns -0.1 it only misses for very straight shots
    AImargin = playerHeight * getRandomBetween(-0.1, 0.45);

    // As AI can only refresh its view every time predicFinalYPos is called the AI uses its PowerUp here
    // ball.yVel > 3 as its only logical to use the powerUp when the ball is moving at a steep angle 
    // ball.x checks are that so the power up is only used on opponents side but not too close to opponent
    // ball.y checks are because the powerUp is pretty useless close to the bottom & top as its gonna bounce anyway
    if (allowPowerUp && !keyState.rPowerUpUsed && ball.xVel < 0 && !ball.serve
        && ball.x < boardWidth/2 && ball.x > boardWidth/7 
        && ball.y > boardHeight/6 && ball.y < 5*boardHeight/6
        && Math.abs(ball.yVel) > 3.5)
        keyDownHandler({ code : "ArrowLeft" }, true);

    if (ball.xVel < 0) // If ball is going away from AI
        return (boardHeight/2); // Prompt AI to go back to middle

    // Amount of times the screen refreshes before ball reaches other side: Length / xVel
    let refreshes = (boardWidth - xMargin - playerWidth - ball.x) / ball.xVel;
    let yMovement = (ball.yVel * refreshes);
    let finalYPos = ball.y + ballSide / 2;

    while (true) 
    {
        if (yMovement < 0 && finalYPos + yMovement < ballSide/2) // Bounce off top
        {
            yMovement += finalYPos - ballSide/2;
            yMovement *= -1;
            finalYPos = ballSide/2;
        } 
        else if (yMovement > 0 && finalYPos + yMovement > boardHeight - ballSide/2) // Bounce off bottom
        {
            yMovement -= (boardHeight - finalYPos - ballSide/2);
            yMovement *= -1;
            finalYPos = boardHeight - ballSide/2;
        } 
        else 
        {
            finalYPos += yMovement;
            break;
        }
    }
    return (finalYPos);
}

function simulateAIInput() 
{
    if (predictedY < Rplayer.y + playerHeight - AImargin && predictedY > Rplayer.y + AImargin)
    {
        keyUpHandler({ code: "ArrowUp" }, true);
        keyUpHandler({ code: "ArrowDown" }, true);
    }
    else if (predictedY < Rplayer.y + playerHeight/2)
    {
        keyDownHandler({ code: "ArrowUp" }, true);
        keyUpHandler({ code: "ArrowDown" }, true);
    } 
    else if (predictedY > Rplayer.y + playerHeight/2) 
    {
        keyDownHandler({ code: "ArrowDown" }, true);
        keyUpHandler({ code: "ArrowUp" }, true);
    }
}
