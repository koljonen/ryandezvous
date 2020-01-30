import moment from "moment";
import FlightsChart from "./FlightsChart";
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
    const yourMax = flights.yourFares.reduce((maxPrice, fare) => Math.max(fare.price, maxPrice), 0);
    const theirMax = flights.theirFares.reduce((maxPrice, fare) => Math.max(fare.price, maxPrice), 0);
    const yourMin = flights.yourFares.reduce((minPrice, fare) => Math.min(fare.price, minPrice), Infinity);
    const theirMin = flights.theirFares.reduce((minPrice, fare) => Math.min(fare.price, minPrice), Infinity);
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
            <FlightsChart
                flights={flights}
                yourFlight={yourFlight}
                theirFlight={theirFlight}
                setYourFlight={setYourFlight}
                setTheirFlight={setTheirFlight}
                sortBy={sortBy}
                yourMaxPrice={yourMaxPrice}
                theirMaxPrice={theirMaxPrice}
                setYourMaxPrice={setYourMaxPrice}
                setTheirMaxPrice={setTheirMaxPrice}
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

function formatTime(time) {
    return moment(time).format('DD MMM HH:mm');
}
