'use strict';
var myChart = {};

/* 
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
        itemHeight: 5
    };

    config = myChart.extend(defaults, config);


    var width = config.width,
        height = config.height,
        itemHeight = config.itemHeight + 2,
        itemWidth = width - config.padding.left - config.padding.right,
        svg,
        max,
        itemCount = Math.ceil(height / itemHeight);

    var scale = d3.scale.linear()
        .domain([0, itemCount])
        .range([height - config.padding.bottom - config.padding.top, config.padding.top]);

    var colorScale = d3.scale.linear()
        .domain([0, itemCount])
        .range(['#00a8ff', '#00ff80']);

    function progressBar(data) {
        max = data.max;



        var progressData = d3.range(0, Math.round(itemCount * data.progress / data.max), 1);
        var restData = d3.range(Math.round(itemCount * data.progress / data.max), itemCount, 1);


        svg = d3.select(selector)
            .append('svg')
            .attr('class', 'progress-bar')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', 'translate(' + config.padding.left + ',' + config.padding.top + ')');

        svg.selectAll('rect.progress')
            .data(progressData)
            .enter()
            .append('rect')
            .transition()
            .attr('class', 'progress')
            .attr('width', itemWidth)
            .attr('height', itemHeight - 2)
            .attr('transform', function(d) {
                return 'translate(0,' + (scale(d) - itemHeight) + ')';
            })
            .attr('rx', 3)
            .attr('ry', 3)
            .style('fill', function(d) {
                return colorScale(d);
            });

        svg.selectAll('rect.rest')
            .data(restData)
            .enter()
            .append('rect')
            .attr('class', 'rest')
            .attr('width', itemWidth)
            .attr('height', itemHeight - 2)
            .attr('transform', function(d) {
                return 'translate(0,' + (scale(d) - itemHeight) + ')';
            })
            .attr('rx', 3)
            .attr('ry', 3);
    }

    progressBar.update = function(data) {
        var progressData = d3.range(0, Math.round(itemCount * data.progress / max), 1);

        svg.selectAll('rect.progress')
            .data(progressData)
            .enter()
            .append('rect')
            .transition()
            .attr('class', 'progress')
            .attr('width', itemWidth)
            .attr('height', itemHeight - 2)
            .attr('rx', 3)
            .attr('ry', 3)
            .attr('transform', function(d) {
                console.log(d);
                return 'translate(0,' + (scale(d) - itemHeight) + ')';
            })
            .style('fill', function(d) {
                return colorScale(d);
            });
    }

    return progressBar;
};
