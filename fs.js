// 全局变量，显示当前用户名 string name
var userNow = "root";

// 全局变量，显示当前路径 string-array dirname
var locNow = ["/"];

// 全局变量，显示当前目录的FCB号 number fcbnum
var dirfcbNow = 0;

// 文件控制块  object-array fileinfo
/*
 *  FCB文件控制块格式范例
 *
 *	var file = {
 *		name:"",
 *		meta:{
 *			type:"",
 *			own:"",
 *			mod:[true,true,true,true,true,false,true,true,false],
 *			createAt:"",
 *			updateAt:""
 *		},
 *		iaddr:[] //number-array disknum
 *	};
 *
 */
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
			createAt:1418995724279,
			updateAt:1418995724279
		},
		iaddr:[3]
	},
	{
		name:"file2",
		meta:{
			type:"-",
			own:"root",
			mod:[true,true,true,true,true,false,true,true,false],
			createAt:1418995724279,
			updateAt:1418995724279
		},
		iaddr:[4]
	}
];

// 磁盘信息 string-array file
var disk = [
	"fcb[0]",
	"fcb[1]",
	"fcb[2]",
	"This is file1.",
	"This is file2."
];

// 当前目录下的文件名缓存 string-array filename
var dirFileNameCache = [];
// 当前目录下的FCB号缓存 numarray fcbnum
var dirFcbnumCache = [];

// 转换文件名到其对应i节点上的fcb号 Convert filename to fcbnum
var find = function (filename) {
	for (var i = 0; i < dirFileNameCache.length; i++) {
		if (dirFileNameCache[i] === filename) {
			return dirFcbnumCache[i];	
		}
	}
	if (filename === ".") {
		return dirfcbNow;
	}
	console.log("No such file.");
	return null;
};

// 刷新当前目录下的缓存
// refresh now dir Cache 
// 当对目录/文件进行增删或打开新目录时
// after opening a new folder delete/create a new file/dir
var refreshDirCache = function (dirfcb) {
	var count = 0;
	dirFcbnumCache = [];
	dirFileNameCache = [];
	for (var i = 0; i < fcb[dirfcb].iaddr.length; i++) {
		if (fcb[dirfcb].iaddr !== undefined) {
			dirFcbnumCache[count] = parseInt(disk[fcb[dirfcb].iaddr[i]].replace("fcb[","").replace("]",""));
			dirFileNameCache[count] = fcb[dirFcbnumCache[count]].name;
			count++;
		}
	}
};

// 显示当前用户 show user now
var whoami = function () {
	return userNow;
};

// 显示当前目录 show dir now
var pwd = function () {
	return locNow.join("");
};

// 转换用户 switch user
var su = function (username) {
	userNow = username;
	return whoami();
};

// 显示文件的权限信息 show the file mode info
var shmod = function (fcbnumTmp) {
	var modString = ["r","w","x","r","w","x","r","w","x"];
	var modArray = fcb[fcbnumTmp].meta.mod;
	var modReturn = "";
	for (var i = 0; i < 9; i++) {
		if (modArray[i] === true) {
			modReturn += modString[i];
		}
		else {
			modReturn += "-";
		}
	}
	return modReturn;
};

// 更改文件权限 change the file mode info
var chmod = function (mod,filename) {
	var fcbnumTmp = find(filename);
	var modTmp = mod.toString().split("");
	var modArray = [];
	for (var i = 0; i < modTmp.length; i++) {
		modArray = modArray.concat(parseInt(modTmp[i]).toString(2).split(""));
	}
	for (var j = 0; j < modArray.length; j++) {
		if (modArray[j] === "1") {
			modArray[j] = true;
		}
		else {
			modArray[j] = false;
		}
	};
	fcb[fcbnumTmp].meta.mod = modArray;
	return true;
}

// 更改文件所有者 change the file owner
var chown = function (user,filename) {
	var fcbnumTmp = find(filename);
	var ownArray = user;
	fcb[fcbnumTmp].meta.own = ownArray;
	return true;
};

// 检查读写执行动作权限 check is an act can be done or not
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
};

// 检查同目录下是否有重名 check if there is a duplicate name
var checkDuplicateName = function (filename) {
	for (var i = 0; i < dirFileNameCache.length; i++) {
		if (dirFileNameCache[i] === filename) {
			return true;
		};
	};
	return false;
};

// 获得一个新的文件控制块 request a new FCB
var getNewFcbNum = function () {
	for (var i = 0; i < fcb.length; i++) {
		if (fcb[i] === undefined) {
			return i;
		}
	};
	return fcb.length;
};

// 获得一个新的盘块 request a new disk block
var getNewDiskNum = function () {
	for (var i = 0; i < disk.length; i++) {
		if (disk[i] === undefined) {
			return i;
		}
	};
	return disk.length;
};

// 通过时间戳翻回时间字符串 convert UNIX-timestamp to time-string
var shtime = function (unixtime) {
	var d = new Date(unixtime);
	return ""+d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()+"/"+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds();
}

/* 格式化磁盘 FORMAT DISK */
var format = function () {
	refreshDirCache(0);
	console.log(whoami());
	console.log(pwd());
	console.log(ll());
}

/* 文件操作 FILE ACTION */
// 创建新文件 create file
var touch = function (filename) {
	if (checkDuplicateName(filename) === true) {
		console.log("Already have a same filename, please change a new filename!")
		return false;
	}
	if (checkAct("w",".") === false) {
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
		iaddr:[]
	};
	fileTmp.name = filename;
	fileTmp.meta.own = userNow;
	var d = new Date();
	fileTmp.meta.createAt = d.getTime();
	fileTmp.meta.updateAt = d.getTime();
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
};

// 显示文件内容 read file
var cat = function (filename) {
	if (checkAct("r",filename) === false) {
		return false;
	}
	var fcbnumTmp = find(filename);
	var fcbTmp = fcb[fcbnumTmp];
	var catStr = "\n";
	for (var i = 0; i < fcbTmp.iaddr.length; i++) {
		catStr += disk[fcbTmp.iaddr[i]] + "\n";
	};
	return catStr;
};

// 向文件内部写入文本 write file
var wt = function (filename,text) {
	if (checkAct("w",filename) === false) {
		return false;
	}
	var fcbnumTmp = find(filename);
	var disknumTmp = getNewDiskNum();
	disk[disknumTmp] = text;
	var d = new Date();
	fcb[fcbnumTmp].meta.updateAt = d.getTime();
	fcb[fcbnumTmp].iaddr.push(disknumTmp);
	return true;
};

// 执行文件 execute file
var run = function (filename) {
	if (checkAct("x",filename) === false) {
		return false;
	}
	var fcbnumTmp = find(filename);
	var fcbTmp = fcb[fcbnumTmp];
	for (var i = 0; i < fcbTmp.iaddr.length; i++) {
		console.log(eval(disk[fcbTmp.iaddr[i]]));
	};
	return true;
};
// 删除文件 delete file
var rm = function (filename) {
	if (checkAct("w",filename) === false) {
		return false;
	}
	var fcbnumTmp = find(filename);
	var fcbTmp = fcb[fcbnumTmp];
	// 从磁盘中删除该文件内容 delete its file content
	for (var i = 0; i < fcbTmp.iaddr.length; i++) {
		disk[fcbTmp.iaddr[i]] = undefined;
	};
	// 从目录中删除该文件节点 delete the file index under directory fcb
	for (var i = 0; i < fcb[dirfcbNow].iaddr.length; i++) {
		if (parseInt(disk[fcb[dirfcbNow].iaddr[i]].replace("fcb[","").replace("]","")) === fcbnumTmp) {
			disk[fcb[dirfcbNow].iaddr[i]] = undefined;
			fcb[dirfcbNow].iaddr.splice(i,1);
			break;
		}
	};
	// 释放文件FCB free file fcb
	fcb[fcbnumTmp] = undefined;
	refreshDirCache(dirfcbNow);
	return true;
};

/* 目录操作 DIRECTORY ACTION */
// 创建新的文件夹 create directory
var mkdir = function () {

};

// 更改当前目录 change directory
var cd = function () {

};

// 删除目录 delete directory
var rmdir = function () {

};

// 显示文件信息 file name info
var ls = function () {
	var lsStr = "\n";
	for (var i = 0; i < dirFileNameCache.length; i++) {
		lsStr += dirFileNameCache[i];
		lsStr += "  ";
	}
	return lsStr;
};

// 显示文件详细信息 file details info
var ll = function () {
	var llStr = "\n";
	for (var i = 0; i < dirFileNameCache.length; i++) {
		var fcbnumTmp = dirFcbnumCache[i];
		var fcbTmp = fcb[fcbnumTmp];
		llStr += fcbTmp.meta.type;
		llStr += shmod(fcbnumTmp);
		llStr += "  ";
		llStr += fcbTmp.meta.own;
		llStr += "  ";
		llStr += fcbTmp.name;
		llStr += "  C";
		llStr += shtime(fcbTmp.meta.createAt);
		llStr += "  U";
		llStr += shtime(fcbTmp.meta.updateAt);
		llStr += "\n";
	}
	return llStr;
};

format();