import React,{useState,useEffect} from 'react';
import './App.css';
import { Container, Col,Form,Table,Row } from 'react-bootstrap';
import Datarow from './DataRow'

function App() {

//   let datarw=[{fname:'abcd',lname:'cccc',email:'abc@email.com',phone:'1234567',address:'34, test city,CA,USA'},
//   {fname:'name1',lname:'user',email:'email2@abc.com',phone:'234567',address:'99,our city,TX,USA'}]

  const [contctRw,setContacts]=useState([])
  useEffect(() => {
    const apiurl='/allcontacts'
    fetch(apiurl).then((out)=>{
      return out.json()
    }).then((datajsonout)=>{
        console.log(datajsonout)
        setContacts(datajsonout)
        // consol
        // datarw=[...datajsonout]
    })
    }, [contctRw])

  return (
    <div className="App">
      <Table hover borderless striped style={{position:'absolute',top:'100px'}}>
        <thead style={{backgroundColor:'#393e46',color:'white'}}>
                    <tr>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Email</th>
                        <th>Phone #</th>
                        <th>Address</th>
                    </tr>
        </thead>
        <tbody style={{backgroundColor:'#e8e4e1'}}>
              {contctRw.map((dta)=><Datarow fname={dta.firstname} lname={dta.lastname} email={dta.email} phone={dta.phone} address={dta.address}/>)}              
          </tbody>
      </Table>
    </div>
  );
}

export default App;
