const { default: mongoose } = require("mongoose");
const Category = require("../models/Category");

console.log("Category Controller file is loading."); // <--- ADD THIS


function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

// create category ka handler funtion
exports.createCategory = async (req, res) => {
	try {

        //fetch data
		const { name, description } = req.body;
        //validation
		if (!name) {
			return res
				.status(400)
				.json({ success: false, message: "All fields are required" });
		}
        //create entry in DB
		const CategorysDetails = await Category.create({
			name: name,
			description: description,
		});
		console.log(CategorysDetails);

        //return response
		return res.status(200).json({
			success: true,
			message: "Category Created Successfully",
		});
	} catch (error) {
		return res.status(500).json({
			success: true,
			message: error.message,
		});
	}
    //abhi course ko ni dala h  models k andar ,
    // we will make sure ki course create hone pr course k
    //  sth sth tag ko bhi update kru me
};


// show all categories avaliable
    exports.showAllCategories = async (req, res) => {
      try {
        console.log("INSIDE SHOW ALL CATEGORIES");
		const allCategorys = await Category.find();
		res.status(200).json({
			success: true,
			data: allCategorys,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "could not fetch categoriesssss",
      error
		});
	}
    };


//categoryPageDetails  ---- isko thik krna h
exports.categoryPageDetails = async (req, res) => {
    try {
      const { categoryId } = req.body

      if (!categoryId) {
        return res.status(400).json({ success: false, message: "Category ID is required" });
     }

      console.log("PRINTING CATEGORY ID: ", categoryId);

      // Get courses for the specified category
      const selectedCategory = await Category.findById(categoryId)
        .populate({
          path: "courses",
          match: { status: "Published" },
          populate: "ratingAndReviews",
        })
        .exec()

      //console.log("SELECTED COURSE", selectedCategory)
      // Handle the case when the category is not found
      if (!selectedCategory) {
        console.log("Category not found.")
        return res
          .status(404)
          .json({ success: false, message: "Category not found" })
      }
      // Handle the case when there are no courses
      if (selectedCategory.courses.length === 0) {
        console.log("No courses found for the selected category.")
        return res.status(404).json({
          success: false,
          message: "No courses found for the selected category.",
        })
      }

      // Get courses for other categories
      const categoriesExceptSelected = await Category.find({
        _id: { $ne: categoryId },
      })

      if (categoriesExceptSelected.length === 0) {
        return res.status(404).json({ success: false, message: "No other categories available." });
    }

      let differentCategory = await Category.findOne(
        categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]
          ._id
      )
        .populate({
          path: "courses",
          match: { status: "Published" },
        })
        .exec()
        //console.log("Different COURSE", differentCategory)
      // Get top-selling courses across all categories
      const allCategories = await Category.find()
        .populate({
          path: "courses",
          match: { status: "Published" },
          populate: {
            path: "instructor",
        },
        })
        .exec()

      const allCourses = allCategories.flatMap((category) => category.courses)
      const mostSellingCourses = allCourses
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 10)
       // console.log("mostSellingCourses COURSE", mostSellingCourses)
      res.status(200).json({
        success: true,
        data: {
          selectedCategory,
          differentCategory,
          mostSellingCourses,
        },
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      })
    }
  }
