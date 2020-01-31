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

class Form extends React.Component {
    constructor(props) {
        super(props);
        this.allowSubmit = this.allowSubmit.bind(this);
        this.startLoading = props.startLoading;
        this.finishLoading = props.finishLoading;
        this.handleSubmit = this.handleSubmit.bind(this);
        this.doStuff = this.doStuff.bind(this);
        this.setDepartureDate = this.setDepartureDate.bind(this);
    }

    handleSubmit(event) {
        event.preventDefault();
    }

    allowSubmit() {
        return requiredParams.reduce(
            (tot, par) => tot && !!this.props.query[par],
            true
        ) && !this.props.loading;
    }

    setDepartureDate(newDate) {
        if(newDate > this.props.query.returnDate) {
            this.props.setQuery({
                returnDate: moment(this.props.query.returnDate + (newDate - this.props.query.departureDate))
            });
        }
        this.props.setQuery({departureDate: moment(newDate)});
    }

    async doStuff() {
        this.startLoading();
        this.props.clearFlights();
        for await (const fares of await getFares(this.props.query)) this.props.addFlights(fares);
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
                                value={this.props.query.departureDate}
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
                                value={this.props.query.returnDate}
                                inputVariant="outlined"
                                onChange={d => this.props.setQuery({returnDate: d})}
                                minDate={this.props.query.departureDate}
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
                            value={this.props.query.yourOrigin}
                            onChange={this.props.setQuery}
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
                            value={this.props.query.theirOrigin}
                            onChange={this.props.setQuery}
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
                            value={this.props.query.destination}
                            onChange={this.props.setQuery}
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
