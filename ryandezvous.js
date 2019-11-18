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
            data[key] = result.fares.map(x => x.outbound.arrivalAirport.iataCode);
        }
    );
}

function getCommonDestinations(data) {
    data.commonDestinations = data.myDestinations.filter(
        value => -1 !== data.herDestinations.indexOf(value)
    );
}

async function getFaresFromAirport(destinations, airport, fares, dateFrom) {
    await asyncForEach(
        destinations,
        async function(toAirport) {
            console.log('airport', airport, 'toAirport', toAirport);
            const fareURL = fareURLTemplate.replace('<from>', airport).replace('<to>', toAirport).replace('<dateFrom>', dateFrom);;
            $.getJSON(
                fareURL,
                function(result) {
                    console.log(fareURL, result);
                    faresToAirport = result.outbound.fares.filter(
                        value => value.arrivalDate
                    );
                    if (faresToAirport) fares[toAirport] = faresToAirport;
                }
            );
            await waitFor(1000);
        }
    );
}

async function getFares(destinations, departureDateFrom, myAirport, herAirport) {
    myFares = {};
    herFares = {};
    candidates = [];
    await getFaresFromAirport(destinations, myAirport, myFares, departureDateFrom);
    await getFaresFromAirport(destinations, herAirport, herFares, departureDateFrom);
    console.log('mine', myFares);
    console.log('hers', herFares);
    for (airport in myFares) {
        console.log('checking airport', airport);
        if (!airport in herFares) continue;
        myFares[airport].forEach(function(myFare) {
            console.log('myFare', myFare);
            herFares[airport].forEach(function(herFare) {
                var myArrival = new Date(myFare.arrivalDate);
                var herArrival = new Date(herFare.arrivalDate);
                var arrivalDiffMinutes = (myArrival - herArrival) / 1000 / 60;
                if (Math.abs(arrivalDiffMinutes) < 24 * 60) {
                    candidates.push({
                        day: myFare.day,
                        destination: airport,
                        myArrivalDate: myFare.arrivalDate,
                        herArrivalDate: herFare.arrivalDate,
                        myDepartureDate: myFare.departureDate,
                        herDepartureDate: herFare.departureDate,
                        price: myFare.price.value + herFare.price.value,
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
    candidates = await getFares(data.commonDestinations, departureDateFrom, myAirport, herAirport);

    var table = await new Tabulator("#table", {
        height: 205, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
        data: candidates, //assign data to table
        layout: "fitColumns", //fit columns to width of table (optional)
        columns: [ //Define Table Columns
            {
                title: "Date",
                field: "day",
                width: 150
            },
            {
                title: "Price",
                field: "price"
            },
            {
                title: "Destination",
                field: "destination"
            },
            {
                title: "My time",
                field: "myArrivalDate",
                sorter: "date",
                align: "center"
            },
            {
                title: "Her time",
                field: "herArrivalDate",
                sorter: "date",
                align: "center"
            },
            
            {
                title: "Hours diff",
                field: "arrivalDiffHours"
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
    futureDate.setDate(futureDate.getDate() + 30);
    document.getElementById('departureDateTo').valueAsDate = futureDate;
};
