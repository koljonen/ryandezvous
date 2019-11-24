import moment from "moment";
import $ from "jquery";
import React from 'react';
import 'react-tabulator/lib/styles.css';
import 'react-tabulator/lib/css/tabulator.min.css';
import { ReactTabulator } from 'react-tabulator';
import Autosuggest from 'react-autosuggest';
import logo from './logo.svg';
import './App.css';

// for tabulator
window.moment = moment;

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

const flightsTemplate = 'https://kiwiproxy.herokuapp.com/v2/search?fly_from=<airport>&dateFrom=<outDateFrom>&dateTo=<outDateTo>&returnFrom=<inDateFrom>&returnTo=<inDateTo>&curr=EUR&ret_from_diff_airport=0';

function daysInTheFuture(howMany) {
    var futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + howMany);
    return futureDate.toISOString().split('T')[0];
}

function getSuggestionValue(suggestion) {
    return suggestion.code;
}

function renderSuggestion(suggestion) {
    return (
        <span>{suggestion.code} {suggestion.name}</span>
    );
}

class AirportSelector extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            value: '',
            suggestions: [],
            isLoading: false
        };
        this.lastRequestId = null;
    }

    onChange = (event, { newValue }) => {
        this.setState({
            value: newValue
        });
        this.props.onChange({
            target:{
                name:[this.props.name],
                value:newValue
            }
        });
    };

    onSuggestionsFetchRequested = ({ value }) => {
        this.loadSuggestions(value);
    };

    onSuggestionsClearRequested = () => {
        this.setState({
            suggestions: []
        });
    };
  
    async loadSuggestions(value) {
        // Cancel the previous request
        if (this.lastRequestId !== null) {
            clearTimeout(this.lastRequestId);
        }
        
        this.setState({
            isLoading: true
        });
        const locationJson = await fetch('http://kiwiproxy.herokuapp.com//locations/query?term=' + value);
        const locations = await locationJson.json();
        this.setState({
            isLoading: false,
            suggestions: locations.locations
        });
    }

    render() {
        const { value, suggestions, isLoading } = this.state;
        const inputProps = {
            placeholder: this.props.placeholder,
            value,
            onChange: this.onChange
        };
        return (
            <Autosuggest 
            suggestions={suggestions}
            onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
            onSuggestionsClearRequested={this.onSuggestionsClearRequested}
            getSuggestionValue={getSuggestionValue}
            renderSuggestion={renderSuggestion}
            inputProps={inputProps} />
        );
    }
}

class Form extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            departureDateFrom: daysInTheFuture(5),
            departureDateTo: daysInTheFuture(6),
            returnDateFrom: daysInTheFuture(9),
            returnDateTo: daysInTheFuture(10),
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
        const maxDiffHours = 72;
        await getFares(this.state.myAirport, this.state.herAirport, maxDiffHours, candidates, this.state.departureDateFrom, this.state.departureDateTo, this.state.returnDateFrom, this.state.returnDateTo);
        console.log(candidates);
        endLoading();
    }

    render() {
        return (
            <form onSubmit={this.handleSubmit} >
                <label>
                    Departure:
                    <input type="date" value={this.state.departureDateFrom} name="departureDateFrom" onChange={this.handleChange} />
                </label>
                <label>
                     –
                    <input type="date" value={this.state.departureDateTo} name="departureDateTo" onChange={this.handleChange} />
                </label>
                <label>
                    Return:
                    <input type="date" value={this.state.returnDateFrom} name="returnDateFrom" onChange={this.handleChange} />
                </label>
                <label>
                     –
                    <input type="date" value={this.state.returnDateTo} name="returnDateTo" onChange={this.handleChange} />
                </label>
                <AirportSelector name="myAirport" value={this.state.myAirport} onChange={this.handleChange} placeholder="Your origin"/>
                <AirportSelector name="herAirport" value={this.state.herAirport} onChange={this.handleChange} placeholder="Their origin"/>
                <input type="submit" value="Submit" onClick={this.doStuff}/>
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
    return date.split('-').reverse().join('/');
}

async function getFaresFromAirport(airport, fares, departureDateFrom, departureDateTo, returnDateFrom, returnDateTo) {
    const fareURL = flightsTemplate.replace(
        '<airport>', airport
    ).replace(
        '<outDateFrom>', formatKiwiDate(departureDateFrom)
    ).replace(
        '<outDateTo>', formatKiwiDate(departureDateTo)
    ).replace(
        '<inDateFrom>', formatKiwiDate(returnDateFrom)
    ).replace(
        '<inDateTo>', formatKiwiDate(returnDateTo)
    );
    await $.getJSON(
        fareURL,
        function(result) {
            (result.data || []).forEach(function(fare) {
                fares.push(fare);
            });
        }
    );
}

async function getFares(myAirport, herAirport, maxDiffHours, candidates, departureDateFrom, departureDateTo, returnDateFrom, returnDateTo) {
    var maybeAdd = function(myFare, herFare) {
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
            myReturnDate: myFare.route[myFare.route.length - 1].local_departure,
            herReturnDate: herFare.route[herFare.route.length - 1].local_departure,
            price: myFare.price + herFare.price,
            timeApart: moment.duration(msApart),
            timeTogether: moment.duration(msTogether),
            myLink: myFare.deep_link,
            herLink: herFare.deep_link
        });
    };

    const myFares = [];
    const herFares = [];
    await getFaresFromAirport(myAirport, myFares, departureDateFrom, departureDateTo, returnDateFrom, returnDateTo);
    await getFaresFromAirport(herAirport, herFares, departureDateFrom, departureDateTo, returnDateFrom, returnDateTo);
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
