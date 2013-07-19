﻿/**
 * @name     jQuery.selectList
 * @version  1.0.1
 * @date     2013.7
 * @author   Jiangzm
 * @url      https://github.com/jiangzm/jQuery-selectList
 *
 * 仿智联招聘多选下拉框插件，
 * 参照jquery.selectBox,jquery.comboBox
 */

(function ($) {
    //初始化元素和下拉面板
    function init(target, options) {
        var opts = options;
        var t = $(target).prop("multiple", opts.multiple).hide();
        var select = $('<a class="selectList" />')
                     .width(t.outerWidth())
			         .addClass(t.attr('class'))
			         .attr('title', t.attr('title') || '')
			         .attr('tabindex', t.attr('tabindex') || -1)
			         .css('display', 'inline-block')
                     .insertAfter(target)
                     .mousedown(function (e) { e && e.stopPropagation(); })
                     .on('click', null, function (e) {
                         if (panel.is(':hidden')) {
                             showPanel(target);
                         }
                         else {
                             hidePanel(target);
                         }
                     });

        var label = $('<span class="selectList-label" />').appendTo(select);
        var arrow = $('<span class="selectList-arrow">&nbsp;</span>').appendTo(select);
        label.width(select.width() - arrow.outerWidth()
                                   - parseInt(label.css('paddingLeft'))
                                   - parseInt(label.css('paddingRight')));

        var panel = $('<div class="selectList-panel"></div>').appendTo('body')
                    .on({
                        'mouseenter': function () {
                            $(document).off('mousedown.selectlist');
                        },
                        'mouseleave': function () {
                            $(document).off('mousedown.selectlist')
                                       .one('mousedown.selectlist', function () {
                                           hidePanel(target);
                                       });
                        }
                    });
        panel.append('<div class="selectTips"></div>');
        var pHead = $('<div class="selectHead"><span>' + opts.title + '</span></div>').appendTo(panel);
        var pHeadButtons = $('<div class="selectButtons"></div>').appendTo(pHead);
        $('<a class="okButton" >确定</a>').appendTo(pHeadButtons).click(function () {
            hidePanel(target);
            var panel = $.data(target, 'selectlist').panel;
            var indexes = panel.find(".selectlist-td>input").map(function (i, item) {
                if ($(item).prop("checked")) {
                    return i;
                }
            }).get();
            setIndexes(target, indexes);
        });
        if (opts.multiple) {
            $('<a class="allButton">' + (opts.selectAll ? '清除' : '全选') + '</a>').appendTo(pHeadButtons).click(function () {
                var panel = $.data(target, 'selectlist').panel;
                var opts = $.data(target, 'selectlist').options;
                if (opts.selectAll) {
                    panel.find(':checked').prop('checked', false);
                    panel.find('.selected-item').removeClass('selected-item');
                    $(this).text("全选");
                    opts.selectAll = false;
                }
                else {
                    panel.find(':checkbox').prop('checked', true);
                    panel.find('.selectlist-td').addClass('selected-item');
                    $(this).text("清除");
                    opts.selectAll = true;
                }
            });
        }
        else {
            $('<a class="allButton">清除</a>').appendTo(pHeadButtons).click(function () {
                var panel = $.data(target, 'selectlist').panel;

                panel.find(':checked').prop('checked', false);
                panel.find('.selectlist-td').removeClass('selected-item');
            });
        }
        $('<a class="closeButton"></a>').appendTo(pHeadButtons).click(function () {
            hidePanel(target);
        });
        pHead.append('<div class="clear"></div>');
        panel.append('<div class="selectBody"><table class="selectItems" border="0" cellSpacing="0" cellPadding="0" width="100%"></table></div>');

        $(window).on('resize.selectlist', null, function () {
            if (panel.is(':hidden')) {
                panel.css({
                    'top': select.offset().top + select.outerHeight() + 2,
                    'left': select.offset().left
                });
            }
        });

        return {
            select: select,
            panel: panel
        };
    };

    //选中下拉列表的选项
    function setIndexes(target, indexes) {
        var panel = $.data(target, "selectlist").panel;
        var opts = $.data(target, 'selectlist').options;
        var data = $.data(target, 'selectlist').data;
        var oldIndexes = $.data(target, 'indexes');
        panel.find('.selected-item').removeClass('selected-item');
        panel.find(':checked').prop('checked', false);

        if (!indexes || indexes.length == 0) {
            $(target).data("indexes", []);
            $(target).val(opts.multiple ? [] : null);
            setText(target, "-请选择-");
            if (oldIndexes.length) {
                opts.onChange.call(target, []);
            }
            return;
        }
        if (!opts.multiple && indexes.length > 1) {
            indexes = [indexes[indexes.length - 1]];
        }

        var vv = [], ss = [];
        panel.find(".selectlist-td>input").each(function (i, item) {
            if ($.inArray(i, indexes) != -1) {
                $(this).prop("checked", true)
                       .parent().addClass('selected-item');
                vv.push(data[i][opts.valueField]);
                ss.push(data[i][opts.textField]);
            }
        });

        $(target).data("indexes", indexes);
        $(target).val(opts.multiple ? vv : vv[0]);
        setText(target, ss.join(opts.separator || ',') || "-请选择-");

        oldIndexes && (function () {
            if (oldIndexes.length != indexes.length) {
                opts.onChange.call(target, vv);
            }
            else {
                for (var i in indexes) {
                    if ($.inArray(indexes[i], oldIndexes) != -1) {
                        opts.onChange.call(target, vv);
                        break;
                    }
                }
            }
        })();
    };

    //设置目标元素的值
    function setValues(target, values) {
        var data = $.data(target, 'selectlist').data;
        var opts = $.data(target, 'selectlist').options;

        if (typeof values == 'function') {
            values = values();
        }
        values = $.makeArray(values);

        var indexes = $.map(data, function (d, i) {
            if ($.inArray(d[opts.valueField], values) != -1) {
                return i;
            }
        });
        setIndexes(target, indexes);
    };

    //获取目标元素的值
    function getValues(target) {
        var indexes = $.data(target, "indexes");
        var panel = $.data(target, 'selectlist').panel;
        return $.map(indexes, function (item, i) {
            return panel.find("input").eq(item).val();
        });
    };

    //设置元素的显示文本
    function setText(target, text) {
        var select = $.data(target, "selectlist").select;
        select.find('.selectList-label').text(text).attr("title", text);
    };

    //为元素载入选择项
    function loadData(target, data) {
        var opts = $.data(target, 'selectlist').options;
        var panel = $.data(target, "selectlist").panel;
        $.data(target, 'selectlist').data = data;
        $.data(target, 'scroll', null);
        $.data(target, 'indexes', null);

        var indexes = [];
        var items = panel.find(".selectItems").empty();
        var $target = $(target).empty();
        for (var i = 0, j; i < data.length; i++) {
            var tr = $('<tr></tr>').appendTo(items);
            for (j = 0; j < opts.columns; j++) {
                if (i + j >= data.length) {
                    tr.append('<td></td>');
                }
                else {
                    var v = data[i + j][opts.valueField];
                    var s = data[i + j][opts.textField];
                    if (opts.multiple) {
                        tr.append('<td class="selectlist-td"><input type="checkbox" value=' + v + ' />' + s + '</td>');
                    }
                    else {
                        tr.append('<td class="selectlist-td"><input type="radio" name="selectRadio-' + target.name + '" value=' + v + ' />' + s + '</td>');
                    }
                    $target.append("<option value='" + v + "' >" + s + "</option>");

                    if (opts.selectAll || (opts.selectIndex == i + j) ||
                        (opts.selectValue == v) || data[i + j]['selected']) {
                        indexes.push(i + j);
                    }
                }
            }
            i += j - 1;
        }
        setIndexes(target, indexes);
        opts.onSuccess.call(target, data);

        panel.find('.selectlist-td').click(function () {
            if (opts.multiple) {
                $(this).toggleClass('selected-item');
                $('input', this).prop('checked', !$('input', this).prop('checked'));
            }
            else {
                panel('.selected-item').removeClass('selected-item');
                $(this).addClass('selected-item');
                $('input', this).prop('checked', true);
            }
        });
        panel.find('.selectlist-td>input').click(function (e) {
            if (opts.multiple) {
                $(this).parent().toggleClass('selected-item');
            }
            else {
                panel.find('.selected-item').removeClass('selected-item');
                $(this).parent().addClass('selected-item');
            }
            e.stopPropagation();
        });
    };

    //以ajax远程请求元素的数据
    function request(target, url, param) {
        var opts = $.data(target, 'selectlist').options;
        if (url) {
            opts.url = url;
        }
        if (!opts.url) {
            return;
        }
        param = param || {};
        $.ajax({
            type: opts.method,
            url: opts.url,
            dataType: 'json',
            data: param,
            success: function (data) {
                loadData(target, data);
            },
            error: function () {
                opts.loadError.apply(this, arguments);
            }
        });
    };

    //显示下拉面板
    function showPanel(target) {
        var panel = $.data(target, "selectlist").panel;
        var select = $.data(target, "selectlist").select;
        var opts = $.data(target, "selectlist").options;
        panel.find(">.selectTips").css('left', select.outerWidth() / 2 - 26);
        panel.find(".selectBody").css({ "max-height": opts.size * 20 });
        panel.css({
            'z-index': opts.zindex,
            'visibility': 'visible',
            'top': select.offset().top + select.outerHeight() + 2,
            'left': select.offset().left
        }).show();
        panel.find('.selected-item').removeClass('selected-item');
        panel.find(':checked').prop('checked', false);
        //for ie 6/7
        if ($.browser && $.browser.msie && ($.browser.version - 0) < 8) {
            panel.find(".selectButtons").css("padding-top", "9px");
            panel.css("width", opts.columns <= 2 ? "220px" : (20 + opts.columns * 100) + "px");
        }

        $.each($.data(target, "indexes"), function (i, item) {
            panel.find(".selectlist-td>input")
                 .eq(item).prop("checked", true)
                 .parent().addClass('selected-item');
        });
        var tw = panel.find('.selectHead span').width() - 45;
        if (tw > 0 && panel.width() <= parseInt(panel.css('min-width').replace('px', ''))) {
            panel.width(panel.width() + tw);
        }

        opts.multiple && (function () {
            var data = $.data(target, "selectlist").data;
            if (data.length == panel.find(":checked").length) {
                opts.selectAll = true;
                panel.find(".allButton").text("清除");
            }
            else {
                opts.selectAll = false;
                panel.find(".allButton").text("全选");
            }
        })();

        var scrollBar = $.data(target, "scroll");
        if (!scrollBar) {
            scrollBar = new ScrollBar(panel.find(".selectItems")[0], {
                mouseWheelSpace: 5,
                hoverHideScroll: true
            });
            $.data(target, "scroll", scrollBar);
        }
    };

    //隐藏下拉面板
    function hidePanel(target) {
        var panel = $.data(target, "selectlist").panel;
        panel.hide();
    };

    //替换jQuery selector需要转义字符[':','.','/','$','[',']']
    function replaceEscape(str) {
        return str.replace(/:/g, "\\:")
                  .replace(/\./g, "\\.")
                  .replace(/\//g, "\\/")
                  .replace(/\$/g, "\\$")
                  .replace(/\[/g, "\\[")
                  .replace(/\]/g, "\\]");
    }

    /**
     * 解析options，包括元素节点'data-options'属性
     * 
     * parseOptions(target);
     * parseOptions(target, ['id','width',{fit:'boolean',min:'number'}]);
     */
    function parseOptions(target, properties) {
        var t = $(target);
        var options = {};

        var s = $.trim(t.attr('data-options'));
        if (s) {
            var first = s.substring(0, 1);
            var last = s.substring(s.length - 1, 1);
            if (first != '{') s = '{' + s;
            if (last != '}') s = s + '}';
            options = (new Function('return ' + s))();
        }

        if (properties) {
            var opts = {};
            for (var i = 0; i < properties.length; i++) {
                var pp = properties[i];
                if (typeof pp == 'string') {
                    if (pp == 'width' || pp == 'height' || pp == 'left' || pp == 'top') {
                        opts[pp] = parseInt(target.style[pp]) || undefined;
                    } else {
                        opts[pp] = t.attr(pp);
                    }
                }
                else {
                    for (var name in pp) {
                        var type = pp[name];
                        if (type == 'boolean') {
                            opts[name] = t.attr(name) ? (t.attr(name) == 'true') : undefined;
                        } else if (type == 'number') {
                            opts[name] = t.attr(name) == '0' ? 0 : parseFloat(t.attr(name)) || undefined;
                        }
                    }
                }
            }
            $.extend(options, opts);
        }
        return options;
    }

    /**
     * 初始化selectList,或访问selectList定义的方法
     * @options (object||string) 参数项或方法名
     * @param 附加参数
     */
    $.fn.selectList = function (options, param) {
        if (typeof options == 'string') {
            var method = $.fn.selectList.methods[options];
            if (method) {
                return method(this, param);
            }
            return;
        }

        return this.each(function () {
            var state = $.data(this, 'selectlist');
            if (state) {
                $.extend(state.options, options);
            }
            else {
                var opts = $.extend({}, $.fn.selectList.defaults, $.fn.selectList.parseOptions(this), options);
                var r = init(this, opts);
                //if (opts.columns > 3) opts.columns = 3;
                if (opts.selectValue && !(typeof opts.selectValue == 'string' || typeof opts.selectValue == 'number')) {
                    opts.selectValue = null;
                }
                state = $.data(this, 'selectlist', {
                    options: opts,
                    select: r.select,
                    panel: r.panel
                });
                loadData(this, $.fn.selectList.parseData(this));
                $(this).prop('disabled', false);
            }
            if (state.options.data) {
                loadData(this, state.options.data);
            }
            request(this);
        });
    };

    /**
     * selectList插件公开的方法
     * @options   获取元素的参数项         object
     * @panel     获取元素的下拉面板       jQuery
     * @select    获取自定义的select      jQuery
     * @getData   获取所有选择项数据       array
     * @getValue  获取元素的选择值         array
     * @setValue  设置元素的值            (values:array|string|number)
     * @loadData  重新设置选择项数据       (data:array)
     * @reload    以Url方式载入选择项数据  (url:string,params:object)
     * @showPanel 显示下拉面板
     * @hidePanel 隐藏下拉面板
     */
    $.fn.selectList.methods = {
        options: function (jq) {
            return $.data(jq[0], 'selectlist').options;
        },
        panel: function (jq) {
            return $.data(jq[0], 'selectlist').panel;
        },
        select: function (jq) {
            return $.data(jq[0], 'selectlist').select;
        },
        getData: function (jq) {
            return $.data(jq[0], 'selectlist').data;
        },
        setValue: function (jq, values) {
            return jq.each(function () {
                setValues(this, values);
            });
        },
        getValue: function (jq) {
            return getValues(jq[0]);
        },
        loadData: function (jq, data) {
            return jq.each(function () {
                loadData(this, data);
            });
        },
        reload: function (jq, url) {
            return jq.each(function () {
                request(this, url);
            });
        },
        showPanel: function (jq) {
            return jq.each(function () {
                showPanel(this);
            });
        },
        hidePanel: function (jq) {
            return jq.each(function () {
                hidePanel(this);
            });
        }
    };

    /**
     * 获取目标元素select(input)的标签属性
     */
    $.fn.selectList.parseOptions = function (target) {
        var t = $(target);
        return $.extend({}, {
            title: t.attr('title'),
            columns: (t.attr('columns') - 0) || undefined,
            valueField: t.attr('valueField'),
            textField: t.attr('textField'),
            disabled: t.prop('disabled'),
            method: t.attr('method') || undefined,
            url: t.attr('url') || undefined
        });
    };

    /**
     * 若目标元素为'select'，则转换options为元素的选择项数据
     */
    $.fn.selectList.parseData = function (target) {
        var opts = $.data(target, 'selectlist').options;
        var data = [];
        $('>option', target).each(function () {
            var item = {};
            item[opts.valueField] = $(this).attr('value') || $(this).html();
            item[opts.textField] = $(this).html();
            item['selected'] = $(this).prop('selected');
            data.push(item);
        });
        return data;
    };

    /**
     * selectList 参数的默认值
     */
    $.fn.selectList.defaults = {
        title: "请选择",      //下拉面板标题
        columns: 1,          //选择项的列数
        size: 6,             //下拉列表高度
        multiple: true,      //是否多选
        disabled: false,     //是否禁用
        data: null,          //选择项数组
        valueField: 'value', //value字段名
        textField: 'text',   //text字段名
        selectIndex: null,   //默认选中项的索引
        selectValue: null,   //默认选中项的值
        selectAll: false,    //选择全部
        separator: ',',      //select文本分隔符
        url: null,           //通过url加载数据
        method: 'POST',      //请求方式
        zindex: 1000,        //css z-indx值
        onSuccess: function (data) { },      //加载成功回调函数
        loadError: function (args) { },      //加载失败回调函数(针对Url方式)
        onChange: function (vals) { }        //select值改变事件
    };

    //#region 自定义滚动条
    /**
     * 自定义滚动条，依赖jQuery.mousewheel
     */
    var ScrollBar = function (target, options) {
        if (arguments.length == 0) return;
        return new ScrollBar.prototype.init(target, options);
    };
    ScrollBar.prototype = {
        /**
         * 构造函数
         */
        constructor: ScrollBar,
        /**
         * 初始化滚动条
         * @return {*}
         */
        init: function (target, options) {
            var _self = this;
            _self.jqObj = $(target); //内容对象
            _self.wrapperObj = _self.jqObj.parent();     //内容对象容器对象
            _self.wrapperObjHeight = _self.wrapperObj.outerHeight(); //容器对象的高度
            _self.jqObjHeight = _self.jqObj.outerHeight()
                              + (_self.wrapperObjHeight - _self.wrapperObj.height()); //内容对象的高度
            if (_self.wrapperObj.css('overflow') !== 'hidden') {
                _self.wrapperObj.css('overflow', "hidden").addClass('scrollOverFlow');
            }
            if (_self.wrapperObjHeight >= _self.jqObjHeight) {
                //若内容对象高度小于容器对象高度则返回
                return false;
            }
            _self.scrollHeight = _self.wrapperObjHeight * _self.wrapperObjHeight / _self.jqObjHeight; //滚动条的高度
            _self.maxValue = _self.wrapperObjHeight - _self.scrollHeight; //滚动条最大的可滚动高度
            $.extend(_self.options, options);
            _self.makeScroll(); //生成滚动条
            _self.initEvent(); //初始化事件
        },
        /**
         * 初始化事件
         * @return {*}
         */
        initEvent: function () {
            var _self = this;
            var mouseDown = false; //记录鼠标是否按下
            var startPageY = 0;    //记录鼠标按下时e.pageY的值
            var startTop = 0;      //记录鼠标按下时滚动条的top值
            var options = _self.options;
            _self.scrollObj.on({
                'mousedown': function (e) {
                    mouseDown = true;
                    startPageY = e.pageY;
                    startTop = $(this).position().top;
                    $(document).on({
                        'mouseup.selectList': function (e) {
                            mouseDown = false;
                            _self.scrollWrapperObj.stop(true, true).fadeOut();
                            $(document).off('mouseup.selectList mousemove.selectList');
                        },
                        'mousemove.selectList': function (e) {
                            if (mouseDown) {
                                var curPageY = e.pageY;
                                var moveY = curPageY - startPageY;
                                if (moveY % options.speed === 0) {
                                    _self.setScroll(startTop + moveY);
                                }
                            }
                            e.preventDefault();
                        }
                    });
                }
            });
            //滚轮事件
            _self.wrapperObj.mousewheel(function (e, delta) {
                var currentTopValue = _self.scrollObj.position().top;
                if (delta > 0) {
                    //向上
                    currentTopValue -= options.mouseWheelSpace;
                } else {
                    //向下
                    currentTopValue += options.mouseWheelSpace;
                }
                _self.setScroll(currentTopValue);
                e.preventDefault();
                /*if (currentTopValue > 0 && currentTopValue < _self.maxValue) {
                e.preventDefault();
                }*/
            });
            if (options.hoverHideScroll) {
                _self.wrapperObj.on({
                    "mouseenter": function () {
                        _self.scrollWrapperObj.stop(true, true).fadeIn();
                    },
                    "mouseleave": function () {
                        if (!mouseDown) {
                            _self.scrollWrapperObj.stop(true, true).fadeOut();
                        }
                    }
                });
            }
        },
        /**
         * 生成滚动条函数
         * @return {*}
         */
        makeScroll: function () {
            var _self = this;
            _self.wrapperObj.css('position', 'relative');
            _self.wrapperObj.append('<div class="scrollWrapper"><div class="scrollContent" style="height: ' + _self.scrollHeight + 'px"></div></div>');
            _self.scrollWrapperObj = _self.wrapperObj.find('.scrollWrapper');
            _self.scrollObj = _self.scrollWrapperObj.find('.scrollContent');
        },
        /**
         * 设置滚动条的top值和内容对象jqObj的marginTop值
         * @param value 需要设置的滚动条的top值
         * @return {*}
         */
        setScroll: function (value) {
            var _self = this;
            value = Math.min(Math.max(value, 0), _self.maxValue);
            var marginTopValue = (_self.jqObjHeight / _self.wrapperObjHeight * value); //按比例计算内容对象的marginTop值
            _self.scrollObj.css({ top: value });
            _self.jqObj.css({ marginTop: -marginTopValue });
            return _self;
        },
        /**
         * 默认值
         */
        options: {
            speed: 1,              //鼠标移动多长步长触发鼠标移动事件
            mouseWheelSpace: 10,   //鼠标滚轮时滚动条移动的步长
            hoverHideScroll: false //鼠标移动到容器对象上时出现滚动条，移开时隐藏滚动条
        }
    };
    ScrollBar.prototype.init.prototype = ScrollBar.prototype;
    //#endregion

    //#region 检测浏览器
    (function (_) {
        //若jQuery≥1.9 则jQuery.browser Api已被移除
        if (!_.browser) {
            var matched, browser;

            // Use of jQuery.browser is frowned upon.
            // More details: http://api.jquery.com/jQuery.browser
            // jQuery.uaMatch maintained for back-compat
            _.uaMatch = function (ua) {
                ua = ua.toLowerCase();

                var match = /(chrome)[ \/]([\w.]+)/.exec(ua) ||
		                    /(webkit)[ \/]([\w.]+)/.exec(ua) ||
		                    /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) ||
		                    /(msie) ([\w.]+)/.exec(ua) ||
                            ua.indexOf("trident") > 0 && /(rv) ([\w.]+)/.exec(ua) ||
		                    ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) ||
		                    [];

                return {
                    browser: match[1] || "",
                    version: match[2] || "0"
                };
            };

            matched = _.uaMatch(navigator.userAgent);
            browser = {};

            if (matched.browser) {
                browser[matched.browser] = true;
                browser.version = matched.version;
            }

            // Chrome is Webkit, but Webkit is also Safari.
            if (browser.chrome) {
                browser.webkit = true;
            }
            else if (browser.webkit) {
                browser.safari = true;
            }

            //for IE11
            if (browser.rv) {
                browser.msie = true;
                delete browser.rv;
            }

            _.browser = browser;
        }
    })($);
    //#endregion
})(jQuery);