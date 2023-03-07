(function () {
    freeboard.loadWidgetPlugin({
        type_name: "apexcharts_linecharts",
        display_name: "ApexCharts Line Charts",
        description: "Line Charts using ApexCharts",
        external_scripts: [
            "https://cdn.jsdelivr.net/npm/apexcharts"
        ],
        settings: [
            {
                name: "data",
                display_name: "data",
                type: "calculated"
            },
            {
                name: "timestamp",
                display_name: "Timestamp Label",
                type: "calculated"
            },
            {
                name: "chart_title",
                display_name: "Title",
                type: "text",
                default_value: "Line Chart"
            },
            {
                name: "chart_type",
                display_name: "Chart Type",
                type: "option",
                options: [
                    {
                        name: "Line",
                        value: "line"
                    },
                    {
                        name: "Area",
                        value: "area"
                    }
                ]
            },
            {
                name: "line_type",
                display_name: "Line Type",
                type: "option",
                options: [
                    {
                        name: "Stepline",
                        value: "stepline"
                    },
                    {
                        name: "Smooth",
                        value: "smooth"
                    },
                    {
                        name: "Straight",
                        value: "straight"
                    }

                ]
            },



        ],

        newInstance: function (settings, newInstanceCB) {
            newInstanceCB(new LineCharts(settings));
        }
    });

    var apexchartID = 0;

    var LineCharts = function (settings) {
        var data1;
        var data2;
        var timestamp;
        var rendered = false;
        var thisapexchartID = "apexchart-" + apexchartID++;
        var apexchartObject;
        var apexchartElement = $('<div class="apexchart" id="chart' + thisapexchartID + '"></div>');
        var currentSettings = settings;

        function createChart() {
            /*if (!rendered) {
                return;
            }*/
            apexchartElement.empty();

            var options = {
                id: "chart1",
                series: [{
                    data: []
                }],
                chart: {
                    type: currentSettings.chart_type,
                    animations: {
                        enabled: false,
                    },
                    height: 350,
                    toolbar: {
                        show: true,
                        offsetX: -50,
                        offsetY: 0,
                        tools: {
                            download: false,
                            selection: false,
                            zoom: false,
                            zoomin: true,
                            zoomout: true,
                            pan: false,
                            reset: true,
                            customIcons: []
                        },
                    }
                },

                stroke: {
                    curve: currentSettings.line_type,
                },
                dataLabels: {
                    enabled: false
                },
                title: {
                    text: 'Stepline Chart',
                    align: 'left'
                },
                markers: {
                    hover: {
                        sizeOffset: 1
                    }
                },
                colors: ['#ffffff'],
                xaxis: {
                    type: 'datetime',

                    labels: {
                        show: true,
                        datetimeUTC: false,
                        format: 'HH:mm:ss',
                        style: {
                            colors: '#ffffff',
                            fontSize: '12px',
                            cssClass: 'apexcharts-xaxis-label',
                        },
                    },
                },
                yaxis: {
                    labels: {
                        show: true,
                        style: {
                            colors: '#ffffff',
                            fontSize: '12px',
                            cssClass: 'apexcharts-xaxis-label',
                        },
                    },
                },
                title: {
                    text: currentSettings.chart_title,
                    align: 'left',
                    margin: 10,
                    offsetX: 0,
                    offsetY: 0,
                    floating: false,
                    style: {
                        fontSize: '15px',
                        fontWeight: 'bold',
                        fontFamily: undefined,
                        color: '#ffffff',
                    }
                },

            };

            apexchartObject = new ApexCharts(document.querySelector("#chart" + thisapexchartID), options);
            apexchartObject.render();
        }

        this.render = function (element) {
            //rendered = true;
            $(element).append(apexchartElement);
            createChart();

        }
        this.onSettingsChanged = function (newSettings) {
            if (newSettings.chart_title != currentSettings.chart_title) {
                currentSettings = newSettings;
                createChart();
            }
            else if (newSettings.line_type != currentSettings.line_type) {
                currentSettings = newSettings;
                createChart();
            }
            else if (newSettings.line_color != currentSettings.line_color) {
                currentSettings = newSettings;
                createChart();
            }
            else if (newSettings.font_color != currentSettings.font_color) {
                currentSettings = newSettings;
                createChart();
            }
            else if (newSettings.chart_type != currentSettings.chart_type) {
                currentSettings = newSettings;
                createChart();
            }
            else {
                currentSettings = newSettings;
            }
        }
        var chartData = {}
        this.onCalculatedValueChanged = function (settingName, newValue) {
            if (settingName == "data") {
                data1 = newValue;
                console.log("TESTTEST TIMESTAMP: " + timestamp);
                for (let i = 0; i < 10; i++) {
                    data1[i] = data1[i].toFixed(2);
                }
                console.log("TESTTEST OIL/HEIGHT: " + data1);
                apexchartObject.updateSeries([{
                    data: [
                        [timestamp[0], data1[0]],
                        [timestamp[1], data1[1]],
                        [timestamp[2], data1[2]],
                        [timestamp[3], data1[3]],
                        [timestamp[4], data1[4]],
                        [timestamp[5], data1[5]],
                        [timestamp[6], data1[6]],
                        [timestamp[7], data1[7]],
                        [timestamp[8], data1[8]],
                        [timestamp[9], data1[9]],
                    ]
                }]);

                //xddddddd :)
            }
            
            else if (settingName == "timestamp") {
                timestamp = newValue;
            }

            else {
                console.log("EHEEHEEHE :)");
            }
        }
        this.onDispose = function () { }
        this.getHeight = function () {
            return 6
        }
        this.onSettingsChanged(settings)
    }
}());
