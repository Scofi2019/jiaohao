//叫号对象
var jiaohao = {
	init : function(){
		var myself = this;

		window.onload = function(){
			myself.resize();
			myself.websocket.init();

            var d = jiaohao.query();

            //设置待叫号排队列表
			jiaohao.data.queue.buildUI(d.reserveData, true, "l");
			//设置待叫号现场列表
			jiaohao.data.queue.buildUI(d.registData, true, "r");
			//设置当前时间
			jiaohao.data.other.setTime();
			//设置当前科室
			jiaohao.data.other.setDept("脱毛");
		}

		window.onresize = function(){
			myself.resize();
		}
	},
    //页面自适应
    resize : function(){
		var boxB = document.querySelector(".jh-box-body"),
			boxH = document.querySelector(".jh-box-head"),
			boxF = document.querySelector(".jh-box-foot"),
			bcall = document.querySelector(".jh-box-call"),
            blc = document.querySelector(".jh-box-list.c");
        
		boxB.style.height = (window.innerHeight - boxH.offsetHeight - boxF.offsetHeight - 70) + "px";
		blc.style.height = (window.innerHeight - boxH.offsetHeight - boxF.offsetHeight - bcall.offsetHeight - 70) + "px";
    },
	//web交互端口
    websocket:{
    	init : function(){
    		var myself = this;
    		//判断当前浏览器是否支持WebSocket
    		if ('WebSocket' in window) {
				var sessionId = config.tenantId + "_" + config.deptId;
    			this.ref = new WebSocket("ws://"+config.serverUrl+"/websocket?httpSessionId="+sessionId+"&tenantId="+config.tenantId+"&deptId="+config.deptId);
    		}else {
    		    alert('当前浏览器不支持websocket功能');
    		}
    		
    		//接收消息
        	this.ref.onmessage = function (event) {
                var data = event.data;
				if(!data) return;

				var i = data.lastIndexOf("-");
				var body = data.substring(0, i);
                var head = data.substring(i + 1);

				head = JSON.parse(head.substr(1, head.length - 2));

				//设置当前叫号内容
                jiaohao.data.call.set(body);
				//触发语音播叫
                jiaohao.sound.trigger(head.qID);
        	};
    		
    		window.onbeforeunload = function () {
    			myself.ref.close();
    		}
    		
    		this.ref.onerror = function () {
    			console.log("WebSocket连接发生错误");
        	};
        	this.ref.onopen = function (evt) {
        		console.log("WebSocket连接成功");
        	};
        	this.ref.onclose = function () {
        		console.log("WebSocket连接关闭");
        	};
    	},
    	send : function(message){
    		this.ref.send(message);
    	},
    	close : function(){
    		this.ref.close();
    	}
    },
	//数据
	data : {
        //待叫号客户队列
		queue : {
			//排队类别
			collection : {
				//预约排队
				l : {
					value : "l",
					//总页数
					pageSize : 1,
					//当前页
					pageNo : 1,
					//每页行数量
					rowNum : 1,
					//默认翻页时间
					pageTime : 5000,
				},
				//现场排队
				r : {
					value : "r",
					//总页数
					pageSize : 1,
					//当前页
					pageNo : 1,
					//每页行数量
					rowNum : 1,
					//默认翻页时间
					pageTime : 5000,
				}
			},
			//构造显示UI
			buildUI : function(queueList, refresh, type){
				var blb = document.querySelector(".jh-box-list."+type+">.jh-box-list-body");
                blb.innerHTML = "";

				var colt = this.collection[type];
				
				if(refresh){
					colt.queueList = queueList;

					if(!colt.queueList || colt.queueList.length == 0) return;

					var boxB = document.querySelector(".jh-box-body"),
					bc = document.querySelector(".jh-box-call");
					blh = document.querySelector(".jh-box-list.l>.jh-box-list-head");
					
					var q = colt.queueList[0];
					blb.innerHTML = this._createElement(q.sortNo, q.queuecode, q.cusname);

					var maxHeight = boxB.offsetHeight - bc.offsetHeight - blh.offsetHeight;

					var blbt = document.querySelector(".jh-box-list.l>.jh-box-list-body>.jh-box-list-tr"),
				    style = blbt.currentStyle || window.getComputedStyle(blbt);

					colt.rowNum = parseInt(maxHeight / (blbt.offsetHeight + parseFloat(style.marginTop.replace("px","")) + parseFloat(style.marginBottom.replace("px",""))));
                    colt.pageSize = colt.queueList.length % colt.rowNum == 0 ? parseInt(colt.queueList.length / colt.rowNum) : parseInt(colt.queueList.length / colt.rowNum + 1);
					colt.pageNo = 1;
					colt.startNum = 1;
					colt.endNum = colt.queueList.length < colt.rowNum ? colt.queueList.length : colt.rowNum;

					if(colt.pageSize > 1){
						colt._interval = setInterval(function(){
						    jiaohao.data.queue.buildUI(null, null, colt.value);
					    }, colt.pageTime);
					}
                }else{
					colt.pageNo = colt.pageNo < colt.pageSize ? (colt.pageNo + 1) : 1;
					colt.startNum = (colt.pageNo - 1) * colt.rowNum;
					colt.endNum =  colt.pageNo * colt.rowNum > colt.queueList.length ? colt.queueList.length : (colt.pageNo * colt.rowNum);
                }
				
				var html = "";
				for(var i = colt.startNum; i < colt.endNum; i++){
					var q = colt.queueList[i];
                    html += this._createElement(q.sortNo, q.queuecode, q.cusname);
				}

                blb.innerHTML += html; 
			},
			//创建等待队列页面元素
			_createElement : function(sortNo, queuecode, cusname){
				return '<div class="jh-box-list-tr">' +
						   '<div class="jh-box-list-th th-3">' + sortNo +
						   '</div>' +
						   '<div class="jh-box-list-th th-3">' + queuecode +
						   '</div>' +
						   '<div class="jh-box-list-th th-6">' + cusname +
						   '</div>' +
					   '</div>';
			}
		},
		//叫号客户信息
		call : {
			set : function(msg){
				callMsg.innerHTML = msg;

                var i = 0, clr = ["red", "#fff"];
				var si = setInterval(function(){
					document.querySelector(".jh-box-call>.icon-call").style.color = clr[i%2];
					i++;

					if(i > 15){
						clearInterval(si);
					}
				}, 500);
			}
		},
		//提示信息
		prompt : {
			insert : function(msg){
				promptMsg.innerHTML = msg;
			}
		},
		//科室、时间等信息
		other : {
			setDept : function(dName){
				deptName.innerHTML = dName;
			},
		    setTime : function(){
				var d = new Date();

				document.querySelector(".jh-box-date>.date>.str").innerHTML = d.Format("yyyy年MM月dd日") + " " + getWeekStr(d.Format("yyyy-MM-dd"));
				document.querySelector(".jh-box-date>.date>.time").innerHTML = d.Format("HH:mm");

				setInterval(function(){
					jiaohao.data.other.setTime();
				}, 10000);
		    }
		}
	},
	//查询数据
	query : function(){
		var data = [];
		for(var i=0;i<4;i++){
			data.push({sortNo:(i+1), queuecode:"A00"+(i+1), cusname:"张**"});
		}

		var data2 = [];
		for(var j=0;j<3;j++){
			data2.push({sortNo:(j+1), queuecode:"B00"+(j+1), cusname:"李**"});
		}
		return {reserveData:data, registData:data2};
	},
	//播报语音
	sound : {
		trigger : function(name){
			msgSound.setAttribute("src", "http://"+config.serverUrl+"/tts/"+name+".wav");
			msgSound.play();
		}
	}
}

jiaohao.init();