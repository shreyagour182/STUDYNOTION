import React, { useEffect , useState } from "react";
import { Link } from "react-router-dom";
import RatingStars from '../../common/RatingStars'
import GetAvgRating from '../../../utils/avgRating';

export default function Course_Card({course , Height}){
    
    //state variable bana liya to store average rating count
   const [avgReviewCount , setAvgReviewCount] = useState(0);

   //jb bhi course aye tho avgRating function k use kro rating nikal lo aur above state variable me store krlo
   useEffect( () => {
      const count = GetAvgRating(course.ratingAndReviews);
      setAvgReviewCount(count);
   } , [course] )

    return(
        <>
      <Link to={`/courses/${course._id}`}>
        <div className="">
          <div className="rounded-lg">
            <img
              src={course?.thumbnail}
              alt="course thumnail"
              className={`${Height} w-full rounded-xl object-cover `}
            />
          </div>
          <div className="flex flex-col gap-2 px-1 py-3">
            <p className="text-xl text-richblack-5">{course?.courseName}</p>
            <p className="text-sm text-richblack-50">
              {course?.instructor?.firstName} {course?.instructor?.lastName}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-yellow-5">{avgReviewCount || 0}</span>
              {/* <ReactStars
                count={5}
                value={avgReviewCount || 0}
                size={20}
                edit={false}
                activeColor="#ffd700"
                emptyIcon={<FaRegStar />}
                fullIcon={<FaStar />}
              /> */}
              <RatingStars Review_Count={avgReviewCount} />
              <span className="text-richblack-400">
                {course?.ratingAndReviews?.length} Ratings
              </span>
            </div>
            <p className="text-xl text-richblack-5">Rs. {course?.price}</p>
          </div>
        </div>
      </Link>
    </>
    )
}