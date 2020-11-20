var express = require('express');
var app = express(); 
var Vue = require('vue');
var path = require('path')
var fs = require('fs');
var http = require('http');
var os = require('os');
const dns = require('dns');
var jwt = require('jsonwebtoken');
var url = require('url');
var axios = require('axios');
var request = require('request')
var cheerio = require('cheerio')
var {gohttp} = require('gohttp')

//模块学习
var assert = require('assert');
var asyncHook = require('async_hooks');

const { error } = require('console');
const { resolve } = require('path');

var vueServerRender = require('vue-server-renderer').createRenderer(
	// {
	// 	template:require('fs').readFileSync(path.join(__dirname,"./App.html"),'utf-8')
	// }
);
const vueApp = new Vue({
    data:{
        message:'hello ssr'
    },
    template:'<div><p>使用服务端渲染技术</p></div>'
})

//学习模块
app.get('/assert', function(req, res) {
	//assert(1 == 3, '预期1不等于3')//asssert接受两个参数，第一个参数为false就会把第二个参数的内容作为错误抛出
	//assert.ok是assert另外一个名字
	//其他方法详细看文档
	//assert.strictEqual(actual, expected, [message])//比较实际的和预期的是否相等，使用严格相等运算符（===）
	//assert.notStrictEqual(actual, expected, [message])//使用严格不相等（!==）比较实际值和预期值
	assert.throws(
		function (){
			throw new Error('error value')
		},
		Error,
		'不符合预期的错误类型'
	)//预期某个代码会抛出一个错误，抛出的错误符合指定条件，不符合就报错
	res.send('ok')
})

app.get('/asyncHook',function(req, res) {
	//async_hooks是用来追踪异步资源的生命周期，每一个上下文都有一个asyncId和triggerAsyncId，是自身ID和触发自身异步的ID，通过两个ID可以很清楚知道异步关系
	console.log('global Id', asyncHook.executionAsyncId())
	console.log('trigger Id', asyncHook.triggerAsyncId())
	fs.open('./App.html', 'r', (err, fd)=>{
		console.log('fs.open.asyncId', asyncHook.executionAsyncId())
		console.log('fs.open.triggerId', asyncHook.triggerAsyncId())
	})
	const createasyncHook = asyncHook.createHook({
		init(asyncId, type, triggerAsyncId, resource) {
			console.log('init', asyncId)
		},
		before(asyncId) {
			console.log('before', asyncId)	
		},
		after(asyncId) {
			console.log('after', asyncId)
		},
		destroy(asyncId){
			console.log('destroy', asyncId)
		},
		promiseResolve(asyncId) {
			console.log('promise', asyncId)
		}
	});
	clearTimeout(setTimeout(() => {}, 10));
	createasyncHook.enable();
	clearTimeout(setTimeout(() => {}, 10));
	res.send('ok')
})

//未了解
app.get('/buffer', function(req, res) {
//buffer缓存区，当处理像TCP或文件流时，必须使用二进制数据，node定义buffer类专门用来存放二进制数据的缓存区
//如果处理数据时候比到达的时间快，那么一部分数据到达了，就需要等待，等待区域就是buffer
	const buf1 = Buffer.alloc(10)
	//写入buffer
	let len = buf1.write('www.bufer.com')
	const buf2 = Buffer.from('hello')
	console.log(len)
	//读取buffer，第一个参数是读取数据编码，第二个和第三个是起始和结束位置
	console.log(buf1.toString('utf8',0,5))
	//合并缓存区
	const buf3 = Buffer.concat([buf1, buf2])
	console.log(buf3.toString('utf8', 0, 18))
	res.send('ok')
})

app.get('')
// 接收请求服务端--------------------------------
//http头部配置
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
})

//服务端渲染html
app.get('/', function (req, res) {
	res.status(200);
	res.setHeader('Content-Type','text/html;charset=utf-8;')
	vueServerRender.renderToString(vueApp)
	.then((html) => {
		res.end(html);
	})
	.catch((err) => console.log(err))
	
})

//读取文件
app.get('/api', function(req, res) {

    //console.log(req.body); //获取请求参数

    var file = path.join(__dirname, './china.json'); //文件路径，__dirname为当前运行js文件的目录
	console.log(path.extname('./china.json'+ '文件扩展名'))
	console.log(path.dirname('./china.json'))
	console.log(path.basename('./china.json'+ '文件名不含路径'))
    //var file = 'f:\\nodejs\\data\\test.json'; //也可以用这种方式指定路径，读取json文件
	var fileerror = path.join(__dirname, './china.js')
	//判断文件是否存在
	fs.access(fileerror,error=>{
		console.log('文件不存在')
	})
	//对文件信息判断
	fs.stat(file,(error, stats) => {
		console.log(stats.isFile()+ '是否是文件')
		console.log(stats.isDirectory()+ '是否是文件夹')
		console.log(stats.mod+ '获取权限')
		console.log(stats.size+ '字节长度')
	})
	//写入文件
	var datatxt = 'huanglin';
	fs.appendFile(file, datatxt ,(err)=>{
		if(err) throw err;
		console.log('The file has been saved!');
	})
    //去读整个文件
	fs.readFile(file, 'utf-8', function(err, data) {
        if (err) {
            res.send('文件读取失败');
        } else {
            res.send(data);
        }
    });
	//创建目录
	fs.mkdir('./ceshi.js',(err)=> {
		console.log('创建目录');
	})
	fs.rmdir('./ceshi.js',(err) => {
		console.log('删除目录')
	})
});

//添加数据/register?name=xxx&work=xxx
app.get('/register',function (req, res) {
	var data = req.query;
	console.log(data)
	var MongoClient = require('mongodb').MongoClient;
	var url = "mongodb://localhost:27017";
	 
	MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
	    if (err) throw err;
	    var dbo = db.db("runoob");
	    var myobj = data;
	    dbo.collection("site").insertOne(myobj, function(err, res) {
	        if (err) throw err;
	        console.log("文档插入成功");
	        db.close();
	    });
	});
   res.send('成功注册');
})
//删除数据
app.get('/delete',function (req, res) {
	var data = req.query;
	console.log(data)
	var MongoClient = require('mongodb').MongoClient;
	var url = "mongodb://localhost:27017/";
	 
	MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
	    if (err) throw err;
	    var dbo = db.db("runoob");
	    var whereStr = {"name": data.name};  // 查询条件
	    dbo.collection("site").deleteOne(whereStr, function(err, obj) {
	        if (err) throw err;
	        // console.log(obj);
	        db.close();
	    });
	});
   res.send();
})
//更新数据/updata?name=xxx&work=xxx
app.get('/updata',function (req, res) {
	var data = req.query;
	console.log(data)
	var MongoClient = require('mongodb').MongoClient;
	var url = "mongodb://localhost:27017/";
	 
	MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
	    if (err) throw err;
	    var dbo = db.db("runoob");
	    var whereStr = {"name": data.name};  // 查询条件
	    var updateStr = {$set: { "work" : data.work }};//修改数据
	    dbo.collection("site").updateOne(whereStr, updateStr, function(err, res) {
	        if (err) throw err;
	        console.log("文档更新成功");
	        db.close();
	    });
	});
   res.send('更新成功');
})
// 查询数据
app.get('/login',function (req, res) {
	var data = req.query;
	var MongoClient = require('mongodb').MongoClient;
	var url = 'mongodb://localhost:27017';
	MongoClient.connect(url, { useUnifiedTopology: true ,useNewUrlParser: true }, function(err, db) {
		if(err) throw err;
		var dbo = db.db("runoob");
		var whereStr = data;  // 查询条件
		//find是查询条件，limit是返回条数
		dbo.collection("site").find(whereStr).limit(10).toArray(function(err, result) {
		    if (err) throw err;
		    db.close();
			console.log(result)
			if(result[0]) {
				let rule={id:result[0]._id,telephone:result[0].telephone,password:result[0].password}
					jwt.sign(rule, 'Bearer',{ expiresIn: 3600 }, function(err, token) {
					if(err) throw err;
						res.json({
						status:0,
						token:token,
						name: whereStr.telephone
						})
				});
				
			}else{
				res.json({
				status:1,
				message:'账号名或密码错误'
				})
			}
			
		});
	})
})
//二维码登陆
app.get('/codeLogin',function(req,res){
	res.writeHead(200,{'Content-Type':'text/html'});
	fs.readFile('App.html','utf-8',function(err,data){
	    if(err){
	        throw err ;
	    }
		console.log(data)
	    res.end(data);
	});
})
//验证登陆
app.get('/Verifylogin',function (req, res) {
	var MongoClient = require('mongodb').MongoClient;
	var url = 'mongodb://localhost:27017';
	MongoClient.connect(url, { useUnifiedTopology: true ,useNewUrlParser: true }, function(err, db) {
		if(err) throw err;
		var dbo = db.db("runoob");
		var token = req.query.token;
		var tele = ''
		var pass = ''
		jwt.verify(token, 'Bearer', (err, data)=> {
			if (err) {
				console.log(err)
			}else{
				tele = data.telephone
				pass = data.password
			}
			
		})
		//find是查询条件，limit是返回条数
		dbo.collection("site").find({telephone: tele,password: pass}).limit(1).toArray(function(err, result) {
		    if (err) throw err;
			if(result[0]) {
				db.close();
				res.json({
					status:1,
					message:'登陆成功'
				})
			}else{
				res.json({
				status:0,
				message:'账号名或密码错误'
			})
		}
	})
})
	
})
//查看域名
app.get('/dns',function(req,res){
	dns.lookup('example.org', (err, address, family) => {
	  console.log('address: %j family: IPv%s', address, family);
	  res.send('address: %j family: IPv%s', address, family)
	});
})
//查看火车车次
app.get('/queryTrain',function (req, res) {
	var data = req.query;
	var MongoClient = require('mongodb').MongoClient;
	var url = 'mongodb://localhost:27017';
	MongoClient.connect(url, { useUnifiedTopology: true ,useNewUrlParser: true }, function(err, db) {
		if(err) throw err;
		var dbo = db.db("runoob");
		var whereStr = data;  // 查询条件
		//find是查询条件，limit是返回条数
		dbo.collection("train").find(whereStr).limit(10).toArray(function(err, result) {
		    if (err) throw err;
		    db.close();
			console.log(result)
			res.send(result)
		});
	})
})
//添加火车票
app.get('/addTrain',function (req, res) {
	var data = req.query;
	var MongoClient = require('mongodb').MongoClient;
	var url = "mongodb://localhost:27017/";
	var Repetition = false
	MongoClient.connect(url, { useUnifiedTopology: true ,useNewUrlParser: true }, function(err, db) {
		if(err) throw err;
		var dbo = db.db("runoob");
		var duplicate = {
			telephone: data.telephone,
			trainTicket: data.trainTicket
		}
		dbo.collection("people_train").find(duplicate).toArray(function(err, result) {
		    if (err) throw err;
		    db.close();
			console.log(result)
			if(!result){
				MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
					if (err) throw err;
					var dbo = db.db("runoob");
					var myobj = {
						telephone: data.telephone,
						trainTicket: data.trainTicket,
						Money: data.Money,
						day: data.day
					};
					dbo.collection("people_train").insertOne(myobj, function(err, res) {
						if (err) throw err;
						db.close();
					});
				});
	//查询票数量
				let NumTicket = []
				MongoClient.connect(url, { useUnifiedTopology: true ,useNewUrlParser: true }, function(err, db) {
					if(err) throw err;
					var dbo = db.db("runoob");
					let whereStr = {
						name: data.trainTicket
					};
					dbo.collection("train").find(whereStr).limit(10).toArray(function(err, result) {
						if (err) throw err;
						console.log(result[0].num[data.index])
						for(let i=0;i<3;i++){
							if(i == data.index){
								NumTicket.push(result[0].num[i] - 1)
							}else{
								NumTicket.push(result[0].num[i])
							}
						}
						// 减少票数量
						MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
							if (err) throw err;
							var dbo = db.db("runoob");
							var whereStr = {"name": data.trainTicket};
							var updateStr = {$set: { "num" : NumTicket }};
							dbo.collection("train").updateOne(whereStr, updateStr, function(err, res) {
								if (err) throw err;
								console.log("文档更新成功");
							});
						});
						db.close();
					})
				})
				
				res.send(true);
			}else{
				res.send('冲突')
			}
		});
	})
	
})
//查询已经购买的火车票
app.get('/searchShopping',function(req,res){
	var data = req.query;
	var MongoClient = require('mongodb').MongoClient;
	var url = 'mongodb://localhost:27017';
	MongoClient.connect(url, { useUnifiedTopology: true ,useNewUrlParser: true }, function(err, db) {
		if(err) throw err;
		var dbo = db.db("runoob");
		var whereStr = data;  // 查询条件
		//find是查询条件，limit是返回条数
		dbo.collection("people_train").find(whereStr).limit(10).toArray(function(err, result) {
		    if (err) throw err;
		    db.close();
			res.send(result)
		});
	})
})
//退票
app.get('/deleteTrain',function (req, res) {
	var data = req.query;
	var MongoClient = require('mongodb').MongoClient;
	var url = "mongodb://localhost:27017/";
	 
	MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
	    if (err) throw err;
	    var dbo = db.db("runoob");
	    var whereStr = {"telephone": data.telephone,"trainTicket":data.trainTicket};  // 查询条件
	    dbo.collection("people_train").deleteOne(whereStr, function(err, obj) {
	        if (err) throw err;
	        db.close();
	    });
	});
   res.send();
})

//爬虫接口
app.get('/pullUrlData', function(req, res) {
	let httpUrl = 'https://nodejs.org/dist/latest-v12.x/docs/api/';
	let urlObj = url.parse(httpUrl)
	//给地址解析成json对象
	console.log(urlObj)
	let http = "./xuexi/huanglin.html"
	// 自动拼接URL地址
	httpUrl = url.resolve(httpUrl, http)
	console.log(httpUrl)
	//爬虫。在node执行请求地址，获得数据
	// axios.get('https://nodejs.org/dist/latest-v12.x/docs/api/')
	// .then(function(res){
	// 	console.log(res)
	// })
	request.get('https://nodejs.org/dist/latest-v12.x/docs/api/',
		function(err, res, body){
		//console.log(body)
		//bode是爬虫得到的DOM节点。通过正则获取指定的内容
		let reg1 = /<a href="(.*?)".*?>(.*?)<\/a>/igs;
		let arrClass = []
		var res;
		while( res = reg1.exec(body)){
			let obj = {
				className: res[2],
				urlL: res[1]
			}
			arrClass.push(obj)
		}
		//正则是任何网站都可以爬，但是正则是有针对性，每次可能要针对写正则

	})
})
//cheerio爬虫
app.get('/cheerioPull', function (req, res) {
	//获取HTML文档内容，内容的获取和jquery一样
	let urlData;
	let httpUrl = 'https://www.fabiaoqing.com/bqb/detail/id/54003.html';
	axios.get(httpUrl).then((res) => {
		// cheerio解析html文档
		let $ = cheerio.load(res.data);
		//通过cheerio得到DOM，复制给  $   之后，就能和jquery一样，操作DOM了
		urlData = $('.bqppdiv1 img').attr('src');
		console.log(urlData);
		
	})
	res.send(urlData);
})
//代理
app.get('/httpDaili',function(req, res) {
	let httpUrl = 'https://www.fabiaoqing.com/bqb/detail/id/54003.html';
	let url = 'https://www.kuaidaili.com/free/';
	let options = {
		proxy: {
			host: '112.111.217.38',
			port: '9999'
		}
	}
	//使用代理，网上有代理http地址，使用代理，改变options的ip和端口，默认是自己的地址127.0.0.1和8080
	axios.get(httpUrl, options).then(function(res){
		console.log(res.data)
	})
})
//服务端渲染
app.get('/serverDom',function(req, res) {
	let name = [
		{
			name: 'huanglin',
			age: 12
		},
		{
			name: 'xulinlin',
			age: 13
		}
	];
	fs.readFile('./node.html', 'utf-8', function(err, data) {
        if (err) {
            res.send('文件读取失败');
        } else {
			res.send(data);
        }
    });
	// let index = req.pathObj.base;
	// res.render(name[index], './App.html');
})
//中间件
app.use(function(req, res, next){
	console.log('此页面会备调用');
	//定义中间件方法，在请求中调用
	res.addNum = function(a, b) {
		return a+b;
	}
	next();
})
app.get('/initNpmHttp',function(req, res){
	//上传npm包，错误
	console.log(req.query)
	console.log(gohttp)
	res.send('中间件'+res.addNum(1, 2))
})

app.get('/manager/user/add',function(req, res){
    // let query = req.param;
    let resData = {
        weather: '晴',
        num: 20
	}
	var client = require('mongodb').MongoClient;
	var url ='mongodb://localhost:27017/';
	client.connect(url,{ useNewUrlParser: true, useUnifiedTopology: true }, function(err, db) {
		if(err) throw err
		console.log('创建成功');
		var test = db.db("admin").collection('test')
		test.insertOne({name: 'huanglin',age: 1}).then((res)=>{
			return test.find({}).toArray().then(arr=>{
				console.log(arr)
			})
		})
		//创建集合
		
		db.close();
	})
    res.send(JSON.stringify(resData))

})
app.get('/user/show',function(req, res){
	var mongoClient = require('mongodb').MongoClient;
	var url ='mongodb://localhost:27017/';
	mongoClient.connect(url,function(err, db){
		var dbBase = db.db('admin');
		dbBase.collection('site').find({}).toArray(function(err, result){
			if(err) throw err
			console.log(result)
			db.close()
			res.send(result)
		})
	})
})
//路由模块
let router1 = express.Router()
router1.get('/', (req, res)=> {
	res.send('首页')
})
router1.get('/list', (req, res)=> {
	res.send('列表页')
})
app.use('/mall',router1)
//定义了模块之后，访问/mall就是访问首页，/mall/list就是访问列表页

var server = app.listen(8081, function () {
 
  var host = server.address().address
  var port = server.address().port
 
  console.log("应用实例，访问地址为 http://%s:%s", host, port)
})

// http发起请求------------------------------

//get请求
// http.get('http://aicoder.com', res => {
//   res.on('data', data => {
//     console.log(data.toString('utf8'));
// 	console.log('http的get请求')
//   });
// });
// server.on('connection', () => {
//   console.log('握手');
// });
// server.on('close', () => {
//   console.log('server will close');
// });
// 关闭服务功能
// server.close();