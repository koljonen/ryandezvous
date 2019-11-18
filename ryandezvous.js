const myAirport = 'MLA';
const herAirport = 'HHN';
const departureDateFrom = '2019-11-25';
const departureDateTo = '2019-11-29';
const myDestinationsURL = 'https://services-api.ryanair.com/farfnd/3/oneWayFares?&departureAirportIataCode=<airport>&language=en&limit=100&market=en-mt&offset=0&outboundDepartureDateFrom=<dateFrom>&outboundDepartureDateTo=<dateTo>&priceValueTo=150'.replace('<dateFrom>', departureDateFrom).replace('<dateTo>', departureDateTo).replace('<airport>', myAirport);
const herDestinationsURL = 'https://services-api.ryanair.com/farfnd/3/oneWayFares?&departureAirportIataCode=<airport>&language=en&limit=100&market=en-mt&offset=0&outboundDepartureDateFrom=<dateFrom>&outboundDepartureDateTo=<dateTo>&priceValueTo=150'.replace('<dateFrom>', departureDateFrom).replace('<dateTo>', departureDateTo).replace('<airport>', herAirport);
const fareURLTemplate = 'https://services-api.ryanair.com/farfnd/3/oneWayFares/<from>/<to>/cheapestPerDay?market=en-mt&outboundMonthOfDate=<dateFrom>'.replace('<dateFrom>', departureDateFrom);

const waitFor = (ms) => new Promise(r => setTimeout(r, ms));

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

function getDestinations(url, callback) {
    $.getJSON(
        url,
        function(result) {
            console.log(url);
            console.log(result);
            callback(result.fares.map(x => x.outbound.arrivalAirport.iataCode))
        }
    );
}

function getCommonDestinations(data) {
    data.commonDestinations = data.myDestinations.filter(
        value => -1 !== data.herDestinations.indexOf(value)
    );
}

async function getFaresFromAirport(destinations, airport, fares) {
    await asyncForEach(
        destinations,
        async function(toAirport) {
            const fareURL = fareURLTemplate.replace('<from>', airport).replace('<to>', toAirport);
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

async function getFares(destinations) {
    myFares = {};
    herFares = {};
    candidates = [];
    await getFaresFromAirport(destinations, myAirport, myFares);
    await getFaresFromAirport(destinations, herAirport, herFares);
    console.log('mine', myFares);
    console.log('hers', herFares);
    for (airport in myFares) {
        if (!airport in herFares) continue;
        myFares[airport].forEach(function(myFare) {
            console.log(myFare);
            herFares[airport].forEach(function(herFare) {
                if (myFare.day === herFare.day) {
                    candidates.push({
                        day: myFare.day,
                        destination: airport,
                        myArrivalDate: myFare.arrivalDate,
                        herArrivalDate: herFare.arrivalDate,
                        price: myFare.price.value + herFare.price.value
                    })
                }
            });
        });
        console.log('my', airport, myFares[airport]);
        console.log('her', airport, herFares[airport]);
        console.table(candidates);
        return candidates;
    }
}

async function doStuff() {
    var candidates;
    await getDestinations(
        myDestinationsURL,
        function(result) {
            var data = {
                myDestinations: result
            };
            getDestinations(
                herDestinationsURL,
                function(result) {
                    data.herDestinations = result;
                    getCommonDestinations(data);
                    candidates = getFares(data.commonDestinations);
                }
            );
        }
    );

    var table = new Tabulator("#table", {
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
        ],
        rowClick: function(e, row) { //trigger an alert message when the row is clicked
            alert("Row " + row.getData().id + " Clicked!!!!");
        },
    });
}

doStuff();
