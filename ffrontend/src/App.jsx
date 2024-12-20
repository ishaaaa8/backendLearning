import { useEffect, useState } from 'react'
import './App.css'
import axios from "axios"
function App() {
  const [jokes , setJokes] = useState([]);
  //we want as the application loads ... the entire data from api gets come into jokes and then rendered on frontend

  useEffect(() => {
    axios.get('/api/jokes')
    .then((res) => {
      setJokes(res.data)
    })
    .catch((err) => {
      console.log(err)
    })
  })
  return (
    <>
      <h1>
        We are learning full stack with isha
      </h1>
      <p> Jokes: {jokes.length}</p>
      {
        jokes.map( (joke , index) => (
          <div key = {joke.id}>
            <h3>{joke}</h3>
          </div>
        ))
      }

    </>
  )
}

export default App
