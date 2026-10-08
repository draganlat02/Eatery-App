import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:8000/api', // Tvoj backend URL
});

// Presretač koji uzima token iz localStorage-a i stavlja ga u svaki zahtjev
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);
// POST: Dodavanje nove recenzije
export const dodajRecenziju = async (dto) => {
  const response = await API.post('/recenzije', dto);
  return response.data;
};

// GET: Prosječna ocjena restorana (Javni poziv)
export const getOcjenaRestorana = async (idRestorana) => {
  const response = await API.get(`/recenzije/restoran/${idRestorana}/ocjena`);
  return response.data;
};

// GET: Provjera da li je narudžba već ocjenjena
export const jeOcjenjenaNarudzba = async (idNarudzbe) => {
  const response = await API.get(`/recenzije/provjeri/${idNarudzbe}`);
  return response.data;
};

// GET: Ocjena za ulogovani restoran
export const getMojaOcjena = async () => {
  const response = await API.get('/recenzije/moja-ocjena');
  return response.data;
};

export default API;