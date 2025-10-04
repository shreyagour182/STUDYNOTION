import axios from "axios";

// 1. Determine the Base URL dynamically.
// Use the environment variable (e.g., http://localhost:4000/api/v1) for development,
// and fall back to the deployed URL for production builds if the variable is not set.
const BASE_URL = process.env.REACT_APP_BASE_URL
    ? process.env.REACT_APP_BASE_URL
    : "https://studynotion-z39s.onrender.com/api/v1"; // Added /api/v1 here for cleaner path concatenation

// Create Axios instance with global configurations
export const axiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

// Function to handle API requests dynamically
export const apiConnector = async (method, url, bodyData = null, headers = {}, params = null) => {
    // ************************************************
    // CRITICAL DIAGNOSTIC STEP: Log the final URL used
    // (This 'url' is the segment that is appended to the baseURL)
    // ************************************************
    console.log("Axios FINAL Base URL:", BASE_URL);
    console.log("Axios Request Segment:", url);

    try {
        const response = await axiosInstance({
            method: method,
            url: url,
            data: bodyData,
            headers: headers,
            params: params,
        });

        return response;
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
};
