import moment from "moment";
import { Chart } from "react-google-charts";
import React from 'react';
import Grid from '@material-ui/core/Grid';
import {Tabs, Tab, Paper} from '@material-ui/core';

export default function ResultsTable(props) {
    const setDestination = (event, newValue) => {
        props.setQuery({expand: newValue});
    };
    const airports = Object.keys(props.candidates);
    const value = airports.indexOf(props.query.expand) !== -1 ? props.query.expand : false;
    return (
        <Paper>
            <Tabs value={value} onChange={setDestination}>
                {Object.values(props.candidates).map(
                    candidate => {
                        const myFirst = candidate.yourFares[0];
                        const price = minPrice(candidate.yourFares) + minPrice(candidate.theirFares);
                        const label = `€ ${price} ${myFirst.cityTo}, ${myFirst.countryTo.name}`;
                        return <Tab value={myFirst.cityCodeTo} label={label}/>;
                    }
                )
                }
            </Tabs>
            <Expanded cityCodeTo={props.query.expand} candidates={props.candidates}/>
        </Paper>
    )
}

function minPrice(fares) {
    return Math.min(...(fares.map(fare => fare.price)));
}

function formatTime(time) {
    return moment(time).format('DD MMM HH:mm');
}

function fareToDatum({fare, selection}) {
    const returnLeg = fare.route[fare.route.length - 1];
    const price = `€ ${fare.price}`
    const there = `${fare.flyFrom} -> ${fare.flyTo} ${formatTime(fare.local_departure)} – ${formatTime(fare.local_arrival)}`;
    const back = `${returnLeg.flyFrom} -> ${returnLeg.flyTo} ${formatTime(returnLeg.local_departure)} – ${formatTime(returnLeg.local_arrival)}`;
    const label = `${price} | ${there} | ${back}`;
    const tooltip = `${price}<br/>${there}<br/>${back}`;
    const colors = {
        theirs: ['#DC3912', '#FFAAAA'],
        yours: ['#3366CC', '#88AAFF']
    }[fare.yoursOrTheirs];
    const color1 = fare.id === selection ? colors[1] : colors[0];
    const color2 = fare.id === selection ? colors[0] : colors[1];
    return [
        [
            label,
            '',
            `color: ${color1};`,
            tooltip,
            new Date(fare.utc_departure),
            new Date(fare.utc_arrival),

        ],
        [
            label,
            label,
            `color: ${color2};`,
            tooltip,
            new Date(fare.utc_arrival),
            new Date(returnLeg.utc_departure),

        ],
        [
            label,
            '',
            `color: ${color1};`,
            tooltip,
            new Date(returnLeg.utc_departure),
            new Date(returnLeg.utc_arrival),
        ]
    ];
}

function addYoursOrTheirs(fares, yoursOrTheirs) {
    return fares.map(x => {
        return {...x, ...{yoursOrTheirs: yoursOrTheirs}}
    });
}

function Expanded({cityCodeTo, candidates}) {
    const [selection, setSelection] = React.useState({});
    if(cityCodeTo in candidates);
    else return null;
    const fares = [
        ...addYoursOrTheirs(candidates[cityCodeTo].yourFares, 'yours'),
        ...addYoursOrTheirs(candidates[cityCodeTo].theirFares, 'theirs'),
    ];
    fares.sort((x, y) => Math.sign(x.price - y.price));

    const data_param = [
        [
            { type: 'string', id: 'Room' },
            { type: 'string', id: 'price' },
            { type: 'string', role: 'style' },
            { type: 'date', id: 'Start' },
            { type: 'date', id: 'End' },

        ],
        ...fares.map(
            fare => fareToDatum({fare:fare, selection: selection})
        ).flat()
    ];

    const chartEvents=[
      {
        eventName: 'select',
        callback: function({chartWrapper}) {
            const chartSelection = chartWrapper.getChart().getSelection();
            const idx = Math.floor(chartSelection[0].row / 3);
            const selectedFare = fares[idx];
            if(selectedFare.id === selection.id) setSelection({});
            else setSelection(selectedFare);
        }
      }
    ];

    return (
        <Chart
            width={'100%'}
            height={'800px'}
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

function Fare(fare) {
    return (<Grid item sm={6} md={3} xl={2}>
        <div>{JSON.stringify(fare)}</div>
    </Grid>);
}
