import moment from "moment";
import React from 'react';
import { Chart } from "react-google-charts";

export default function FlightsChart({
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

    const data_param = [
        [
            { type: 'string', id: 'id' },
            { type: 'string', id: 'label' },
            { type: 'string', role: 'style' },
            { type: 'string', role: 'tooltip', p: {'html': true}},
            { type: 'date', id: 'Start' },
            { type: 'date', id: 'End' }
        ],
        ...fares.filter(fare => {
            const maxPrice = {yours: yourMaxPrice, theirs: theirMaxPrice}[fare.yoursOrTheirs];
            return !maxPrice || maxPrice >= fare.price;
        }).map(
            fare => fareToDatum({fare:fare, yourFlight: yourFlight, theirFlight: theirFlight})
        ).filter(x => x).flat()
    ];
    const chartEvents=[
      {
        eventName: 'select',
        callback: function({chartWrapper}) {
            const chartSelection = chartWrapper.getChart().getSelection();
            const selectedFareID = data_param[chartSelection[0].row][0];
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
      }
    ];
    return (
            <Chart
                width={'100%'}
                height={yourFlight && theirFlight ? '200px' : '800px'}
                chartType="Timeline"
                loader={<div>Loading Chart</div>}
                data={data_param}
                chartEvents={chartEvents} // <- this is event handler
                options={{
                    timeline: {
                        colorByRowLabel: false,
                        groupByRowLabel: true,
                        showRowLabels: false
                    },
                    tooltip: {
                        isHtml: true
                    }

                }}
                rootProps={{ 'data-testid': '1' }}
            />
    );
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
        (output, leg) => `${output}<br/>${formatTime(leg.local_departure)} ${leg.flyFrom} -> ${leg.flyTo} ${formatTime(leg.local_arrival)}}`,
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
        bars.push([
            fare.id,
            '',
            `color: ${flight_color};`,
            tooltip,
            new Date(leg.utc_departure),
            new Date(leg.utc_arrival)
        ]);
        if(previousLeg) bars.push([
            fare.id,
            previousLeg.flyTo === fare.flyTo ? label : '',
            `color: ${gap_color};`,
            tooltip,
            new Date(previousLeg.utc_arrival),
            new Date(leg.utc_departure)
        ]);
        previousLeg = leg;
    };
    return bars;
}

function formatTime(time) {
    return moment(time).format('DD MMM HH:mm');
}
