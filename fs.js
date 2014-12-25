/* TODOLIST
 * (0) 完成绝对路径的改造，实现所有的东西只要写着filename的地方均可以使用绝对路径
 * (1) 完成索引函数，实现混合索引
 * (2) 为了更好地实现混合索引，所以要添加位是图数据结构
 * (3) 实现多种写入方式，现在只有追加，以后还要添加覆盖
 */

// 全局变量，显示当前用户名 string name
var userNow = "root";

// 全局变量，显示当前路径 string-array dirname
var locNow = ["/"];

// 全局变量，显示当前目录的FCB号 number fcbnum
var dirfcbNow = 1;

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
 *		pfcb:1;
 *		iaddr:[] //number-array disknum
 *	};
 *
 */
var fcb = [
	{
		name:null,
		meta:{
			type:"n",
			own:null,
			mod:[false,false,false,false,false,false,false,false,false],
			createAt:0,
			updateAt:0
		},
		pfcb:null,
		iaddr:[]
	},
	{
		name:"/",
		meta:{
			type:"d",
			own:"root",
			mod:[true,true,true,true,true,false,true,true,false],
			createAt:1418995724279,
			updateAt:1418995724279
		},
		pfcb:0,
		iaddr:[1,2]
	},
	{
		name:"file1",
		meta:{
			type:"-",
			own:"root",
			mod:[true,true,true,true,false,false,true,false,false],
			createAt:1418995724279,
			updateAt:1418995724279
		},
		pfcb:1,
		iaddr:[3]
	},
	{
		name:"file2",
		meta:{
			type:"-",
			own:"root",
			mod:[true,true,true,true,false,false,true,false,false],
			createAt:1418995724279,
			updateAt:1418995724279
		},
		pfcb:1,
		iaddr:[4]
	}
];

// 磁盘信息 string-array file
var disk = [
	"fcb[1]",
	"fcb[2]",
	"fcb[3]",
	"This is f1",
	"This is f2"
];

// 当前目录下的文件名缓存 string-array filename
var dirFileNameCache = [];

// 当前目录下的FCB号缓存 numarray fcbnum
var dirFcbnumCache = [];

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

// 文本文档的读取
var getValue = function (fcbnum) {
	var addrArray = fcb[fcbnum].iaddr; // = getBlocks(fcbnum);
	var strTmp = "";
	for (var i = 0; i < addrArray.length; i++) {
		strTmp += disk[addrArray[i]];
	};
	return strTmp;
}

// 检查单盘块是否已满 
var isDiskFull = function (disknum) {
	return !(disk[disknum].length < 10);
}

// 文本文档的写入
var setValue = function (fcbnum,streamstr) {
	var streamArray = streamstr.split("");
	var fcbTmp = fcb[fcbnum];
	var nowDisknum;
	if (fcbTmp.iaddr.length === 0) {
		nowDisknum = getNewDiskNum();
		disk[nowDisknum] = "";
		fcbTmp.iaddr.push(nowDisknum);
	}
	else {
		nowDisknum = fcbTmp.iaddr[(fcbTmp.iaddr.length-1)];	
	}
	while (streamArray.length !== 0) {
		if (isDiskFull(nowDisknum) === true){
			nowDisknum = getNewDiskNum();
			disk[nowDisknum] = "";
			fcbTmp.iaddr.push(nowDisknum);
		}
		disk[nowDisknum] += streamArray.shift();
	}
	return true;
}

// 未完成，预设中，索引设置
var getIndex = function (disknum) {
	return JSON.parse(disk[disknum]);
}

var getBlocks = function (fcbnum,indexnum) {
	if (indexnum < 10) {
		return fcb[fcbnum].iaddr[indexnum];
	}
	else if (indexnum < 20) {
		var firstIndexDisknum = fcb[fcbnum].iaddr[10];
		var firstIndex = getIndex(firstIndexDisknum);
		return firstIndex[indexnum - 10];
	}
	else if (indexnum < 120) {
		var secondIndexDisknum = fcb[fcnnum].iaddr[11];
		var secondIndex = getIndex[secondIndexDisknum];
		var firstIndexDisknum = secondIndex[parseInt((indexnum - 20) / 10)];
		var firstIndex = getIndex(firstIndexDisknum);
		return firstIndex[(indexnum - 20) % 10];
	}
	else {
		console.log("Out of Maxium File Bounder!");
		return false;
	}
}

var setIndex = function (value,disknum) {
	var indexArray = JSON.parse(disk[disknum]);
	indexArray.push(value);
	disk[disknum] = JSON.stringify(indexArray);
	return true;
}

var setBlocks = function (value,fcbnum) {

}

// 转换文件名到其对应i节点上的fcb号 Convert filename to fcbnum
var find = function (filename) {
	for (var i = 0; i < dirFileNameCache.length; i++) {
		if (dirFileNameCache[i] === filename) {
			return dirFcbnumCache[i];	
		}
	}
	console.log("No such file.");
	return null;
};

// 刷新当前目录下的缓存
// refresh now dir Cache 
// 当对目录/文件进行增删或打开新目录时
// after opening a new folder delete/create a new file/dir
var refreshDirCache = function (dirfcb) {
	var count = 2;
	dirFcbnumCache = [fcb[dirfcbNow].pfcb,dirfcbNow];
	dirFileNameCache = ["..","."];
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
	return locNow.join("/");
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

// 通过时间戳翻回时间字符串 convert UNIX-timestamp to time-string
var pad = function (num, n) {
    var len = num.toString().length;
    while(len < n) {
        num = "0" + num;
        len++;
    }
    return num;
}

var shtime = function (unixtime) {
	var d = new Date(unixtime);
	return ""+d.getFullYear()+"-"+pad(d.getMonth()+1,2)+"-"+pad(d.getDate(),2)+"/"+pad(d.getHours(),2)+":"+pad(d.getMinutes(),2)+":"+pad(d.getSeconds(),2);
}

/* 文件操作 FILE ACTION */
// 创建新文件 create file
var touch = function (filename) {
	if (checkDuplicateName(filename) === true) {
		console.log("Already have a same name, please choose a new filename!");
		return false;
	}
	if (checkAct("w",".") === false) {
		return false;
	}
	var fileTmp = {
		name:"",
		meta:{
			type:"-",
			own:"",
			mod:[true,true,true,true,false,false,true,false,false],
			createAt:"",
			updateAt:""
		},
		pfcb:0,
		iaddr:[]
	};
	fileTmp.name = filename;
	fileTmp.meta.own = userNow;
	// 设置其父级文件夹FCB setting its parent directory fcn number
	fileTmp.pfcb = dirfcbNow;
	var d = new Date();
	fileTmp.meta.createAt = d.getTime();
	fileTmp.meta.updateAt = d.getTime();
	fcb[fileTmp.pfcb].meta.updateAt = d.getTime();
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
	return getValue(fcbnumTmp);
};

// 向文件内部写入文本 write file
var vi = function (filename,text) {
	if (checkAct("w",filename) === false) {
		return false;
	}
	if (checkDuplicateName(filename) === false) {
		touch(filename);
	};
	var fcbnumTmp = find(filename);
	var fcbTmp = fcb[fcbnumTmp];
	if (fcbTmp.meta.type !== "-") {
		console.log(filename + " is not a file, cannot be edited.");
		return false;
	}
	setValue(fcbnumTmp,text);
	var d = new Date();
	fcbTmp.meta.updateAt = d.getTime();
	fcb[fcbTmp.pfcb].meta.updateAt = d.getTime();
	return true;
};

// 执行文件 execute file
var run = function (filename) {
	if (checkAct("x",filename) === false) {
		return false;
	}
	if (checkDuplicateName(filename) === false) {
		console.log(filename + " is not existed.");
		return false;
	};
	var fcbnumTmp = find(filename);
	var fcbTmp = fcb[fcbnumTmp];
	if (fcbTmp.meta.type !== "-") {
		console.log(filename + " is not a file, cannot be run.");
		return false;
	}
	console.log(eval(getValue(fcbnumTmp)));
	return true;
};

// 删除文件 delete file
var rm = function (filename) {
	if (checkAct("w",filename) === false) {
		return false;
	}
	var fcbnumTmp = find(filename);
	var fcbTmp = fcb[fcbnumTmp];
	// 检测是否为目录 check if it is a diretory
	if (fcbTmp.meta.type === "d") {
		console.log(filename + " is a diretory, please use 'rmdir' instead.");
		return false;
	};
	// 从磁盘中删除该文件内容 delete its file content
	for (var i = 0; i < fcbTmp.iaddr.length; i++) {
		disk[fcbTmp.iaddr[i]] = undefined;
	};
	// 从目录中删除该文件节点 delete the file index under directory fcb
	for (var i = 0; i < fcb[fcbTmp.pfcb].iaddr.length; i++) {
		if (parseInt(disk[fcb[fcbTmp.pfcb].iaddr[i]].replace("fcb[","").replace("]","")) === fcbnumTmp) {
			disk[fcb[fcbTmp.pfcb].iaddr[i]] = undefined;
			fcb[fcbTmp.pfcb].iaddr.splice(i,1);
			break;
		}
	};
	// 释放文件控制块 free file fcb
	refreshDirCache(dirfcbNow);
	fcb[fcbnumTmp] = undefined;
	return true;
};

/* 目录操作 DIRECTORY ACTION */

// 创建新的文件夹 create directory
var mkdir = function (dirname) {
	if (checkDuplicateName(dirname) === true) {
		console.log("Already have a same name, please choose a new directory name!")
		return false;
	}
	if (checkAct("w",".") === false) {
		return false;
	}
	var dirTmp = {
		name:"",
		meta:{
			type:"d",
			own:"",
			mod:[true,true,true,true,false,false,true,false,false],
			createAt:"",
			updateAt:""
		},
		pfcb:0,
		iaddr:[]
	};
	dirTmp.name = dirname;
	dirTmp.meta.own = userNow;
	// 设置其父级文件夹FCB setting its parent directory fcn number
	dirTmp.pfcb = dirfcbNow;
	var d = new Date();
	dirTmp.meta.createAt = d.getTime();
	dirTmp.meta.updateAt = d.getTime();
	fcb[dirTmp.pfcb].meta.updateAt = d.getTime();
	// 分配新的DISK空间 allocate a new disk space
	var disknumTmp = getNewDiskNum();
	// 分配新的FCB块 allocate a fcb
	var fcbnumTmp = getNewFcbNum();
	// 将fcb信息写入DISK
	disk[disknumTmp] = "fcb[" + fcbnumTmp +"]";
	// 将盘块号写入当前目录fcb的iaddr
	fcb[dirfcbNow].iaddr.push(disknumTmp);
	// 将fcb写入fcb[]
	fcb[fcbnumTmp] = dirTmp;
	refreshDirCache(dirfcbNow);
	return true;
};

// 更改当前目录 change directory
var cd = function (dirname) {
	if (checkDuplicateName(dirname) === false) {
		console.log(dirname + " is not existed.")
		return false;
	}
	if (checkAct("r",dirname) === false) {
		return false;
	}
	if (dirname === ".") {}
	else if (dirname === "..") {
		dirfcbNow = dirFcbnumCache[0];
		locNow.pop();
	}
	else {
		dirfcbNow = find(dirname);
		locNow.push(dirname);
	}
	refreshDirCache(dirfcbNow);
	return true;
};

// 删除目录 delete directory
var rmdir = function (dirname) {
	if (checkAct("w",dirname) === false) {
		return false;
	}
	var fcbnumTmp = find(dirname);
	var fcbTmp = fcb[fcbnumTmp];
	// 检测是否为目录 check if it is a diretory
	if (fcbTmp.meta.type !== "d") {
		console.log(dirname + " is not a directory, try 'rm' instead.");
		return false;
	};
	// 检查目录下是否还有其他文件
	if (fcbTmp.iaddr.length !== 0) {
		console.log(dirname + " is not empty, try 'rmrf' instead.");
		return false;
	}
	// 从目录中删除该目录节点 delete the dir index under directory fcb
	for (var i = 0; i < fcb[fcbTmp.pfcb].iaddr.length; i++) {
		if (parseInt(disk[fcb[fcbTmp.pfcb].iaddr[i]].replace("fcb[","").replace("]","")) === fcbnumTmp) {
			disk[fcb[fcbTmp.pfcb].iaddr[i]] = undefined;
			fcb[fcbTmp.pfcb].iaddr.splice(i,1);
			break;
		}
	};
	// 释放文件控制块 free dir fcb
	refreshDirCache(dirfcbNow);
	fcb[fcbnumTmp] = undefined;
	return true;
};

// 强制递归删除 forcely delete directory
var rmrf = function (elename) {
	if (checkAct("w",elename) === false) {
		return false;
	}
	var fcbnumTmp = find(elename);
	var fcbTmp = fcb[fcbnumTmp];
	// 检测是否为目录 check if it is a diretory
	if (fcbTmp.meta.type === "d")
	{
		// 目录处理方式
		// 检查目录下是否还有其他文件
		if (fcbTmp.iaddr.length === 0) {
			rmdir(elename);
		}
		else {
			cd(elename);
			var len = dirFileNameCache.length;
			for (var i = 2; i < len; i++) {
				rmrf(dirFileNameCache[2]);
			};
			cd("..");
			rmdir(elename);
		}
	}
	else {
		// 文件处理方式
		rm(elename);
	}
	return true;
}

// 显示文件信息 file name info
var ls = function () {
	var lsStr = "\n";
	for (var i = 0; i < dirFileNameCache.length; i++) {
		if (dirFileNameCache[i].charAt(0) !== ".") {
			lsStr += dirFileNameCache[i];
			lsStr += "  ";
		}
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
		llStr += "  C";
		llStr += shtime(fcbTmp.meta.createAt);
		llStr += "  U";
		llStr += shtime(fcbTmp.meta.updateAt);
		llStr += "      ";
		llStr += dirFileNameCache[i];
		llStr += "\n";
	}
	return llStr;
};

/* 初始化磁盘 INIT DISK */
var init = function () {
	refreshDirCache(1);
	mkdir("bin");
	mkdir("etc");
	mkdir("usr");
	mkdir("var");
	mkdir("mnt");
	touch("runfile");
	vi("runfile","console.log(Date());");
	mkdir(".hiddendir");
	touch(".hiddenfile");
	cd("bin");
	mkdir("dir1");
	mkdir("dir2");
	touch("file1");
	vi("file1","qwertyuipte4wwyuiaeryuioaasuyeuriurqfuhfqewhufuhfqewohfweowefhqohwfe");
	touch("file2");
	vi("file2","happy")
	cd("..");
	console.log("login as: " + whoami());
	console.log("working directory: " + pwd());
}

init();