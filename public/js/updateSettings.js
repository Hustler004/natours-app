/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';

//type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  //   console.log(email, name);
  const url =
    type === 'password'
      ? '/api/v2/users/updateMyPassword'
      : '/api/v2/users/updateMe';
  try {
    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });
    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully!`);
      window.setTimeout(() => {
        location.reload();
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
