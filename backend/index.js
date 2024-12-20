import express from 'express';
//module js syntax ->  "type": "module",
const app = express();

app.get('/', (req,res) =>{
    res.send('server is ready');
});
//get a list of 5 jokes

app.get('/api/jokes', (req,res) =>{
    const jokes = ["isha", "isha Singh"];
    res.send(jokes);
});

const port = process.env.PORT || 3000;

app.listen( port , () => {
    console.log(`server is at http://localhost:${port}`);
});