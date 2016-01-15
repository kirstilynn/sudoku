var Sudoku = {};
Sudoku.p_difficulty;
Sudoku.current_puzzle;
Sudoku.puzzle_file;
Sudoku.timerId;
Sudoku.paused = false;
Sudoku.audio = false;
document.onload = init();

function init() {
 	'use strict';
	createGrid(9, 9, "container");	
	//events
	
	addPuzzle('easy');
	Sudoku.timerId = setInterval(increaseClock, 1000);
	
	var snd = document.getElementById('selectsnd');
	snd.oncanplay = (Sudoku.audio = true);
	document.getElementById('easy').addEventListener('click', function(){
		if(Sudoku.audio) document.getElementById('selectsnd').play();
		fadeOut();
		setTimeout(function() { addPuzzle("easy", false); }, 300); 
	}, false);
	document.getElementById('medium').addEventListener('click', function(){
		if(Sudoku.audio) document.getElementById('selectsnd').play();
		fadeOut();
		setTimeout(function() { addPuzzle("medium", false); }, 300); 
	}, false)	;
	document.getElementById('hard').addEventListener('click', function(){
		if(Sudoku.audio) document.getElementById('selectsnd').play();
		fadeOut();
		setTimeout(function() { addPuzzle("hard", false); }, 300); 
	}, false);	
	document.getElementById('reset').addEventListener('click', function(){ 
		if(Sudoku.audio) document.getElementById('selectsnd').play();
		fadeOut(); 
		addPuzzle(Sudoku.p_difficulty, true); 
	}, false);
	document.getElementById('timercontainer').addEventListener('click', toggleClock, false);	
	document.getElementById('timercontainer').addEventListener('mouseover', function(){ 
		if(!Sudoku.paused)
			toggle_visibility('pause-icon'); 
		}, false);	
	document.getElementById('timercontainer').addEventListener('mouseout', function(){ 
		if(!Sudoku.paused)
			toggle_visibility('pause-icon');
	}, false);	

}

function getXMLHttpRequestObject() {
    var ajax = null;
    if (window.XMLHttpRequest) {
        ajax = new XMLHttpRequest();
    } else if (window.ActiveXObject) { // Older IE.
        ajax = new ActiveXObject('MSXML2.XMLHTTP.3.0');
	}
    return ajax;
}

function clearPuzzle() {
	var t = document.getElementById('sudokugrid');
	for (var i = 0, r; r = t.rows[i]; i++) {
		for (var j = 0; c = r.cells[j]; j++) {
			c.className = c.className.replace(' user', '');
		}  
	}
}

function addPuzzle(selected_difficulty, reset) {
	clearPuzzle();
	resetClock();
	document.getElementById('easy').className = "";
	document.getElementById('medium').className = "";
	document.getElementById('hard').className = "";
	document.getElementById(selected_difficulty).className = "selected-button";
	
	Sudoku.p_difficulty = selected_difficulty;
	if (!reset) {
		var puzzle_num = Math.floor((Math.random()*3)+1);
		Sudoku.puzzle_file = selected_difficulty+'_0'+puzzle_num+'.txt';	
	}
	var ajax = getXMLHttpRequestObject();
	ajax.open('GET', 'JSON/'+Sudoku.puzzle_file, false);
	ajax.setRequestHeader('Content-Type', 'application/json');
	ajax.overrideMimeType('application/json');
    ajax.send(null);
	if (ajax.readyState == 4) {
		Sudoku.current_puzzle = JSON.parse(ajax.response);
	}
	
	var t = document.getElementById('sudokugrid');
	for (var i = 0, r; r = t.rows[i]; i++) {
		for (var j = 0; c = r.cells[j]; j++) {
			c.className = c.className.replace('transparent', 'isvisible');
			if(Sudoku.current_puzzle[i][j] != 0){
				c.innerHTML = Sudoku.current_puzzle[i][j];
			} 	
	   		else {
				if(c.className.indexOf('user') == -1) 
					c.className += ' user';
				c.innerHTML = '<input class="userinput" type="text">';
			}		
		}  
	}
	//Add change event listener to all userinput classes
	var userinput = document.getElementsByClassName("userinput");
	for(var i=0;i<userinput.length;i++){
		userinput[i].addEventListener('keyup', userInputEvent, false);
		userinput[i].addEventListener('keydown', removeUserInput, false); 
	}
}

function createGrid(rows, collumns, container) {
	var t = document.createElement('table');
	t.id = "sudokugrid";
		for(var i=0;i<rows;i++) { // 9 rows
			var r = t.insertRow(i);
			if ((i+1) % 3 == 0) {
				r.className +=" bottom";
			}
			for(var j=0; j<collumns; j++) { //9 collumns
				c = r.insertCell(j);
				if ((j+1) % 3 == 0) 
					c.className +=" right sudokucell isvisible";
				else
					c.className +=" sudokucell isvisible";
			}
		}
	document.getElementById(container).appendChild(t);
}

function userInputEvent() {
	c = this.parentNode.cellIndex;
	r = this.parentNode.parentNode.rowIndex;
	value = this.value;
	Sudoku.current_puzzle[r][c] = value;
	if(!getConflicts(value, r, c)) {
		this.className = "userinput";
	}
	else {
		this.className = "userinput conflict";
	}
	//recheck effected cells for conflicts
	checkForFixedConflicts(c, r);
	
	//check if all cells are filled in
	if(filledBoard())
		if(noConflicts())
			gameWon();
}

function removeUserInput() {
	this.value="";
}

//check if user input has any conflicts
function getConflicts(value, r, c) {
	var conflict = false;
	for (var i=0; i<8; i++) { //loop through column for conflicts
		if(i!=c)
			if(Sudoku.current_puzzle[r][i] == value) {
				conflict = true;
			}
	}
	for (var i=0; i<8; i++) { //loop through row for conflicts
		if(i!=r)
			if(Sudoku.current_puzzle[i][c] == value) {
				conflict = true;
			}
	}
	var rsub = Math.floor(r/3)+1;
	var csub = Math.floor(c/3)+1;
	var rsubstart = rsub * 3 - 3;
	var csubstart = csub * 3 - 3;
	for (var i=rsubstart; i<rsubstart+3; i++){ //loop through the sub-section for conflicts
		for (var j=csubstart; j<csubstart+3; j++){
			if(i!=r || j!=c){
				if(Sudoku.current_puzzle[i][j] == value) {
					conflict = true;
				}
			}
		}
	}
	
	if(value < 1 || value > 9) //only allow values 1-9
		conflict = true;
	if(isNaN(value)) //only allow numbers
		conflict = true;
	return conflict;
}

function moveAnimation() {
	if(parseInt(document.getElementById('animation').style.left) < window.innerWidth) {
		document.getElementById('animation').style.left = parseInt(document.getElementById('animation').style.left) + 10 + "px";
		setTimeout(moveAnimation, 25);
	}
}

function fadeOut() {
	var t = document.getElementById("sudokugrid");
	for (var i = 0, r; r = t.rows[i]; i++) {
		for (var j = 0; c = r.cells[j]; j++) {
			c.className = c.className.replace('isvisible', 'transparent');
		}  
	}
}

function filledBoard() {
	var filled = true;
	var cells = document.getElementsByClassName('userinput');
	for(var i=0;i<cells.length;i++){
		if (cells[i].value == "")
			filled = false;
	}
	return filled;
}

function noConflicts() {
	var conflictCells = document.getElementsByClassName('conflict');
	if (conflictCells.length == 0){
		return true;
	}
	else 
		return false;
}

function gameWon() {
	moveAnimation();
	var t = document.getElementById('sudokugrid');
	for (var i = 0, r; r = t.rows[i]; i++) {
		for (var j = 0; c = r.cells[j]; j++) {
			c.className = c.className + " correct";
		}
	}
	var cells = document.getElementsByClassName('sudokucell');
	for(var i=0;i<cells.length;i++){
		cells[i].className = cells[i].className + " correct";
		if(cells[i].innerHTML.length > 1) { //is a user input cell
			var value = cells[i].firstChild.value; 
			cells[i].innerHTML = value;
		}
	}
}

function checkForFixedConflicts(r, c) {
	var conflictCells = document.getElementsByClassName('userinput');
	for(var i=0;i<conflictCells.length;i++){
		var c = conflictCells[i].parentNode.cellIndex;
		var r = conflictCells[i].parentNode.parentNode.rowIndex;
		var value = conflictCells[i].value;
		if(!getConflicts(value, r, c)) {
			conflictCells[i].className = "userinput";
		}
		else {
			conflictCells[i].className = "userinput conflict";
		}
	}
}

function resetClock() {
	Sudoku.start_time = new Date().getTime();
	document.getElementById('timer').innerHTML = "00:00:00";

}

function toggleClock() {
	if(Sudoku.audio) document.getElementById('selectsnd').play();
	toggle_timer();
	toggle_visibility('play-icon');
	toggle_visibility('pause-icon');
	if(document.getElementById('pausehovertext').innerHTML= "pause") 
		document.getElementById('pausehovertext').innerHTML = "play";
	else
		document.getElementById('pausehovertext').innerHTML = "pause";

}

function increaseClock() {
	var now = new Date().getTime();
	
    var seconds_apart = (now - Sudoku.start_time) / 1000;
 
    // do some time calculations
    days = parseInt(seconds_apart / 86400);
    seconds_apart = seconds_apart % 86400;
     
    hours = parseInt(seconds_apart / 3600);
    seconds_apart = seconds_apart % 3600;
     
    minutes = parseInt(seconds_apart / 60);
    seconds = parseInt(seconds_apart % 60);
	
	var timer = "";
	if (hours > 0){
		if(hours < 10)
			timer += "0" + hours + ":"; 
		else
			timer += hours + ":"; 
	}
	else
		timer+= "00:";
	if (minutes > 0) {
		if(minutes < 10)
			timer += "0" + minutes + ":"; 
		else
			timer += minutes + ":"; 
	}
	else
		timer+= "00:";
	if(seconds < 10)
		timer += "0" + seconds; 
	else
		timer += seconds; 
			
	document.getElementById('timer').innerHTML = timer;
}

function increaseStart() {
	Sudoku.start_time += 1000;
}

function toggle_visibility(id) {
	var e = document.getElementById(id);
	if(e.style.display == 'block')
    	e.style.display = 'none';
	else
    	e.style.display = 'block';
}

function toggle_deactive(id) {
	var e = document.getElementById(id);
	if(e.style.color == 'rgba(255, 255, 255, 0.25)')
    	e.style.color = '#fff';
	else
     	e.style.color = 'rgba(255, 255, 255, 0.25)';
}

function toggle_timer() {
	if(!Sudoku.paused) {
		clearInterval(Sudoku.timerId);
		Sudoku.paused = true;
		Sudoku.pTimerId = setInterval(increaseStart, 1000);

	}
	else {
		clearInterval(Sudoku.pTimerId);
   		Sudoku.timerId = setInterval(increaseClock, 1000);
   		Sudoku.paused = false;
   	}
}




