require('dotenv').config()
const express = require('express')

const app = express()

const port = 3000
//servers listens at port

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/twitter', (req, res) => {
    res.send('isha8')
  })
  
app.get('/login', (req, res) => {
    res.send('<H1>Please Login to Get access</H1>')
})
  

app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${port}`)
})