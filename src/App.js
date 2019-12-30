import moment from "moment";
import React from 'react';
import './App.css';
import Form from './Form.js';
import ResultsTable from './ResultsTable.js';

// for tabulator
window.moment = moment;
moment.updateLocale('en', {
  week: {
    dow: 1,
  },
})

const candidates = [];

function App() {
    const [loading, setLoading] = React.useState(false);

    return (
        <div>
            <Form candidates={candidates} setLoading={setLoading}/>
             <Loading id="loading" loading={loading}/>
            <ResultsTable candidates={candidates}/>
        </div>
  );
}

function Loading(props) {
    return <div id={props.id}>{props.loading ? '✈' : ''}</div>;
}

function parseDuration(s) {
    const parts = s.split(' ');
    const numberPart = parts[0] === 'a' || parts[0] === 'an' ? 1 : parseInt(parts[0]);
    const unitPart =  parts[1][parts[1].length -1] === 's' ? parts[1] : parts[1] + 's';
    return moment.duration(numberPart, unitPart);
}

export default App;
