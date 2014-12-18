var userNow = "root"; // string name
var locNow = ["/"]; // string-array dir name
var dirfcbNow = 0;
var fcb = [
	{
	name:"/",
	meta:{
		type:"d",
		own:"root",
		mod:[true,true,true,true,true,false,true,true,false],
		createAt:"",
		updateAt:""
	},
	iaddr:[1,2]
	},

	{
	name:"file1",
	meta:{
		type:"-",
		own:"root",
		mod:[true,true,true,true,true,false,true,true,false],
		createAt:"Fri Dec 19 2014 00:41:35 GMT+0800",
		updateAt:"Fri Dec 19 2014 00:41:35 GMT+0800"
	},
	iaddr:[3]
	},

	{
	name:"file2",
	meta:{
		type:"-",
		own:"root",
		mod:[true,true,true,true,true,false,true,true,false],
		createAt:"Fri Dec 19 2014 00:41:35 GMT+0800",
		updateAt:"Fri Dec 19 2014 00:41:35 GMT+0800"
	},
	iaddr:[4]
	}
]; // object-array fileinfo
var disk = ["fcb[0]","fcb[1]","fcb[2]","'This is file1.'","'This is file2.'"]; // string-array file

/*
var file = {
	name:"",
	meta:{
		type:"",
		own:"",
		mod:[true,true,true,true,true,false,true,true,false],
		createAt:"",
		updateAt:""
	},
	iaddr:[] //number-array disknum
};
*/

var dirFileNameCache = []; //string-array filename
var dirFcbnumCache = []; //numarray fcbnum

//Convert filename to fcbnum
var find = function (filename){
	for(var i = 0; i < dirFileNameCache.length; i++){
		if(dirFileNameCache[i] === filename){
			return dirFcbnumCache[i];	
		}
	}
	if (filename === "."){
		return dirfcbNow;
	}
	console.log("No such file.");
	return null;
}

//refresh now dir Cache (after opening a new folder delete/create a new file/dir)
var refreshDirCache = function (dirfcb){
	for(var i = 0; i < fcb[dirfcb].iaddr.length; i++){
		dirFcbnumCache[i] = parseInt(disk[fcb[dirfcb].iaddr[i]].charAt(4));
		dirFileNameCache[i] = fcb[dirFcbnumCache[i]].name;
	}
}

//show user now
var whoami = function (){
	return userNow;
}

//show dir now
var pwd = function (){
	return locNow.join("");
}

//switch user
var su = function (username){
	userNow = username;
	return whoami();
}

//show the file mode info
var shmod = function (fcbnum) {
	var modString = ["r","w","x","r","w","x","r","w","x"];
	var modArray = fcb[fcbnum].meta.mod;
	var modReturn = "";
	for (var i = 0; i < 9; i++) {
		if(modArray[i] === true) {
			modReturn += modString[i];
		}
		else {
			modReturn += "-";
		}
	}
	return modReturn;
};

//change the file mode info
var chmod = function (mod,filename) {
	var fcbnum = find(filename);
	var modTmp = mod.toString().split("");
	var modArray = [];
	for (var i = 0; i < modTmp.length; i++){
		modArray = modArray.concat(parseInt(modTmp[i]).toString(2).split(""));
	}
	for (var j = 0; j < modArray.length; j++) {
		if (modArray[j] === "1"){
			modArray[j] = true;
		}
		else {
			modArray[j] = false;
		}
	};
	fcb[fcbnum].meta.mod = modArray;
}

//change the file owner
var chown = function (user,filename) {
	var fcbnum = find(filename);
	var ownArray = user;
	fcb[fcbnum].meta.own = ownArray;
}

//check is an act can be done or not
var checkAct = function (act,filename) {
	var fcbnum = find(filename);
	var i = 0;
	if (userNow !== fcb[fcbnum].meta.own) {
		i = 6;
	}
	if (act === "r") {
	}
	else if (act === "w") {
		i += 1;
	}
	else if (act === "x") {
		i += 2;
	}
	else {
		console.log("Wrong action!");
		return false;
	}
	if(fcb[fcbnum].meta.mod[i] === true) {
		return true;
	}
	else {
		console.log("You don't have enough auth to finish this action!");
		return false;
	}
}

var checkDuplicateName = function (filename){
	return false;
}
var getNewFcbNum = function (){
	for (var i = 0; i < fcb.length; i++) {
		if(fcb[i] === undefined){
			return i;
		}
	};
	return fcb.length;
}
var getNewDiskNum = function (){
	for (var i = 0; i < disk.length; i++) {
		if(disk[i] === undefined){
			return i;
		}
	};
	return disk.length;
}

/* FORMAT DISK*/
var format = function (){
	refreshDirCache(0);
	console.log(whoami());
	console.log(pwd());
	console.log(ll());
}
/* 文件操作 FILE ACTION */
// 创建新文件 create file
var touch = function (filename){
	if (checkDuplicateName(filename) === true){
		console.log("Already have a same filename, please change a new filename!")
		return false;
	}
	if (checkAct("w",".") === false){
		console.log("You can not create file here.")
		return false;
	}
	var filetmp = {
		name:"",
		meta:{
			type:"-",
			own:"",
			mod:[true,true,true,true,true,false,true,true,false],
			createAt:"",
			updateAt:""
		},
		iaddr:[] //number-array fatnum
	};
	filetmp.name = filename;
	filetmp.meta.own = userNow;
	filetmp.meta.createAt = Date().toString();
	filetmp.meta.updateAt = Date().toString();
	// 分配新的DISK空间 allocate a new disk space
	var disknumtmp = getNewDiskNum();
	// 分配新的FCB块 allocate a fcb
	var fcbnumtmp = getNewFcbNum();
	// 将fcb信息写入DISK
	disk[disknumtmp] = "fcb[" + fcbnumtmp +"]";
	// 将盘块号写入当前目录fcb的iaddr
	fcb[dirfcbNow].iaddr.push(disknumtmp);
	// 将fcb写入fcb[]
	fcb[fcbnumtmp] = filetmp;
	refreshDirCache(dirfcbNow);
	return true;
}
//read file
var cat = function(filename){
	if (checkAct("r",filename) === false){
		return false;
	}
	var fcbnumtmp = find(filename);
	var fcbtmp = fcb[fcbnumtmp];
	var catStr = "\n";
	for (var i = 0; i < fcbtmp.iaddr.length; i++) {
		catStr += disk[fcbtmp.iaddr[i]] + "\n";
	};
	return catStr;
}
//write file
var wt = function(filename,text){
	if (checkAct("w",filename) === false){
		return false;
	}
	var fcbnum = find(filename);
	var disknum = getNewDiskNum();
	disk[disknum] = text;
	fcb[fcbnum].iaddr.push(disknum);
	return true;
}
//execute file
var run = function(filename){
	if (checkAct("x",filename) === false){
		return false;
	}
	var fcbnumtmp = find(filename);
	var fcbtmp = fcb[fcbnumtmp];
	for (var i = 0; i < fcbtmp.iaddr.length; i++) {
		console.log(eval(disk[fcbtmp.iaddr[i]]));
	};
	return true;
}
//delete file
var rm = function(){

}

/* 目录操作 DIRECTORY ACTION */
//create directory
var mkdir = function(){

}
//change directory
var cd = function(){

}
//show directory
var rmdir = function(){

}
//file name info
var ls = function(){
	var lsStr = "\n";
	for (var i = 0; i < dirFileNameCache.length; i++){
		lsStr += dirFileNameCache[i];
		lsStr += "    ";
	}
	return lsStr;
}
//file details info
var ll = function(){
	var llStr = "\n";
	for (var i = 0; i < dirFileNameCache.length; i++){
		var tmpfcbnum = dirFcbnumCache[i];
		var tmpfcb = fcb[tmpfcbnum];
		llStr += tmpfcb.meta.type;
		llStr += shmod(tmpfcbnum);
		llStr += "  ";
		llStr += tmpfcb.meta.own;
		llStr += "  ";
		llStr += tmpfcb.name;
		llStr += "  ";
		llStr += tmpfcb.meta.updateAt;
		llStr += "\n";
	}
	return llStr;
}

format();