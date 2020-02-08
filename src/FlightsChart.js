import Immutable from 'seamless-immutable';
import Timeline from 'react-visjs-timeline'
import moment from "moment";
import React from 'react';

function FlightsChart({
    flights,
    yourFlight,
    theirFlight,
    setYourFlight,
    setTheirFlight,
    sortBy,
    yourMaxPrice,
    theirMaxPrice,
}) {
    const fares = [
        ...addYoursOrTheirs(flights.yourFares, 'yours'),
        ...addYoursOrTheirs(flights.theirFares, 'theirs'),
    ];
    fares.sort((x, y) => {
        if(x.id === theirFlight || x.id === yourFlight) return -1;
        if(y.id === theirFlight || y.id === yourFlight) return 1;
        if(sortBy === 'price') return Math.sign(x.price - y.price);
        if(sortBy === 'time') {
            const ret = Math.sign(
                new Date(x.utc_departure) - new Date(y.utc_departure) ||
                new Date(x.utc_arrival) - new Date(y.utc_arrival) ||
                new Date(x.utc_arrival) - new Date(y.utc_arrival) ||
                new Date(x.route[x.route.length - 1].utc_arrival) - new Date(y.route[y.route.length - 1].utc_arrival) ||
                x.price - y.price
            );
            return ret;
        }
        return 0;
    });

    const itemsAndGroups = fares.filter(fare => {
        const maxPrice = {yours: yourMaxPrice, theirs: theirMaxPrice}[fare.yoursOrTheirs];
        return !maxPrice || maxPrice >= fare.price;
    }).map(
        fare => fareToDatum({fare:fare, yourFlight: yourFlight, theirFlight: theirFlight})
    ).filter(x => x);
    const items = itemsAndGroups.map(x => x.items).flat();
    const groups = itemsAndGroups.map((x, idx) => ({...x.group, order:idx}));

    const selectHandler = ({items, event}) => {
        const selectedFareID = items[0].split('/')[0];
        const selectedFare = fares.filter(x => x.id === selectedFareID)[0];
        if(selectedFare.yoursOrTheirs === 'yours') {
            if(selectedFare.id === yourFlight) setYourFlight('');
            else setYourFlight(selectedFare.id);
        }
        else if(selectedFare.yoursOrTheirs === 'theirs') {
            if(selectedFare.id === theirFlight) setTheirFlight('');
            else setTheirFlight(selectedFare.id);
        }
        else console.error('unexpected yoursOrTheirs', selectedFare.yoursOrTheirs);
    }
    const options = {
        width: '100%',
        showMajorLabels: true,
        showCurrentTime: false,
        verticalScroll: true,
        zoomable: false,
        stack: false,
        type: 'range',
        maxHeight: '100%',
        orientation: {
            axis: 'both',
        },
        format: {
            minorLabels: {
                minute: 'h:mma',
                hour: 'ha',
            }
        }
    };
    return <Timeline
        options={options}
        items={Immutable(items)}
        groups={Immutable(groups)}
        selectHandler={selectHandler}
    />;
}

function addYoursOrTheirs(fares, yoursOrTheirs) {
    return fares.map(x => {
        return {...x, ...{yoursOrTheirs: yoursOrTheirs}}
    });
}

function fareToDatum({fare, yourFlight, theirFlight}) {
    const selection = yourFlight || theirFlight;
    if(yourFlight && fare.yoursOrTheirs === 'yours' && fare.id !== yourFlight) return null;
    if(theirFlight && fare.yoursOrTheirs === 'theirs' && fare.id !== theirFlight) return null;
    const returnLeg = fare.route[fare.route.length - 1];
    const price = `€ ${fare.price}`
    const there = `${fare.flyFrom} -> ${fare.flyTo} ${formatTime(fare.local_departure)} – ${formatTime(fare.local_arrival)}`;
    const back = `${returnLeg.flyFrom} -> ${returnLeg.flyTo} ${formatTime(returnLeg.local_departure)} – ${formatTime(returnLeg.local_arrival)}`;
    const label = `${price} | ${there} | ${back}`;
    const tooltip = fare.route.reduce(
        (output, leg) => `${output}<br/>${formatTime(leg.local_departure)} ${leg.flyFrom} -> ${leg.flyTo} ${formatTime(leg.local_arrival)}}\n`,
        price
    );
    const colors = {
        theirs: ['#DC3912', '#FFAAAA'],
        yours: ['#3366CC', '#88AAFF']
    }[fare.yoursOrTheirs];
    const flight_color = fare.id === selection ? colors[1] : colors[0];
    const gap_color = fare.id === selection ? colors[0] : colors[1];
    const bars = [];
    let previousLeg;
    for(const leg of fare.route) {
        bars.push({
            group: fare.id,
            id: fare.id + '/' + leg.id,
            content: '✈',
            style: `font-size: "6px"; background-color: ${flight_color};`,
            title: tooltip,
            start: new Date(leg.utc_departure),
            end: new Date(leg.utc_arrival)
        });
        if(previousLeg) bars.push({
            group: fare.id,
            id: fare.id + '/' + leg.id + '/gap',
            content: previousLeg.flyTo === fare.flyTo ? label : previousLeg.flyTo,
            style: `font-size: "6px"; background-color: ${gap_color};`,
            title: tooltip,
            start: new Date(previousLeg.utc_arrival),
            end: new Date(leg.utc_departure)
        });
        previousLeg = leg;
    };
    return {
        items: bars,
        group: {
            id: fare.id,
            title: label,
            content: ''
        }
    };
}

function formatTime(time) {
    return moment(time).format('DD MMM HH:mm');
}

const equal = (x, y, keys) => {
    for(const key of keys) if(x[key] !== y[key]) return false;
    return true;
}

export default React.memo(
    FlightsChart,
    (x, y) => equal(x, y, ['flights', 'yourFlight', 'theirFlight', 'sortBy', 'yourMaxPrice', 'theirMaxPrice'])
);
