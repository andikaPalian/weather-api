const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const app = express();

const port = 8000;
dotenv.config();
const API_KEY = process.env.API_KEY;

app.get("/api/weather", async (req, res) => {
    const {location} = req.query;
    if (!location) {
        return res.status(400).json({message: 'Please provide a location'});
    };
    const url = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(location)}&aqi=no`;
    try {
        const response = await axios.get(url);
        const data = {
            location: response.data.location.name,
            region: response.data.location.region,
            country: response.data.location.country,
            temperature: response.data.current.temp_c,
            feels_like: response.data.current.feelslike_c,
            condition: response.data.current.condition.text,
            wind_speed: response.data.current.wind_kph,
            humidity: response.data.current.humidity,
        };
        res.status(200).json({data});
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "error fetching data", error});
    }
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});