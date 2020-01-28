import moment from "moment";
import { Chart } from "react-google-charts";
import React from 'react';
import CardHeader from "@material-ui/core/CardHeader";
import CardActions from '@material-ui/core/CardActions';
import {
    Grid,
    Link,
    Tabs,
    Tab,
    Paper,
    Card,
    CardContent,
    Avatar
} from '@material-ui/core';

export default function ResultsTable(props) {
    const setDestination = (event, newValue) => {
        props.setQuery({expand: newValue, theirFlight: null, yourFlight: null});
    };
    const setYourFlight = (newValue) => props.setQuery({yourFlight: newValue});
    const setTheirFlight = (newValue) => props.setQuery({theirFlight: newValue});
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
            <Expanded
                cityCodeTo={props.query.expand}
                yourFlight={props.query.yourFlight}
                theirFlight={props.query.theirFlight}
                candidates={props.candidates}
                setYourFlight={setYourFlight}
                setTheirFlight={setTheirFlight}
            />
            <Selected
                yourFlight={props.query.yourFlight}
                theirFlight={props.query.theirFlight}
                flights={props.candidates[props.query.expand]}
            />
        </Paper>
    )
}

function minPrice(fares) {
    return Math.min(...(fares.map(fare => fare.price)));
}

function formatTime(time) {
    return moment(time).format('DD MMM HH:mm');
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

function Expanded({cityCodeTo, candidates, yourFlight, theirFlight, setYourFlight, setTheirFlight}) {
    if(yourFlight && theirFlight) return null;
    if(cityCodeTo in candidates);
    else return null;
    const fares = [
        ...addYoursOrTheirs(candidates[cityCodeTo].yourFares, 'yours'),
        ...addYoursOrTheirs(candidates[cityCodeTo].theirFares, 'theirs'),
    ];
    fares.sort((x, y) => {
        if(x.id === theirFlight || x.id === yourFlight) return -1;
        if(y.id === theirFlight || y.id === yourFlight) return 1;
        return Math.sign(x.price - y.price);
    });

    const data_param = [
        [
            { type: 'string', id: 'Room' },
            { type: 'string', id: 'price' },
            { type: 'string', role: 'style' },
            { type: 'string', role: 'tooltip', p: {'html': true}},
            { type: 'date', id: 'Start' },
            { type: 'date', id: 'End' },

        ],
        ...fares.map(
            fare => fareToDatum({fare:fare, yourFlight: yourFlight, theirFlight: theirFlight})
        ).filter(x => x).flat()
    ];
    const chartEvents=[
      {
        eventName: 'select',
        callback: function({chartWrapper}) {
            const chartSelection = chartWrapper.getChart().getSelection();
            const idx = Math.floor(chartSelection[0].row / 3);
            const selectedFare = fares[idx];
            if(selectedFare.yoursOrTheirs === 'yours') {
                if(selectedFare.id === yourFlight) setYourFlight('');
                else setYourFlight(selectedFare.id);
            }
            else {
                if(selectedFare.id === theirFlight) setTheirFlight('');
                else setTheirFlight(selectedFare.id);
            }
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

function Selected({yourFlight, theirFlight, flights}) {
    if(!flights) return null;
    const theirs = theirFlight && flights.theirFares.filter(c => c.id === theirFlight)[0];
    const yours = yourFlight && flights.yourFares.filter(c => c.id === yourFlight)[0];
    if(!theirs && !yours) return null;
    return <Paper>
        <Grid container spacing={10}>
            {theirs && <Flight flight={theirs}/>}
            {yours && <Flight flight={yours}/>}
        </Grid>
    </Paper>
}

function Flight({flight}) {
    return <Grid item>
        <Card key={flight.id}>
            <CardHeader title={`${flight.cityFrom} -> ${flight.cityTo}`}/>
            {flight.route.map(
                leg => {
                    return <div>
                        <Avatar src={`https://images.kiwi.com/airlines/64/${leg.airline}.png`}/>
                        <CardContent>
                            {formatTime(leg.local_departure)} {leg.cityFrom} ({leg.flyFrom})
                            <br/>
                            {formatTime(leg.local_arrival)} {leg.cityTo} ({leg.flyTo})
                        </CardContent>
                    </div>
                }
            )}
            <CardActions>
                <Link target="_blank" rel="noopener" href={flight.deep_link}>€ {flight.price}</Link>
            </CardActions>
        </Card>
    </Grid>
}
