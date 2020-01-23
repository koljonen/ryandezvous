import throttle from 'lodash/throttle';
import buildUrl from 'build-url';
import moment from "moment";

function formatKiwiDate(date) {
    return moment(date).format('DD/MM/YYYY');
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

const getFaresFromAirport = throttle(
    async function (airport, state) {
        const dateFlexibility = state.dateFlexibility || 0;
        const dateFrom = addDays(state.departureDate, -dateFlexibility);
        const dateTo = addDays(state.departureDate, dateFlexibility);
        const returnFrom = addDays(state.returnDate, -dateFlexibility);
        const returnTo = addDays(state.returnDate, dateFlexibility);
        const fareURL = buildUrl(
            'https://kiwiproxy.herokuapp.com',
            {
                path: "v2/search",
                queryParams: {
                    fly_from: airport.id,
                    dateFrom: formatKiwiDate(dateFrom),
                    dateTo: formatKiwiDate(dateTo),
                    returnFrom: formatKiwiDate(returnFrom),
                    returnTo: formatKiwiDate(returnTo),
                    curr: 'EUR',
                    ret_from_diff_airport: 0,
                    fly_to: state.destination ? state.destination.id : undefined,
                    max_stopovers: state.max_stopovers || 0
                }
            }
        ).replace(/%2F/g, '/');
        const flights = (await (await fetch(fareURL)).json()).data;
        return flights;
    },
    200
);


function arrayToDict(flights, map = {}) {
    flights.forEach(
        (flight) => {
            if(getKey(flight) in map) map[getKey(flight)].push(flight);
            else map[getKey(flight)] = [flight];
            return map;
        },
        {}
    );
    return map;
}

function getKey(flight) {
    return flight.cityCodeTo;
}

function maybeAdd(myFare, herFare, candidates) {
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

function getCandidates({myFaresArray, herFaresDict, revertParams = false}) {
    const candidates = [];
    myFaresArray.forEach(
        myFare => {
            const herFaresFromCity = herFaresDict[getKey(myFare)];
            if(herFaresFromCity) herFaresFromCity.forEach(
                herFare => {
                    if(revertParams) maybeAdd(herFare, myFare, candidates)
                    else maybeAdd(myFare, herFare, candidates)
                }
            )
        }
    );
    return candidates;
}

async function* getFares(state) {
    const myFares = await getFaresFromAirport(state.yourOrigin, state);
    const herFares = await getFaresFromAirport(state.theirOrigin, state);
    const myFaresDict = arrayToDict(myFares);
    const herFaresDict = arrayToDict(herFares);
    yield getCandidates({myFaresArray: myFares, herFaresDict:herFaresDict});
    for(const destination of Object.keys(herFaresDict)) {
        if(destination in myFaresDict) continue;
        const myFaresToDestination = await getFaresFromAirport(
            state.yourOrigin,
            {...state, destination: {id: destination}}
        );
        const newCandidates = getCandidates({myFaresArray: myFaresToDestination, herFaresDict: herFaresDict});
        yield newCandidates;
        // todo: add to dict
    }
    for(const destination of Object.keys(myFaresDict)) {
        if(destination in herFaresDict) continue;
        const herFaresToDestination = await getFaresFromAirport(
            state.theirOrigin,
            {...state, destination: {id: destination}}
        );
        const newCandidates = getCandidates({myFaresArray: herFaresToDestination, herFaresDict: myFaresDict, revertParams: true});
        yield newCandidates;
        // todo: add to dict
    }
}

export default getFares;
