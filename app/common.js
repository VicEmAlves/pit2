// common.js — shared helpers
const API_BASE_URL = 'https://vic-api-dgbma8eqbqcnegg3.brazilsouth-01.azurewebsites.net';

function apiUrl(path){ return API_BASE_URL + path; }

async function fetchJson(url, opts = {}){
  const defaultHeaders = { 'Content-Type': 'application/json' };
  opts.headers = Object.assign(defaultHeaders, opts.headers || {});
  const res = await fetch(url, opts);
  return res;
}

function requireAuth(){
  const userId = sessionStorage.getItem('userId');
  if(!userId){
    window.location.href = 'index.html';
    return null;
  }
  return userId;
}

function formatRange(min, max){ return `${min} - ${max}`; }