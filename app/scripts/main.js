'use strict';
var myChart = {};

/**
 * 对象属性赋值
 *
 * @param {Object} target 目标对象。
 * @param {Object} source 源对象。
 * @param {boolean} deep 是否复制(继承)对象中的对象。
 * @returns {Object} 返回继承了source对象属性的新对象。
 */
myChart.extend = function(target, /*optional*/ source, /*optional*/ deep) {
    target = target || {};
    var sType = typeof source,
        i = 1,
        options;
    if (sType === 'undefined' || sType === 'boolean') {
        deep = sType === 'boolean' ? source : false;
        source = target;
        target = this;
    }
    if (typeof source !== 'object' && Object.prototype.toString.call(source) !== '[object Function]') {
        source = {};
    }
    while (i <= 2) {
        options = i === 1 ? target : source;
        if (options !== null) {
            for (var name in options) {
                var src = target[name],
                    copy = options[name];
                if (target === copy) {
                    continue;
                }
                if (deep && copy && typeof copy === 'object' && !copy.nodeType) {
                    target[name] = this.extend(src ||
                        (copy.length !== null ? [] : {}), copy, deep);
                } else if (copy !== undefined) {
                    target[name] = copy;
                }
            }
        }
        i++;
    }
    return target;
};

myChart.progressBar = function(selector, config) {
    //默认参数
    var defaults = {
        padding: {
            top: 5,
            right: 5,
            bottom: 5,
            left: 5
        },
        itemSize: 5,
        strokeWidth: 1,
        direction: 'horizontal',
        startColor: '#00a8ff',
        endColor: '#00ff80',
        duration: 500 //动画持续时间，调用update的间隔需要大于2倍duration
    };

    config = myChart.extend(defaults, config);

    var width = config.width,
        height = config.height,
        itemWidth,
        itemHeight,
        itemOuterWidth,
        itemOuterHeight,
        svg,
        max,
        itemCount;

    if (config.direction === 'vertical') {
        itemWidth = config.itemSize;
        itemHeight = height - config.padding.top - config.padding.bottom;
        itemOuterWidth = itemWidth + config.strokeWidth * 2;
        itemCount = Math.floor((width - config.padding.left - config.padding.right) / itemOuterWidth);
    } else {
        itemWidth = width - config.padding.left - config.padding.right;
        itemHeight = config.itemSize;
        itemOuterHeight = itemHeight + config.strokeWidth * 2;
        itemCount = Math.floor((height - config.padding.top - config.padding.bottom) / itemOuterHeight);
    }

    //用于定位小矩形位置的缩放函数
    var scale = d3.scale.linear()
        .domain([0, itemCount - 1]);
    if (config.direction === 'vertical') {
        scale.range([0, width - config.padding.right - config.padding.left - itemWidth]);
    } else {
        scale.range([height - config.padding.bottom - config.padding.top - itemHeight, 0]);
    }

    //颜色缩放函数
    var colorScale = d3.scale.linear()
        .domain([0, itemCount])
        .range([config.startColor, config.endColor]);

    /**
     * 生成进度条的条状元素
     * @return {void}
     */
    var itemBarGenerator = function(selection) {
        selection.attr('width', itemWidth)
            .attr('height', itemHeight)
            .attr('rx', 3)
            .attr('ry', 3)
            .attr('transform', function(d) {
                if (config.direction === 'vertical') {
                    return 'translate(' + (scale(d)) + ', 0)';
                } else {
                    return 'translate(0, ' + scale(d) + ')';
                }
            });

        return selection;
    };

    /**
     * 生成进度条的过渡效果
     * @param  {transition} transition d3的transition对象
     * @return {transition}            返回d3的transition对象
     */
    // var transitionGenerator = function(transition) {
    //     transition.delay(function(d, i) {
    //             return i * 50;
    //         })
    //         .style('fill', function(d) {
    //             return colorScale(d);
    //         });

    //     return transition;
    // };

    var bgData = d3.range(0, itemCount, 1);

    //生成背景矩形块
    svg = d3.select(selector)
        .append('svg')
        .attr('class', 'progress-bar')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', 'translate(' + config.padding.left + ',' + config.padding.top + ')');
    svg.selectAll('rect.bg')
        .data(bgData)
        .enter()
        .append('rect')
        .attr('class', 'bg')
        .call(itemBarGenerator);

    //创建一个函数对象，可以在初始化后调用其他扩展方法
    var progressBar = function() {};

    //更新进度条的状态
    progressBar.update = function(data) {
        var progressData = d3.range(0, Math.floor(itemCount * data.progress / config.max), 1);

        var progressItemBar = svg.selectAll('rect.progress')
            .data(progressData, function(d) {
                return d;
            });

        progressItemBar.call(itemBarGenerator);

        var duration = config.duration;

        progressItemBar.enter()
            .append('rect')
            .attr('class', 'progress')
            .call(itemBarGenerator)
            .style('fill', function(d) {
                return colorScale(d);
            })
            .style('fill-opacity', 0)
            .transition()
            .duration(duration)
            .delay(function(d, i) {
                return (i + 1) / progressData.length * duration;
            })
            .style('fill-opacity', 1);

        var exitSize = progressItemBar.exit().size();

        progressItemBar
            .exit()
            .style('fill-opacity', 1)
            .transition()
            .duration(duration)
            .delay(function(d, i) {
                return (exitSize - i + progressData.length - 1) / exitSize * duration;
            })
            .style('fill-opacity', 0)
            .remove();
    };

    return progressBar;
};

myChart.progressKnob = function(selector, config) {
    var defaults = {
        ringWidth: 14, //外层圆环的宽度
        intervalNum: 60, //外层圆环切分成的个数
        radius: 100,
    };

    config = myChart.extend(defaults, config);

    var svg, radius = config.radius;

    var sliceData = [];
    for (var i = 0; i < config.intervalNum; i++) {
        sliceData.push(1);
    }

    var arcGenerator = d3.svg.arc()
        .outerRadius(radius)
        .innerRadius(radius - config.ringWidth);

    var pie = d3.layout.pie();

    svg = d3.select(selector)
        .append('svg')
        .attr('class', 'progress-knob')
        .attr('width', radius * 2 + 2)
        .attr('height', radius * 2 + 2)
        .append('g')
        .attr('transform', 'translate(' + (radius + 1) + ',' + (radius + 1) + ')');

    svg.append('g')
        .attr('class', 'slices');

    var buttons = svg.append('g')
        .attr('class', 'buttons')
        .attr('transform', 'translate(-' + (radius - 5) + ', -' + (radius - 10) + ')');

    var slice = svg.select('.slices').selectAll('path.slice')
        .data(pie(sliceData));

    slice.enter()
        .insert('path')
        .attr('d', function(d) {
            return arcGenerator(d);
        })
        .attr('class', 'slice');

    var progressSlice = svg.select('.slices').append('path')
        .attr('class', 'progressSlice');

    buttons.append('image')
        .attr('xlink:href', 'images/knob01.png')
        .attr('width', 189)
        .attr('height', 189)
        .attr('x', 0)
        .attr('y', 0);

    var progressDot = svg.append('image')
        .attr('xlink:href', 'images/knob02.png')
        .attr('width', 12)
        .attr('height', 12);

    var progressKnob = function() {};
    var lastProgress = 0;

    progressKnob.update = function(progress) {

        var progressAngle = progress / config.max * 2 * Math.PI;
        var lastProgressAngle = lastProgress / config.max * 2 * Math.PI;

        progressSlice.transition()
            .duration(800)
            .attrTween('d', function() {
                this._current = this._current || {
                    startAngle: 0,
                    endAngle: progressAngle
                };
                var interpolate = d3.interpolateObject(this._current, {
                    startAngle: 0,
                    endAngle: progressAngle
                });
                this._current = interpolate(0);
                return function(t) {
                    return arcGenerator(interpolate(t));
                };
            });

        progressDot.transition()
            .duration(800)
            .attrTween('x', function() {
                this._current = this._current || progressAngle;
                var interpolate = d3.interpolate(lastProgressAngle, progressAngle);
                this._current = interpolate(0);
                return function(t) {
                    return (radius - 30) * Math.cos(interpolate(t) - Math.PI / 2) - 6;
                };
            })
            .attrTween('y', function() {
                this._current = this._current || progressAngle;
                var interpolate = d3.interpolate(lastProgressAngle, progressAngle);
                this._current = interpolate(0);
                return function(t) {
                    return (radius - 30) * Math.sin(interpolate(t) - Math.PI / 2) - 6;
                };
            });

        lastProgress = progress;
    };

    return progressKnob;
};

// 简单仪表
myChart.simpleGauge = function(selector, config) {
    var defaults = {
        width: 200,
        height: 200,
        min: 0, //最小刻度
        max: 7, //最大刻度
        tick: {
            startDeg: 180, //刻度起始角度
            endDeg: 360, //刻度结束角度
            direction: 1, //刻度方向，1为顺时针，-1为逆时针
            major: 8, //主要刻度数量
            minor: 0, //主要刻度之间的次要刻度数量
        },
        unitLabel: { //计量单位标签
            title: 'W/W', // 标题
            pos: 'north' // 位置 north:上半部分， south:下半部分
        }
    };
    config = myChart.extend(defaults, config);
    var simpleGauge = function() {};

    var svg, ticksContainer, labelsContainer, radius, valueLabel;
    var tickScale, labelScale, pointScale;

    radius = d3.min([config.width, config.height]) / 2;
    svg = d3
        .select(selector)
        .append('svg')
        .attr('class', 'simple-gauge')
        .attr('width', config.width)
        .attr('height', config.height)
        .append('g');

    ticksContainer = svg.append('g')
        .attr('class', 'ticks')
        .attr('transform', 'translate(' + radius + ',' + radius + ')');

    labelsContainer  = svg.append('g')
        .attr('class', 'labels')
        .attr('transform', 'translate(' + radius + ',' + radius + ')');

    //刻度缩放函数
    tickScale = d3.scale.linear()
        .domain([1, config.tick.major])
        .range([config.tick.startDeg, config.tick.endDeg]);

    labelScale = d3.scale.linear()
        .domain([1, config.tick.major])
        .rangeRound([config.min, config.max]);

    pointScale = d3.scale.linear()
        .domain([0, config.max])
        .range([config.tick.startDeg, config.tick.endDeg]);

    var majorData = d3.range(1, config.tick.major + 1, 1);

    var buildTicks = function() {
        ticksContainer.append('circle')
            .attr('r', radius - 30);

        ticksContainer.selectAll('line.tick-major')
            .data(majorData)
            .enter()
            .append('line')
            .attr('class', 'tick-major')
            .attr('x1', function(d) {
                return degreeToPoint(tickScale(d), 22).x;
            })
            .attr('y1', function(d) {
                return degreeToPoint(tickScale(d), 22).y;
            })
            .attr('x2', function(d) {
                return degreeToPoint(tickScale(d), 30).x;
            })
            .attr('y2', function(d) {
                return degreeToPoint(tickScale(d), 30).y;
            });

        ticksContainer.selectAll('text.lable-tick-major')
            .data(majorData)
            .enter()
            .append('text')
            .attr('class', 'label-tick-major')
            .attr('x', function(d) {
                return degreeToPoint(tickScale(d), 10).x;
            })
            .attr('y', function(d) {
                return degreeToPoint(tickScale(d), 10).y;
            })
            .attr('dy', '0.5em')
            .attr('text-anchor', 'middle')
            .text(function(d) {
                return labelScale(d);
            });
    };
    buildTicks();

    var buildLabels = function(){
        var unitLabel = labelsContainer.append('text')
            .attr('class', 'label-unit')
            .attr('text-anchor', 'middle')
            .attr('x', 0)
            .text(config.unitLabel.title);

        var valueLabelWidth = radius - 30,
            valueLabelHeight = valueLabelWidth / 2;

        var valueLabelContainer = labelsContainer.append('g')
            .attr('class', 'value');

        valueLabelContainer.append('rect')
            .attr('class', 'label-value')
            .attr('rx', 3)
            .attr('ry', 3)
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', valueLabelWidth)
            .attr('height', valueLabelHeight)
            ;

        valueLabel = valueLabelContainer.append('text')
            .attr('text-anchor', 'end')
            .attr('x', valueLabelWidth)
            .attr('y', valueLabelHeight / 2)
            .attr('dy', '0.32em')
            .text('0.00');

        if(config.unitLabel.pos === 'north') {
            unitLabel.attr('y', '-5');
            valueLabelContainer.attr('transform', 'translate(' + valueLabelWidth / -2 + ', 0)')
        } else {
            unitLabel.attr('y', '20');
            valueLabelContainer.attr('transform', 'translate(' + valueLabelWidth / -2 + ',' + valueLabelHeight * -1 + ')')
        }
    };
    buildLabels();

    var point;
    var buildPoint = function() {
        point = svg.append('g')
            .attr('class', 'point')
            .attr('x', 10)
            .attr('y', 10)
            .attr('transform', 'translate(' + radius + ',' + radius + ')');

        point.append('circle')
            .attr('class', 'c1')
            .attr('r', 5);

        point.append('circle')
            .attr('class', 'c2')
            .attr('r', 2)
            .attr('cx', -1)
            .attr('cy', -1);

        point.append('circle')
            .attr('class', 'c3')
            .attr('r', 1)
            .attr('cx', -1)
            .attr('cy', -1);
    };
    buildPoint();

    function degreeToPoint(deg, offset) {
        return {
            x: (radius - offset) * Math.cos(deg / 180 * Math.PI),
            y: (radius - offset) * Math.sin(deg / 180 * Math.PI)
        };
    }

    simpleGauge.update = function(value) {
        value = Number(value);
        valueLabel.text((value));

        point.transition()
            .duration(800)
            .attrTween('transform', function() {
                this._current = this._current || pointScale(value);
                var interpolate = d3.interpolate(this._current , pointScale(value));
                this._current = interpolate(1);
                return function(t) {
                    return 'translate(' + (radius + radius / 2 * Math.cos(interpolate(t) / 180 * Math.PI) ) + ',' + (radius + radius / 2 * Math.sin(interpolate(t) / 180 * Math.PI) ) + ')';
                };
            });

    };
    return simpleGauge;
};
