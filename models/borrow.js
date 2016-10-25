var db = require('./dbhelper');

function Borrow(number, barcode) {
	this.number = number;
	this.barcode = barcode;
}

module.exports = Borrow;

//��������¼
Borrow.save = function(number, barcode, callback) {
	db.getConnection(function(err,connection){
		if(err){
			throw err;
		}
		connection.beginTransaction(function(err){
			if(err){
				callback(err);
			}
			//����book���ݿ����鼮״̬ 0--�ɽ� 1--��� 2--��ʧ
			var updatesql = "update book SET state='1' WHERE barcode='" + barcode + "';";
			connection.query(updatesql,[],function(err,rows,fields){
				if(err){
					return connection.rollback(function(){
						callback(err);
					});
				}

				var date = new Date().Format("yyyy-MM-dd hh:mm:ss");
				var state = 1; // 0--�ѻ� 1--δ�� 2--��ʧ
				//д��������ݿ���
				var sql = "insert into borrow (number,barcode,outdate,state,frequency) values ('" + number + "','" + barcode + "','" + date + "','" + state + "','0');";
				connection.query(sql,[],function(err,rows,fields) {
					if(err){
						return connection.rollback(function(){
							callback(err);
						});
					}

					connection.commit(function(err){
						if(err){
							return connection.rollback(function(){
								callback(err);
							});
						}
						console.log('success!');
						connection.end();
						callback(err);
					});
				});
			});
		});
	});
};

//���ҵ�ǰ����
Borrow.findNowBorrow=function(number,callback){
	var sql="select bk.barcode,bk.title,bk.author,bw.outdate,bw.frequency,bk.address from borrow bw,book bk where bw.barcode=bk.barcode AND bw.state='1' AND number='"+number+"';"
	db.exec(sql,'',function(err,rows){
		callback(err,rows);
	}); 
}

//�������
// Book.returnBook=function(number,barcode){

// }

//�������
Borrow.renew=function(number,barcode,callback){
	db.getConnection(function(err,connection){
		if(err){
			throw err;
		}
		var sql;
		connection.beginTransaction(function(err){
			if(err){
				return callback(err);
			}
			sql="select frequency from borrow where number='"+number+"' and barcode='"+barcode+"';";
			connection.query(sql,[],function(err,rows){
				if(err){
					connection.rollback(function(){
						callback(err);
					});
				}

				var frequency;
				if(rows){
					frequency=rows[0].frequency;
				}

				console.log('frequency',frequency);

				if(frequency=='0'){
					frequency=1;
				}else if(frequency=='1'){
					frequency=2;
				}else{
					return callback('no pass 2')
				}
				var sql="update borrow set frequency='"+frequency+"' where number='"+number+"' and barcode='"+barcode+"'";
				connection.query(sql,[],function(err,rows){
					if(err){
						connection.rollback(function(){
							callback(err);
						})
					}

					connection.commit(function(err){
						if(err){
							return connection.rollback(function(){
								callback(err);
							});
						}
						callback();
					});	
				});
			});
		});
	});
};

//��ʷ����
Borrow.findHistory=function(number,callback){
	var sql="select bk.barcode,bk.title,bk.author,bw.outdate,bw.indate,bk.address from borrow bw,book bk where bw.barcode=bk.barcode AND bw.state='0' AND number='"+number+"';"
	db.exec(sql,'',function(err,rows){
		callback(err,rows);
	});
};

//���ڸ�ʽ������
Date.prototype.Format = function(fmt) {
	var o = {
		"M+": this.getMonth() + 1, //�·� 
		"d+": this.getDate(), //�� 
		"h+": this.getHours(), //Сʱ 
		"m+": this.getMinutes(), //�� 
		"s+": this.getSeconds(), //�� 
		"q+": Math.floor((this.getMonth() + 3) / 3), //���� 
		"S": this.getMilliseconds() //���� 
	};
	if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	for (var k in o)
		if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
	return fmt;
}