import axios from "axios";

export const axiosInstance = axios.create({
  withCredentials: true,  // Ye backend ke sath match hona chahiye
});

export const apiConnector = async (method, url, bodyData, headers, params) => {
  try {
    const response = await axiosInstance({
      method: method,
      url: url,
      data: bodyData || null,
      headers: headers || {},
      params: params || null,  withCredentials: true,
    });
    return response; // ye correct h

  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};
// import axios from "axios";

// // Create an axios instance
// export const axiosInstance = axios.create({
//   withCredentials: true, // Ensure that cookies (if any) are sent with requests
// });

// // API connector function
// export const apiConnector = async (method, url, bodyData, headers = {}, params = {}) => {
//   try {
//     // Add the Authorization token to the headers dynamically
//     const token = localStorage.getItem('token'); // Get token from localStorage
//     if (token) {
//       headers['Authorization'] = `Bearer ${token}`; // Add the token to headers if it exists
//     }

//     // Make the request
//     const response = await axiosInstance({
//       method: method,
//       url: url,
//       data: bodyData || null,
//       headers: headers, // Use the dynamic headers
//       params: params || null,
//       withCredentials: true, // Include credentials (cookies, etc.) if necessary
//     });

//     return response; // Return the response data

//   } catch (error) {
//     // Enhanced error logging
//     console.error("API Error: ", error.message || error);

//     if (error.response) {
//       // The server responded with an error status
//       console.error("Response Error: ", error.response.data);
//       console.error("Response Status: ", error.response.status);
//     } else if (error.request) {
//       // The request was made but no response was received
//       console.error("Request Error: ", error.request);
//     } else {
//       // Some other error (e.g., misconfiguration)
//       console.error("General Error: ", error.message);
//     }

//     throw error; // Throw error to be handled elsewhere
//   }
// };
