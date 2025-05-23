import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {RxDropdownMenu} from "react-icons/rx";
import { AiFillCaretDown } from "react-icons/ai"
import {MdEdit} from "react-icons/md";
import {RiDeleteBin6Line} from "react-icons/ri";
import SubSectionModal from "./SubSectionModal";
import { deleteSection , deleteSubSection } from "../../../../../services/operations/courseDetailsAPI";
import { setCourse } from "../../../../../slices/courseSlice";
import { FaPlus } from "react-icons/fa"

const NestedView = ({handleChangeEditSectionName}) => {

    const {course} = useSelector((state)=>state.course);
    const {token} = useSelector((state)=>state.auth);
    const dispatch = useDispatch();

    //three flags needed
    const[addSubSection , setAddSubsection] = useState(null);
    const[viewSubSection , setViewSubSection] = useState(null);
    const[editSubSection , setEditSubSection] = useState(null);

    const[ConfirmationModal , setConfirmationModal]= useState(null);

    const handleDeleleSection = async(sectionId) => {
       const result = await deleteSection({
        sectionId,
        courseId : course._id},
        token,
       )     
         if(result){
        dispatch(setCourse(result));
       }

       setConfirmationModal(null);
    }

    const handleDeleteSubSection = async (subSectionId , sectionId) => {
        const result = await deleteSubSection({
            subSectionId,
            sectionId ,
            token,
           });

           if(result){
            //pehle updated course bana liya
               const updatedCourseContent = course.courseContent.map((section) => 
                  section._id === sectionId ?   result : section
              )
            // with its help updated course bna liya , aur usko set krdiya
              const updatedCourse = { ...course , courseContent: updatedCourseContent }
            dispatch(setCourse(updatedCourse));
           }
           setConfirmationModal(null);
    }

     return (
        <div>
          
           <div className=" rounded-lg bg-richblack-700 p-6 px-8"  id="nestedViewContainer">
             {
                course?.courseContent?.map((section) => {

                    return   <details key={section._id} open>
                    {/* Section Dropdown Content */}
                    <summary className="flex cursor-pointer items-center justify-between border-b-2 border-b-richblack-600 py-2">
                    
                      <div className="flex items-center gap-x-3">
                        <RxDropdownMenu className="text-2xl text-richblack-50" />
                        <p className="font-semibold text-richblack-50">
                          {section.sectionName}
                        </p>
                      </div>
                                       {/* edit button */}
                      <div className="flex items-center gap-x-3">
                        <button
                          onClick={() =>
                            handleChangeEditSectionName(
                              section._id,
                              section.sectionName
                            )
                          }
                        >
                          <MdEdit className="text-xl text-richblack-300" />
                        </button>
                        
                        <button
                          onClick={() =>
                            setConfirmationModal({
                              text1: "Delete this Section?",
                              text2: "All the lectures in this section will be deleted",
                              btn1Text: "Delete",
                              btn2Text: "Cancel",
                              btn1Handler: () => handleDeleleSection(section._id),
                              btn2Handler: () => setConfirmationModal(null),
                            })
                          }
                        >
                          <RiDeleteBin6Line className="text-xl text-richblack-300" />
                        </button>
                        
                        <span className="font-medium text-richblack-300">|</span>
                        
                        <AiFillCaretDown className={`text-xl text-richblack-300`} />
                      
                      </div>
                    </summary>
                   
                            {/* Render All Sub Sections Within a Section */}
                    <div className="px-6 pb-4">
                      { section.subSection.map((data) => (
                        <div
                          key={data?._id}
                          onClick={() => setViewSubSection(data)}
                          className="flex cursor-pointer items-center justify-between gap-x-3 border-b-2 border-b-richblack-600 py-2"
                        >
                          <div className="flex items-center gap-x-3 py-2 ">
                            <RxDropdownMenu className="text-2xl text-richblack-50" />
                            <p className="font-semibold text-richblack-50">
                              {data.title}
                            </p>
                          </div>
                        
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-x-3"
                          >
                            <button
                              onClick={() =>
                                setEditSubSection({ ...data, sectionId: section._id })
                              }
                            >
                              <MdEdit className="text-xl text-richblack-300" />
                            </button>
                            <button
                              onClick={() =>
                                setConfirmationModal({
                                  text1: "Delete this Sub-Section?",
                                  text2: "This lecture will be deleted",
                                  btn1Text: "Delete",
                                  btn2Text: "Cancel",
                                  btn1Handler: () =>
                                    handleDeleteSubSection(data._id, section._id),
                                  btn2Handler: () => setConfirmationModal(null),
                                })
                              }
                            >
                              <RiDeleteBin6Line className="text-xl text-richblack-300" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {/* Add New Lecture to Section */}
                      <button
                        onClick={() => setAddSubsection(section._id)}
                        className="mt-3 flex items-center gap-x-1 text-yellow-50"
                      >
                        <FaPlus className="text-lg" />
                        <p>Add Lecture</p>
                      </button>
                    </div>
                  </details>
                })
             }
           </div>
               {/* ab jisme bhi data pada h uska subsectionmodal render kr denge */}
          { 
            addSubSection ? (<SubSectionModal modalData={addSubSection} setModalData={setAddSubsection} add={true} />) 
          : viewSubSection ? (<SubSectionModal modalData={viewSubSection} setModalData={setViewSubSection} add={true} />)
          : editSubSection ? (<SubSectionModal modalData={editSubSection} setModalData={setEditSubSection} add={true} />) 
          : (<div></div>)
          }
  
          { 
           ConfirmationModal ? 
             (
                <ConfirmationModal modalData={ConfirmationModal}/>
             ) : (<div></div>) 
          } 


        </div>
     ) 
}

export default NestedView;