import getFares from './flightsearch.js';
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

const requiredParams = ['departureDate', 'returnDate', 'yourOrigin', 'theirOrigin'];

async function fillDefault(whichAirport, state) {
    if(state[whichAirport]) {
        const url = `https://kiwiproxy.herokuapp.com/locations/id?id=${state[whichAirport]}`;
        const locationJson = await fetch(url);
        const locations = await locationJson.json();
        state[whichAirport] = locations.locations.filter(
            x => x.id === state[whichAirport]
        )[0];
    }
}

class Form extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            departureDate: nextThursday(),
            returnDate: nextThursday().add(4, 'days'),
            destination: "",
            ...props.query
        };
        
        this.state.departureDate = moment(this.state.departureDate);
        this.state.returnDate = moment(this.state.returnDate);
        this.allowSubmit = this.allowSubmit.bind(this);
        this.startLoading = props.startLoading;
        this.finishLoading = props.finishLoading;
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.doStuff = this.doStuff.bind(this);
        //this.componentDidUpdate = this.componentDidUpdate.bind(this);
        this.setDepartureDate = this.setDepartureDate.bind(this);
        async function fillDefaults(state, allowSubmit, doStuff) {
            await fillDefault('yourOrigin', state);
            await fillDefault('theirOrigin', state);
            await fillDefault('destination', state);
            if (allowSubmit()) doStuff();
        }
        fillDefaults(this.state, this.allowSubmit, this.doStuff);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const setState = this.setState.bind(this)
        const oldMatch = prevProps.query;
        const newMatch = this.props.query;
        if(newMatch.returnDate !== oldMatch.returnDate) {
            this.setState({returnDate: moment(newMatch.returnDate)});
        }
        if(newMatch.dateFlexibility !== oldMatch.dateFlexibility) {
            this.setState({dateFlexibility: newMatch.dateFlexibility});
        }
        if(newMatch.departureDate !== oldMatch.departureDate) this.setDepartureDate(newMatch.departureDate);
        async function setAirport(which)  {
            if(newMatch[which] !== oldMatch[which]) {
                const newState = {};
                newState[which] = newMatch[which];
                await fillDefault(which, newState);
                setState(newState);
            }
        }
        setAirport('yourOrigin');
        setAirport('theirOrigin');
        setAirport('destination');
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

    setDepartureDate(newDate) {
        if(newDate > this.state.returnDate) {
            this.setState({
                returnDate: moment(this.state.returnDate + (newDate - this.state.departureDate))
            });
        }
        this.setState({departureDate: moment(newDate)});
    }

    async doStuff() {
        this.startLoading();
        this.props.clearCandidates();
        this.props.setQuery({
            yourOrigin: this.state.yourOrigin.id,
            theirOrigin: this.state.theirOrigin.id,
            destination: this.state.destination ? this.state.destination.id : undefined,
            departureDate: this.state.departureDate.toDate(),
            returnDate: this.state.returnDate.toDate()
        });
        for await (const fares of await getFares(this.state)) this.props.addCandidates(fares);
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
                                disablePast
                                variant="inline"
                                label="Departure"
                                value={this.state.departureDate}
                                inputVariant="outlined"
                                onChange={this.setDepartureDate}
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
                                minDate={this.state.departureDate}
                            />
                            </MuiPickersUtilsProvider>
                    </Grid>
                    <Grid item sm={6} md={3} xl={2}>
                        <AirportSelector
                            startLoading={this.startLoading}
                            finishLoading={this.finishLoading}
                            required
                            id="yourOrigin"
                            name="yourOrigin"
                            value={this.state.yourOrigin}
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
                            id="theirOrigin"
                            name="theirOrigin"
                            value={this.state.theirOrigin}
                            onChange={this.handleChange}
                            label="Their origin"
                            renderInput={this.renderInput}
                        />
                    </Grid>
                    <Grid item sm={6} md={3} xl={2}>
                        <AirportSelector
                            startLoading={this.startLoading}
                            finishLoading={this.finishLoading}
                            id="destination"
                            name="destination"
                            value={this.state.destination}
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

export default Form
