const https = require('https');

const GOOGLE_MAPS_API_KEY = 'AIzaSyDWxOhWt1lSkGDjyHmr0omVFMdWp7myzw';

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const { origin, destination } = JSON.parse(event.body);

        if (!origin || !destination) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Origin and destination are required' })
            };
        }

        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&units=imperial&key=${GOOGLE_MAPS_API_KEY}`;

        const data = await new Promise((resolve, reject) => {
            https.get(url, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(body));
                    } catch (e) {
                        reject(e);
                    }
                });
            }).on('error', reject);
        });

        if (data.status !== 'OK' || !data.rows || !data.rows[0] || !data.rows[0].elements || !data.rows[0].elements[0]) {
            return {
                statusCode: 500,
                body: JSON.stringify({ 
                    error: 'Google Maps API error',
                    details: data.status 
                })
            };
        }

        const element = data.rows[0].elements[0];

        if (element.status !== 'OK') {
            return {
                statusCode: 500,
                body: JSON.stringify({ 
                    error: 'Cannot calculate distance',
                    details: element.status 
                })
            };
        }

        const distance = element.distance.text;
        const duration = element.duration.text;

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify({
                distance: distance,
                duration: duration,
                success: true
            })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message 
            })
        };
    }
};
