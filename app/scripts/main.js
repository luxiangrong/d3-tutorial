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
    var defaults = {
        padding: {
            top: 5,
            right: 5,
            bottom: 5,
            left: 5
        },
        itemHeight: 5,
        strokeWidth: 1
    };

    config = myChart.extend(defaults, config);

    var width = config.width,
        height = config.height,
        itemHeight = config.itemHeight,
        itemOuterHeight = itemHeight + config.strokeWidth * 2,
        itemWidth = width - config.padding.left - config.padding.right,
        svg,
        max,
        itemCount = Math.floor(height / itemOuterHeight);

    var scale = d3.scale.linear()
        .domain([0, itemCount])
        .range([height - config.padding.bottom - config.padding.top, config.padding.top]);

    var colorScale = d3.scale.linear()
        .domain([0, itemCount])
        .range(['#00a8ff', '#00ff80']);

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
                return 'translate(0,' + (scale(d) - itemOuterHeight) + ')';
            });

        return selection;
    }

    /**
     * 生成进度条的过渡效果
     * @param  {transition} transition d3的transition对象
     * @return {transition}            返回d3的transition对象
     */
    var transitionGenerator = function(transition) {
        transition.delay(function(d, i) {
                return i * 50
            })
            .style('fill', function(d) {
                return colorScale(d);
            });

        return transition;
    }

    function progressBar(data) {
        max = data.max;

        var progressData = d3.range(0, Math.floor(itemCount * data.progress / data.max), 1);
        var restData = d3.range(Math.floor(itemCount * data.progress / data.max), itemCount, 1);
        var bgData = d3.range(0, itemCount, 1);

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

        progressBar.update(data);
    }

    progressBar.update = function(data) {
        var progressData = d3.range(0, Math.floor(itemCount * data.progress / max), 1);

        var progressItemBar = svg.selectAll('rect.progress')
            .data(progressData, function(d) {
                return d;
            })

        progressItemBar.call(itemBarGenerator);

        var enterSize = progressItemBar.enter().size(),
            duration = 500;

        progressItemBar.enter()
            .append('rect')
            .attr('class', 'progress')
            .call(itemBarGenerator)
            .style('fill', function(d) {
                return colorScale(d);
            })
            .style("fill-opacity", 1e-6)
            .transition()
            .duration(duration)
            .delay(function(d, i) {
                return (i + 1) / progressData.length * duration;
            })
            .style("fill-opacity", 1);

        var exitSize = progressItemBar.exit().size();

        progressItemBar
            .exit()
            .style("fill-opacity", 1)
            .transition()
            .duration(duration)
            .delay(function(d, i) {
                return (exitSize - i + progressData.length - 1) / exitSize * duration;
            })
            .style("fill-opacity", 1e-6)
            .remove();
    }

    return progressBar;
};
