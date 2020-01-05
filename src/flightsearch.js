import buildUrl from 'build-url';
import moment from "moment";

function formatKiwiDate(date) {
    return moment(date).format('DD/MM/YYYY');
}

async function getFaresFromAirport(airport, state) {
    const fareURL = buildUrl(
        'https://kiwiproxy.herokuapp.com',
        {
            path: "v2/search",
            queryParams: {
                fly_from: airport.id,
                dateFrom: formatKiwiDate(state.departureDate),
                dateTo: formatKiwiDate(state.departureDate),
                returnFrom: formatKiwiDate(state.returnDate),
                returnTo: formatKiwiDate(state.returnDate),
                curr: 'EUR',
                ret_from_diff_airport: 0,
                fly_to: state.destinationAirport ? state.destinationAirport.id : undefined,
                max_stopovers: 0
            }
        }
    ).replace(/%2F/g, '/');
    const flights = (await (await fetch(fareURL)).json()).data;
    return flights.reduce(
        (map, flight) => {
            if(getKey(flight) in map) map[getKey(flight)].push(flight);
            else map[getKey(flight)] = [flight];
            return map;
        },
        {}
    );
    
}

function getKey(flight) {
    return flight.cityTo;
}

async function getFares(state) {
    const candidates = [];
    var maybeAdd = function(myFare, herFare) {
        const maxDiffHours = 36;
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
            price: myFare.price + herFare.price,
            timeApart: moment.duration(msApart),
            timeTogether: moment.duration(msTogether),
            myLink: myFare.deep_link,
            herLink: herFare.deep_link
        });
    };
    const myFares = await getFaresFromAirport(state.myAirport, state);
    const herFares = await getFaresFromAirport(state.herAirport, state);
    Object.values(myFares).forEach(
        myFaresToCity => myFaresToCity.forEach(
            myFare => {
                const herFaresFromCity = herFares[getKey(myFare)];
                if(herFaresFromCity) herFaresFromCity.forEach(
                    herFare => maybeAdd(myFare, herFare)
                )
            }
        )
    );
    return {
        candidates: candidates,
        myFares: myFares,
        herFares: herFares
    };
}

export default getFares;
