import React from 'react';

function DataRow(props){

    return <tr>
            <td>
                {props.fname}
            </td>
            <td>
                {props.lname}
            </td>
            <td>
               {props.email}
            </td>
            <td>
                {props.phone}
            </td>
            <td>
                {props.address}
            </td>
        </tr>
}

export default DataRow