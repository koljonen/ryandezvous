import moment from "moment";
import { Chart } from "react-google-charts";
import React from 'react';
import CardHeader from "@material-ui/core/CardHeader";
import CardActions from '@material-ui/core/CardActions';
import CloseIcon from '@material-ui/icons/Close';
import {
    Typography,
    MenuItem,
    Slider,
    Select,
    Grid,
    Link,
    Tabs,
    Tab,
    Paper,
    Card,
    CardContent,
    Avatar,
    IconButton,
} from '@material-ui/core';

export default function ResultsTabs(props) {
    const setDestination = (event, newValue) => {
        props.setQuery({expand: newValue, theirFlight: null, yourFlight: null});
    };
    const setYourFlight = (newValue) => props.setQuery({yourFlight: newValue});
    const setTheirFlight = (newValue) => props.setQuery({theirFlight: newValue});
    const setYourMaxPrice = (event, value) => props.setQuery({yourMaxPrice: value});
    const setTheirMaxPrice = (event, value) => props.setQuery({theirMaxPrice: value});
    const setSortBy = (event, newValue) => props.setQuery({sortBy: event.target.value});
    const airports = Object.keys(props.flights);
    const value = airports.indexOf(props.query.expand) !== -1 ? props.query.expand : false;
    return (
        <Paper>
            <Tabs variant="scrollable" scrollButtons="auto" value={value} onChange={setDestination}>
                {Object.values(props.flights).map(
                    flight => {
                        const myFirst = flight.yourFares[0];
                        const price = minPrice(flight.yourFares) + minPrice(flight.theirFares);
                        const label = `€ ${price} ${myFirst.cityTo}, ${myFirst.countryTo.name}`;
                        return <Tab key={myFirst.cityCodeTo} value={myFirst.cityCodeTo} label={label}/>;
                    }
                )
                }
            </Tabs>
            <FlightSelector
                cityCodeTo={props.query.expand}
                yourFlight={props.query.yourFlight}
                theirFlight={props.query.theirFlight}
                flights={props.flights[props.query.expand]}
                setYourFlight={setYourFlight}
                setTheirFlight={setTheirFlight}
                sortBy={props.query.sortBy || 'price'}
                setSortBy={setSortBy}
                yourMaxPrice={props.query.yourMaxPrice}
                theirMaxPrice={props.query.theirMaxPrice}
                setYourMaxPrice={setYourMaxPrice}
                setTheirMaxPrice={setTheirMaxPrice}
            />
            <SelectedFlights
                yourFlight={props.query.yourFlight}
                theirFlight={props.query.theirFlight}
                setTheirFlight={setTheirFlight}
                setYourFlight={setYourFlight}
                flights={props.flights[props.query.expand]}
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

function addYoursOrTheirs(fares, yoursOrTheirs) {
    return fares.map(x => {
        return {...x, ...{yoursOrTheirs: yoursOrTheirs}}
    });
}

function FlightSelector({
    flights,
    yourFlight,
    theirFlight,
    setYourFlight,
    setTheirFlight,
    sortBy,
    setSortBy,
    yourMaxPrice,
    theirMaxPrice,
    setYourMaxPrice,
    setTheirMaxPrice,
}) {
    if(!flights) return null;
    if(yourFlight && theirFlight) return null;
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
    const yourMax = fares.filter(f => f.yoursOrTheirs === 'yours').reduce((maxPrice, fare) => Math.max(fare.price, maxPrice), 0);
    const theirMax = fares.filter(f => f.yoursOrTheirs === 'theirs').reduce((maxPrice, fare) => Math.max(fare.price, maxPrice), 0);
    const yourMin = fares.filter(f => f.yoursOrTheirs === 'yours').reduce((minPrice, fare) => Math.min(fare.price, minPrice), Infinity);
    const theirMin = fares.filter(f => f.yoursOrTheirs === 'theirs').reduce((minPrice, fare) => Math.min(fare.price, minPrice), Infinity);
    return (
        <div>
            <Grid container spacing={10}>
                <Grid item xs/>
                <Grid item xs>
                    <Typography gutterBottom>Sorting</Typography>
                    <Select onChange={setSortBy} value={sortBy}>
                        <MenuItem value="price">↑Price</MenuItem>
                        <MenuItem value="time">↑Time</MenuItem>
                    </Select>
                </Grid>
                <Grid item xs>
                    <Typography gutterBottom>Max price</Typography>
                    <Slider
                        defaultValue={yourMaxPrice || yourMax}
                        onChangeCommitted={setYourMaxPrice}
                        valueLabelDisplay="auto"
                        min={yourMin}
                        max={yourMax}
                    />
                </Grid>
                <Grid item xs>
                    <Typography gutterBottom>Max price</Typography>
                    <Slider
                        defaultValue={theirMaxPrice || theirMax}
                        onChangeCommitted={setTheirMaxPrice}
                        valueLabelDisplay="auto"
                        color="secondary"
                        min={theirMin}
                        max={theirMax}
                    />
                </Grid>
                <Grid item xs/>
            </Grid>
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
        </div>
    );
}

function SelectedFlights({yourFlight, theirFlight, flights, setTheirFlight, setYourFlight}) {
    if(!flights) return null;
    const theirs = theirFlight && flights.theirFares.filter(c => c.id === theirFlight)[0];
    const yours = yourFlight && flights.yourFares.filter(c => c.id === yourFlight)[0];
    if(!theirs && !yours) return null;
    return <Paper>
        <Grid container spacing={10}>
            {theirs && <Flight flight={theirs} clearFlight={() => setTheirFlight(null)}/>}
            {yours && <Flight flight={yours} clearFlight={() => setYourFlight(null)}/>}
        </Grid>
    </Paper>
}

function Flight({flight, clearFlight}) {
    return <Grid item>
        <Card>
            <CardHeader
                title={`${flight.cityFrom} -> ${flight.cityTo}`}
                action={<IconButton aria-label="delete" onClick={clearFlight}><CloseIcon/></IconButton>}
            />
            {flight.route.map(
                leg => {
                    return <div key={leg.id}>
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