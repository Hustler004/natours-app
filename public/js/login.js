/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';

export const login = async (email, password) => {
  // console.log(email, password);
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v2/users/login',
      data: {
        email,
        password,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }

    console.log(res);
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v2/users/logout',
    });
    if (res.data.status === 'success') {
      // location.reload(true); //this will force to reload it from the server not the cache so that the same page is not reloaded again
      location.href = '/';
    }
  } catch (err) {
    showAlert('error', 'Error logging out! Try again.');
  }
};
