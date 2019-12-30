import moment from "moment";
import React from 'react';
import 'react-tabulator/lib/styles.css';
import 'react-tabulator/lib/css/tabulator.min.css';
import { ReactTabulator } from 'react-tabulator';

export default function ResultsTable(props) {
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
        <ReactTabulator
            data={props.candidates}
            columns={columns}
            options={{
                height:"100%",
                layout:"fitColumns",
                reactiveData:true,
            }}
        />
  );
}

function parseDuration(s) {
    const parts = s.split(' ');
    const numberPart = parts[0] === 'a' || parts[0] === 'an' ? 1 : parseInt(parts[0]);
    const unitPart =  parts[1][parts[1].length -1] === 's' ? parts[1] : parts[1] + 's';
    return moment.duration(numberPart, unitPart);
}
