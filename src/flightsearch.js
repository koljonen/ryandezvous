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

function getCandidates({yourFares, theirFares}) {
    const candidates = {};
    for(const destination of Object.keys(theirFares)) {
        if(destination in yourFares);
        else continue;
        candidates[destination] = {
            yourFares: yourFares[destination],
            theirFares: theirFares[destination]
        }
    }
    return candidates;
}

async function* getFares(state) {
    const yourFares = await getFaresFromAirport(state.yourOrigin, state);
    const theirFares = await getFaresFromAirport(state.theirOrigin, state);
    const yourFaresDict = arrayToDict(yourFares);
    const theirFaresDict = arrayToDict(theirFares);
    yield getCandidates({yourFares: yourFaresDict, theirFares:theirFaresDict});
    for(const destination of Object.keys(theirFaresDict)) {
        if(destination in yourFaresDict) continue;
        const yourFaresToDestination = await getFaresFromAirport(
            state.yourOrigin,
            {...state, destination: {id: destination}}
        );
        const yourFaresToDestinationDict = arrayToDict(yourFaresToDestination);
        const newCandidates = getCandidates({yourFares: yourFaresToDestinationDict, theirFares: theirFaresDict});
        yield newCandidates;
        // todo: add to dict
    }
    for(const destination of Object.keys(yourFaresDict)) {
        if(destination in theirFaresDict) continue;
        const theirFaresToDestination = await getFaresFromAirport(
            state.theirOrigin,
            {...state, destination: {id: destination}}
        );
        const theirFaresToDestinationDict = arrayToDict(theirFaresToDestination);
        const newCandidates = getCandidates({yourFares: yourFaresDict, theirFares: theirFaresToDestinationDict});
        yield newCandidates;
        // todo: add to dict
    }
}

export default getFares;
