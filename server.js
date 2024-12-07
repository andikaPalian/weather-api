const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const redis = require("redis");
dotenv.config();

const app = express();
const port = 8000;
// Ambil API Key dan TTL(Time To Live) cache dari env variable
const API_KEY = process.env.API_KEY;
const CACHE_TTL = process.env.CACHE_TTL;

// Konfigurasi Redis
const redisClient = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
});

redisClient.on("error", (error) => {
    console.error(`redis error ${error}`);
});

app.use(express.json());

// Endpoint untuk mendapatkan data cuaca
app.get("/api/weather", async (req, res) => {
    const {location} = req.query;
    if (!location) {
        return res.status(400).json({message: 'Please provide a location'});
    };
    try {
        // Cek cache di Redis
        redisClient.get(location, async (error, cacheData) => {
            if (error) {
                console.error(`redis error ${error}`);
                return res.status(500).json({message: "redis error"});
            };
            if (cacheData) {
                // Jika ada data di cache, kembalikan data tersebut
                return res.status(200).json({source: "cache", data: JSON.parse(cacheData)});
            }
        })
        // Jika tidak ada di cache, ambil data dari API
        const url = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(location)}&aqi=no`;
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
        // Simpan data ke Redis
        redisClient.setEx(location, CACHE_TTL, JSON.stringify(data));
        // Kirim response ke user
        res.status(200).json({source: "api", data});
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "error fetching data", error});
    }
})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});