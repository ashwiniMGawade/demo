'use strict';

angular.module('dashboards').controller('DashboardsListController', ['$scope', '$filter', '$http', '$interval', 'Authentication', 'Dashboards', 'Sites', 'Subtenants', 'Servers', 'Storagegroups', 'Flash',
  function ($scope, $filter, $http, $interval, Authentication, Dashboards, Sites, Subtenants, Servers, Storagegroups, Flash) {
    $scope.authentication = Authentication;
    $scope.isRoot = Authentication.user.roles.indexOf('root') !== -1;
    $scope.isPartner = Authentication.user.roles.indexOf('partner') !== -1;
    $scope.from = "d";
    $scope.scope = "tenant";
    $scope.custom = {};
    if(!($scope.isPartner || $scope.isRoot)){
      $scope.subtenants = Subtenants.query();
      $scope.sites = Sites.query();
    }
    $scope.tenantId = $scope.authentication.user.tenant;
    $scope.labels = featuresSettings.labels;
    $scope.servers = [];
    $scope.storagegroups = [];

    var refreshData;
    var fromMap = {
      y : 'year_graph_data',
      mon : 'month_graph_data',
      w : 'week_graph_data',
      d : 'day_graph_data',
      h : 'hour_graph_data'
    };
    var colorMap = {
      iops : ["#1f77b4", "#aec7e8" , "#ff7f0e", "#ffbb78"],
      throughput : ["#1f77b4", "#aec7e8" , "#ff7f0e"],
      capacity : ["#1f77b4", "#f7b6d2"],
      latency : ["#aec7e8" , "#ff7f0e", "#ff9896"]
    };
    var flashTimeout = 3000;

    function throwFlashErrorMessage(message) {
      if (angular.element(document.getElementsByClassName("alert-danger")).length === 0) {
        Flash.create('danger', '<strong ng-non-bindable>' + message + '</strong>', flashTimeout, { class: '', id: '' }, true);
      }
    }

    $scope.populatevFas = function(siteId, subtenantId) {
      var servers = Servers.query();
      $scope.servers = [];
      servers.$promise.then(function(results) {
        angular.forEach(servers, function(server) {
          if (siteId && subtenantId && server.site && server.site._id === siteId && server.subtenant && server.subtenant._id === subtenantId) {
             $scope.servers.push(server);
          }else if (siteId && !subtenantId && server.site && server.site._id === siteId) {
             $scope.servers.push(server);
          }else if (subtenantId && !siteId && server.subtenant && server.subtenant._id === subtenantId) {
             $scope.servers.push(server);
          }
        });
      });
    };

    $scope.populateSG = function(serverId) {
      var storagegroups = Storagegroups.query();
      $scope.storagegroups = [];
      storagegroups.$promise.then(function(results) {
        angular.forEach(storagegroups, function(storagegroup) {
          if (serverId && storagegroup.server && storagegroup.server._id === serverId) {
             $scope.storagegroups.push(storagegroup);
          }
        });
      });
    };

    function renderGraph(data, name){
      var outerWidth = 500;
      var outerHeight = 300;
      var margin = { left: 70, top: 40, right: 0, bottom:60 };

      var xColumn = "Date";
      var yColumn = "Values";
      var colorColumn = "Series";
      var lineColumn = colorColumn;

      var innerWidth  = outerWidth  - margin.left - margin.right;
      var innerHeight = outerHeight - margin.top  - margin.bottom;
      var selector = "#"+name.toLowerCase();

      //Removing the loader/spinner
      d3.select(selector).selectAll("*").remove();

      var svg = d3.select(selector).append('svg')
                  .attr("width", outerWidth)
                  .attr("height", outerHeight)
                  .style("position","relative");

      var g = svg.append("g")
                 .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      //Adding label to the graph
      g.append("text").text(name)
       .attr("x", 180).attr("y", -10)
       .attr("font-size", "15px")
       .attr("font-weight", "bold");

      //Return when no Data to display
      if(!data || data.length === 0){
         g.append("text").text("No Data to Display")
          .attr("x", 150).attr("y", 130)
          .attr("font-size", "15px")
          .attr("font-weight", "bold");
       return;
      }

      var rss = d3.select(selector).append("button").text("Export")
            .attr("class","btn btn-xs btn-info")
            .style("position","absolute")
            .style("bottom","10px")
            .style("right","70px")
            .on("click", function(){
              download(name);
            });

      var xAxisG = g.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + innerHeight + ")");

      var yAxisG = g.append("g")
                    .attr("class", "y axis");

      var colorLegendG = g.append("g")
                          .attr("transform", "translate(0,240)")
                          .attr("class", "color-legend");

      var xScale = d3.time.scale().range([0, innerWidth]);
      var yScale = d3.scale.linear().range([innerHeight, 0]);
      var colorScale = d3.scale.ordinal().range(colorMap[name.toLowerCase()]);

      var tickFormatMap = { Capacity : 'GB', Latency : 'ms', IOPS : 'ops', Throughput : 'GBs'};

      var xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(7).outerTickSize(0);
      var yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(10).outerTickSize(0)
                        .tickFormat(function(d) {  return d + tickFormatMap[name];  });
      var line = d3.svg.line()
        .x(function(d) { return xScale(d[xColumn]); })
        .y(function(d) { return yScale(d[yColumn]); });

      var colorLegend = d3.legend.color()
        .scale(colorScale)
        .shapePadding(3)
        .shapeWidth(10)
        .shapeHeight(10)
        .labelOffset(5);

      xScale.domain(d3.extent(data, function (d){ return d[xColumn]; }));
      yScale.domain([0, d3.max(data, function (d){ return d[yColumn]; })]);

      xAxisG.call(xAxis);
      yAxisG.call(yAxis);

      var nested = d3.nest()
        .key(function (d){ return d[lineColumn]; })
        .entries(data);

      colorScale.domain(nested.map(function (d){ return d.key; }));

      var paths = g.selectAll(".chart-line").data(nested);

      paths.enter().append("path").attr("class", "chart-line");
      paths.exit().remove();
      paths
        .attr("d", function (d){ return line(d.values); })
        .attr("stroke", function (d){ return colorScale(d.key); });

      colorLegendG.call(colorLegend);
      g.selectAll("g.cell").attr("transform", function(d,i) {return "translate(" + (i * 55) + ",0)"; });
    }

    function type(d){
      //d.Date = new Date(d.Date);
      //d.Date = Date.parseExact(d.Date, 'yyyy-MM-dd');
      d.Date =  moment(d.Date).toDate();
      d.Values = +d.Values;
      return d;
    }

    $scope.$on('$destroy', function(){
      $interval.cancel(refreshData);
    });

    var graphQueryString = function(){
      var queryString = "&from="+$scope.from;

      if($scope.scope === 'custom' && $scope.custom.storagegroupId)
        queryString += "&scope=storagegroup&objectId="+ $scope.custom.storagegroupId;
      else if($scope.scope === 'custom' && $scope.custom.serverId )
        queryString += "&scope=server&objectId="+ $scope.custom.serverId;
      else
        queryString += "&scope=tenant&objectId="+ $scope.tenantId;

      return queryString;
    };

    // Show panels from Grafana
    $scope.refreshGraphs = function (ispolling) {
      d3.selectAll(".graph").selectAll("*").remove();
      d3.selectAll(".graph").append("img").attr('src','/modules/core/client/img/loaders/loader.gif');

      var queryString = graphQueryString();
      if (ispolling) {
        queryString += '&ispolling=1';
      }

      d3.csv("/api/storagegraphs?statistic=iops"+queryString, type, function (data){
        renderGraph(data,"IOPS");
      });
      d3.csv("/api/storagegraphs?statistic=latency"+queryString, type, function (data){
        renderGraph(data,"Latency");
      });
      d3.csv("/api/storagegraphs?statistic=throughput"+queryString, type, function (data){
        renderGraph(data,"Throughput");
      });
      d3.csv("/api/storagegraphs?statistic=capacity"+queryString, type, function (data){
        renderGraph(data,"Capacity");
      });

      $interval.cancel(refreshData);
      //Weekly graphs refreshes every hour
      if($scope.from === 'w'){
        refreshData = $interval(function() {
           $scope.refreshGraphs(true);
         }, 36000000);
      //Daily & Hourly graphs refreshes every minute
      }else if($scope.from === 'd' || $scope.from === 'h'){
        refreshData = $interval(function() {
           $scope.refreshGraphs(true);
         }, 60000);
      }
    };

    var download = function(name) {
      var queryString = graphQueryString();

      $http({ method: 'GET', url: '/api/storagegraphs?statistic='+name.toLowerCase()+queryString}).
      success(function(data, status, headers, config) {
        if (status === 200) {
          var anchor = angular.element('<a/>');
          angular.element(document.body).append(anchor);
          var tagToClick = anchor.attr({
            href: '/api/storagegraphs?statistic='+name.toLowerCase()+queryString,
            target: '_blank',
            download: name.toLowerCase()+'_'+fromMap[$scope.from]+'.csv'
          })[0];

          // First create an event as per DOM level 3 documents
          var click_ev = document.createEvent("MouseEvents");
          // initialize the event
          click_ev.initEvent("click", true /* bubble */, true /* cancelable */);
          tagToClick.dispatchEvent(click_ev);
        }
      }).
      error(function(data, status, headers, config) {
        throwFlashErrorMessage(data.message);
      });
    };


    //write code to get the data from backend
    var margin  = {top: 20, right: 20, bottom: 100, left: 60},
    width   = 300 - margin.left - margin.right,
    height  = 200 - margin.top - margin.bottom,
    x       = d3.scale.ordinal().rangeRoundBands([0,width], 0.5),
    y       = d3.scale.linear().range([height,0]);

    //draw axis
    var xAxis   = d3.svg.axis()
        .scale(x)
        .orient("bottom");
    var yAxis   = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(5)
        .innerTickSize(-width)
        .outerTickSize(0)
        .tickPadding(10);

var svg     = d3.select("#wordCountContainer")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  d3.json("api/storagegraphs/test", function (data)
{
    x.domain(data.map(function (d)
    {
        return d.name;
    }));

    y.domain([0, d3.max(data, function (d)
    {
        return d.wc;
    })]);

    var barWidth = width / 3;

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0, " + height + ")")
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "middle")
        .attr("dx", "-0.5em")
        .attr("dy", "-.55em")
        .attr("y", 30)
        .attr("transform", "rotate(0)");

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 5)
        .attr("dy", "0.8em")
        .attr("text-anchor", "end")
        // .text("Word Count");

      svg.selectAll("bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("fill", function(d) {
          if (d.name == "Healthy") {
            return "green";
          } else if (d.name == "At Risk") {
            return "orange";
          } else {
            return "red";
          }
        }) 
        .attr("x", function(d)
        {
            return x(d.name);
        })
        .attr("width", x.rangeBand())
        .attr("y", function (d)
        {
            return y(d.wc);
        })
        .attr("height", function (d)
        {
            return height - y(d.wc);
        })

        svg.selectAll("bar")
        .append("text")
        .text("test")
        .attr("y", function(d) {
          return y(d.wc);
        })
         .attr("x", function(d)
        {
            return x(d.name);
        })
        .attr("width", x.rangeBand()/ 2)
        .style("text-anchor", "middle")

  
    
  })
  }]);
