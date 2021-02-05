# 进销存系统

## 前端展示

1. icon
2. logo
3. banner
4. content-left
    - 加载源
        - 加载作为源数据的excel文件，并展示
    - 列表
        - 一般用于从搜索选项卡返回检视整个网页展示的table
    - 入库
        - 点击加载入库文件，读取特定字段，匹配字段更新数据；如无匹配数据，则新增数据行
    - 订购单状态
        - 用来记录订购单状态，记录订购成功和订购等待的物料的数量
    - 出库
        - 点击加载出库文件，匹配id，计算出库后剩余库存，并用出库数据新建以时间命名列，用来记录每次的出库数据，便于检索
    - 搜索
        - 检索符合部分或完全匹配的字段所对应的数据，并展示
    - 下载
        - 点击下载按钮，下载第一个table标签所展示的内容，并以时间命名保存
5. content-right（result）
    - table展示区
        - 用来展示table数据，展示搜索数据，并实现直接在网页修改的功能

## 后端数据

1. 数据处理
    - 源文件
        - 带有所有所需字段，是总的操作表
    - 入库文件
        - 是入库的数据，在源文件中有对应id则修改值，不存在即新建表项
    - 出库文件
        - 包含出库数据，由出库数据在加载源文件和入库文件之后对最新表项进行修改，并新增以时间命名的出库数量列
