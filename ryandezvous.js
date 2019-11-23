const flightsTemplate = 'https://services-api.ryanair.com/farfnd/3/roundTripFares?&departureAirportIataCode=<airport>&language=en&limit=1000&market=en-mt&offset=0&outboundDepartureDateFrom=<outDateFrom>&outboundDepartureDateTo=<outDateTo>&inboundDepartureDateFrom=<inDateFrom>&inboundDepartureDateTo=<inDateTo>';
const deepLinkTemplate ='http://www.kiwi.com/deep?affilid=koljonenryandezvous&departure=<date>&from=<fromAirport>&to=<toAirport>';
const waitFor = (ms) => new Promise(r => setTimeout(r, ms));
var currencyExchangeRates;

async function startLoading() {
    $("#loading").show();
}

async function endLoading() {
    $("#loading").hide();
}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}


async function getCurrencyRates() {
    await $.getJSON(
        'https://api.exchangeratesapi.io/latest',
        function(result) {
            currencyExchangeRates = result;
        }
    );
}

function toEUR(price) {
    if(price.currencyCode === 'EUR') return price.value;
    return price.value / currencyExchangeRates.rates[price.currencyCode];
}

async function getFaresFromAirport(airport, fares, dateFrom) {
    const fareURL = flightsTemplate.replace(
        '<airport>', airport
    ).replace(
        '<outDateFrom>', departureDateFrom.value
    ).replace(
        '<outDateTo>', departureDateTo.value
    ).replace(
        '<inDateFrom>', departureDateFrom.value
    ).replace(
        '<inDateTo>', departureDateTo.value
    );
    console.log(fareURL);
    await $.getJSON(
        fareURL,
        function(result) {
            faresToAirport = result.outbound.fares.filter(
                value => value.arrivalDate
            );
            if (faresToAirport) faresToAirport.forEach(function(fare) {
                fares.push(fare);
            });
        }
    );
}

async function getFares(dateFrom, myAirport, herAirport, maxDiffHours, candidates) {
    var maybeAdd = function(myFare, herFare) {
        const myArrival = new Date(myFare.arrivalDate);
        const herArrival = new Date(herFare.arrivalDate);
        const arrivalDiffMinutes = (myArrival - herArrival) / 1000 / 60;
        if(Math.abs(arrivalDiffMinutes) > maxDiffHours * 60) return;
        candidates.push({
            day: myFare.day,
            destination: destination.name + ', ' + destination.countryName,
            destinationCode: destination.iataCode,
            myArrivalDate: myFare.arrivalDate,
            herArrivalDate: herFare.arrivalDate,
            myDepartureDate: myFare.departureDate,
            herDepartureDate: herFare.departureDate,
            price: Math.round(1.2 * toEUR(myFare.price) + 1.2 * toEUR(herFare.price)),
            arrivalDiffHours: Math.round(arrivalDiffMinutes / 60)
        });
    };

    const myFares = [];
    const herFares = [];
    await getFaresFromAirport(myAirport, myFares, dateFrom);
    await waitFor(1000);
    await getFaresFromAirport(herAirport, herFares, dateFrom);
    await console.log(myFares);
    await console.log(herFares);
    await myFares.forEach(
        function(myFare) {
            herFares.forEach(
                function(herFare){
                    maybeAdd(destination, myFare, herFare);
                }
            );
        }
    );
}

async function doStuff() {
    await startLoading();
    const myAirport = $('#myAirport').val();
    const herAirport = $('#herAirport').val();
    const departureDateFrom = $('#departureDateFrom').val();
    const departureDateTo = $('#departureDateTo').val();
    const maxDiffHours = 48;

    var candidates;
    var data = {};
    candidates = [];
    var table = new Tabulator("#table", {
        height: "100%",
        data: candidates,
        reactiveData:true,
        layout: "fitColumns",
        columns: [
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
                formatter: "money",
                formatterParams: {
                    symbol: "€",
                    precision: 0
                },
                headerFilter: true,
                headerFilterFunc: (headerValue, rowValue) => headerValue >= rowValue,
            },
            {
                title: "Destination",
                field: "destination",
                headerFilter: true
            },
            {
                title: "Your arrival",
                field: "myArrivalDate",
                align: "center",
                formatter:"datetime",
                formatterParams: {
                    outputFormat:"YYYY-MM-DD HH:mm"
                },
            },
            {
                title: "Their arrival",
                field: "herArrivalDate",
                align: "center",
                formatter:"datetime",
                formatterParams: {
                    outputFormat:"YYYY-MM-DD HH:mm"
                },
            },
            
            {
                title: "Hours diff",
                field: "arrivalDiffHours",
                headerFilter: true,
                headerFilterFunc: (headerValue, rowValue) => headerValue >= Math.abs(rowValue),
            },
        ],
        rowClick: function(e, row) {
            var myLink = deepLinkTemplate.replace(
                '<date>', row.getData().myDepartureDate.split('T')[0]
            ).replace(
                '<fromAirport>', myAirport
            ).replace(
                '<toAirport>', row.getData().destinationCode
            );
            window.open(myLink, '_blank');
            var herLink = deepLinkTemplate.replace(
                '<date>', row.getData().herDepartureDate.split('T')[0]
            ).replace(
                '<fromAirport>', herAirport
            ).replace(
                '<toAirport>', row.getData().destinationCode
            );
            window.open(herLink, '_blank');
        },
    });
    await getFares(departureDateFrom, myAirport, herAirport, maxDiffHours, candidates);
    endLoading();
}

window.onload = async function(){
    document.getElementById('departureDateFrom').valueAsDate = new Date();
    var futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    document.getElementById('departureDateTo').valueAsDate = futureDate;
    await $.getJSON(
        'https://www.ryanair.com/api/locate/4/common?embedded=airports',
        function(result) {
            result.airports.sort(function (a, b) {
                return a.name.localeCompare(b.name);
            }).forEach(function(airport){
               const option = $("<option>");
               option.val(airport.iataCode);
               option.text(airport.name);
               $('.airports').append(option);
            });
        }
    );
    await $.getJSON(
        'https://www.ryanair.com/api/geoloc/3/defaultAirport',
        function(airport) {
            $("#myAirport").val(airport.iataCode);
            $("#herAirport").val(
                airport.iataCode === 'MLA' ? 'HHN' : 'MLA'
            );
        }
    );

    await getCurrencyRates();
    endLoading();
};
