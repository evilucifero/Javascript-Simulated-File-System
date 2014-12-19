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
var disk = ["fcb[0]","fcb[1]","fcb[2]","This is file1.","This is file2."]; // string-array file

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
		if (fcb[dirfcb].iaddr !== undefined){
			dirFcbnumCache[i] = parseInt(disk[fcb[dirfcb].iaddr[i]].replace("fcb[","").replace("]",""));
			dirFileNameCache[i] = fcb[dirFcbnumCache[i]].name;
		}
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
var shmod = function (fcbnumTmp) {
	var modString = ["r","w","x","r","w","x","r","w","x"];
	var modArray = fcb[fcbnumTmp].meta.mod;
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
	var fcbnumTmp = find(filename);
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
	fcb[fcbnumTmp].meta.mod = modArray;
}

//change the file owner
var chown = function (user,filename) {
	var fcbnumTmp = find(filename);
	var ownArray = user;
	fcb[fcbnumTmp].meta.own = ownArray;
}

//check is an act can be done or not
var checkAct = function (act,filename) {
	var fcbnumTmp = find(filename);
	var i = 0;
	if (userNow !== fcb[fcbnumTmp].meta.own) {
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
	if(fcb[fcbnumTmp].meta.mod[i] === true) {
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
	var fileTmp = {
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
	fileTmp.name = filename;
	fileTmp.meta.own = userNow;
	fileTmp.meta.createAt = Date().toString();
	fileTmp.meta.updateAt = Date().toString();
	// 分配新的DISK空间 allocate a new disk space
	var disknumTmp = getNewDiskNum();
	// 分配新的FCB块 allocate a fcb
	var fcbnumTmp = getNewFcbNum();
	// 将fcb信息写入DISK
	disk[disknumTmp] = "fcb[" + fcbnumTmp +"]";
	// 将盘块号写入当前目录fcb的iaddr
	fcb[dirfcbNow].iaddr.push(disknumTmp);
	// 将fcb写入fcb[]
	fcb[fcbnumTmp] = fileTmp;
	refreshDirCache(dirfcbNow);
	return true;
}
//read file
var cat = function(filename){
	if (checkAct("r",filename) === false){
		return false;
	}
	var fcbnumTmp = find(filename);
	var fcbTmp = fcb[fcbnumTmp];
	var catStr = "\n";
	for (var i = 0; i < fcbTmp.iaddr.length; i++) {
		catStr += disk[fcbTmp.iaddr[i]] + "\n";
	};
	return catStr;
}
//write file
var wt = function(filename,text){
	if (checkAct("w",filename) === false){
		return false;
	}
	var fcbnumTmp = find(filename);
	var disknumTmp = getNewDiskNum();
	disk[disknumTmp] = text;
	fcb[fcbnumTmp].iaddr.push(disknumTmp);
	return true;
}
//execute file
var run = function(filename){
	if (checkAct("x",filename) === false){
		return false;
	}
	var fcbnumTmp = find(filename);
	var fcbTmp = fcb[fcbnumTmp];
	for (var i = 0; i < fcbTmp.iaddr.length; i++) {
		console.log(eval(disk[fcbTmp.iaddr[i]]));
	};
	return true;
}
//delete file
var rm = function(filename){
	if (checkAct("w",filename) === false){
		return false;
	}
	var fcbnumTmp = find(filename);
	var fcbTmp = fcb[fcbnumTmp];
	// 从磁盘中删除该文件内容
	for (var i = 0; i < fcbTmp.iaddr.length; i++) {
		disk[fcbTmp.iaddr[i]] = undefined;
	};
	// 从目录中删除该文件节点
	for (var i = 0; i < fcb[dirfcbNow].iaddr.length; i++) {
		if (parseInt(disk[fcb[dirfcbNow].iaddr[i]].replace("fcb[","").replace("]","")) === fcbnumTmp){
			disk[fcb[dirfcbNow].iaddr[i]] = undefined;
			fcb[dirfcbNow].iaddr[i] = undefined;
			break;
		}
	};
	fcb[dirfcbNow].iaddr.sort();
	fcb[dirfcbNow].iaddr.pop();
	// 释放fcb
	fcb[fcbnumTmp] = undefined;
	refreshDirCache(dirfcbNow);
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
		var fcbnumTmp = dirFcbnumCache[i];
		var fcbTmp = fcb[fcbnumTmp];
		llStr += fcbTmp.meta.type;
		llStr += shmod(fcbnumTmp);
		llStr += "  ";
		llStr += fcbTmp.meta.own;
		llStr += "  ";
		llStr += fcbTmp.name;
		llStr += "  ";
		llStr += fcbTmp.meta.updateAt;
		llStr += "\n";
	}
	return llStr;
}

format();