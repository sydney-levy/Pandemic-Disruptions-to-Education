// Define date formatter and parser using d3
const dateFormatter = d3.timeFormat("%Y-%m-%d");

// Load data asynchronously using promises
const promises = [
    d3.csv("data/Lower_Secondary.csv"),
    d3.csv("data/cleaned_covid.csv", row => {
        // Parse numeric values while loading cleaned_covid.csv
        Object.keys(row).forEach(key => {
            if (!isNaN(+row[key])) {
                row[key] = +row[key];
            }
        });
        return row;
    }),
    d3.csv("data/OOS_Rates_clean.csv"),
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json"),
    d3.csv("data/primary_demographics.csv", row => {
        // Parse numeric values while loading primary_demographics.csv
        Object.keys(row).forEach(key => {
            if (!isNaN(+row[key])) {
                row[key] = +row[key];
            }
        });
        return row;
    })
];

// Use Promise.all to wait for all data to be loaded
Promise.all(promises)
    .then(function (data) {
        // Call the initialization function with the loaded data
        initMainPage(data);
    })
    .catch(function (err) {
        // Handle errors if any
        console.error(err);
    });

// Initialization function for the main page
function initMainPage(dataArray) {

    // Define a simple event handler object
    let eventHandler = {
        bind: (eventName, handler) => {
            document.body.addEventListener(eventName, handler);
        },
        trigger: (eventName, extraParameters) => {
            document.body.dispatchEvent(new CustomEvent(eventName, {
                detail: extraParameters
            }));
        }
    };

    // Initialize and create visualizations using loaded data
    myMapVis = new MapVis('mapDiv', dataArray[2], dataArray[3]);
    myBubbleChart = new BubbleChart("bubbleDiv", dataArray[0]);
    myCovidLinePlot = new LinePlotCovid('lineChartCovid', dataArray[1], eventHandler);

    // Add an event listener to the 'drawLinesButton'
    document.getElementById('drawLinesButton').addEventListener('click', function () {
        myCovidLinePlot.initializeAndDrawChart();
    });

    myareaChart1 = new areaChart('area-chart1', dataArray[1], 'Fully_Open', eventHandler);
    myareaChart2 = new areaChart('area-chart2', dataArray[1], 'Closed', eventHandler);
    mybarPlot = new BarVis('barPlot', dataArray[4]);

    // Bind the "selectionChanged" event to update visualizations on selection change
    eventHandler.bind("selectionChanged", function (event) {
        let rangeStart = event.detail[0];
        let rangeEnd = event.detail[1];
        myCovidLinePlot.onSelectionChange(rangeStart, rangeEnd);
        myareaChart1.onSelectionChange(rangeStart, rangeEnd);
        myareaChart2.onSelectionChange(rangeStart, rangeEnd);
    });
}
