import buildUrl from 'build-url';
import Grid from '@material-ui/core/Grid';
import {
  MuiPickersUtilsProvider,
  DatePicker
} from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import moment from "moment";
import $ from "jquery";
import Button from '@material-ui/core/Button';
import React from 'react';
import 'react-tabulator/lib/styles.css';
import 'react-tabulator/lib/css/tabulator.min.css';
import { ReactTabulator } from 'react-tabulator';
import './App.css';
import AirportSelector from './AirportSelector.js';

// for tabulator
window.moment = moment;
moment.updateLocale('en', {
  week: {
    dow: 1,
  },
})

const candidates = [];

function App() {
    const columns = [
        {
            title: "Price",
            field: "price",
            formatter: "money",
            formatterParams: {
                symbol: "€",
                precision: 0
            },
            headerFilter: true,
            headerFilterFunc: (headerValue, rowValue) => headerValue >= rowValue,
        },
        {
            title: "Destination",
            field: "destination",
            headerFilter: true
        },
        {
            title: "You",
            columns: [
                {
                    title: "Arrival",
                    field: "myArrivalDate",
                    align: "center",
                    formatter:"datetime",
                    formatterParams: {
                        outputFormat:"ddd DD MMM HH:mm"
                    },
                },
                {
                    title: "Return",
                    field: "myReturnDate",
                    align: "center",
                    formatter:"datetime",
                    formatterParams: {
                        outputFormat:"ddd DD MMM HH:mm"
                    },
                },
                {
                    title: "Link",
                    field: "myLink",
                    formatter:"link",
                    formatterParams: {
                        label: "Buy",
                        target: "_blank",
                    }
                },
            ]
        },
        {
            title: "Them",
            columns: [
                {
                    title: "Arrival",
                    field: "herArrivalDate",
                    align: "center",
                    formatter:"datetime",
                    formatterParams: {
                        outputFormat:"ddd DD MMM HH:mm"
                    },
                },
                {
                    title: "Return",
                    field: "herReturnDate",
                    align: "center",
                    formatter:"datetime",
                    formatterParams: {
                        outputFormat:"ddd DD MMM HH:mm"
                    },
                },
                {
                    title: "Link",
                    field: "herLink",
                    formatter:"link",
                    formatterParams: {
                        label: "Buy",
                        target: "_blank",
                    }
                },
            ]
        },
        {
            title: "Together",
            field: "timeTogether",
            formatter: function(cell, formatterParams, onRendered){
                return cell.getValue().humanize();
            },
            headerFilter: true,
            headerFilterFunc: (headerValue, rowValue) => parseDuration(headerValue) <= rowValue,
        },
        {
            title: "Apart",
            field: "timeApart",
            formatter: function(cell, formatterParams, onRendered){
                return cell.getValue().humanize();
            },
            headerFilter: true,
            headerFilterFunc: (headerValue, rowValue) => parseDuration(headerValue) >= rowValue,
        },
    ];
    return (
        <div>
            <Form />
             <div id="loading">✈</div>
            <ReactTabulator
                data={candidates}
                columns={columns}
                options={{
                    height:"100%",
                    layout:"fitColumns",
                    reactiveData:true,
                }}
            />
        </div>
  );
}

export default App;

function daysInTheFuture(howMany) {
    var futureDate = new Date();
    return moment(futureDate.setDate(futureDate.getDate() + howMany));
}

class Form extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            departureDateFrom: daysInTheFuture(5),
            departureDateTo: daysInTheFuture(6),
            returnDateFrom: daysInTheFuture(9),
            returnDateTo: daysInTheFuture(10),
            myAirport: {code:"MLA", name:"Malta"},
            herAirport: {code:"FRA", name:"Frankfurt"},
            destinationAirport: {}
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.doStuff = this.doStuff.bind(this);
    }

    handleChange = function(e) {
        this.setState({ [e.target.name]: e.target.value });
    }

    handleSubmit(event) {
        event.preventDefault();
    }

    async doStuff() {
        await startLoading();
        await getFares(this.state);
        endLoading();
    }

    renderInput = input => input.name;

    render() {
        return (
            <form onSubmit={this.handleSubmit} >
                <Grid container spacing={2}>
                    <Grid item sm={6} md={3} xl={2}>
                        <MuiPickersUtilsProvider name="departureDateFrom" utils={MomentUtils}>
                            <DatePicker required variant="inline" label="Departure from" value={this.state.departureDateFrom} inputVariant="outlined" onChange={d => this.setState({departureDateFrom: d})}/>
                            </MuiPickersUtilsProvider>
                    </Grid>
                    <Grid item sm={6} md={3} xl={2}>
                        <MuiPickersUtilsProvider name="departureDateTo" utils={MomentUtils}>
                            <DatePicker required variant="inline" label="to" value={this.state.departureDateTo} inputVariant="outlined" onChange={d => this.setState({departureDateTo: d})}/>
                            </MuiPickersUtilsProvider>
                    </Grid>
                    <Grid item sm={6} md={3} xl={2}>
                        <MuiPickersUtilsProvider name="returnDateFrom" utils={MomentUtils}>
                            <DatePicker required variant="inline" label="Return from" value={this.state.returnDateFrom} inputVariant="outlined" onChange={d => this.setState({returnDateFrom: d})}/>
                            </MuiPickersUtilsProvider>
                    </Grid>
                    <Grid item sm={6} md={3} xl={2}>
                        <MuiPickersUtilsProvider name="returnDateTo" utils={MomentUtils}>
                            <DatePicker required variant="inline" label="to" value={this.state.returnDateTo} inputVariant="outlined" onChange={d => this.setState({returnDateTo: d})}/>
                            </MuiPickersUtilsProvider>
                    </Grid>
                    <Grid item sm={6} md={3} xl={2}>
                        <AirportSelector
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
                            id="destinationAirport"
                            name="destinationAirport"
                            value={this.state.destinationAirport}
                            onChange={this.handleChange}
                            label="Destination"
                            renderInput={this.renderInput}
                        />
                    </Grid>
                    <Grid item sm={6} md={3} xl={2}>
                        <Button variant="contained" color="primary" onClick={this.doStuff}>Search</Button>
                    </Grid>
                </Grid>
                
            </form>
        );
    }
}

async function startLoading() {
    $("#loading").show();
}

async function endLoading() {
    $("#loading").hide();
}

function formatKiwiDate(date) {
    return date.format('DD/MM/YYYY');
}

async function getFaresFromAirport(airport, state) {
    const fares = [];
    const fareURL = buildUrl(
        'https://kiwiproxy.herokuapp.com',
        {
            path: "v2/search",
            queryParams: {
                fly_from: airport.code,
                dateFrom: formatKiwiDate(state.departureDateFrom),
                dateTo: formatKiwiDate(state.departureDateTo),
                returnFrom: formatKiwiDate(state.returnDateFrom),
                returnTo: formatKiwiDate(state.returnDateTo),
                curr: 'EUR',
                ret_from_diff_airport: 0,
                fly_to: state.destinationAirport.code,
                max_stopovers: 0
            }
        }
    ).replace(/%2F/g, '/');
    await $.getJSON(
        fareURL,
        function(result) {
            (result.data || []).forEach(function(fare) {
                fares.push(fare);
            });
        }
    );
    return fares;
}

async function getFares(state) {
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
}

function parseDuration(s) {
    const parts = s.split(' ');
    const numberPart = parts[0] === 'a' || parts[0] === 'an' ? 1 : parseInt(parts[0]);
    const unitPart =  parts[1][parts[1].length -1] === 's' ? parts[1] : parts[1] + 's';
    return moment.duration(numberPart, unitPart);
}
