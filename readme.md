# Natours App - Touring Website

## Introduction

The **Natours App** is a modern web application designed for travel enthusiasts to explore and book exciting tours around the world. This project showcases a full-stack web development approach using the **MERN** stack (MongoDB, Express, and Node.js), implementing **CRUD operations** (Create, Read, Update, Delete) for managing users, tours, and bookings.

## Features

- **Tour Listings**: Browse through a variety of tours and their details.
- **User Authentication**: Secure user registration, login, and logout functionality.
- **CRUD Operations**: 
  - **Users**: Create, update, and manage user profiles.
  - **Tours**: Admins can create, edit, and delete tour listings.
  - **Bookings**: Users can book tours and view their booking history.
- **Search & Filters**: Easily search for tours and apply filters by price, duration, or difficulty.
- **Responsive Design**: Fully optimized for desktop and mobile views.
  
## Technologies Used

The Natours App is built using the following technologies:

- **Node.js**: Server-side JavaScript runtime environment.
- **Express.js**: Fast and minimal Node.js web application framework.
- **MongoDB**: NoSQL database for storing tour, user, and booking data.
- **Mongoose**: Elegant MongoDB object modeling for Node.js.
- **JWT Authentication**: JSON Web Tokens for secure user authentication.
- **RESTful API**: Designed following REST architecture principles.
- **Pug Template Engine**: Server-side rendering for the user interface.
- **Deployment**: Deployed on **Render** for live access.

## Try the App

You can explore the live version of the Natours App at:  
[**https://natours-app-nlvn.onrender.com/**](https://natours-app-nlvn.onrender.com/)

## How to Run Locally

1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/natours-app.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add the necessary environment variables:
   ```bash
   NODE_ENV=development
   DATABASE=mongodb://localhost:27017/natours
   JWT_SECRET=your_secret_key
   JWT_EXPIRES_IN=90d
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and go to `http://localhost:3000` to access the app.

## API Documentation

The Natours App follows a RESTful API structure for interacting with tours, users, and bookings. You can find the API documentation under [**https://documenter.getpostman.com/view/36993076/2sAXjSy8Rz**](https://documenter.getpostman.com/view/36993076/2sAXjSy8Rz) for details on available routes and operations.



**Author**: Agam agarwal  
**License**: MIT

Enjoy your adventures with Natours! 🏞️
