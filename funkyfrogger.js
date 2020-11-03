//DEBUG
//Automatisk scrolling
var time = 0;

//************************//
//      Hovudspelet       //
//************************//

//Faste konstantar me ikkje forventar skal endre seg i løpet av spelet. 
var constants = {
	scrollSpeed	: 0.5,
	tileCount	: 12, //Kor mange "tiles" som er synlege på canvas. Vert nytta til å rekna ut størrelsen ved teikning på canvas.
	envColors	: ["lawngreen", "aqua", "coral", "teal", "slategrey", "forestgreen"]
};

//Initialisering av hindre med kollisjon
var cars = [];
// Initialisering av elementer som kan plukkes opp
//var coins = [];

var game = {
	//Spelvariabler. Initialisert til 0
	score       : 0,
	tileSize	: 0,
	distance	: 0,
	started		: 0,	//Når spelet er i gang vil "started" vise til setInterval funksjonen som køyrer og oppdaterer spelet.
	fps			: 20,
	env			: [],

	//Spelfunksjonar for å styre spelet.
	update	: update_game,

	start	: function(fps = 20) {
		if(this.started == 0)
		{
			this.fps = fps;
			this.started = setInterval(this.update, 1000/fps);
			this.audio.play();
			this.audio.volume = 0.3;
		}
		else
		{
			console.log("Error: Game already started");
		}
	},

	stop	: function() {
		if(this.started != 0)
		{
			clearInterval(this.started);
			this.started = 0;
			this.audio.pause();
		}
	},

	pause	: function() {
		if(this.started != 0)
		{
			this.stop()
		}
		else
		{
			//Resume game
			this.start(game.fps);
		}
	}
};

function set_canvas() {
	//Rekn ut kor stor ein "tile" er på canvas.
	//Vert rekna ut kvar gong i tilfelle canvas har endra størrelse.
	game.canvas.height = game.canvas.clientHeight;
	game.canvas.width = game.canvas.clientWidth;
	game.tileSize = game.canvas.height / constants.tileCount;

	//Reknar ut kor mange tiles det er frå senter ut til sida.
	game.width = (game.canvas.width / game.tileSize) / 2;
}

//Vent til nettsida er lasta før ein hentar canvas og koplar opp funksjonar
window.onload = function() {
	game.canvas = document.getElementById("gamecanvas");
	game.tileSize = game.canvas.height / constants.tileCount;
	let coinImg = document.getElementById('coins');
	let startButton = $("#start-btn");
	let stopButton = $("#stop-btn");

	//Legg til interaktivitet
	window.onkeydown = key_down_logger;
	window.onkeyup = key_up_logger;

	//Legg til fyrste enviroment
	set_canvas();
	add_environment(0);

	create_frog();

	update_game();

	startButton.on('click', function(){
		game.start();
		//startButton.toggleClass("active");
	});

	stopButton.on('click', function(){
		game.stop();
	});
}

//Hovudloopen til spelet. Alt starter frå her.
function update_game() {
	set_canvas();

	// Miljø
	handle_enviroment();

	// Hindre og plattformer
	//move_obstacles();
	//draw_obstacles();


	//Eksempelfunksjonar
	//handle_platforms();
	//handle_enemies();
	//handle_froggy();
	//collision_detect();
	//add_score();
	//end_game_if_no_more_lives();

	//DEBUG
	//debug_draw_test();

	handle_frog();

	//Automatisk scrolling ved å auka distance
	//time += 1;
	//game.distance += 5 * (1 - 1 * Math.cos(time/10))
}

//************************//
//    Hjelpefunksjonar    //
//************************//

//Returnerer eit heiltal frå min til max. 
//Eks min=3, max=6, returnerer 3,4,5 eller 6
function get_random(min, max) {
	return min + Math.floor((max+1-min)*Math.random());
}

// Teiknar eit objekt på canvas basert på flisoppsett frå game.tileSize
// Width og height vert målt i flisstørrelse, dvs width = 4 er fire gongar så breitt som ei flis.
// Posisjon vert og målt i flislengd. Dvs y = 3 vil tilsvare 3 flislengder opp på canvas.
// Objektet vert scrolla nedover basert på game.distance
// Nullpunkt for x-posisjon er satt til midt på canvas og negativ x vil dermed vera i venstre halvdel.
// Objektet er i tillegg sentrert på x,y slik at ein ikkje treng å basera posisjon på hjørne til figuren.
function draw_object(object) {
	var context = game.canvas.getContext("2d");

	var width  = Math.round(object.width  * game.tileSize);
	var height = Math.round(object.height * game.tileSize);

	var x = Math.round(game.canvas.width/2 + (object.x * game.tileSize) - width/2);
	var y = Math.round(game.canvas.height  - ((object.y - game.distance) * game.tileSize) - height/2);

	if(object.hasOwnProperty("image")) {
		context.drawImage(object.image, x, y, width, height);
	}
	else if(object.hasOwnProperty("color")) {
		context.fillStyle = object.color;
		context.fillRect(x, y, width, height);
	}
	else {
		context.fillStyle = "magenta";
		context.fillRect(x, y, width, height);
	}
}


//Funksjon for å sjekke om to objekt er borti kvarandre. Kan nyttast til platformar, hinder, mynter og anna
//Hitbox definerar kor stor kontaktboksen til frosken skal vera. Mindre enn 1 betyr dei må overlappe, meir enn 1
//så vil dei kollidera på avstand
function collision_detect(objA, objB, hitbox = 1) {
	var xDistance = Math.abs(objB.x - objA.x);
	var yDistance = Math.abs(objB.y - objA.y);

	var xSize = (objA.width * hitbox + objB.width) / 2;
	var ySize = (objA.height * hitbox + objB.height) / 2;

	if(xDistance < xSize && yDistance < ySize)
	{
		return true;
	}
	else
	{
		return false;
	}
}

//Flyttar plattformar og hindringar
function move_objects(objects) {
	//Reknar ut kor langt det er ut til plattformen skal gå rundt
	var maxX = game.width + 5;

	for (o of objects) {

		o.x += o.speed;

		//Dersom platformen har køyrd ut på eine sida, send han inn att på den andre sida.
		if(o.x > maxX)
		{
			//Høgre side
			o.x -= 2*maxX;
		}
		else if(o.x < -maxX)
		{
			//Venstre side
			o.x += 2*maxX;
		}
	}
}

// Testfunksjon for å visualisere bruken av draw_object(object)
function debug_draw_test() {
	//Array med testobjekt
	var testObjects = [{
		x : -2,
		y : 0.5,
		width: 1,
		height: 1,
	}, {
		x : -1,
		y : 1,
		width: 1,
		height: 1,
	}, {
		x : 0,
		y : 2,
		width: 0.5,
		height: 1.5,
		color: "purple"
	}, {
		x : 1,
		y : 2.5,
		width: 0.2,
		height: 0.2,
	}, {
		x : 2,
		y : 0,
		width: 1,
		height: 1,
	}];

	var topLeftCornerX = 0.5 - (game.canvas.width / game.tileSize)/2;
	var topLeftCornerY = 11.5;
	var testObjectTopLeft = {
		x : topLeftCornerX,
		y : topLeftCornerY,
		width: 1,
		height: 1,
		color: "red"
		};

	var topRightCornerX = (game.canvas.width / game.tileSize)/2 - 0.5;
	var topRightCornerY = 11.5;
	var testObjectTopRight = {
		x : topRightCornerX,
		y : topRightCornerY,
		width: 1,
		height: 1,
		color: "green"
		};

	for (object of testObjects){
		draw_object(object);
	}

	draw_object(testObjectTopLeft);
	draw_object(testObjectTopRight);
	
}

//************************//
//         Input          //
//************************//

function key_down_logger(event) {
	switch(event.key) {
		// Nyttar escape til å pause og starte spelet
		case "Escape":
			game.pause();
			break;

		// Når me trykkjer ned ein tast vil frosken flytta på seg. 
		case "ArrowUp":
		case "w":
			game.frog.ySpeed = game.frog.speed;
			break;

		case "ArrowDown":
		case "s":
			game.frog.ySpeed = -game.frog.speed;
			break;

		case "ArrowLeft":
		case "a":
			game.frog.xSpeed = -game.frog.speed;
			break;

		case "ArrowRight":
		case "d":
			game.frog.xSpeed = game.frog.speed;
	}
}

function key_up_logger(event) {
	switch(event.key) {

		//Når me slepp opp ein tast vil frosken stoppa opp.
		case "ArrowUp":
		case "ArrowDown":
		case "w":
		case "s":
			game.frog.ySpeed = 0;
			break;

		case "ArrowLeft":
		case "ArrowRight":
		case "a":
		case "d":
			game.frog.xSpeed = 0;
	}
}

//************************//
//       Enviroment       //
//************************//

//Hovudfunksjonen til handtering av miljø
function handle_enviroment() {
	//Dersom det ikkje er nok miljø, legg til så det er nok.
	while(!enviroment_is_complete()) {
		add_environment();
	}

	//Dersom me har scrolla forbi gamle miljø vert dei sletta.
	while(game.env[0].end < game.distance) {
		game.env.shift();

		//Fix for overscroll bug
		game.distance = game.env[0].start;
		game.frog.y = game.distance + 0.5;
	}

	//Teikn opp alle miljø på canvas.
	for (env of game.env) {
		draw_environment(env);

		if(env.hasOwnProperty("platforms")) {
			move_objects(env.platforms);
			for(obj of env.platforms) {
				draw_object(obj);
			}
		}
		if(env.hasOwnProperty("obstacles")) {
			move_objects(env.obstacles);
			for(obj of env.obstacles) {
				draw_object(obj);
			}
		}
		if(env.hasOwnProperty("coins")) {
			draw_coins_in(env);
		}
	}
}

//Teikner opp det valgte "env" miljø på canvas.
function draw_environment(env) {
	var context = game.canvas.getContext("2d");

	var y = game.canvas.height - (env.end - game.distance) * game.tileSize;

	var width = game.canvas.width;
	var height = env.tiles * game.tileSize;

	//Teiknar berre rein farge. Trend meir avansert grafikk
	context.fillStyle = constants.envColors[env.type];
	context.fillRect(0, y, width, height);
}

//Legg til eit nytt (tilfeldig) miljø i game.env.
function add_environment(start = undefined) {
	//Dersom start ikkje er satt ved funksjons-kall, bruk slutten frå førre miljø
	if(start == undefined)
	{
		var prevEnv = game.env[game.env.length-1];

		start = prevEnv.end;
	}

	var env = {
		start	: start,
		tiles	: 6,
		//tiles	: get_random(3,8),
		type	: get_random(0,5)
	};
	env.end = env.start + env.tiles;

	//Dersom me tilfeldigvis fekk same miljø att, prøv igjen.
	try {
		while(env.type == prevEnv.type)
		{
			env.type = get_random(0,5);
		}
	}
	catch {
		//Dersom dette er fyrste enviroment vil prevEnv vera "undefined". 
		//Nyttar difor try-catch blokk for å ignorera error sidan me ikkje bryr oss.
	}


	env.platforms = [];
	env.obstacles = [];

	//Sjekkar om miljøet er eit vått miljø (env.type er oddetal) og dermed lagar plattformar
	if(env.type % 2 == 1)
	{
		env.platforms.push(create_safe_platform(env.start));
		create_platforms_in(env);
	}
	//For tørt miljø lagar me bilar
	else
	{
		create_obstacles_in(env);
	}

	// lager coins uansett type miljø foreløpig
	
	env.coins = [];
	var totalCoins = 4;
	for(var i = 0; i<totalCoins; ++i)
		{
			create_coin_in(env);
		}
	
	game.env.push(env);	
}

//Sjekker om me har nok miljø eller er nøydt til å leggja til fleire.
function enviroment_is_complete() {
	var lastEnv = game.env[game.env.length-1];

	return constants.tileCount < (lastEnv.end - game.distance);
}


//************************//
//        Obstacles       //
//************************//

//Funksjon til å lage hindringar til eit miljø.
function create_obstacles_in(env) {
	for(var row = 1; row < env.tiles; ++row) {
		var x = -game.width - 4;

		var carColors = ["blue", "purple", "black"];
		var carTypes = [
			car1 = document.getElementById("car1"),
			car2 = document.getElementById("car2"),
			bus = document.getElementById("bus")
		];
		while(x < game.width + 4) {
			var platform = {
				x		: x,
				y		: env.start + row + 0.5,

				width	: 1 + 1 * Math.random(),
				height	: 0.8,

				speed	: 0.05 + 0.04*row,

				color	: carColors[get_random(0,2)],
				image	: carTypes[get_random(0,2)]
			}

			x += 4 + 2 * Math.random();

			//Alternerer fartsretning
			if(row % 2 == 0) {
				platform.speed = -platform.speed;
			}

			env.obstacles.push(platform);
		}
	}
}

//************************//
//        Coins           //
//************************//



//************************//
//        Platforms       //
//************************//

//Funksjon til å lage platformer til eit miljø.
function create_platforms_in(env) {
	for(var row = 1; row < env.tiles; ++row) {
		var x = -game.width - 4;

		var logTypes = [
			log1 = document.getElementById("log1"),
		];
		while(x < game.width + 4) {
			var platform = {
				x		: x,
				y		: env.start + row + 0.5,

				width	: 1 + 2 * Math.random(),
				height	: 1.05,

				speed	: 0.05 + 0.04*row,

				color	: "white",
				image	: logTypes[0]
			};

			x += 3.1 + 3 * Math.random();

			//Alternerer fartsretning
			if(row % 2 == 0) {
				platform.speed = -platform.speed;
			}

			//Krokodille
			if(Math.random() < 0.05) {
				platform.width = 1.5;

				var crocHead = {
					x		: platform.x,
					y		: platform.y,

					width	: 0.4,
					height	: 0.8,

					speed	: platform.speed,

					color	: "grey"
				};

				if(crocHead.speed < 0) {
					crocHead.x -= (platform.width + crocHead.width)/2
				}
				else {
					crocHead.x += (platform.width + crocHead.width)/2
				}

				env.obstacles.push(crocHead);
			}

			env.platforms.push(platform);
		}
	}
}

//Startplattform til våte miljø
function create_safe_platform(row) {
	var platform = {
		x : 0,
		y : row + 0.5,

		width : game.width * 1.8,
		height : 0.9,

		speed : 0,
		color : constants.envColors[0],
	};

	return platform;
}

function create_coin_in(env) {

	var row = get_random(0, env.tiles);
	var coin = {
		x		: Math.random() * 10 - 5,
		y		: env.start + row + 0.5,

		width	: 0.5,
		height	: 0.5,

		speed	: 0,

		image	: document.getElementById('musicnote')
	}

	env.coins.push(coin);
}

function draw_coins_in(env) {
	for (coin of env.coins) {
		draw_object(coin);
	}
}


//************************//
//       Multimedia       //
//************************//

game.audio = new Audio("audio/aces-high.mp3");
game.audio.loop = true;


//************************//
//       High Score       //
//************************//

//Poengsum vert lagra i window.localStorage. Då vert han "permanent" lagra i nettlesaren og kan hentast fram ved seinare tilhøve.
//Nyttar JSON format for å lagra ein "array" av "high scores" som eit "string" objekt.

function add_high_score(name, score) {
	try{
		var highScore = JSON.parse(window.localStorage.getItem("highScore"))
	} catch(error) {
		var highScore = [];
	}

	//Legg til den nye poengsummen og sorterar lista slik at han kjem på rett plass.
	highScore.push([name, score]);
	highScore.sort(
			function(a, b){
				return b[1] - a[1];
			}
			);

	window.localStorage.setItem("highScore", JSON.stringify(highScore));
}

function get_high_score_list() {
	try{
		var highScore = JSON.parse(window.localStorage.getItem("highScore"))
	} catch(error) {
		var highScore = [];
	}

	return highScore;
}

function clear_all_high_score() {
	window.localStorage.setItem("highScore", JSON.stringify([]));
}

//************************//
//       Funky Frog       //
//************************//

function create_frog() {
	var frog = {
		x : 0,
		y : 0.5,
		width  : 0.75,
		height : 0.75,

		xSpeed : 0,
		ySpeed : 0,
		speed : 0.25,

		//https://www.flaticon.com/free-icon/frog_1036001
		image : document.getElementById("frog")
	};

	game.frog = frog;
}

function handle_frog() {
	var frog = game.frog;

	//Reknar ut kva miljø frosken er i no.
	var i = 0;
	var currentEnv = game.env[i];
	while(frog.y > currentEnv.end)
	{
		currentEnv = game.env[++i];
	}

	//Dersom frosken har vandra over i neste miljø vil skjermen scrolla nedover
	//fram til førre miljø forsvinner ut av canvas og vert sletta i handle_enviroment.
	//Når dette skjer kan me ikkje flytta på frosken og han vil ikkje kollidera med noko.
	if(currentEnv != game.env[0])
	{
		game.distance += constants.scrollSpeed;
		frog.y = currentEnv.start + 1;
	}
	else {
		//Me oppdaterar frosken sin posisjon med farten dei har i x eller y retning
		frog.x += frog.xSpeed;
		frog.y += frog.ySpeed;

		//Dersom frosken er i eit vått miljø med platformar itererar me over plattformane for å sjå om han står på ein.
		//Dersom han gjer det, så seglar han bortetter saman med plattformen.
		//Dersom han ikkje gjer det, så må han mista eit liv.
		if(currentEnv.hasOwnProperty("platforms"))
		{
			var safe = false;
			for(platform of currentEnv.platforms)
			{
				//Collision detect med 0.5 for at mesteparten av frosken må vera oppå platformen.
				if(collision_detect(frog, platform, 0.5))
				{
					safe = true;
					frog.x += platform.speed;

					//Endrar farge for å visa kontakt. Debugfunksjon
					platform.color = constants.envColors[0];
					break;
				}
				else
				{
					//Tilbakestiller til vanleg farge. Debugfunksjon
					if(platform != currentEnv.platforms[0]) {
						platform.color = 'white';
					}
				}
			}
		}

		//Tester om frosken kolliderar med ein bil
		if(currentEnv.hasOwnProperty("obstacles"))
		{
			var safe = true;
			for(obstacle of currentEnv.obstacles)
			{
				//Collision detect med 0.9 for å gje litt slark med kollisjonen.
				if(collision_detect(frog, obstacle, 0.9))
				{
					safe = false;

					//Endrar farge for å visa kontakt. Debugfunksjon
					obstacle.color = "red";
					break;
				}
			}
		}

		if(currentEnv.hasOwnProperty("coins"))
		{
			for(coin of currentEnv.coins)
			{
				//Collision detect med 1
				if(collision_detect(frog, coin, 1))
				{ 
					//fjerner myntene frosken har plukket opp fra spillbrettet
					var idx = currentEnv.coins.indexOf(coin);
					currentEnv.coins.splice(idx, 1);
					game.score+=10;
					console.log("Points: "+game.score);
					break;
				}
				
			}
		}
	}

	//Stenger frosken inne i spelvindauge.
	if(frog.y - frog.height/2 < game.distance) {
		frog.y = game.distance + frog.height/2;
	}
	if(frog.x + frog.width/2 > game.width) {
		frog.x = game.width - frog.width/2;
	}
	else if(frog.x - frog.width/2 < -game.width) {
		frog.x = frog.width/2 - game.width;
	}

	draw_object(frog);
}
