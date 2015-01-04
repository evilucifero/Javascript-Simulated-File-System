/* 未完成功能 TO-DO LIST
 * (0) 完成绝对路径的改造，实现所有的东西只要写着filename的地方均可以使用绝对路径
 * (1) 实现多种写入方式，现在只有追加，以后还要添加覆盖
 */

// 全局变量，显示当前用户名 string name
var userNow = "";

// 全局变量，显示当前路径 string-array dirname
var locNow = [];

// 全局变量，显示当前目录的FCB的磁盘号 number-fcb disknum
var dirfcbNow = 0;

// 磁盘信息 string-array file
var bitmap = [];
var disk = [];

// 当前目录f下的文件名缓存 string-array filename
var dirFileNameCache = [];

// 当前目录下的FCB号缓存 numarray fcb disknum
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

// 获得一个新的盘块 request a new disk block
var getNewDiskNum = function () {
	for (var i = 0; i < bitmap.length; i++) {
		if (bitmap[i] === false) {
			return i;
		}
	};
	console.log("Disk is full. Please delete some unimportant files.")
	return false;
};

// 文本文档的读取
var getValue = function (fcbnum) {
	var addrArray = getAddressList(fcbnum);
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
	// 先将字符串数组化以便于一个一个输入
	var streamArray = streamstr.split("");
	// 如果输入为空则直接取消执行，以防分配多余空盘块
	if (streamArray.length === 0) {
		return true;
	}
	var nowDisknum;
	// 先全部读出当前文件下的字符串
	var realAddr = getAddressList(fcbnum);
	// 当前文件下为空时的处理
	if (realAddr.length === 0) {
		// 分配一个新的盘块
		nowDisknum = getNewDiskNum();
		bitmap[nowDisknum] = true;
		disk[nowDisknum] = "";
		// 将其添加到数组中
		realAddr.push(nowDisknum);
	}
	// 当前文件不为空时自动将“指针”指向数组末端
	else {
		nowDisknum = realAddr[realAddr.length - 1];	
	}
	// 循环条件：当前等待写入的数组（缓冲）是否还有剩余
	while (streamArray.length !== 0) {
		// 当前指针所指盘块对应的内容是否已满，如果满了则分配新盘块
		if (isDiskFull(nowDisknum) === true) {
			nowDisknum = getNewDiskNum();
			disk[nowDisknum] = "";
			bitmap[nowDisknum] = true;
			realAddr.push(nowDisknum);
		}
		// 写入数据
		disk[nowDisknum] += streamArray.shift();
	}
	// 将新的地址表写入fcb中
	setAddressList(realAddr,fcbnum);
	return true;
}

// 索引设置
// 将混合索引地址表转化为一维数组
var getAddressList = function (fcbnum) {
	var realAddr = [];
	var addrTmp = disk[fcbnum].iaddr;
	// 检测是否启用二级索引
	if (addrTmp[11] === undefined) {
		// 检测是否启用一级索引
		if (addrTmp[10] === undefined) {
			// 直接读出
			for (var i = 0; i < addrTmp.length; i++) {
				realAddr.push(addrTmp[i]);
			};
		}
		else {
			// 前十盘块号直接读出
			for (var i = 0; i < 10; i++) {
				realAddr.push(addrTmp[i]);
			};
			// 一级索引通过索引读出
			var firstLevelIndex = disk[addrTmp[10]];
			for (var i = 0; i < firstLevelIndex.length; i++) {
				realAddr.push(firstLevelIndex[i]);
			};
		}
	}
	else {
		// 前十盘块号直接读出
		for (var i = 0; i < 10; i++) {
			realAddr.push(addrTmp[i]);
		};
		// 一级索引通过索引读出
		var firstLevelIndex = disk[addrTmp[10]];
		for (var i = 0; i < 10; i++) {
			realAddr.push(firstLevelIndex[i]);
		};
		// 通过二级索引读出一级索引
		var secondLevelIndex = disk[addrTmp[11]];
		for (var i = 0; i < secondLevelIndex.length; i++) {
			// 一级索引通过索引读出
			var firstLevelIndexTmp = disk[secondLevelIndex[i]];
			for (var j = 0; j < firstLevelIndexTmp.length; j++) {
				realAddr.push(firstLevelIndexTmp[j]);
			};
		};
	}
	return realAddr;
}

// 将一维顺序数组写入混合索引
var setAddressList = function (realAddr,fcbnum) {
	
	// 如果超出大小则报错终止
	if (realAddr.length > 120) {
		console.log("Out of Maxium File Bounder!");
		return false;
	}

	// 清除原有数据
	if (disk[fcbnum].iaddr[11] !== undefined) {
		// 如果二级索引存在则先清楚二级索引下的一级索引
		var secondLevelIndex = disk[disk[fcbnum].iaddr[11]];
		for (var i = 0; i < secondLevelIndex.length; i++) {
			disk[secondLevelIndex[i]] = undefined;
			bitmap[secondLevelIndex[i]] = false;
		};
		// 清除二级索引
		disk[disk[fcbnum].iaddr[11]] = undefined;
		bitmap[disk[fcbnum].iaddr[11]] = false;
	}
	if (disk[fcbnum].iaddr[10] !== undefined) {
		// 如果一级索引存在则清除
		disk[disk[fcbnum].iaddr[10]] = undefined;
		bitmap[disk[fcbnum].iaddr[10]] = false;
	}
	// 清除iaddr
	disk[fcbnum].iaddr = [];

	// 接下来分类，按顺序逐次写入
	// 当无需调用索引时，
	if (realAddr.length <= 10) {
		// 写入无需调用索引的部分
		for (var i = 0; i < realAddr.length; i++) {
			disk[fcbnum].iaddr.push(realAddr[i]);
		};
	}
	// 当仅需要一级索引时
	else if (realAddr.length <= 20) {
		// 写入无需调用索引的部分
		for (var i = 0; i < 10; i++) {
			disk[fcbnum].iaddr.push(realAddr[i]);
		};
		// 生成一级索引
		var firstLevelIndex;
		for (var j = 10; j < realAddr.length; j++) {
			firstLevelIndex.push(realAddr[j]);
		};
		var indexDiskNum = getNewDiskNum();
		disk[indexDiskNum] = firstLevelIndex;
		bitmap[indexDiskNum] = true;
		// 写入一级索引
		disk[fcbnum].iaddr[10] = indexDiskNum;
	}
	// 当需要二级索引时
	else {
		// 写入无需调用索引的部分
		for (var i = 0; i < 10; i++) {
			disk[fcbnum].iaddr.push(realAddr[i]);
		};
		// 生成一级索引
		var firstLevelIndex = [];
		for (var j = 10; j < 20; j++) {
			firstLevelIndex.push(realAddr[j]);
		};
		var firstLevelIndexDiskNum = getNewDiskNum();
		disk[firstLevelIndexDiskNum] = firstLevelIndex;
		bitmap[firstLevelIndexDiskNum] = true;
		disk[fcbnum].iaddr[10] = firstLevelIndexDiskNum;
		// 生成二级索引
		var secondLevelIndex = [];
		var firstLevelIndexTmp = [];
		for (var k = 20; k < realAddr.length; k++) {
			firstLevelIndexTmp.push(realAddr[k]);
			// 在二级索引下生成相应的一级索引
			if (k % 10 === 9 || k === realAddr.length - 1) {
				var firstLevelIndexTmpDiskNum = getNewDiskNum();
				disk[firstLevelIndexTmpDiskNum] = firstLevelIndexTmp;
				bitmap[firstLevelIndexTmpDiskNum] = true;
				secondLevelIndex.push(firstLevelIndexTmpDiskNum);
				firstLevelIndexTmp = [];
			}
		};
		var secondLevelIndexDiskNum = getNewDiskNum();
		disk[secondLevelIndexDiskNum] = secondLevelIndex;
		bitmap[secondLevelIndexDiskNum] = true;
		// 写入二级索引
		disk[fcbnum].iaddr[11] = secondLevelIndexDiskNum;
	}
}

// 转换文件名到其对应i节点上的fcb号 Convert filename to fcbnum
var find = function (filename) {
	// 按名索取
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
	// 设立..和.两个静态名占有[0]和[1]
	dirFcbnumCache = [disk[dirfcb].pfcb,dirfcb];
	dirFileNameCache = ["..","."];
	// 从[2]开始将目录缓存写入其中
	var count = 2;
	for (var i = 0; i < disk[dirfcb].iaddr.length; i++) {
		if (disk[dirfcb].iaddr[i] !== undefined) {
			dirFcbnumCache[count] = disk[dirfcb].iaddr[i];
			dirFileNameCache[count] = disk[dirFcbnumCache[count]].name;
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
	var modArray = disk[fcbnumTmp].meta.mod;
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
	disk[fcbnumTmp].meta.mod = modArray;
	return true;
}

// 更改文件所有者 change the file owner
var chown = function (user,filename) {
	var fcbnumTmp = find(filename);
	var ownArray = user;
	disk[fcbnumTmp].meta.own = ownArray;
	return true;
};

// 检查读写执行动作权限 check is an act can be done or not
var checkAct = function (act,filename) {
	var fcbnumTmp = find(filename);
	if (fcbnumTmp === false) {
		return false;
	}
	var i = 0;
	// 如果当前用户不是文件主，则以其他用户对待，即从第7位开始看权限
	if (userNow !== disk[fcbnumTmp].meta.own) {
		i = 6;
	}
	// 根据rwx顺序决定检测权限位
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
	if(disk[fcbnumTmp].meta.mod[i] === true) {
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
	// 检查是否重名
	if (checkDuplicateName(filename) === true) {
		console.log("Already have a same name, please choose a new filename!");
		return false;
	}
	// 检查权限，创建新文件视作写入权限
	if (checkAct("w",".") === false) {
		return false;
	}
	// fcb模型
	var fileTmp = {
		name:"",
		meta:{
			type:"-",
			own:"",
			mod:[true,true,true,true,true,false,true,true,false],
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
	// 写入相应的时间变化 write the time change
	var d = new Date();
	fileTmp.meta.createAt = d.getTime();
	fileTmp.meta.updateAt = d.getTime();
	disk[fileTmp.pfcb].meta.updateAt = d.getTime();
	// 为fcb分配新的DISK空间 allocate a new disk space
	var fcbnumTmp = getNewDiskNum();
	// 将盘块号写入当前目录fcb的iaddr
	disk[dirfcbNow].iaddr.push(fcbnumTmp);
	// 将fcb写入磁盘
	disk[fcbnumTmp] = fileTmp;
	bitmap[fcbnumTmp] = true;
	// 文件变化，刷新缓存
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
	// 权限检测
	if (checkAct("w",filename) === false) {
		return false;
	}
	// 检测文件是否存在
	if (checkDuplicateName(filename) === false) {
		console.log(filename + " is not existed.");
		return false;
	};
	var fcbnumTmp = find(filename);
	var fcbTmp = disk[fcbnumTmp];
	// 文件类型检测
	if (fcbTmp.meta.type !== "-") {
		console.log(filename + " is not a file, cannot be edited.");
		return false;
	}
	// 写入内容
	setValue(fcbnumTmp,text);
	// 写入相应的时间变化
	var d = new Date();
	fcbTmp.meta.updateAt = d.getTime();
	disk[fcbTmp.pfcb].meta.updateAt = d.getTime();
	return true;
};

// 执行文件 execute file
var run = function (filename) {
	// 权限检测
	if (checkAct("x",filename) === false) {
		return false;
	}
	// 检测文件是否存在
	if (checkDuplicateName(filename) === false) {
		console.log(filename + " is not existed.");
		return false;
	};
	var fcbnumTmp = find(filename);
	var fcbTmp = disk[fcbnumTmp];
	// 检测文件类型
	if (fcbTmp.meta.type !== "-") {
		console.log(filename + " is not a file, cannot be run.");
		return false;
	}
	// 执行文件内容
	console.log(eval(getValue(fcbnumTmp)));
	return true;
};

// 删除文件 delete file
var rm = function (filename) {
	if (checkAct("w",filename) === false) {
		return false;
	}
	var fcbnumTmp = find(filename);
	var fcbTmp = disk[fcbnumTmp];
	// 检测是否为目录 check if it is a diretory
	if (fcbTmp.meta.type === "d") {
		console.log(filename + " is a diretory, please use 'rmdir' instead.");
		return false;
	};
	// 从磁盘中删除该文件内容 delete its file content
	for (var i = 0; i < fcbTmp.iaddr.length; i++) {
		bitmap[fcbTmp.iaddr[i]] = false;
		disk[fcbTmp.iaddr[i]] = undefined;
	};
	// 从目录中删除该文件节点 delete the file index under directory fcb
	for (var i = 0; i < disk[fcbTmp.pfcb].iaddr.length; i++) {
		if (disk[fcbTmp.pfcb].iaddr[i] === fcbnumTmp) {
			disk[fcbTmp.pfcb].iaddr.splice(i,1);
			bitmap[fcbnumTmp] = false;
			disk[fcbnumTmp] = undefined;
			break;
		}
	};
	// 释放文件控制块 free file fcb
	refreshDirCache(dirfcbNow);
	return true;
};

/* 目录操作 DIRECTORY ACTION */

// 创建新的文件夹 create directory
var mkdir = function (dirname) {
	// 重名检测
	if (checkDuplicateName(dirname) === true) {
		console.log("Already have a same name, please choose a new directory name!")
		return false;
	}
	// 权限检测
	if (checkAct("w",".") === false) {
		return false;
	}
	// 目录模型
	var dirTmp = {
		name:"",
		meta:{
			type:"d",
			own:"",
			mod:[true,true,true,true,true,false,true,true,false],
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
	// 写入相应的时间变化 write the time change
	var d = new Date();
	dirTmp.meta.createAt = d.getTime();
	dirTmp.meta.updateAt = d.getTime();
	disk[dirTmp.pfcb].meta.updateAt = d.getTime();
	// 分配新的FCB块 allocate a fcb
	var fcbnumTmp = getNewDiskNum();
	// 将盘块号写入当前目录fcb的iaddr
	disk[dirfcbNow].iaddr.push(fcbnumTmp);
	// 将fcb写入磁盘
	disk[fcbnumTmp] = dirTmp;
	bitmap[fcbnumTmp] = true;
	// 文件变化，刷新缓存
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
	var fcbTmp = disk[fcbnumTmp];
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
	for (var i = 0; i < disk[fcbTmp.pfcb].iaddr.length; i++) {
		if (disk[fcbTmp.pfcb].iaddr[i] === fcbnumTmp) {
			disk[fcbTmp.pfcb].iaddr.splice(i,1);
			bitmap[fcbnumTmp] = false;
			disk[fcbnumTmp] = undefined;
			break;
		}
	};
	// 释放文件控制块 free dir fcb
	refreshDirCache(dirfcbNow);
	return true;
};

// 强制递归删除 forcely delete directory
var rmrf = function (elename) {
	if (checkAct("w",elename) === false) {
		return false;
	}
	var fcbnumTmp = find(elename);
	var fcbTmp = disk[fcbnumTmp];
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
		var fcbTmp = disk[fcbnumTmp];
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
	bitmap = [true,true];
	disk = [
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
		iaddr:[]
	}
	];
	for (var i = 2; i < 1024; i++) {
		bitmap[i] = false;
	}
	dirfcbNow = 1;
	userNow = "root";
	locNow = ["/"];
	refreshDirCache(dirfcbNow);
	mkdir("bin");
	mkdir("etc");
	mkdir("usr");
	mkdir("var");
	mkdir("mnt");
	touch("lorem");
	vi("lorem","Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.");
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
	vi("lorem","\nLorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.");
	console.log("login as: " + whoami());
	console.log("working directory: " + pwd());
}

init();
