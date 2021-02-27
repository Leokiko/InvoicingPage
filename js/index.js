// ********************************************************************************************
// Excel文件的加载和保存


function selectFile() {
    //从其他选项卡切换到加载的时候隐藏搜索框
    $('.inputt').addClass("display-none");
    //隐藏之前所有数据，包括excel数据和搜索数据
    $('#result').empty();
    console.log("clear table and hide search-box to reload");

    document.getElementById('file').addEventListener('change', function(e) {

        var files = e.target.files;
        if (files.length == 0) return;
        var f = files[0];
        // if (!/\.xlsx$/g.test(f.name)) {
        //     alert('仅支持读取xlsx格式！');
        //     return;
        // }
        readWorkbookFromLocalFile(f, function(workbook) {
            readWorkbook(workbook);
        });
    });
    console.log("file loaded")
    document.getElementById('file').click();
}


// 读取本地excel文件
function readWorkbookFromLocalFile(file, callback) {
    console.log("reading file")
    $('#load').click(function() {
        $('.inputt').addClass("display-none");
    })
    var reader = new FileReader();
    reader.onload = function(e) {
        var data = e.target.result;
        var workbook = XLSX.read(data, {
            type: 'binary'
        });
        if (callback) callback(workbook);
    };

    //这里在读取的是Blob类型的file
    reader.readAsBinaryString(file);
}

// 读取 excel文件第二种方法，没有使用

// function outputWorkbook(workbook) {

//     console.log("fromming file")
//     var sheetNames = workbook.SheetNames; // 工作表名称集合
//     sheetNames.forEach(name => {
//         var worksheet = workbook.Sheets[name]; // 只能通过工作表名称来获取指定工作表
//         for (var key in worksheet) {
//             // v是读取单元格的原始值
//             console.log(key, key[0] === '!' ? worksheet[key] : worksheet[key].v);
//         }
//     });
// }

//读取第一个sheet，并插入html

var rootcsv; //定义全局变量来保存库存的csv，加载源的时候change，之后出入库更新的时候，也要同时更新
function readWorkbook(workbook) {

    console.log("Inserting table")
    var sheetNames = workbook.SheetNames; // 工作表名称集合
    var worksheet = workbook.Sheets[sheetNames[0]]; // 这里我们只读取第一张sheet
    var csv = XLSX.utils.sheet_to_csv(worksheet);
    //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------这里可以修改为直接读取csv
    // console.log("table csv为")
    // console.log(csv);
    // console.log(typeof csv);
    rootcsv = csv;
    document.getElementById('result').innerHTML = csv2table(csv);
    // console.log(csv2table(csv))
    warn();
}


//这里是对readWorkbook函数的修改，用于出入库更新，只得到数据，不插入页面
function read2getjsondata(workbook) {

    console.log("getting I/O/M data")
    var sheetNames = workbook.SheetNames; // 工作表名称集合
    var worksheet = workbook.Sheets[sheetNames[0]]; // 这里我们只读取第一张sheet
    var csv = XLSX.utils.sheet_to_csv(worksheet);
    // console.log(csv)
    var json = csv2JSON(csv);

    console.log("change-file's json was transfer")
        // console.log(json);
    return json;
}

// 将csv转换成表格
function csv2table(csv) {

    console.log("csv2table")
    var html = '<table>';
    var rows = csv.split('\n');
    rows.pop(); // 最后一行没用的
    rows.forEach(function(row, idx) {
        var columns = row.split(',');
        // console.log(columns.length);
        columns.unshift(idx); // 添加行索引
        if (idx == 0) { // 添加列索引
            html += '<tr>';

            html += "<th>" + '序号' + "</th>";
            for (var i = 1; i < columns.length; i++) {
                html += "<th id = \"th" + i + "\"  onclick=\"SortTable(this)\">" + columns[i] + "</th>";
                // console.log(i + "\n")
            }
            html += '</tr>';
        };
        if (idx != 0) {
            html += '<tr>';
            columns.forEach(function(column) {

                html += '<td>' + column + '</td>';
            })
            html += '</tr>';
        };
    });
    html += '</table>';

    // console.log("插入的html 为")
    // console.log(html)
    return html;
}

// 将表格转换成csv
function table2csv(table) {
    console.log("table2csv")
    var csv = [];
    $(table).find('tr').each(function() {
        var temp = [];
        $(this).find('th').each(function() {
            temp.push($(this).html());
        })
        $(this).find('td').each(function() {
            temp.push($(this).html());
        })
        temp.shift(); // 移除第一个序号
        csv.push(temp.join(','));
    });
    // csv.shift(); //移除表头
    return csv.join('\n');
}

// csv转sheet对象
function csv2sheet(csv) {

    console.log("csv2sheet")
    var sheet = {}; // 将要生成的sheet
    // console.log(csv);
    csv = csv.split('\n');
    csv.forEach(function(row, i) {
        row = row.split(',');
        if (i == 0) sheet['!ref'] = 'A1:' + String.fromCharCode(65 + row.length - 1) + (csv.length);
        sheet[length] = csv.length - 1;
        row.forEach(function(col, j) {
            sheet[String.fromCharCode(65 + j) + (i + 1)] = {
                v: col
            };
        });
    });
    console.log(sheet);
    return sheet;
}

// 将一个sheet转成最终的excel文件的blob对象，然后通过URL.createObjectURL实现下载到本地的功能
function sheet2blob(sheet, sheetName) {

    console.log("sheet2blob")
    sheetName = sheetName || 'sheet1';
    var workbook = {
        SheetNames: [sheetName],
        Sheets: {}
    };
    workbook.Sheets[sheetName] = sheet;
    // 生成excel的配置项
    var wopts = {
        bookType: 'xlsx', // 要生成的文件类型
        bookSST: false, // 是否生成Shared String Table，如果开启生成速度会下降
        type: 'binary'
    };
    var wbout = XLSX.write(workbook, wopts);
    // console.log(wopts, workbook)
    var blob = new Blob([s2ab(wbout)], {
        type: "application/octet-stream"
    });


    // 字符串转ArrayBuffer
    function s2ab(s) {
        console.log("s2ArrayBuffer");
        var buf = new ArrayBuffer(s.length);
        var view = new Uint8Array(buf);
        for (var i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    }
    return blob;
}


//csv转Json

//var csv is the CSV file with headers
function csv2JSON(csv) {
    // console.log(csv)
    var lines = csv.split("\n");
    // console.log(lines);

    //rootcsv最后多了一行空数据
    lines.pop();

    // console.log(lines);
    var result = [];
    var headers = lines[0].split(",");
    for (var i = 1; i < lines.length; i++) {
        var obj = {};
        var currentline = lines[i].split(",");
        for (var j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentline[j];
        }
        result.push(obj);
    }
    //return result;
    //JavaScript object
    // return JSON.stringify(result); //返回JSON
    return result;
}

//buydata的csv2json

// function csv2JSONN(csv) {
//     // console.log(csv)
//     var lines = csv.split("\n");
//     // console.log(lines);
//     var result = [];
//     var headers = lines[0].split(",");
//     for (var i = 1; i < lines.length; i++) {
//         var obj = {};
//         var currentline = lines[i].split(",");
//         for (var j = 0; j < headers.length; j++) {
//             obj[headers[j]] = currentline[j];
//         }
//         result.push(obj);
//     }
//     //return result;
//     //JavaScript object
//     // return JSON.stringify(result); //返回JSON
//     return result;
// }


//Json转回csv
function JSON2csv(jsonn, attr) {
    // var str = '';
    // for (var i = 0; i < json.length; i++) {
    //     var line = '';
    //     for (var index in json[i]) {
    //         if (line != '') { line += ','; }
    //         line += json[i][index];
    //         console.log(index)
    //         console.log(json[i][index]);
    //     }
    //     str += line + '\n';
    // }
    // // str += ""
    // // console.log(str);
    // return str;

    var csv = '';
    $("#result").find('tr:first').find('th').not(':first').each(function() {
        csv += $(this).html() + ',';
    })
    if (attr) {
        csv += attr + ',';
    }


    csv = csv.substring(0, csv.length - 1);
    csv += '\n';
    for (var i = 0; i < jsonn.length; i++) {
        var line = '';
        for (var index in jsonn[i]) {
            if (line != '') line += ','
            line += jsonn[i][index];
        }

        csv += line + '\n';
    }
    // console.log('--------------------------------------------------')
    // console.log(csv)
    return csv;
}


//订购单的json转csv

// function json2csvFbuy(jsonn) {
//     var csv = '存货编号,订购总数,已到货,在途,';
//     csv = csv.substring(0, csv.length - 1);
//     csv += '\n';
//     for (var i = 0; i < jsonn.length; i++) {
//         var line = '';
//         for (var index in jsonn[i]) {
//             if (line != '') line += ','
//             line += jsonn[i][index];
//         }

//         csv += line + '\n';
//     }
//     // console.log('--------------------------------------------------')
//     // console.log(csv)
//     return csv;
// }


//下载保存函数
//用来打开保存窗口

/**
 * 通用的打开下载对话框方法
 * @param url 下载地址，也可以是一个blob对象，必选
 * @param saveName 保存文件名，可选
 */
function openDownloadDialog(url, saveName) {
    if (typeof url == 'object' && url instanceof Blob) {
        url = URL.createObjectURL(url); // 创建blob地址
    }
    var aLink = document.createElement('a');
    aLink.href = url;
    aLink.download = saveName || ''; // HTML5新增的属性，指定保存文件名，可以不要后缀，注意，file:///模式下不会生效
    var event;
    if (window.MouseEvent) event = new MouseEvent('click');
    else {
        event = document.createEvent('MouseEvents');
        event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    }
    aLink.dispatchEvent(event);
}


//html load的时候自动运行的代码
//也是table加载的代码
$(function() {
    //合并到读取函数中了
});


//日期格式化(yyyy-MM-dd h时mi分)，用于文件保存的时候生成当前时间作为文件名

function dateFmt(value) {
    if (null != value && "" != value) {
        var date = new Date(value);
        var y = date.getFullYear();
        var m = date.getMonth() + 1;
        if (m < 10) {
            m = "0" + m;
        }
        var d = date.getDate();
        if (d < 10) {
            d = "0" + d;
        }
        var h = date.getHours();
        var mi = date.getMinutes();
        return y + '-' + m + '-' + d + ' ' + h + '时' + mi + '分';
    } else {
        return "Time false";
    }
}


//下载转换函数
function exportExcel() {
    var csv = table2csv($('#result table')[0]);
    var sheet = csv2sheet(csv);
    var blob = sheet2blob(sheet); //三连转换
    var namee = dateFmt(new Date()) + '.xlsx';
    // console.log(csv, sheet, blob, namee);
    openDownloadDialog(blob, namee);
}







//功能js
// ********************************************************************************************
//排序后的新值，设置flag来按照点击次数来循环升序与降序
var flagg = 0;

function SortTable(obj) {
    console.log("begin sorting");

    // 获取所有的列
    var td1s = [],
        td2s = [],
        td3s = [],
        td4s = [],
        td5s = [],
        td6s = [],
        td7s = [],
        td8s = [],
        td9s = [],
        td10s = [],
        td11s = [],
        td12s = [];

    $("table").find("tr").not(":first").each(function() {
            td1s.push($(this).find("td:nth-child(2)")[0]);
            td2s.push($(this).find("td:nth-child(3)")[0]);
            td3s.push($(this).find("td:nth-child(4)")[0]);
            td4s.push($(this).find("td:nth-child(5)")[0]);
            td5s.push($(this).find("td:nth-child(6)")[0]);
            td6s.push($(this).find("td:nth-child(7)")[0]);
            td7s.push($(this).find("td:nth-child(8)")[0]);
            td8s.push($(this).find("td:nth-child(9)")[0]);
            td9s.push($(this).find("td:nth-child(10)")[0]);
            td10s.push($(this).find("td:nth-child(11)")[0]);
            td11s.push($(this).find("td:nth-child(12)")[0]);
            td12s.push($(this).find("td:nth-child(13)")[0]);
        })
        // console.log(td1s)

    // 每个列都定义数组,方便后面调整顺序
    var tdArray1 = [];
    var tdArray2 = [];
    var tdArray3 = [];
    var tdArray4 = [];
    var tdArray5 = [];
    var tdArray6 = [];
    var tdArray7 = [];
    var tdArray8 = [];
    var tdArray9 = [];
    var tdArray10 = [];
    var tdArray11 = [];
    var tdArray12 = [];

    // 将之前保存的所有列节点里面的数据都保存到对应数组中

    for (var i = 0; i < td1s.length; i++) {
        tdArray1.push(td1s[i].innerHTML);
        tdArray2.push(td2s[i].innerHTML);
        tdArray3.push(td3s[i].innerHTML);
        tdArray4.push(td4s[i].innerHTML);
        tdArray5.push(td5s[i].innerHTML);
        tdArray6.push(td6s[i].innerHTML);
        tdArray7.push(td7s[i].innerHTML);
        tdArray8.push(td8s[i].innerHTML);
        tdArray9.push(td9s[i].innerHTML);
        tdArray10.push(td10s[i].innerHTML);
        tdArray11.push(td11s[i].innerHTML);
        tdArray12.push(td12s[i].innerHTML);
    }

    // console.log(tdArray5);

    var colnum = obj.id.length == 3 ? obj.id.substr(2, 1) : obj.id.substr(2, 2);
    //console列序号
    // console.log(colnum);
    // 获取列名，保存到数组，这里保存到两个数组用于比较显示 var
    var tds = [];
    $("table").find("tr").not(":first").each(function() {
        tds.push($(this).find("td")[colnum]);
    })
    console.log(tds);

    //两次处理————先parseInt转Int保存为比较数组，然后再push一个副本作为源数组
    var columnArray = [];
    console.log("sorting");
    for (var i = 0; i < tds.length; i++) {
        if (tds[i].innerHTML) {
            columnArray.push(parseInt(tds[i].innerHTML))
        } else columnArray.push(0);


        // console.log("sorting" + i + "*****" + tds[i].innerHTML + "**********************************************");
    }

    // console.log("columnArray sortedIs\n" + columnArray);
    var orginArray = [];
    for (var i = 0; i < columnArray.length; i++) {
        orginArray.push(columnArray[i]);

        // console.log("sorting" + i + "*****" + columnArray[i] + "-----------------------------------------------");
    }


    // console.log("orginArray sortedIs\n" + orginArray);


    // table按某一特定列大小进行排序，得到最终序列
    function sortNumberD(a, b) {
        return a - b;
    }

    function sortNumberR(a, b) {
        return b - a;
    }


    if (flagg == 0) {
        flagg++;
        columnArray.sort(sortNumberD);
    } else {
        flagg--;
        columnArray.sort(sortNumberR);
    }
    // console.log(flagg)

    console.log("比较后 list\n" + columnArray);
    console.log("源 list\n" + orginArray);

    //这里就通过对副本数组和比较数组进行相等判断, 如果相等, 则将相同位置对应的所有列重新打印出来
    // console.log(columnArray.length)
    for (var i = 0; i < columnArray.length; i++) {
        for (var j = 0; j < orginArray.length; j++) {
            if (orginArray[j] == columnArray[i]) {
                //重新赋值显示
                //-------------------------------------------------------------------------------------------------------------------------------------------后面的按日期显示的出库数据不会参与排序
                // $("table").find("tr").not(":first").each(function () {
                //     $(this).find("td:nth-child(2)")[i].innerHTML = tdArray1[j];
                //     $(this).find("td:nth-child(3)")[i].innerHTML = tdArray2[j];
                //     $(this).find("td:nth-child(4)")[i].innerHTML = tdArray3[j];
                //     $(this).find("td:nth-child(5)")[i].innerHTML = tdArray4[j];
                //     $(this).find("td:nth-child(6)")[i].innerHTML = tdArray5[j];
                //     console.log($(this).find("td:nth-child(2)")[i].innerHTML)
                //     console.log($(this).find("td:nth-child(3)")[i].innerHTML)
                //     console.log($(this).find("td:nth-child(4)")[i].innerHTML)
                //     console.log($(this).find("td:nth-child(5)")[i].innerHTML)
                //     console.log($(this).find("td:nth-child(6)")[i].innerHTML)
                //})
                $("table").find("tr").not(":first")[i].children[1].innerHTML = tdArray1[j];
                $("table").find("tr").not(":first")[i].children[2].innerHTML = tdArray2[j];
                $("table").find("tr").not(":first")[i].children[3].innerHTML = tdArray3[j];
                $("table").find("tr").not(":first")[i].children[4].innerHTML = tdArray4[j];
                $("table").find("tr").not(":first")[i].children[5].innerHTML = tdArray5[j];
                $("table").find("tr").not(":first")[i].children[6].innerHTML = tdArray6[j];
                $("table").find("tr").not(":first")[i].children[7].innerHTML = tdArray7[j];
                $("table").find("tr").not(":first")[i].children[8].innerHTML = tdArray8[j];
                $("table").find("tr").not(":first")[i].children[9].innerHTML = tdArray9[j];
                $("table").find("tr").not(":first")[i].children[10].innerHTML = tdArray10[j];
                $("table").find("tr").not(":first")[i].children[11].innerHTML = tdArray11[j];
                $("table").find("tr").not(":first")[i].children[12].innerHTML = tdArray12[j];
                console.log($("table").find("tr").not(":first")[i].children[1].innerHTML)
                console.log($("table").find("tr").not(":first")[i].children[2].innerHTML)
                console.log($("table").find("tr").not(":first")[i].children[3].innerHTML)
                console.log($("table").find("tr").not(":first")[i].children[4].innerHTML)
                console.log($("table").find("tr").not(":first")[i].children[5].innerHTML)
                console.log($("table").find("tr").not(":first")[i].children[6].innerHTML)
                console.log($("table").find("tr").not(":first")[i].children[7].innerHTML)
                console.log($("table").find("tr").not(":first")[i].children[8].innerHTML)
                console.log($("table").find("tr").not(":first")[i].children[9].innerHTML)
                console.log($("table").find("tr").not(":first")[i].children[10].innerHTML)
                console.log($("table").find("tr").not(":first")[i].children[11].innerHTML)
                console.log($("table").find("tr").not(":first")[i].children[12].innerHTML)


                orginArray[j] = null;
                break;
            }
        }
    }
    warn();
}


// ********************************************************************************************
// Excel文件的出入库更新

//本来是用来去除千分位的，但是没用到
function removeThousand(num) {
    var x = num.split(',');
    return parseInt(parseInt(x.join("")).toFixed(3));
}

function libIn() {
    //只允许一次入库操作，点击后按钮消失
    //修改为字体加粗显示
    $('#in-lib').addClass('display-bold');

    document.getElementById('fileIn').addEventListener('change', function(e) {
        var files = e.target.files;
        if (files.length == 0) return;
        var f = files[0];
        // if (!/\.xlsx$/g.test(f.name)) {
        //     alert('仅支持读取xlsx格式！');
        //     return;
        // }
        readWorkbookFromLocalFile(f, function(workbook) {
            console.log("reading In-lib file");
            //转化源excel展示的table的数据为Json，之后与读入的入库的Json进行合并
            var indata = read2getjsondata(workbook);
            var rootjson = csv2JSON(rootcsv);
            // console.log(indata)
            // console.log(rootjson)

            //先是外层数据，之后才是内层数组
            //用change文件来做外层函数（好像也不用，只要arrij位置控制就行）


            //这里对rootjson做最初的初始化，init第一次加载库存文件
            var Data = getdata()
            console.log("when in data 前 Data为")
            console.log(Data)
            if (Data.length == 0) {
                for (let i = 0; i < rootjson.length; i++) {
                    whenInSet(0, rootjson[i].安全库存天数, rootjson[i].存货编码, Data)
                }
            }


            for (let i = 0; i < indata.length; i++) {
                var a = 0;
                for (let j = 0; j < rootjson.length; j++) {
                    if (indata[i].存货编号 == rootjson[j].存货编码) {
                        //数据操作
                        //需要提前去除千分位的逗号

                        rootjson[j].结存数量 = (parseInt(rootjson[j].结存数量) + parseInt(removeThousand(indata[i].数量))).toFixed(2);
                        // console.log(rootjson[j].结存数量)
                        // console.log(parseInt(rootjson[j].结存数量))
                        // console.log(indata[i].数量)
                        // console.log(removeThousand(indata[i].数量))
                        // console.log(parseInt(removeThousand(indata[i].数量)))
                        // console.log(rootjson[j].存货编码)
                        if (rootjson[j].已到货) rootjson[j].已到货 = parseInt(rootjson[j].已到货) + parseInt(removeThousand(indata[i].数量))
                        else rootjson[j].已到货 = parseInt(removeThousand(indata[i].数量))
                            // rootjson[j].物料月建议采购量 = suggestBuy(rootjson[j].物料平均日消耗, rootjson[j].结存数量, rootjson[j].安全库存天数, rootjson[j].物料购买等待天数)
                        a = 1;
                    }
                }

                if (a == 0) {
                    //新建追加json数据项
                    var newdjsondata = {
                            "存货编号": indata[i].存货编号,
                            "存货名称": indata[i].存货名称,
                            "存货规格": indata[i].规格型号,
                            "存货主计量单位": indata[i].计量单位,
                            "结存数量": removeThousand(indata[i].数量).toFixed(2),
                            "安全库存天数": "10", //手动更改
                            "物料平均日消耗": "", //置空
                            "物料购买等待天数": "15", //手动更改
                            "物料月建议采购量": "", //计算
                            "是否需要采购": "", //计算
                            "已下订单订购总数": "", //手动输入
                            "已到货": "", //置空
                        }
                        //插入rootjson
                    rootjson.push(newdjsondata)
                    console.log(rootjson);

                    //插入localstorage
                    //usecount, safeday, id, data
                    whenInSet(0, 15, indata[i].存货编号, Data)
                }
            }
            console.log("when in finally Data为")
            console.log(Data)
            storagedata(Data)
            console.log(JSON.parse(localStorage.getItem("key")))
            console.log("in finally rootjson值为")
            console.log(rootjson);
            //转回csv并重新赋值给rootcsv
            var avdancedata = JSON2csv(rootjson);
            // console.log(avdancedata)
            rootcsv = avdancedata;
            $('#result').children().remove();
            document.getElementById('result').innerHTML = csv2table(avdancedata);
            switchhide();
        });
    });
    console.log("In file ladded")
    document.getElementById('fileIn').click();
}


function libOut() {
    // 只允许一次出库操作，点击后按钮消失
    //修改为字体加粗显示
    $('#out-lib').addClass('display-bold');

    document.getElementById('fileOut').addEventListener('change', function(e) {

        var files = e.target.files;
        if (files.length == 0) return;
        var f = files[0];
        // if (!/\.xlsx$/g.test(f.name)) {
        //     alert('仅支持读取xlsx格式！');
        //     return;
        // }
        readWorkbookFromLocalFile(f, function(workbook) {
            console.log("reading Out-lib file");
            //转化源excel展示的table的数据为Json，之后与读入的出库的Json进行合并
            var outdata = read2getjsondata(workbook);
            var rootjson = csv2JSON(rootcsv);

            console.log("when out outdata值为")
            console.log(outdata)
            console.log("when out rootjson值为")
            console.log(rootjson)

            //因为涉及两个json的比较，仅仅计算出库数量
            for (let i = 0; i < rootjson.length; i++) {
                for (let j = 0; j < outdata.length; j++) {
                    if (outdata[j].材料编码 == rootjson[i].存货编码) {
                        //数据操作
                        rootjson[i].结存数量 = (parseInt(rootjson[i].结存数量) - parseInt(removeThousand(outdata[j].数量))).toFixed(2);
                    }
                }
            }


            //这里修改localstorage数据，更新出库历史记录，计算物料平均日消耗
            //如果当天没有出库，置值为0
            var Data = getdata();
            var timee = dateFmt(new Date()) + "Out";

            function outNum(outdata, id) {
                var flag = 0;
                for (var key in outdata) {
                    if (outdata[key].材料编码 == id) {
                        flag = 1;
                        return parseInt(outdata[key].数量);
                    }
                }
                if (flag == 0) {
                    return 0;
                }
            }
            for (let index = 0; index < rootjson.length; index++) {

                // console.log(outcount(rootjson[index].存货编码))
                rootjson[index].物料平均日消耗 = avg(outNum(outdata, rootjson[index].存货编码), rootjson[index].安全库存天数, rootjson[index].存货编码, Data)
                    // console.log(rootjson[index].物料平均日消耗)
                    // console.log(avg(outNum(outdata, rootjson[index].存货编码), rootjson[index].安全库存天数, rootjson[index].存货编码, Data))
                    // console.log(outNum(outdata, rootjson[index].存货编码))
                    // console.log(rootjson[index].安全库存天数)
                    // console.log(rootjson[index].存货编码)
                rootjson[index].物料月建议采购量 = suggestBuy(rootjson[index].物料平均日消耗, rootjson[index].结存数量, rootjson[index].安全库存天数, rootjson[index].物料购买等待天数)
                    //键名以时间命名
                rootjson[index][timee] = outNum(outdata, rootjson[index].存货编码);
            }

            console.log("when out finally Data为")
            console.log(Data)
            storagedata(Data)
            console.log("out finally rootjson值为")
            console.log(rootjson);
            //转回csv并重新赋值给rootcsv
            var avdancedata = JSON2csv(rootjson, timee);
            // console.log(timee)
            // console.log("``````````````````````````````````````````````````````````````````````````````````````")
            rootcsv = avdancedata;
            // console.log(rootcsv)
            $('#result').children().remove();
            document.getElementById('result').innerHTML = csv2table(avdancedata);
            switchhide();
        });
    });
    console.log("Out file ladded")
    document.getElementById('fileOut').click();
}


//不需要订购单选项卡了
// var buydata = []
//     //这里只是初始化表格，数据要自己填
// function purchase() {
//     $('#result').find("table").addClass("tablee");
//     // var buydata = getdata()
//     buydata = []
//     $(".tablee").find("tr").each(function() {
//         var name = $(this).find('td:nth(1)')
//         if ($(this).find('td:nth(11)').html() == "是") {
//             var arr = {
//                 "存货编号": $(this).find("td:nth(1)").html(),
//                 "订购总数": 0, //等待初始化
//                 "已到货": 0, //等待初始化
//                 "在途": 0, //等待初始化
//             }
//             buydata.push(arr)
//         }
//     })
//     $('.tablee').after(csv2table(json2csvFbuy(buydata)))
// }


// 预计可使用天数小于安全天数时数据项条目css样式突出表示
function warn() {
    $('.container').find('table').each(function() {
        $(this).find('tr').not(':first').each(function() {
            // console.log(this.children[8].innerHTML);
            // console.log(this.children[6].innerHTML + "\n")
            // console.log((parseFloat($(this)[0].children[5].innerHTML)) / (parseFloat($(this)[0].children[7].innerHTML)))
            // console.log(parseFloat($(this)[0].children[6].innerHTML))


            //因为是月度采购和随机采购2种采购方式


            // console.log((parseFloat($(this)[0].children[5].innerHTML) / parseFloat($(this)[0].children[7].innerHTML)))
            // console.log((parseFloat($(this)[0].children[5].innerHTML) / parseFloat($(this)[0].children[7].innerHTML)) <= ($(this)[0].children[6].innerHTML + 15))
            // console.log((parseFloat($(this)[0].children[5].innerHTML) / parseFloat($(this)[0].children[7].innerHTML)) <= ($(this)[0].children[6].innerHTML + 5))

            // console.log($(this)[0].children[5].innerHTML)
            // console.log($(this)[0].children[6].innerHTML)
            // console.log($(this)[0].children[7].innerHTML)         

            //预计可使用天数小于安全天数加15，就提醒需要采购
            //背景yellow，√

            if ((parseFloat($(this)[0].children[5].innerHTML) / parseFloat($(this)[0].children[7].innerHTML)) <= (parseFloat($(this)[0].children[6].innerHTML) + 15)) {
                $(this).css('background-color', 'yellow');
                $(this)[0].children[10].innerHTML = "2√";
                // console.log('11111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111')
                //预计可使用天数小于安全天数加5，就提醒急需采购
                //背景red，√√√
                if ((parseFloat($(this)[0].children[5].innerHTML) / parseFloat($(this)[0].children[7].innerHTML)) <= (parseFloat($(this)[0].children[6].innerHTML) + 5)) {
                    $(this).css('background-color', '#ff3300');
                    $(this)[0].children[10].innerHTML = "1√√√";
                    // console.log('22222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222')
                }
            } else {
                $(this).css('background-color', '')
                $(this)[0].children[10].innerHTML = "";
                // console.log('3333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333')
            }


        })
    })
}

// ********************************************************************************************
// 切换到列表页，调整页面内容
//隐藏input，重新显示table

//同时要更新localstorage内容，并且加载数据到table
// var buydataa = []

function switchhide() {

    console.log("--------------------------------warn is worked")
        //移除了订购单选项卡，所以不需要保存订购信息了

    //保存订购信息
    //length不为0，表示
    // if (buydata.length != 0) {
    //     var csv = table2csv($('#result').find('table:odd')[0])
    //     buydataa = csv2JSONN(csv)
    //     var rootjson = csv2JSON(rootcsv);
    //     console.log(rootcsv)
    //     for (let index = 0; index < rootjson.length; index++) {
    //         console.log(rootjson[index].物料月建议采购量)
    //         console.log(parseInt(changeAfterBuy(rootjson[index].存货编码, buydataa)))
    //         console.log(rootjson[index].物料月建议采购量 - parseInt(changeAfterBuy(rootjson[index].存货编码, buydataa)))
    //         rootjson[index].物料月建议采购量 = (rootjson[index].物料月建议采购量 - changeAfterBuy(rootjson[index].存货编码, buydataa)) > 0 ? (rootjson[index].物料月建议采购量 - changeAfterBuy(rootjson[index].存货编码, buydataa)) : 0
    //     }
    //     //转回csv并重新赋值给rootcsv
    //     var avdancedata = JSON2csv(rootjson);
    //     rootcsv = avdancedata;
    //     console.log(rootcsv)
    //     $('#result').children().remove();
    //     document.getElementById('result').innerHTML = csv2table(avdancedata);
    //     warn();
    // }

    // console.log("订购单Data")
    // console.log(Data)
    // storagedata(Data)
    //从搜索切换到列表时，删除已经搜索出来显示的内容
    $('#result').find('table:odd').remove();
    //使用天数接近或小于安全天数时提示
    warn();
    //移除切换到搜索页时添加的tablee class，去除display-none
    $('#result').find("table").removeClass("tablee");

    //从搜索切换到列表的时候隐藏搜索框
    $('.inputt').addClass("display-none");

}

$('#list-lib').click(function() {
    switchhide();
})



// ********************************************************************************************
// 点击搜索选项卡时初始化
var tablehead;
$('#lib-search').click(function() {
    //隐藏result表格内容，并生成搜索框和标签
    //只是隐藏内容，因为之后再使用下载按钮，还是要下载这个文件，后面切换到列表标签页的时候又直接display-block就可以了
    //并且之后的搜索内容也是以当前excel保存出来的table来展示的
    console.log("clear to search")
    $('#result').find("table").addClass("tablee");


    //把表头数据先保存出来，之后展示的时候直接用静态表头
    tablehead = $(".tablee").find('tr:first').clone();
    var tableheadd = '<table id="table2"><tbody><tr>' + tablehead.html() + '</tr></tbody></table>';
    $("#result").append(tableheadd);

    $('.inputt').removeClass("display-none");

    //将源数据存下来，之后用于匹配数据，进而展示
    var tableTags = [];
    $(".tablee").find('tr').not(":first").each(function() {
        // console.log("add search-standby");
        // console.log(this);
        // console.log($(this));
        tableTags.push($(this).find('td:nth-child(3)')[0].innerHTML)
    })
    console.log("waitng list below************************************\n" + tableTags);

    //这是自动联想的下拉框，因为去掉了搜索按钮变为直接显示所有部分以及全部匹配，所以也不需要了
    // $("#tags").autocomplete({
    //     source: tableTags,
    //     max: 10,

    // });
    show();
})



//onchange，动态更新搜索显示table

function show() {
    // 数据的搜索模糊式展示，这里取消了点击才搜索，直接动态获取input值，动态更新搜索结果
    var displaydata = [];
    $("#tags").on("input onpropertychange", function() {
        console.log("检测到输入-----------------------------------------------------\n输入为：")
            //删除之前的搜索展示
        $('#table2').find("tr:first").siblings().remove();
        // console.log(this)
        var key = $('#tags').val();
        console.log(key)
        var Exp = eval("/.*" + key + ".*/");
        // console.log(Exp)

        //不能用utf编码比较，所以直接用值比较
        // string_a.localeCompare(string_b);
        //后来又行了
        // var Exp = /^.*[\u6211].*$/,
        //最后发现正则可以直接识别汉字，不需要手动转编码

        //key的匹配

        // function keytrans(str) {
        //     var k = '';
        //     for (var i = 0; i < str.length; i++) {
        //         k += "\\u" + parseInt(str[i].charCodeAt(0), 10).toString(16);
        //     }
        //     k.replace(/\\\\*/, "\\u")
        //     return k
        // }
        // var keyy = keytrans(key);
        // var reg = new RegExp("^" + keyy + "$")
        // console.log(reg);



        // $(".tablee").find('tr').not(":first").each(function () {
        //     var tdd = this;
        //     // console.log(tdd) 已经成功选择出了表格数据
        //     function matchf() {
        //         console.log("tendtomatch")
        //         console.log($(tdd).find('td:nth-child(2)'))
        //         if ($(tdd).find('td:nth-child(2)').innerHTML.match(reg)) {
        //             console.log("matchsuccess");
        //             // console.log(this.parentElement.innerHTML);
        //             displaydata = this.parentElement.innerHTML.split('<td>').toString().split('</td>,')
        //             displaydata.shift();
        //             // displaydata.toString().split(",")
        //             // console.log(displaydata);
        //         }
        //     }
        //     matchf()
        // })
        $(".tablee").find('tr').not(":first").each(function() {
            console.log("tend to match");
            console.log($(this).find('td:nth-child(3)')[0].innerHTML);
            // console.log("reg:" + reg)
            if ($(this).find('td:nth-child(3)')[0].innerHTML.match(Exp)) {
                console.log("match success");
                var str = "<tr>" + $(this).html() + "</tr>"
                $("#table2").find('tbody').append(str);
            }
        })
        warn();
    });
}



// *****************************************************************************************************
//这里处理数据的存储，主要即针对平均日消耗的这些需要平均的日期的出库数据
//最终得到平均日消耗
//使用 localStorage.setItem("key", "value");
function avg(usecount, safeday, id, data) {
    //init，遍历Data.data，如果里面存在对应的id值，则push+shift
    //若里面不存在对应的id值，则通过flag检测，之后新建

    // console.log(data);
    whenInSet(usecount, safeday, id, data);
    // console.log(getAvg(id, data))
    return getAvg(id, data)

}


// window.localStorage.clear()


//localStorage数据
var dataa = [
    //daycounmt是需要合并计算平均日消耗的天数

    //data对象样例
    // {
    //     id: xxx,
    //     arr: [1, 2.3],
    // }
]

function getdata() {
    var Data;
    if (!localStorage.getItem("key")) {
        console.log(localStorage.getItem("key"))
        console.log("keyData是最初init定义的")
        Data = dataa;

    } else {
        console.log("keyData是从localstorage读取的");
        Data = localStorage.getItem("key");
        Data = JSON.parse(Data);
        // console.log(Data);
    }
    return Data
}

function storagedata(d) {
    var data = JSON.stringify(d)
        // console.log(Dataa)
        // console.log(Data)
    localStorage.setItem("key", data);
}

//向localstorage中插入历史消耗数据，没有则新建
function whenInSet(usecount, safeday, id, data) {
    var flag = 0;
    var t;
    for (let index in data) {
        //若存在id
        if (data[index].id == id) {
            // console.log("have matched id")
            if (safeday == data[index].arr.length) {
                flag = 1;
                data[index].arr.push(usecount);
                t = data[index].arr[0];
                data[index].arr.shift();
                //保证时长量少的物料非零
                if (!data[index].arr.some(item => item !== 0)) data[index].arr[0] = t;
            }

            //若更改安全库存天数
            else if (safeday < data[index].arr.length) {
                data[index].arr.push(usecount);
                t = data[index].arr[0];
                data[index].arr.shift();
                flag = 1;
                for (let i = 0; i < (data[index].arr.length - safeday); i++) {
                    if (data[index].arr[0] != 0)
                        t = data[index].arr[0];
                    data[index].arr.shift();
                }
                //保证时长量少的物料非零
                if (!data[index].arr.some(item => item !== 0)) data[index].arr[0] = t;
            } else {
                data[index].arr.push(usecount);
                t = data[index].arr[0];
                data[index].arr.shift();
                flag = 1;
                for (let i = 0; i < (safeday - data[index].arr.length); i++) {
                    data[index].arr.push(usecount);
                }
                //保证时长量少的物料非零
                if (!data[index].arr.some(item => item !== 0)) data[index].arr[0] = t;
            }
        }
    }

    //若不存在id则新建项
    if (flag == 0) {
        var neww = {
            id: id,
            arr: [],
        }
        for (let i = 0; i < safeday; i++) {
            neww.arr.push(usecount);
        }
        data.push(neww)
    }
}

//得到每日消耗的平均值
function getAvg(id, data) {
    var num = 0,
        len;
    for (let index in data) {
        if (data[index].id == id) {
            len = data[index].arr.length;
            // console.log("getting Avg")
            for (let i in data[index].arr) {
                num += parseFloat(data[index].arr[i]);
            }
        }
    }
    num = (num / len).toFixed(3);
    return num;
}

//休眠函数
function sleep(numberMillis) {
    var now = new Date();
    var exitTime = now.getTime() + numberMillis;
    while (true) {
        now = new Date();
        if (now.getTime() > exitTime)
            return;
    }
}

function suggestBuy(avg, nowCount, safe, wait) {
    avg = parseFloat(avg);
    nowCount = parseFloat(nowCount);
    safe = parseFloat(safe);
    wait = parseFloat(wait);
    // console.log(typeof (avg))
    // console.log(typeof (nowCount))
    // console.log(typeof (safe))
    // console.log(typeof (wait))

    return parseInt((avg * (safe + wait + 25) - nowCount) > 0 ? (avg * (safe + wait + 25) - nowCount) : 0)
}

//不需要同步订购单选项卡了
// function changeAfterBuy(id, buydataa) {
//     var flag = 0
//     for (let index = 0; index < buydataa.length; index++) {
//         if (id == buydataa[index].存货编码) {
//             flag = 1;
//             return buydataa[index].已到货
//         }
//     }
//     if (flag == 0) {
//         return 0
//     }
// }


//订购单合并
function mergeExcel() {
    // 只允许一次出库操作，点击后按钮消失
    //修改为字体加粗显示
    $('#merge').addClass('display-bold');

    document.getElementById('fileMerge').addEventListener('change', function(e) {

        var files = e.target.files;
        if (files.length == 0) return;
        var f = files[0];
        // if (!/\.xlsx$/g.test(f.name)) {
        //     alert('仅支持读取xlsx格式！');
        //     return;
        // }
        readWorkbookFromLocalFile(f, function(workbook) {
            console.log("reading merge file");
            //转化源excel展示的table的数据为Json，之后与读入的出库的Json进行合并
            var mergedata = read2getjsondata(workbook);
            var rootjson = csv2JSON(rootcsv);

            //将订购单里面信息合并进table，然后在table内部处理已到货数据
            for (let i = 0; i < rootjson.length; i++) {
                for (let j = 0; j < mergedata.length; j++) {
                    if (mergedata[j].物料编码 == rootjson[i].存货编码) {
                        //数据操作
                        if (rootjson[i].已下单订购总数) rootjson[i].已下单订购总数 = parseInt(rootjson[i].已下单订购总数) + parseInt(mergedata[j].订购数量)
                        else rootjson[i].已下单订购总数 = parseInt(mergedata[j].订购数量)
                        if (rootjson[i].已到货) {
                            rootjson[i].已下单订购总数 = parseInt(rootjson[i].已下单订购总数) - parseInt(rootjson[i].已到货)
                            rootjson[i].已到货 = ''
                        }
                    }
                }
            }

            console.log("finally rootjson值为")
            console.log(rootjson);
            //转回csv并重新赋值给rootcsv
            var avdancedata = JSON2csv(rootjson);
            rootcsv = avdancedata;
            // console.log(rootcsv)
            $('#result').children().remove();
            document.getElementById('result').innerHTML = csv2table(avdancedata);
            switchhide();
        });
    });
    console.log("merge file ladded")
    document.getElementById('fileMerge').click();
}