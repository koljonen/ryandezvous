const flightsTemplate = 'https://kiwiproxy.herokuapp.com/v2/search?fly_from=<airport>&dateFrom=<outDateFrom>&dateTo=<outDateTo>&returnFrom=<inDateFrom>&returnTo=<inDateTo>&curr=EUR&ret_from_diff_airport=0';

async function startLoading() {
    $("#loading").show();
}

async function endLoading() {
    $("#loading").hide();
}

function formatKiwiDate(date) {
    return date.split('-').reverse().join('/');
}

async function getFaresFromAirport(airport, fares, dateFrom) {
    const fareURL = flightsTemplate.replace(
        '<airport>', airport
    ).replace(
        '<outDateFrom>', formatKiwiDate(departureDateFrom.value)
    ).replace(
        '<outDateTo>', formatKiwiDate(departureDateTo.value)
    ).replace(
        '<inDateFrom>', formatKiwiDate(returnDateFrom.value)
    ).replace(
        '<inDateTo>', formatKiwiDate(returnDateTo.value)
    );
    await $.getJSON(
        fareURL,
        function(result) {
            (result.data || []).forEach(function(fare) {
                fares.push(fare);
            });
        }
    );
}

async function getFares(dateFrom, myAirport, herAirport, maxDiffHours, candidates) {
    var maybeAdd = function(myFare, herFare) {
        const myArrival = new Date(myFare.route[0].local_arrival);
        const herArrival = new Date(herFare.route[0].local_arrival);
        const myReturn = new Date(myFare.route[myFare.route.length - 1].local_arrival);
        const herReturn = new Date(herFare.route[herFare.route.length - 1].local_arrival);
        const arrivalDiff = Math.abs(myArrival - herArrival);
        const returnDiff = Math.abs(myReturn - herReturn);
        const msTogether = Math.min(myReturn, herReturn) - Math.max(myArrival, herArrival);
        const msApart = arrivalDiff + returnDiff;
        if(arrivalDiff + returnDiff > maxDiffHours * 60 * 60 * 1000) return;
        if(myFare.cityCodeTo !== herFare.cityCodeTo) return;
        if(msTogether < 24 * 60 * 60 * 1000) return;
        if(msTogether <= msApart) return;
        candidates.push({
            day: myFare.route[0].local_departure,
            destination: myFare.cityTo + ', ' + myFare.countryTo.name,
            myArrivalDate: myFare.route[0].local_arrival,
            herArrivalDate: herFare.route[0].local_arrival,
            myReturnDate: myFare.route[myFare.route.length - 1].local_arrival,
            herReturnDate: herFare.route[herFare.route.length - 1].local_arrival,
            myDepartureDate: myFare.route[0].local_departure,
            herDepartureDate: herFare.route[0].local_departure,
            myReturnDate: myFare.route[myFare.route.length - 1].local_departure,
            herReturnDate: herFare.route[herFare.route.length - 1].local_departure,
            price: myFare.price + herFare.price,
            timeApart: moment.duration(msApart),
            timeTogether: moment.duration(msTogether),
            myLink: myFare.deep_link,
            herLink: herFare.deep_link
        });
    };

    const myFares = [];
    const herFares = [];
    await getFaresFromAirport(myAirport, myFares, dateFrom);
    await getFaresFromAirport(herAirport, herFares, dateFrom);
    myFares.forEach(
        function(myFare) {
            herFares.forEach(
                function(herFare){
                    maybeAdd(myFare, herFare);
                }
            );
        }
    );
}

function parseDuration(s) {
    const parts = s.split(' ');
    const numberPart = parts[0] === 'a' || parts[0] === 'an' ? 1 : parseInt(parts[0]);
    const unitPart =  parts[1][parts[1].length -1] === 's' ? parts[1] : parts[1] + 's';
    return moment.duration(numberPart, unitPart);
}

async function doStuff() {
    await startLoading();
    const myAirport = $('#myAirport').val();
    const herAirport = $('#herAirport').val();
    const departureDateFrom = $('#departureDateFrom').val();
    const departureDateTo = $('#departureDateTo').val();
    const maxDiffHours = 72;

    const candidates = [];
    await getFares(departureDateFrom, myAirport, herAirport, maxDiffHours, candidates);
    var table = new Tabulator("#table", {
        height: "100%",
        data: candidates,
        layout: "fitColumns",
        columns: [
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
                title: "You",
                columns: [
                    {
                        title: "Arrival",
                        field: "myArrivalDate",
                        align: "center",
                        formatter:"datetime",
                        formatterParams: {
                            outputFormat:"ddd DD MMM HH:mm"
                        },
                    },
                    {
                        title: "Return",
                        field: "myReturnDate",
                        align: "center",
                        formatter:"datetime",
                        formatterParams: {
                            outputFormat:"ddd DD MMM HH:mm"
                        },
                    },
                    {
                        title: "Link",
                        field: "myLink",
                        formatter:"link",
                        formatterParams: {
                            label: "Buy",
                            target: "_blank",
                        }
                    },
                ]
            },
            {
                title: "Them",
                columns: [
                    {
                        title: "Arrival",
                        field: "herArrivalDate",
                        align: "center",
                        formatter:"datetime",
                        formatterParams: {
                            outputFormat:"ddd DD MMM HH:mm"
                        },
                    },
                    {
                        title: "Return",
                        field: "herReturnDate",
                        align: "center",
                        formatter:"datetime",
                        formatterParams: {
                            outputFormat:"ddd DD MMM HH:mm"
                        },
                    },
                    {
                        title: "Link",
                        field: "herLink",
                        formatter:"link",
                        formatterParams: {
                            label: "Buy",
                            target: "_blank",
                        }
                    },
                ]
            },
            {
                title: "Together",
                field: "timeTogether",
                formatter: function(cell, formatterParams, onRendered){
                    return cell.getValue().humanize();
                },
                headerFilter: true,
                headerFilterFunc: (headerValue, rowValue) => parseDuration(headerValue) <= rowValue,
            },
            {
                title: "Apart",
                field: "timeApart",
                formatter: function(cell, formatterParams, onRendered){
                    return cell.getValue().humanize();
                },
                headerFilter: true,
                headerFilterFunc: (headerValue, rowValue) => parseDuration(headerValue) >= rowValue,
            },
        ]
    });
    endLoading();
}

function daysInTheFuture(howMany) {
    var futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + howMany);
    return futureDate;
}

window.onload = async function(){
    document.getElementById('departureDateFrom').valueAsDate = daysInTheFuture(5);
    document.getElementById('departureDateTo').valueAsDate = daysInTheFuture(6);
    document.getElementById('returnDateFrom').valueAsDate = daysInTheFuture(9);
    document.getElementById('returnDateTo').valueAsDate = daysInTheFuture(10);
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
                airport.iataCode === 'MLA' ? 'FRA' : 'MLA'
            );
        }
    );
    endLoading();
};
