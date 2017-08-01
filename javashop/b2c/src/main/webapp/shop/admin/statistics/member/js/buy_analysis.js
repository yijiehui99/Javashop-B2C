/**
 * 购买分析页面
 */

var buyFreNum = 10;	//购买频次最大频次

$(function(){
	
	//初始化下拉菜单中的时间
	var currentYear = new Date().getFullYear();
	var historyYear = currentYear-10;
	var currentmonth = new Date().getMonth();
	currentmonth+=1;
	
	//for循环得到年数
	for(var i=0;i<20;i++){
		
		//选中当前年 
		if(currentYear==historyYear){
			$("#year").append("<option value='"+historyYear+"' selected >"+historyYear+"年</option>" );
		}else{
			$("#year").append("<option value='"+historyYear+"' >"+historyYear+"年</option>" );
		}
		historyYear++;
	}
	
	//for循环得到月份
	for(var i=1;i<=12;i++){
		
		// 选中当前月
		if(currentmonth==i){
			$("#month").append("<option value='"+i+"' selected >"+i+"月</option>" );
		}else{
			$("#month").append("<option value='"+i+"' >"+i+"月</option>" );
		}
	}
	
	
	
	
	// 设置价格区间单机事件
	$("#set_sections_btn").click(function(){
		openPriceSections();
	});
	
	var dateWhere = getDateWhere();
	
	// 初始化统计数据 默认区间 0~500 500~1000 1000~1500 1500~2000
	initOrderPrice("sections=0&sections=500&sections=1000&sections=1500&sections=2000", dateWhere);
	
	//初始化购买频次datagrid
	initBuyFre(dateWhere);
	
	//初始化购买时段统计图
	initBuyTimeDis(dateWhere);
	
	//搜索按钮单击事件
	$("#search_statis").click(function(){
		var dateWhere = getDateWhere();
		
		//如果没有时间条件 就不用刷新
		if(!dateWhere) {
			return;
		}
		var where = "sections=0&sections=500&sections=1000&sections=1500&sections=2000";
		
		// 如果有区间数据并且数据正确 就不用默认区间
		if($("#sections_is_true").val() == "1") {
			where = $("#sections_serialize").val();
		}
		
		// 初始化统计数据 
		initOrderPrice(where, dateWhere);
		
		//初始化购买频次datagrid
		initBuyFre(dateWhere);
		
		//初始化购买时段统计图
		initBuyTimeDis(dateWhere);
	});
	
	var type = $("#cycle_type").val();
	
	// 如果统计类型 是按年统计
	if(type == "2") {
		$("#month").hide();
	} else {
		$("#month").show();
	}
	
	// 统计类型变更事件
	$("#cycle_type").change(function(){
		
		var type = $(this).val();
		
		// 如果统计类型 是按年统计
		if(type == "2") {
			$("#month").hide();
		} else {
			$("#month").show();
		}
		
	});
});

/**
 * 初始化购买时段分布统计图
 */
function initBuyTimeDis(dateWhere) {

	// ajax配置
	var options = {
		url : ctx + "/shop/admin/memberStatistics/get-buy-time-dis.do" ,
		data : {'start_date' : dateWhere[0], 'end_date' : dateWhere[1]},
		type : "post",
		dataType:"json",
		success:function(data){
			//如果获得正确的数据
			if (data.result == 1) {
				//alert(JSON.stringify(data.data));
				if(data.data && data.data.length < 1) {
					//alert("当前条件下没有统计数据");
				}
				
				// 1.获取到统计图相关配置
				var conf = getBuyTimeDisConfig(data.data);
				
				// 2.初始化统计图
				initHistogram("buy_time_dis",conf);

			} else {
				alert("调用action出错：" + data.message);
			} 
		},
		error:function(){
			alert("系统错误，请稍候再试");
		}
	};
	$.ajax(options);
}

/**
 * 初始化购买频次列表
 */
function initBuyFre(dateWhere){
	// ajax配置
	var options = {
		url : ctx + "/shop/admin/memberStatistics/get-buy-fre.do",
		data : {'start_date' : dateWhere[0], 'end_date' : dateWhere[1]},
		type : "post",
		dataType:"json",
		success:function(data){
			//如果获得正确的数据
			if (data.result == 1) {
				
				// 1.初始化datagrid
				$("#buy_fre_dg").datagrid();
				
				// 2.准备数据
				var list = [];
				
				// 循环生成购买频次数据   遍历多一次  统计最大频次以上的数据
				for (var i = 0; i < buyFreNum; i++) {
					var index = i + 1;
					var result = false;		// 是否存在该条频次
					//找到相应购买次数的数据
					for (var key in data.data) {
						var row = data.data[key];
						
						//如果这条数据的购买次数 相符
						if( row.buy_num == index ) {
							list.push(row);
							result = true;
							break;
						}
					}
					// 如果没有该频次数据  则加入空数据
					if ( !result ) {
						list.push({"total_num":0,"buy_num":index,"member_num":0});
					}
				}
				
				// 添加 超过频率的数据
				var lastRow = lastRow = {"total_num":data.data[0].total_num,"buy_num":buyFreNum + '+',"member_num":0};	// 最后一行数据
				for (var key in data.data) {
					var row = data.data[key];
					
					// 如果该条数据大于频次最大数
					if(row.buy_num > buyFreNum ) {
						
						// 如果购买人数 没有值
						if (!lastRow.member_num) {
							lastRow.member_num = 0;
						}
						
						// 增加人数
						lastRow.member_num += row.member_num;
						
					}
				}
				
				// 添加进数据
				list.push(lastRow);
				
				// 3.将数据绑定到datagrid  
				$("#buy_fre_dg").datagrid('loadData', list); 
			} else {
				alert("调用action出错：" + data.message);
			} 
		},
		error:function(){
			alert("系统错误，请稍候再试");
		}
	};
	$.ajax(options);
};

/**
 * 打开设置区间窗口
 */
function openPriceSections() {
	
	// 初始化价格区间弹出框
	$('#dialog_div').dialog({
		title : '设置价格区间',
		modal:true,
		autoOpen: false,
		buttons : [ {
			text : '保存',
			handler : function() {
				var savebtn = $(this);				// 获取按钮本身
				var result = getSections();
				if (result) {
					$('#dialog_div').dialog('close');
				}
			}
		} ]
	});
}

function getSections(){
	
	var $sections = $("input[name='sections']");
	
	var result = true;		//数据是否正确
	var allNone = true ;
	var allZero = true ;
	
	$sections.each(function(index,element){
		var self = $(this);
		var val = self.val();
		if(val != "") {
			if(isNaN(val)){
				result = false;
			}
		}
		if(val !="" && self.attr("type") !="hidden" ){
			allNone = false ;
		}
		if(val != 0){
			allZero = false ;
		}
	});
	if(allNone) {
		alert("区间不能全部为空");
		return false;
	}else if (allZero){
		alert("区间范围不能全部为0");
		return false;
	}else if (result) {
		var dateWhere = getDateWhere();
		
		// 保存区间序列化后的文本
		$("#sections_serialize").val($("#section_form").serialize());
		initOrderPrice($("#sections_serialize").val(),dateWhere);
		
		//记录区间数据正确
		$("#sections_is_true").val("1");
		return true;
	} else {
		alert("请填写正确的区间值");
		
		//记录区间数据错误  （不用记录，默认错误，如果保存正确值一次之后 可以重复使用，输入框不影响以前正确的数据）
		//$("#sections_is_true").val("0");
		return false;
	}
}

/**
 * 初始化客单价分布图
 * 
 * @param where 条件
 */
function initOrderPrice(where,dateWhere){
	// ajax配置
	var options = {
		url : ctx + "/shop/admin/memberStatistics/get-order-price-dis.do?" + where,
		data : {'start_date' : dateWhere[0], 'end_date' : dateWhere[1]},
		type : "post",
		dataType:"json",
		success:function(data){
			//如果获得正确的数据
			if (data.result == 1) {
				//alert(JSON.stringify(data.data));
				if(data.data && data.data.length < 1) {
					//alert("当前条件下没有统计数据");
				}
				
				// 1.获取到统计图相关配置
				var conf = getPriceDisConfig(data.data);
				
				// 2.初始化统计图
				initHistogram("order_price_dis",conf);
				
				// 3.初始化datagrid
				//$("#order_price_dg").datagrid();
				
				// 4.将数据绑定到datagrid  
				//$("#order_price_dg").datagrid('loadData', data.data); 
			} else {
				alert("调用action出错：" + data.message);
			} 
		},
		error:function(){
			alert("系统错误，请稍候再试");
		}
	};
	$.ajax(options);
}

/**
 * 获取日期条件
 * @return dateWhere[] 下标0=开始时间  下标1=结束时间
 */
function getDateWhere(){
	
	var c_type = $("#cycle_type").val();
	var startDate, endDate; //开始时间和结束时间
	
	if (c_type == 0) {
		alert("请先选择查询方式!");
		return;
	}
	
	//如果是按照年来筛选订单的
	if(c_type == 2) {
		
		var year = $("#year").val();
		
		if(year == 0) {
			var dateWhere = [];
			dateWhere[0] = "";
			dateWhere[1] = "";
			return dateWhere;
		}
		
		startDate = year + "-01-01 0:0:00";
		endDate = year + "-12-31 23:59:59";
		
	} else {
		
		var year = parseInt($("#year").val());
		var month = parseInt($("#month").val());

		if(year == 0) {
			alert("请选择年份");
			return;
		}
		if(month == 0) {
			alert("请选择月份");
			return;
		}
		
		//得到一个月最后一天
		var lastDate = new Date(year, month, 0);
		var lastDay = lastDate.getDate();
		
		startDate = year + "-" + month + "-01 0:0:00";
		endDate = year + "-" + month + "-" + lastDay + " 23:59:59";
	}
	var dateWhere = [];
	dateWhere[0] = startDate;
	dateWhere[1] = endDate;
	return dateWhere;
}

/**
 * 获取到客单价分布统计图配置
 * @param json 数据
 */
function getBuyTimeDisConfig(json){
	
	var conf = {};			//配置
	var colors = Highcharts.getOptions().colors;	// 颜色

	var data = [];	// Y轴 排名数据
	var categories = []; //X轴 名次数据
	
	// 遍历生成 data,categories
	for(var i in json) {
		var order = json[i];
		
		//添加到数组
		data.push(order.num);
		categories.push("" + order.hour_num);
	}
	
	var conf = {
		title : "购买时段分布图" ,		//统计图标题
		yDesc : "订单数量（个）" ,			//y轴 描述
										//X 轴数据 [数组]
		categories : categories,				
            							//Y轴数据 [数组]
		series : [
			{
				name : '下单量', 
				data: data
			}
		]						

	};
	return conf;
};

/**
 * 获取到客单价分布统计图配置
 * @param json 数据
 */
function getPriceDisConfig(json){
	
	var conf = {};			//配置
	var colors = Highcharts.getOptions().colors;	// 颜色

	var data = [];	// Y轴 排名数据
	var categories = []; //X轴 名次数据
	
	// 遍历生成 data,categories
	for(var i in json) {
		var order = json[i];
		
		//添加到数组
		data.push(order.num);
		categories.push("" + order.elt_data);
	}
	
	var conf = {
		title : "客单价分布图" ,		//统计图标题
		yDesc : "订单数量（个）" ,			//y轴 描述
										//X 轴数据 [数组]
		categories : categories,				
            							//Y轴数据 [数组]
		series : [
			{
				name : '下单量', 
				data: data
			}
		]						

	};
	return conf;
};


/**
 * 初始化曲线图
 * @param id	html 初始化div的id
 * @param conf	相关配置
 */
function initHistogram(id,conf){

	var options = {
			credits: {
	             //text: 'Javashop',
	             //href: 'http://www.javamall.com.cn'
				enabled:false
	        },
	        chart: {
	            type: 'line'
	        },
	        title: {
	            text: conf.title
	        },
	        xAxis: {
	            categories: conf.categories
	        },
	        yAxis: {
	            title: {
	                text: conf.yDesc
	            }
	        },
	        plotOptions: {
	            line: {
	                dataLabels: {
	                    enabled: true
	                }
	            }
	        },
	        series: conf.series
	    };
	$("#" + id).highcharts(options);
};