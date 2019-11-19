const fareURLTemplate = 'https://services-api.ryanair.com/farfnd/3/oneWayFares/<from>/<to>/cheapestPerDay?market=en-mt&outboundMonthOfDate=<dateFrom>';
const waitFor = (ms) => new Promise(r => setTimeout(r, ms));

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

async function getDestinations(url, data, key) {
    await $.getJSON(
        url,
        function(result) {
            console.log(url);
            console.log(result);
            data[key] = result.fares.map(x => x.outbound.arrivalAirport);
        }
    );
}

function getCommonDestinations(data) {
    console.log(data);
    const herCodes = data.herDestinations.map(x => x.iataCode);
    data.commonDestinations = data.myDestinations.filter(
        value => -1 !== herCodes.indexOf(value.iataCode)
    );
}

async function getFaresFromAirport(destinations, airport, fares, dateFrom) {
    await asyncForEach(
        destinations,
        async function(toAirport) {
            console.log('airport', airport, 'toAirport', toAirport.iataCode);
            const fareURL = fareURLTemplate.replace('<from>', airport).replace('<to>', toAirport.iataCode).replace('<dateFrom>', dateFrom);;
            $.getJSON(
                fareURL,
                function(result) {
                    console.log(fareURL, result);
                    faresToAirport = result.outbound.fares.filter(
                        value => value.arrivalDate
                    );
                    if (faresToAirport) fares[toAirport.iataCode] = faresToAirport;
                }
            );
            await waitFor(1000);
        }
    );
}

async function getFares(destinations, departureDateFrom, myAirport, herAirport, maxDiffHours) {
    myFares = {};
    herFares = {};
    candidates = [];
    await getFaresFromAirport(destinations, myAirport, myFares, departureDateFrom);
    await getFaresFromAirport(destinations, herAirport, herFares, departureDateFrom);
    console.log('mine', myFares);
    console.log('hers', herFares);
    for (airport in myFares) {
        console.log('checking airport', airport);
        const destination = (destinations.filter(d => d.iataCode === airport))[0];
        if (!airport in herFares) continue;
        myFares[airport].forEach(function(myFare) {
            console.log('myFare', myFare);
            herFares[airport].forEach(function(herFare) {
                var myArrival = new Date(myFare.arrivalDate);
                var herArrival = new Date(herFare.arrivalDate);
                var arrivalDiffMinutes = (myArrival - herArrival) / 1000 / 60;
                if (Math.abs(arrivalDiffMinutes) < maxDiffHours * 60) {
                    candidates.push({
                        day: myFare.day,
                        destination: destination.name,
                        destinationCode: airport,
                        myArrivalDate: myFare.arrivalDate,
                        herArrivalDate: herFare.arrivalDate,
                        myDepartureDate: myFare.departureDate,
                        herDepartureDate: herFare.departureDate,
                        price: Math.round(myFare.price.value + herFare.price.value),
                        arrivalDiffHours: Math.round(arrivalDiffMinutes / 60)
                    })
                }
            });
        });
        console.log('my', airport, myFares[airport]);
        console.log('her', airport, herFares[airport]);
        console.table(candidates);
    }
    return candidates;
}

async function doStuff() {
    const myAirport = $('#myAirport').val();
    const herAirport = $('#herAirport').val();
    const departureDateFrom = $('#departureDateFrom').val();
    const departureDateTo = $('#departureDateTo').val();
    const maxDiffHours = 48;
    const myDestinationsURL = 'https://services-api.ryanair.com/farfnd/3/oneWayFares?&departureAirportIataCode=<airport>&language=en&limit=100&market=en-mt&offset=0&outboundDepartureDateFrom=<dateFrom>&outboundDepartureDateTo=<dateTo>&priceValueTo=150'.replace('<dateFrom>', departureDateFrom).replace('<dateTo>', departureDateTo).replace('<airport>', myAirport);
    const herDestinationsURL = 'https://services-api.ryanair.com/farfnd/3/oneWayFares?&departureAirportIataCode=<airport>&language=en&limit=100&market=en-mt&offset=0&outboundDepartureDateFrom=<dateFrom>&outboundDepartureDateTo=<dateTo>&priceValueTo=150'.replace('<dateFrom>', departureDateFrom).replace('<dateTo>', departureDateTo).replace('<airport>', herAirport);

    var candidates;
    var data = {};
    await getDestinations(
        myDestinationsURL,
        data,
        'myDestinations'
    );
    await getDestinations(
        herDestinationsURL,
        data,
        'herDestinations'
    );
    await getCommonDestinations(data);
    candidates = await getFares(data.commonDestinations, departureDateFrom, myAirport, herAirport, maxDiffHours);

    var table = await new Tabulator("#table", {
        height: "100%", // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
        data: candidates, //assign data to table
        layout: "fitColumns", //fit columns to width of table (optional)
        columns: [ //Define Table Columns
            {
                title: "Date",
                field: "day",
                width: 150,
                formatter:"datetime",
                formatterParams: {
                    outputFormat:"YYYY-MM-DD ddd"
                }
            },
            {
                title: "Price",
                field: "price",
                headerFilter: true,
                headerFilterFunc: (headerValue, rowValue) => headerValue >= rowValue,
            },
            {
                title: "Destination",
                field: "destination",
                headerFilter: true
            },
            {
                title: "My time",
                field: "myArrivalDate",
                align: "center",
                formatter:"datetime",
            },
            {
                title: "Her time",
                field: "herArrivalDate",
                align: "center",
                formatter:"datetime",
            },
            
            {
                title: "Hours diff",
                field: "arrivalDiffHours",
                headerFilter: true,
                headerFilterFunc: (headerValue, rowValue) => headerValue >= Math.abs(rowValue),
            },
        ],
        rowClick: function(e, row) { //trigger an alert message when the row is clicked
            alert("Row " + row.getData().id + " Clicked!!!!");
        },
    });
}

window.onload = function(){
    document.getElementById('departureDateFrom').valueAsDate = new Date();
    var futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    document.getElementById('departureDateTo').valueAsDate = futureDate;
};
