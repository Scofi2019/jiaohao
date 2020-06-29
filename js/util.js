/**
 * 自定义时间格式化
 * 
 * @param fmt
 * @returns
 */
Date.prototype.Format = function(fmt) {
	var o = {
		"M+" : this.getMonth() + 1, // 月份
		"d+" : this.getDate(), // 日
		"H+" : this.getHours(), // 小时
		"m+" : this.getMinutes(), // 分
		"s+" : this.getSeconds(), // 秒
		"q+" : Math.floor((this.getMonth() + 3) / 3), // 季度
		"S" : this.getMilliseconds()
	// 毫秒
	};
	if (/(y+)/.test(fmt))
		fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "")
				.substr(4 - RegExp.$1.length));
	for ( var k in o)
		if (new RegExp("(" + k + ")").test(fmt))
			fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k])
					: (("00" + o[k]).substr(("" + o[k]).length)));
	return fmt;
};

/**
 * 根据日期获取星期
 */
function getWeekStr(sdate){
    function toDate(uYear, uMonth, uDay) {
        var arr = "日一二三四五六".split("");
        with (document.all) {
			var vYear = parseInt(uYear, 10);
			var vMonth = parseInt(uMonth, 10);
			var vDay = parseInt(uDay, 10);
		}
		var week = "星期" + arr[new Date(vYear, vMonth - 1, vDay).getDay()];
		return week;
	}
	if (sdate) {
		var arr = sdate.split("-");
		var week = toDate(arr[0], arr[1], arr[2]);
		return week;
	}
	return "";
}

/**
 * 扩展对象的属性
 */
function extend(source, common){
	var copy = function(obj, common){
		if(typeof obj === "function"){
			for(var i in common){
				obj.prototype[i] = common[i];
			}
		}else{
			for(var i in common){
				obj[i] = common[i];
			}
		}
		return obj;
	};

	if(source.constructor === Array){
		for(var i in source){
			copy(source[i], common);
		}
	}else{
		return copy(source, common);
	}
};