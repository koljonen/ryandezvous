import { withRouter } from 'react-router-dom';
import buildUrl from 'build-url';
import Grid from '@material-ui/core/Grid';
import {
  MuiPickersUtilsProvider,
  DatePicker
} from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import moment from "moment";
import Button from '@material-ui/core/Button';
import React from 'react';
import AirportSelector from './AirportSelector.js';

function nextThursday() {
    return moment().add((moment().isoWeekday() >= 4  ? 12 : 4) - moment().isoWeekday(), 'days');
}

const requiredParams = ['departureDate', 'returnDate', 'myAirport', 'herAirport'];

class Form extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            departureDate: nextThursday(),
            returnDate: nextThursday().add(4, 'days'),
            destinationAirport: "",
            ...props.match.params
        };
        this.state.departureDate = moment(this.state.departureDate);
        this.state.returnDate = moment(this.state.returnDate);
        this.allowSubmit = this.allowSubmit.bind(this);
        this.startLoading = props.startLoading;
        this.finishLoading = props.finishLoading;
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.doStuff = this.doStuff.bind(this);
        async function fillDefault(whichAirport, state) {
            if(state[whichAirport]) {
                const url = `https://kiwiproxy.herokuapp.com/locations/id?id=${state[whichAirport]}`;
                const locationJson = await fetch(url);
                const locations = await locationJson.json();
                state[whichAirport] = locations.locations.filter(
                    x => x.code === state[whichAirport]
                )[0];
            }
        }
        async function fillDefaults(state, allowSubmit, doStuff) {
            await fillDefault('myAirport', state);
            await fillDefault('herAirport', state);
            if (allowSubmit()) doStuff();
        }
        fillDefaults(this.state, this.allowSubmit, this.doStuff);
    }

    handleChange = function(e) {
        this.setState({ [e.target.name]: e.target.value });
    }

    handleSubmit(event) {
        event.preventDefault();
    }

    allowSubmit() {
        return requiredParams.reduce(
            (tot, par) => tot && !!this.state[par],
            true
        ) && !this.props.loading;
    }

    async doStuff() {
        this.startLoading();
        this.props.clearCandidates();
        this.props.history.push(
            `/${this.state.myAirport.id}/` +
            `${this.state.herAirport.id}/` +
            `${this.state.departureDate.format('YYYY-MM-DD')}/` +
            `${this.state.returnDate.format('YYYY-MM-DD')}/` +
            (this.state.destinationAirport && this.state.destinationAirport.id ? `${this.state.destinationAirport.id}` : '')
        );
        const newCandidates = await getFares(this.state);
        this.props.addCandidates(newCandidates);
        this.finishLoading();
    }

    renderInput = input => input.name;

    render() {
        return (
            <form onSubmit={this.handleSubmit} >
                <Grid container spacing={2}>
                    <Grid item sm={6} md={3} xl={2}>
                        <MuiPickersUtilsProvider name="departureDate" utils={MomentUtils}>
                            <DatePicker
                                required
                                variant="inline"
                                label="Departure"
                                value={this.state.departureDate}
                                inputVariant="outlined"
                                onChange={d => this.setState({departureDate: d})}
                            />
                            </MuiPickersUtilsProvider>
                    </Grid>
                    <Grid item sm={6} md={3} xl={2}>
                        <MuiPickersUtilsProvider name="returnDate" utils={MomentUtils}>
                            <DatePicker
                                required
                                variant="inline"
                                label="Return"
                                value={this.state.returnDate}
                                inputVariant="outlined"
                                onChange={d => this.setState({returnDate: d})}
                            />
                            </MuiPickersUtilsProvider>
                    </Grid>
                    <Grid item sm={6} md={3} xl={2}>
                        <AirportSelector
                            startLoading={this.startLoading}
                            finishLoading={this.finishLoading}
                            required
                            id="myAirport"
                            name="myAirport"
                            value={this.state.myAirport}
                            onChange={this.handleChange}
                            label="Your origin"
                            renderInput={this.renderInput}
                        />
                    </Grid>
                    <Grid item sm={6} md={3} xl={2}>
                        <AirportSelector
                            startLoading={this.startLoading}
                            finishLoading={this.finishLoading}
                            required
                            id="herAirport"
                            name="herAirport"
                            value={this.state.herAirport}
                            onChange={this.handleChange}
                            label="Their origin"
                            renderInput={this.renderInput}
                        />
                    </Grid>
                    <Grid item sm={6} md={3} xl={2}>
                        <AirportSelector
                            startLoading={this.startLoading}
                            finishLoading={this.finishLoading}
                            id="destinationAirport"
                            name="destinationAirport"
                            value={this.state.destinationAirport}
                            onChange={this.handleChange}
                            label="Destination"
                            renderInput={this.renderInput}
                        />
                    </Grid>
                    <Grid item sm={6} md={3} xl={2}>
                        <Button variant="contained" color="primary" disabled={!this.allowSubmit()} onClick={this.doStuff}>Search</Button>
                    </Grid>
                </Grid>
                
            </form>
        );
    }
}

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
    return (await (await fetch(fareURL)).json()).data;
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
    myFares.forEach(
        function(myFare) {
            herFares.forEach(
                function(herFare){
                    maybeAdd(myFare, herFare);
                }
            );
        }
    );
    return candidates;
}

export default withRouter(Form)
