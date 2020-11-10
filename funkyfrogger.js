//DEBUG
//Automatisk scrolling
var time = 0;

//************************//
//      Hovudspelet       //
//************************//

//Faste konstantar me ikkje forventar skal endre seg i løpet av spelet. 
var constants = {
	scrollSpeed	: 0.5,
	tileCount	: 13, //Kor mange "tiles" som er synlege på canvas. Vert nytta til å rekna ut størrelsen ved teikning på canvas.
	envColors	: ["lawngreen", "aqua", "coral", "teal", "slategrey", "forestgreen"],

	sinkTime	: 3000,
	sinkChance	: 0.0005,
		//Oppsett av vanskegrad. Større fart og akselerasjon vil vera vanskelegare. Større avstand på platformar vil vera vanskelegare. Større avstand på hinder vil vera lettare.
	difficulty	: {
		easy	: {
			platformSpeed	: 0.02,
			platformAccel	: 0.02,
			platformGap		: 4,
			obstacleSpeed	: 0.02,
			obstacleAccel	: 0.02,
			obstacleGap		: 6,
		},
		normal	: {
			platformSpeed	: 0.03,
			platformAccel	: 0.03,
			platformGap		: 6,
			obstacleSpeed	: 0.03,
			obstacleAccel	: 0.03,
			obstacleGap		: 5,
		},
		hard	: {
			platformSpeed	: 0.04,
			platformAccel	: 0.04,
			platformGap		: 8,
			obstacleSpeed	: 0.04,
			obstacleAccel	: 0.04,
			obstacleGap		: 4,
		},
		impossible	: {
			platformSpeed	: 0.05,
			platformAccel	: 0.05,
			platformGap		: 10,
			obstacleSpeed	: 0.05,
			obstacleAccel	: 0.05,
			obstacleGap		: 3,
		}
	}
};

var game = {
	//Spelvariabler. Initialisert til 0
	difficulty	: constants.difficulty.easy,
	debug		: false,
	score       : 0,
	tileSize	: 0,
	distance	: 0,
	started		: 0,	//Når spelet er i gang vil "started" vise til setInterval funksjonen som køyrer og oppdaterer spelet.
	fps			: 20,
	env			: [],

	//Spelfunksjonar for å styre spelet.
	update	: update_game,

	reset	: reset_game,
	end		: end_game,

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

function reset_game() {
	game.score = 0;

	// setter poengteller i statusbar tilbake til null
	$("#score > span").text(game.score);

	//fyller opp til tre liv igjen
	$(".life").removeClass("fa-heart-o").addClass("fa-heart");

	game.distance = 0;
	game.env = [];

	set_canvas();
	add_environment(0);

	//Lagar ny frosk, gamle vert sletta
	create_frog();

	//Teikner opp fyrste bilete
	update_game();
}

//Vent til nettsida er lasta før ein hentar canvas og koplar opp funksjonar
window.onload = function() {
	game.canvas = document.getElementById("gamecanvas");
	//let coinImg = document.getElementById('coins');
	let startButton = $("#start-btn");
	let stopButton = $("#stop-btn");
	let pauseButton = $("#pause-btn");
	let gameScore = $("#score > span");

	//Legg til interaktivitet
	window.onkeydown = key_down_logger;
	window.onkeyup = key_up_logger;
	window.MouseEvent = mouse_logger;

	startButton.on('click', function(){
		game.start();
		//$(this).toggleClass("inactive");
	});

	stopButton.on('click', function(){
		game.stop();
	});

	pauseButton.on('click', function(){
		game.pause();
	});

	reset_game();
}

//Hovudloopen til spelet. Alt starter frå her.
function update_game() {
	game.frameTime = Date.now();
	set_canvas();

	// Miljø
	handle_enviroment();

	// Hindre og plattformer
	//move_obstacles();
	//draw_obstacles();

	//Eksempelfunksjonar
	//handle_enemies();
	//collision_detect();
	//add_score();

	handle_frog();
	handle_items();

	//Automatisk scrolling ved å auka distance
	//time += 1;
	//game.distance += 5 * (1 - 1 * Math.cos(time/10))

	if(game.frog.lifepoints < 1) {
		game.end();
	}
}

function end_game() {
	//Vis sluttskjerm med poengsum og "Vil du spille igjen?"

	add_high_score("Froggy", game.score);
	let lastHighscore = parseInt( $("#highscore > span").text());
	console.log(lastHighscore);
	if(game.score > lastHighscore){
		$("#highscore > span").text(game.score);
	}
	
	var highScore = get_high_score_list();
	//console.log("High scores");
	for(hs of highScore) {
		console.log(hs);
	}
	
	//game.stop();
	game.reset();
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
// scaleX og scaleY reskalerer bilete for å fikse proposjoner.
function draw_object(object) {
	var context = game.canvas.getContext("2d");

	var scaleX = 1.0;
	var scaleY = 1.0;
	if(object.hasOwnProperty('scaleX')) {
		scaleY = object.scaleX;
	}
	if(object.hasOwnProperty('scaleY')) {
		scaleY = object.scaleY;
	}

	var width  = Math.round(object.width  * game.tileSize * scaleX);
	var height = Math.round(object.height * game.tileSize * scaleY);

	var x = Math.round(game.canvas.width/2 + (object.x * game.tileSize) - width/2);
	var y = Math.round(game.canvas.height  - ((object.y - game.distance) * game.tileSize) - height/2);

	//Debug teiknefunksjon. Teiknar ein kvit firkant under objektet
	if(game.debug == true) {
		var dwidth  = Math.round(object.width  * game.tileSize);
		var dheight = Math.round(object.height * game.tileSize);

		var dx = Math.round(game.canvas.width/2 + (object.x * game.tileSize) - dwidth/2);
		var dy = Math.round(game.canvas.height  - ((object.y - game.distance) * game.tileSize) - dheight/2);

		context.fillStyle = "white";
		context.fillRect(dx, dy, dwidth, dheight);
	}

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

function animate_object(object) {
	//Summerar opp kor lang tid animasjonen brukar på loop.
	var totalAnimationTime = 0;
	for(animationFrame of object.animation) {
		totalAnimationTime -= -animationFrame.name;
	}

	//Finner ut kor langt objektet er kommen i animasjonen
	var animationTime = (game.frameTime - object.animationStart) % totalAnimationTime;

	//Finner ut kva animasjonframe me skal bruke
	var i= 0;
	while(animationTime > object.animation[i].name) {
		animationTime -= object.animation[i].name;
		++i;
	}

	//Hentar ut animasjonframe og teiknar han
	object.image = object.animation[i];
	draw_object(object);
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
	var frog = game.frog;
	switch(event.key) {
		// Nyttar escape til å pause og starte spelet
		case "Escape":
			game.pause();
			break;
		// Hopp med mellomtast
		case " ":
			if(frog.down) {
				//Hopp bakover
				frog.jump = true;
				frog.jumpTarget = Math.floor(frog.y) - 0.5;
			}
			else {
				//Hopp framover
				frog.jump = true;
				frog.jumpTarget = Math.ceil(frog.y) + 0.5;
			}
			break;

		// Når me trykkjer ned ein tast vil frosken flytta på seg. 
		case "ArrowUp":
		case "w":
			frog.up = true;
			frog.ySpeed = frog.walkSpeed;
			break;

		case "ArrowDown":
		case "s":
			frog.down = true;
			frog.ySpeed = -frog.walkSpeed;
			break;

		case "ArrowLeft":
		case "a":
			frog.left = true;
			frog.xSpeed = -frog.walkSpeed;
			break;

		case "ArrowRight":
		case "d":
			frog.right = true;
			frog.xSpeed = frog.walkSpeed;
		default:
	}
}

function key_up_logger(event) {
	var frog = game.frog;
	switch(event.key) {
		//Når me slepp opp ein tast vil frosken stoppa opp.
		case "ArrowUp":
		case "w":
			frog.up = false;
			if(frog.down == true) {
				frog.y = -frog.walkSpeed;
			}
			else {
				frog.ySpeed = 0;
			}
		case "ArrowDown":
		case "s":
			frog.down = false;
			if(frog.up == true) {
				frog.ySpeed = frog.walkSpeed;
			}
			else {
				frog.ySpeed = 0;
			}
			break;

		case "ArrowLeft":
		case "a":
			frog.left = false;
			if(frog.right == true) {
				frog.xSpeed = frog.walkSpeed;
			}
			else {
				frog.xSpeed = 0;
			}
			break;
		case "ArrowRight":
		case "d":
			frog.right = false;
			if(frog.left == true) {
				frog.xSpeed = -frog.walkSpeed;
			}
			else {
				frog.xSpeed = 0;
			}
			break;
		default:
	}
}

function mouse_logger(context){
	var frog = game.frog;
	var xpos = game.frog.x;
	var ypos = game.frog.y;
	var context = game.canvas.getContext("2d");
	switch(context) {

		case onmousedown:
			if (context.screenX < xpos) {
				frog.left = true;
				frog.xSpeed = -frog.walkSpeed;
			} else if (context.screenX > xpos) {
				frog.right = true;
				frog.xSpeed = frog.walkSpeed;
			} else if (context.screenY < ypos) {
				frog.down = true;
				frog.ySpeed = -frog.walkSpeed;
			} else if (context.screenY > ypos) {
				frog.up = true;
				frog.ySpeed = frog.walkSpeed;
			}
		default:
		
		case onmouseup:
			
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
			for(platform of env.platforms) {
				handle_sinking(platform);
				draw_object(platform);
			}
		}
		if(env.hasOwnProperty("items")) {
			draw_items_in(env);
		}

		if(env.hasOwnProperty("obstacles")) {
			move_objects(env.obstacles);
			for(obj of env.obstacles) {
				draw_object(obj);
			}
		}

		if(env.hasOwnProperty("specialItems")) {
			draw_special_items_in(env);
		}

    /*
		if(env.hasOwnProperty("items")) {
			draw_items_in(env);
		}
		
    */

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

	//Fast rotasjon på miljø
	env.type = (env.start / constants.envColors.length) % constants.envColors.length;
//	//Dersom me tilfeldigvis fekk same miljø att, prøv igjen.
//	try {
//		while(env.type == prevEnv.type)
//		{
//			env.type = get_random(0,5);
//		}
//	}
//	catch {
//		//Dersom dette er fyrste enviroment vil prevEnv vera "undefined".
//		//Nyttar difor try-catch blokk for å ignorera error sidan me ikkje bryr oss.
//	}


	env.platforms = [];
	env.obstacles = [];

	env.platforms.push(create_safe_platform(env.start));
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

	// lager items uansett type miljø foreløpig
	
	env.items = [];
	var totalItems = 4;
	for(var i = 0; i<totalItems; ++i)
		{
			create_item_in(env);
		}

		env.specialItems = [];
		var totalspecialItems = 2;
		for(var i = 0; i<totalspecialItems; ++i)
			{
				create_special_item_in(env);
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
		//var carColors = ["blue", "purple", "black"];
		//var carTypes = [
		//	car1 = document.getElementById("redcar_right"),
		//	car2 = document.getElementById("car2"),
		//	bus = document.getElementById("bus")
		//];



		var x = -game.width - 4;

		while(x < game.width + 4) {
			var obstacle = {
				x		: x,
				y		: env.start + row + 0.5,

				//width	: 1 + 1 * Math.random(),
				height	: 0.8,

				speed	: game.difficulty.obstacleSpeed +
						  game.difficulty.obstacleAccel * row,

				//color	: carColors[get_random(0,2)],
				//image	: carTypes[get_random(0,2)]
			}

			//Alternerer fartsretning
			if(row % 2 == 0) {
				obstacle.speed = -obstacle.speed;
			}

			switch(get_random(0,2)) {
				case 0:
					if(obstacle.speed > 0) {
						obstacle.image = document.getElementById("redcarright");
					}
					else {
						obstacle.image = document.getElementById("yellowcarleft");
					}
					obstacle.width = 2;
					obstacle.scaleY = 2;
					break;
				case 1:
					if(obstacle.speed > 0) {
						obstacle.image = document.getElementById("car2");
					}
					else {
						obstacle.image = document.getElementById("car1");
					}
					obstacle.width = 2;
					obstacle.scaleY = 2;
					break;
				case 2:
					obstacle.image = document.getElementById("bus");
					obstacle.width = 3;
					obstacle.scaleY = 3;
					break;
			}

			obstacle.x += obstacle.width/2;
			x += obstacle.width/2 + game.difficulty.obstacleGap + 2 * Math.random();

			env.obstacles.push(obstacle);
		}
	}
}

//************************//
//        items           //
//************************//

function create_item_in(env) {

	var row = get_random(0, env.tiles);
	var item = {
		x		: Math.random() * 10 - 5,
		y		: env.start + row + 0.5,

		width	: 0.5,
		height	: 0.5,

		speed	: 0,

		image	: document.getElementById('musicnote')
	}

	env.items.push(item);
}

function create_special_item_in(env) {

	var row = get_random(0, env.tiles);
	var item = {
		x		: Math.random() * 10 - 5,
		y		: env.start + row + 0.5,

		width	: 0.5,
		height	: 0.5,

		speed	: 0,

		image	: document.getElementById('musicnote-purple')
	}



	env.specialItems.push(item);
}

function draw_items_in(env) {
	for (item of env.items) {
		draw_object(item);
	}
}

function draw_special_items_in(env) {
	for (item of env.specialItems) {
		draw_object(item);
	}
}

function handle_items(){
	var frog = game.frog;
	var i = 0;
	var currentEnv = game.env[i];
	while(frog.y > currentEnv.end)
	{
		currentEnv = game.env[++i];
	}

	//tester om spesialnote kolliderer med platform	
	if(currentEnv.hasOwnProperty("platforms"))
	{
		for(item of currentEnv.specialItems)
		{
			for(platform of currentEnv.platforms){
			//Collision detect med 1
			if(collision_detect(item, platform, 1))
			{ 
				//logger kollisjon
				item.x += platform.speed;
				console.log("collisjon");
				break;
			} else {
				

			}
			}
			
			
		}
	}

	// tester om frosken kolliderer med note
	if(currentEnv.hasOwnProperty("items"))
	{
		for(item of currentEnv.items)
		{
			//Collision detect med 1
			if(collision_detect(frog, item, 1))
			{ 
				//fjerner myntene frosken har plukket opp fra spillbrettet
				var idx = currentEnv.items.indexOf(item);
				currentEnv.items.splice(idx, 1);
				game.score+=10;
				$("#score > span").text(game.score);
				break;
			}
			
		}
	}

	//tester om frosken kolliderer med spesialnote
	if(currentEnv.hasOwnProperty("specialItems"))
	{
		for(item of currentEnv.specialItems)
		{
			//Collision detect med 1
			if(collision_detect(frog, item, 1))
			{ 
				//fjerner myntene frosken har plukket opp fra spillbrettet
				var idx = currentEnv.specialItems.indexOf(item);
				currentEnv.specialItems.splice(idx, 1);
				game.score+=30;
				$("#score > span").text(game.score);
				break;
			}
			
		}
	}
}

//************************//
//        Platforms       //
//************************//

//Funksjon til å lage platformer til eit miljø.
function create_platforms_in(env) {
	for(var row = 1; row < env.tiles; ++row) {
		var logTypes = [
			log1 = document.getElementById("log1"),
		];

		var x = -game.width - 4;
		while(x < game.width + 4) {
			var platform = {
				x		: x,
				y		: env.start + row + 0.5,

				width	: 1.5 + 2 * Math.random(),
				height	: 1.05,
				scaleY	: 2.5,

				//speed	: 0.05 + 0.04*row,
				speed	: game.difficulty.platformSpeed +
						  game.difficulty.platformAccel * row,

				sinking : 0,

				color	: "white",
				image	: logTypes[0]
			};


			//Alternerer fartsretning
			if(row % 2 == 0) {
				platform.speed = -platform.speed;
			}

			platform.x += platform.width/2;
			x += platform.width/2 + game.difficulty.platformGap + 2 * Math.random();

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

		width : game.width * 2,
		height : 1.05,

		safe	: true,

		speed : 0,
		color : constants.envColors[0],
		image : document.getElementById("piano"),
	};

	return platform;
}

function handle_sinking(platform) {
	if(platform.sinking > 0)
	{
		var sinking = game.frameTime - platform.sinking;
		if(sinking < constants.sinkTime) {
			//Sinking
			var ratio = (constants.sinkTime - sinking) / constants.sinkTime;

			platform.width = platform.originalWidth * ratio;
			platform.scaleY = 2.5 * ratio;
		}
		else if(sinking < 2*constants.sinkTime) {
			//Sunk
		}
		else if(sinking < 3*constants.sinkTime) {
			//Rising
			var ratio = 1 - ((3*constants.sinkTime - sinking) / constants.sinkTime);

			platform.width = platform.originalWidth * ratio;
			platform.scaleY = 2.5 * ratio;
		}
		else {
			//Floating
			platform.width = platform.originalWidth;
			platform.scaleY = 2.5;
			platform.sinking = 0;
		}

	}
	else if (Math.random() < constants.sinkChance)
	{
		//Plattformen startar å synke
		if(!platform.hasOwnProperty("safe")) {
			platform.originalWidth = platform.width;
			platform.sinking = game.frameTime;
		}
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

	if(!Array.isArray(highScore)) {
		highScore = [];
	}

	//Legg til den nye poengsummen og sorterar lista slik at han kjem på rett plass.
	highScore.push([name, score]);
	highScore.sort(
			function(a, b){
				return b[1] - a[1];
			}
			);

	//Maks 10 high scores
	if(highScore.length > 10) {
		highScore.pop();
	}

	window.localStorage.setItem("highScore", JSON.stringify(highScore));
}

function get_high_score_list() {
	try{
		var highScore = JSON.parse(window.localStorage.getItem("highScore"))
	} catch(error) {
		var highScore = [];
	}

	if(!Array.isArray(highScore)) {
		highScore = [];
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
		walkSpeed : 0.2,
		jumpSpeed : 0.3,

		inputCooldown : 0,
		lifepoints : 3,

		up		: false,
		down	: false,
		left	: false,
		right	: false,

		jump	: false,

		//https://www.flaticon.com/free-icon/frog_1036001
		image : document.getElementById("frog"),
		animation : document.getElementsByClassName("froganimation"),
		animationStart : 0
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
		if(frog.jump == true) {
			frog.y += frog.jumpSpeed * 2;

			//Om han har nådd målet, er han ferdig med å hoppe.
			if(frog.y >= frog.jumpTarget) {
				frog.y = frog.jumpTarget;
				frog.jump = false;
				frog.inputCooldown = 2;
			}
		}
		else {
			//Me oppdaterar frosken sin posisjon med farten dei har i x eller y retning
			if(frog.inputCooldown > 0) {
				frog.inputCooldown -= 1;
			}
			else {
				frog.x += frog.xSpeed;
				frog.y += frog.ySpeed;
			}
		}

		var safe = true;

		//Dersom frosken er i eit vått miljø med platformar itererar me over plattformane for å sjå om han står på ein.
		//Dersom han gjer det, så seglar han bortetter saman med plattformen.
		//Dersom han ikkje gjer det, så må han mista eit liv.
		if(currentEnv.platforms.length > 0 && frog.y < currentEnv.end)
		{
			safe = false;
			for(platform of currentEnv.platforms)
			{
				//Collision detect med 0.5 for at mesteparten av frosken må vera oppå platformen.
				if(collision_detect(frog, platform, 0.1))
				{
					safe = true;
					frog.x += platform.speed;

					//Endrar farge for å visa kontakt. Debugfunksjon
					//platform.color = constants.envColors[0];
					break;
				}
				//else
				//{
				//	//Tilbakestiller til vanleg farge. Debugfunksjon
				//	if(platform != currentEnv.platforms[0]) {
				//		platform.color = 'white';
				//	}
				//}
			}
		}

		//Tester om frosken kolliderar med ein bil
		if(safe == true && currentEnv.hasOwnProperty("obstacles"))
		{
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
		

		
		

		//Frosken er i vatnet eller truffen av ein bil.
		if(safe == false) {
			frog.inputCooldown = Math.round(game.fps/2);
			frog.lifepoints -= 1;
			if(frog.lifepoints==2){
				$("#life3").removeClass("fa-heart").addClass("fa-heart-o");
			} else if(frog.lifepoints==1){
				$("#life2").removeClass("fa-heart").addClass("fa-heart-o");
			} else if(frog.lifepoints==0){
				$("#life1").removeClass("fa-heart").addClass("fa-heart-o");
			}

			frog.x = 0;
			frog.y = currentEnv.start + 0.5;
			frog.jump = false;
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

	//draw_object(frog);
	animate_object(frog);
}
