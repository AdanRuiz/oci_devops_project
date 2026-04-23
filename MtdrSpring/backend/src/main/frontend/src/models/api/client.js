import axios from 'axios';

const client = axios.create({
    headers: { 'Content-Type': 'application/json' },
});

export function setAuthToken(token) {
    if (token) {
        client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete client.defaults.headers.common['Authorization'];
    }
}

export default client;
