//叫号对象
var jiaohao = {
	init : function(){
		window.onload = function(){
			jiaohao.resize();

			//初始化websocket
			jiaohao.websocket.init();
            
			//初始化待叫号队列
			jiaohao.data.queue.init();

            //定义刷新待叫号队列函数
            jiaohao.refreshQueue = function(){
				jiaohao.queryQueue(function(d){
					//设置左侧待叫号排队列表
					jiaohao.data.queue.buildUI(d[config.l.queueType], true, "l");
					//设置右侧待叫号排队列表
					jiaohao.data.queue.buildUI(d[config.r.queueType], true, "r");
				});
            };
            
			//立即执行刷新队列
			jiaohao.refreshQueue();

            //定时刷新待叫号队列数据
			setInterval(function(){
				jiaohao.refreshQueue();
			}, 5000);

            //查询提示信息
            jiaohao.queryTips(function(d){
				jiaohao.data.prompt.set(d.tips);
				jiaohao.data.other.setDept(d.deptInfo.DEPTNAME);
            });
			//设置当前时间
			jiaohao.data.other.setTime();
		}

		window.onresize = function(){
			jiaohao.resize();
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
	//webscoket交互对象
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

				jiaohao.refreshQueue();
        	};
    		
    		this.ref.onerror = function () {
    			console.log("WebSocket连接发生错误");
                jiaohao.websocket.reconnect();
        	};
        	this.ref.onopen = function (evt) {
        		console.log("WebSocket连接成功");
				jiaohao.websocket.clearrec();
        	};
        	this.ref.onclose = function () {
        		console.log("WebSocket连接关闭");
				jiaohao.websocket.reconnect();
        	};
    	},
		//清除定时重连任务
		clearrec : function(){
			try{
				if(this._websocket_reconnect){
					clearInterval(this._websocket_reconnect);
					this._websocket_reconnect = null;
			    }
			}catch(e){
				console.log(e);
			}
		},
		//重新连接
		reconnect : function(){
            this.clearrec();
			this._websocket_reconnect = setInterval(function(){
				jiaohao.websocket.init();
			}, 10000);	
		},
	    //发送消息
    	send : function(message){
    		this.ref.send(message);
    	},
		//关闭连接
    	close : function(){
    		this.ref.close();
    	}
    },
	//数据绑定
	data : {
        //待叫号客户队列
		queue : {
			//排队类别
			collection : {
				//左侧排队列表
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
				//右侧排队列表
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
			//初始化
			init : function(){
				var lths = document.querySelectorAll(".jh-box-list.l>.jh-box-list-head>.jh-box-list-tr>.jh-box-list-th");
				var rths = document.querySelectorAll(".jh-box-list.r>.jh-box-list-head>.jh-box-list-tr>.jh-box-list-th");

				for(var i = 0; i < lths.length; i++){
					var th = lths[i];
					th.innerHTML = config.l.colName[th.getAttribute("name")];
				}

				for(var i = 0; i < lths.length; i++){
					var th = rths[i];
					th.innerHTML = config.r.colName[th.getAttribute("name")];
				}

				if(config.l.hidden){
					document.querySelector(".jh-box-list.l").classList.add("hidden");
					if(!config.r.hidden){
                        document.querySelector(".jh-box-list.r").style.width = "100%";
					}
				}
                
				if(config.r.hidden){
					document.querySelector(".jh-box-list.r").classList.add("hidden");
					if(!config.l.hidden){
                        document.querySelector(".jh-box-list.l").style.width = "100%";
					}
				}

				if(config.l.hidden || config.r.hidden){
					document.querySelector(".jh-box-list.c").classList.add("hidden");
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
					blb.innerHTML = this._createElement(q.sortNo, q.queueCode, q.custName);

					var maxHeight = boxB.offsetHeight - bc.offsetHeight - blh.offsetHeight;

					var blbt = document.querySelector(".jh-box-list."+type+">.jh-box-list-body>.jh-box-list-tr"),
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
                    html += this._createElement(q.sortNo, q.queueCode, q.custName);
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
		//叫号
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
			set : function(data){
				if(!data) return;
				var htm = "<ul>";
				for(var i = 0; i < data.length; i++){
					htm += "<li>" + data[i].tips + "</li>";
				}
				htm += "</ul>";
				promptMsg.innerHTML = htm;

				if(data.length > 1){
					var lis = document.querySelectorAll("#promptMsg>ul>li");
					var k = 0;
					setInterval(function(){
						lis[k].style.display = "none";
						k++;
						if(k > lis.length - 1){
							k = 0;
							for(var i=0;i<lis.length;i++){
								lis[i].style.display = "";
							}
						}
					}, 5000);
				}
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
	//查询待叫号队列数据
	queryQueue : function(callback){
		var param = {
			tenantID : config.tenantId, 
			qsCode : config.l.queueType + "," + config.r.queueType
		};
        
		this.ajax({
			method : "POST",
			url : "http://" + config.serverUrl + "/queue/findPreCallQueueList",
			postData : param,
			dataType : "json",
			success : function(data){
			    callback(data);
			}
		});
	},
	//查询提示信息
	queryTips : function(callback){
		var param = {
			tenantID : config.tenantId, 
			deptId : config.deptId,
			qsCode : config.l.queueType + "," + config.r.queueType
		};
        
		this.ajax({
			method : "POST",
			url : "http://" + config.serverUrl + "/queue/findQueueTipList",
			postData : param,
			dataType : "json",
			success : function(data){
			    callback(data);
			}
		});
	},
    //封装发送请求
	ajax : function(opt){
		var defaultOption = {
			method : "GET",
			url : "",
			async : true,
			postData : null,
			dataType : "json"
		}
		var option = extend(defaultOption, opt);

		var xhr = new XMLHttpRequest();

        xhr.open(option.method, option.url, option.async);
		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");

        var param = "";
        if(option.postData){
			for(var i in option.postData){
				param += i + "=" + option.postData[i] + "&";
			}
        }
        xhr.send(param);

        // 请求成功
		xhr.addEventListener("load", function(e){
		    if (xhr.status == 200) {
				if(option.dataType.toLowerCase() == "json"){
					option.success(JSON.parse(xhr.responseText));
				}else{
					option.success(xhr.responseText);
				}
            }
		});

		// 请求出错
		xhr.addEventListener("error", function(e){
		});

		// 请求超时
		xhr.addEventListener("timeout", function(e){
		});
	},
	//播报语音
	sound : {
		trigger : function(name){
			msgSound.setAttribute("src", "http://" + config.serverUrl + "/tts/" + name + ".wav");
			msgSound.play();
		}
	}
}

jiaohao.init();