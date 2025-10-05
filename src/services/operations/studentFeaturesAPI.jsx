// FOR BUYING :-
/*
  1. Load the script
  2. To open modal -> create Option object
  3. Option object succefull hogya tho -> handle vala function call hojayega
  4. IF Payment successful => send mail
*/

import { apiConnector } from "../apiconnector";
import { studentEndpoints } from "../apis";
import {toast} from "react-hot-toast";
import rzplogo from "../../assets/Logo/Logo-Full-Dark.png";
import {setPaymentLoading} from "../../slices/courseSlice";
import {resetCart} from "../../slices/cartSlice"

// NOTE: Please replace "rzp_test_YourPublicKeyHere" with your actual Razorpay Key ID.
// For production, this should ideally be loaded from a public environment variable (e.g., process.env.REACT_APP_RAZORPAY_KEY_ID).
const RAZORPAY_KEY = "rzp_test_RPf7cDwOtAggUP";

const {COURSE_PAYMENT_API ,SEND_PAYMENT_SUCCESS_EMAIL_API ,COURSE_VERIFY_API } = studentEndpoints;

// 1)
function loadScript(src){
    // ek promise create krdo => ek promise ya tho resolve hota h ya fir reject => agr resolve hogya tho handler function call krdo
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;

        script.onload = () => { resolve(true); }
        script.onerror = () => { resolve(false); }

        document.body.appendChild(script);
    })
}

// 2)
export async function buyCourse(token , courses , userDetails , navigate , dispatch ) {
    const toastId = toast.loading("Loading Payment Gateway...");
    try{
        // before buying:-
          // load the script
        const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");

        if(!res){
            toast.error("Razorpay SDK failed to load");
            return;
        }

        console.log("User Details:", userDetails);
        console.log("Auth Token:", token);

        //initialize order : ye krne k liye backend call krdiya h
        //capture payment
        const orderResponse = await apiConnector("POST" , COURSE_PAYMENT_API ,
                                   {courses} ,
                                {
                                    Authorization: `Bearer ${token}`,
                                });

         console.log("ORDER RESPONSE:", orderResponse.data);

        if(!orderResponse.data.success){
              throw new Error(orderResponse.data.message)
         }
         console.log("PAYMENT RESPONSE FROM BACKEND............", orderResponse.data)

          // **Ensure user details exist**
        if (!userDetails || !userDetails.firstName || !userDetails.email) {
            throw new Error("Invalid user details");
        }
         toast.dismiss(toastId); // Dismiss loading toast before opening Razorpay

         //options
         const options = {
            key: RAZORPAY_KEY, // ⬅️ ✅ FIXED: Now using the key defined at the top
            currency: orderResponse.data.data.currency,
            amount: `${orderResponse.data.data.amount}`,
            order_id: orderResponse.data.data.id,
            name:"StudyNotion",
            description:"Thank You for purachasing the Course",
            image:rzplogo,
            prefill:{
                  name:`${userDetails.firstName} ${userDetails.lastName}`,
                  email:userDetails.email,
            },
            handler: function(response){  // agr payment successfull hogyi tho ye 2 functions run hotey h
                // send successful mail
                   sendPaymentSuccessEmail(response , orderResponse.data.data.amount , token);

                //verify payment krlo
                 verifyPayment({...response , courses} , token , navigate , dispatch);
            }
         }
         const paymentObject = new window.Razorpay(options);
         paymentObject.open();
         paymentObject.on("payment failed"  , function(response){
            toast.error("oops , payment failed");
            console.log("PAYMENT FAILED ERROR:", response.error);
         })
    }
    catch(error){
      toast.dismiss(toastId);
      console.log("PAYMENT API ERROR....." , error);
      toast.error("could not make paymet");
    }
}

//operation me vo fucntion likhtey h forntend k jo backend ki api ko call krtey h
//  https://checkout.razorpay.com/v1/checkout.js
// Verify the Payment
async function verifyPayment(bodyData, token, navigate, dispatch) {
  const toastId = toast.loading("Verifying Payment...")
  dispatch(setPaymentLoading(true))
  try {
    const response = await apiConnector("POST", COURSE_VERIFY_API, bodyData, {
      Authorization: `Bearer ${token}`,
    })

    console.log("VERIFY PAYMENT RESPONSE FROM BACKEND............", response)

    if (!response.data.success) {
      throw new Error(response.data.message)
    }

    toast.success("Payment Successful. You are Added to the course ")
    navigate("/dashboard/enrolled-courses")
    dispatch(resetCart())
  } catch (error) {
    console.log("PAYMENT VERIFY ERROR............", error)
    toast.error("Could Not Verify Payment.")
  }
  toast.dismiss(toastId)
  dispatch(setPaymentLoading(false))
}

// Send the Payment Success Email
async function sendPaymentSuccessEmail(response, amount, token) {
  try {
    await apiConnector(
      "POST",
      SEND_PAYMENT_SUCCESS_EMAIL_API,
      {
        orderId: response.razorpay_order_id,
        paymentId: response.razorpay_payment_id,
        amount,
      },
      {
        Authorization: `Bearer ${token}`,
      }
    )
  } catch (error) {
    console.log("PAYMENT SUCCESS EMAIL ERROR............", error)
  }
}
