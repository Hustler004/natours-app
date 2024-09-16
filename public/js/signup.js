/*eslint-disable*/

import axios from 'axios';
import { showAlert } from './alert';

// export const signup = async (user) => {
//   try {
//     const res = await axios({
//       method: 'POST',
//       url: `http://127.0.0.1:3000/api/v2/users/signup`,
//       data: {
//         name: user.name,
//         email: user.email,
//         password: user.password,
//         passwordConfirmed: user.passwordConfirmed,
//       },
//     });
//     console.log('res');
//     if (res.data.status === 'success') {
//       console.log('success');
//       showAlert('success', 'Welcome to the community!');
//       window.setTimeout(() => {
//         location.assign('/');
//       }, 1500);
//     }
//   } catch (err) {
//     console.log(err);
//     showAlert('error', err.response.data.message);
//   }
// };

export const signup = async (user) => {
  try {
    const res = await axios({
      method: 'POST',
      url: `/api/v2/users/signup`,
      data: {
        name: user.name,
        email: user.email,
        password: user.password,
        passwordConfirmed: user.passwordConfirmed,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Welcome to the community!');

      window.setTimeout(() => {
        location.assign('/'); // Attempt to redirect to homepage
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
