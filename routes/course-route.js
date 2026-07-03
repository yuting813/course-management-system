const router = require('express').Router();
const passport = require('passport');
const Course = require('../models').course;
const User = require('../models').user;
const { courseValidation } = require('../validation');

router.use((req, res, next) => {
  console.log('course route正在接受一個request...');
  next();
});

// 搜尋課程
router.get('/', async (req, res) => {
  try {
    let { keyword } = req.query;

    if (!keyword) {
      let courseFound = await Course.find({})
        .populate('instructor', ['username', 'email'])
        .lean();
      return res.json(courseFound);
    }

    let courses = await Course.find({
      $or: [
        { title: { $regex: keyword, $options: 'i' } }, // 'i' 使正則表達式不須分大小寫
        { description: { $regex: keyword, $options: 'i' } },
      ],
    })
      .populate('instructor', ['username', 'email'])
      .lean();

    return res.json(courses);
  } catch (e) {
    return res.status(500).json({ message: '搜尋課程時發生錯誤', error: e.message });
  }
});

// 透過講師id來尋找課程
router.get('/instructor/:instructorId', async (req, res) => {
  try {
    let { instructorId } = req.params;
    let coursesFound = await Course.find({ instructor: instructorId })
      .populate('instructor', ['username', 'email'])
      .exec();
    return res.json(coursesFound);
  } catch (e) {
    return res.status(500).json({ message: '取得講師課程失敗', error: e.message });
  }
});

// 透過學生id來尋找註冊過的課程
router.get('/student/:studentId', async (req, res) => {
  try {
    let { studentId } = req.params;
    let coursesFound = await Course.find({ students: studentId })
      .populate('instructor', ['username', 'email'])
      .exec();
    return res.json(coursesFound);
  } catch (e) {
    return res.status(500).json({ message: '取得學生註冊課程失敗', error: e.message });
  }
});

// 用課程id來尋找課程
router.get('/:_id', async (req, res) => {
  let { _id } = req.params;
  try {
    let courseFound = await Course.findOne({ _id })
      .populate('instructor', ['email'])
      .exec();
    if (!courseFound) {
      return res.status(404).json({ message: '找不到該課程' });
    }
    return res.json(courseFound);
  } catch (e) {
    return res.status(500).json({ message: '取得課程詳情失敗', error: e.message });
  }
});

// 新增課程
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    // 驗證數據符合規範
    let { error } = courseValidation(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    if (req.user.isStudent()) {
      return res
        .status(403)
        .json({ message: '只有講師才能發佈新課程。' });
    }

    let { title, description, price, image } = req.body;
    try {
      let newCourse = new Course({
        title,
        description,
        price,
        instructor: req.user._id,
        image: image,
      });
      await newCourse.save();
      return res.status(201).json({ message: '新課程已經保存', course: newCourse });
    } catch (e) {
      return res.status(500).json({ message: '無法創建課程', error: e.message });
    }
  }
);

// 讓學生透過課程id來註冊新課程
router.post(
  '/enroll/:_id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    let { _id } = req.params;
    try {
      let course = await Course.findOne({ _id }).exec();
      if (!course) return res.status(404).json({ message: '找不到課程' });
      
      if (course.students.includes(req.user._id)) {
        return res.status(400).json({ message: '您已經註冊過這門課程' });
      }

      course.students.push(req.user._id);
      await course.save();
      return res.json({ message: '註冊完成' });
    } catch (e) {
      return res.status(500).json({ message: '註冊失敗', error: e.message });
    }
  }
);

// 更改課程
router.patch(
  '/:_id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    // 驗證數據符合規範
    let { error } = courseValidation(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    let { _id } = req.params;
    try {
      let courseFound = await Course.findOne({ _id });
      if (!courseFound) {
        return res.status(404).json({ message: '找不到課程。無法更新課程內容。' });
      }

      // 使用者必須是此課程講師，才能編輯課程
      if (courseFound.instructor.equals(req.user._id)) {
        let updatedCourse = await Course.findOneAndUpdate({ _id }, req.body, {
          new: true,
          runValidators: true,
        });
        return res.status(200).json({
          message: '課程已經更新成功',
          updatedCourse,
        });
      } else {
        return res.status(403).json({ message: '只有此課程的講師才能編輯課程。' });
      }
    } catch (e) {
      return res.status(500).json({ message: '更新課程時發生錯誤', error: e.message });
    }
  }
);

// 刪除課程
router.delete(
  '/:_id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    let { _id } = req.params;
    try {
      let courseFound = await Course.findOne({ _id }).exec();
      if (!courseFound) {
        return res.status(404).json({ message: '找不到課程，無法刪除' });
      }

      // 使用者必須是此課程講師，才能修改課程
      if (courseFound.instructor.equals(req.user._id)) {
        await Course.deleteOne({ _id }).exec();
        return res.json({
          message: '課程已經刪除'
        });
      } else {
        return res.status(403).json({ message: '只有此課程的講師才能刪除課程' });
      }
    } catch (e) {
      return res.status(500).json({ message: '刪除課程失敗', error: e.message });
    }
  }
);

// 新增：學生退選課程
router.post(
  '/drop/:_id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    let { _id } = req.params;
    try {
      let course = await Course.findById(_id);
      if (!course) {
        return res.status(404).json({ message: '找不到課程' });
      }

      let student = await User.findById(req.user._id);
      if (!student) {
        return res.status(404).json({ message: '找不到學生資料' });
      }

      // 檢查學生是否已經註冊這門課程
      const studentIndex = course.students.indexOf(req.user._id);
      if (studentIndex === -1) {
        return res.status(400).json({ message: '您尚未註冊這門課程' });
      }

      // 從課程的學生列表中移除該學生
      course.students = course.students.filter(
        (id) => !id.equals(req.user._id)
      );
      await course.save();

      // 從學生的課程列表中移除該課程
      student.courses = student.courses.filter((id) => !id.equals(course._id));
      await student.save();

      return res.status(200).json({ message: '成功退選課程' });
    } catch (e) {
      return res.status(500).json({ message: '退選課程時發生錯誤', error: e.message });
    }
  }
);
module.exports = router;
