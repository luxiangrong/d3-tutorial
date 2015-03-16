'use strict';
var myChart = {};
myChart.progress = function(selector, config) {
    var width = config.width,
        height = config.height;

    function chart(data) {
        d3.select(selector)
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    }

    chart.width = function(value) {
        if (!arguments.length) {
            return width;
        }
        width = value;
        return chart;
    };

    chart.height = function(value) {
        if (!arguments.length) {
            return height;
        }
        height = value;
        return chart;
    }; 

    return chart;
};
