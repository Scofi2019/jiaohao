/**
 * 配置文件
 */
var config = {
	//服务器访问地址(免去http://前缀)
	serverUrl : "localhost:9000/reserve",
	//机构编码
    tenantId : "851010",
	//科室编码
	deptId : "85101054",
	//左侧待叫号排队列表
	l : {
		//对应的排队类型
		queueType : "tmdbwpd1",
		//左侧列表显示或隐藏
		hidden : false,
		//列表名称
		colName : {
			sortNo : "顺 序",
			queueCode : "编 号",
			custName : "预约客户"
		}
	},
	//右侧待叫号排队列表
	r : {
		//对应的排队类型
		queueType : "tmxbwpd2",
		//左侧列表显示或隐藏
		hidden : false,
		//列表名称
		colName : {
			sortNo : "顺 序",
			queueCode : "编 号",
			custName : "现场客户"
		}
	}
}