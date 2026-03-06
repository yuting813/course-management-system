import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CourseService from '../services/course.service';
import CourseSkeleton from '../components/course/CourseSkeleton';
import CreateCourseDesktop from '../assets/CreateCourse-desktop-v1.jpg';
import CreateCourseMobile from '../assets/CreateCourse-mobile-v2.jpg';
import EditCourseModal from '../components/course/EditCourseModal.jsx';
import useAuthUser from '../hooks/useAuthUser';

/* ── 子元件：課程圖片 ───────────────────────── */
const CourseImage = ({ course, width = '16rem', height = '11rem' }) => {
  const defaultImage = 'https://i.ibb.co/BKqMHq0/logo.png';
  const [imgSrc, setImgSrc] = useState(course.image || defaultImage);

  const handleImageError = () => {
    if (imgSrc !== defaultImage) setImgSrc(defaultImage);
  };

  return (
    <img
      src={imgSrc}
      alt="課程圖片"
      onError={handleImageError}
      className="img-fluid"
      style={{ width, height, objectFit: 'cover' }}
    />
  );
};

/* ── 主頁面 ─────────────────────────────────── */
const CoursePage = ({ currentUser, setCurrentUser, showAlert }) => {
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCourse, setEditingCourse] = useState(null);

  // 使用 Hook 取得所有需要的信息和方法
  const {
    uid,
    isInstructor,
    isStudent,
    isLoggedIn,
    roleDisplayName,
    getCoursesFetcher,
    getCourseActions,
    canEditCourse,
  } = useAuthUser(currentUser);

  /* ── 導頁方法 ─────────────────────────────── */
  const handleTakeToLogin = () => navigate('/login');
  const handleTakeToCreateCourse = () => navigate('/CreateCourse');
  const handleTakeToEnroll = () => navigate('/enroll');

  /* ── 課程操作方法 ─────────────────────────── */
  const handleDelete = (e) => {
    const courseId = e.target.id;
    if (window.confirm('確定要刪除這個課程嗎？')) {
      CourseService.delete(courseId)
        .then(() => {
          showAlert('已刪除課程', '課程已成功刪除。', 'elegant', 1000);
          setCourseData((prev) => prev.filter((c) => c._id !== courseId));
        })
        .catch((err) => {
          console.error('刪除課程失敗:', err.message);
          showAlert('課程擁有者才能刪除課程', '請稍後再試。', 'error', 1000);
        });
    }
  };

  const handleDrop = (e) => {
    const courseId = e.target.id;
    if (window.confirm('確定要退選這個課程嗎？')) {
      CourseService.dropCourse(courseId)
        .then(() => {
          showAlert(
            '已退選課程',
            '課程已成功從您的列表中移除。',
            'elegant',
            1000
          );
          setCourseData((prev) => prev.filter((c) => c._id !== courseId));
        })
        .catch((err) => {
          console.error('退選課程時發生錯誤:', err.message);
          showAlert('退選課程失敗', '請稍後再試。', 'error', 1000);
        });
    }
  };

  const handleEdit = (course) => {
    // 使用 Hook 提供的權限檢查方法
    if (!canEditCourse(course)) {
      showAlert('權限錯誤', '只有課程講師才能編輯課程', 'error', 1500);
      return;
    }
    setEditingCourse(course);
  };

  const handleUpdate = async (courseId, updatedData) => {
    try {
      const response = await CourseService.update(courseId, updatedData);
      setCourseData((prev) =>
        prev.map((c) =>
          c._id === courseId
            ? { ...c, ...updatedData, instructor: c.instructor }
            : c
        )
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  // 課程操作按鈕渲染（使用權限檢查）
  const renderCourseActions = (course) => {
    const actions = getCourseActions(course);

    if (actions.canEdit || actions.canDelete) {
      return (
        <div className="d-flex justify-content-between align-items-center">
          {actions.canEdit && (
            <button
              onClick={() => handleEdit(course)}
              className="btn btn-outline-secondary btn-sm px-3"
            >
              編輯課程
            </button>
          )}
          {actions.canDelete && (
            <button
              id={course._id}
              onClick={handleDelete}
              className="btn btn-outline-danger btn-sm px-3"
            >
              刪除課程
            </button>
          )}
        </div>
      );
    }

    if (actions.canDrop) {
      return (
        <div className="d-flex justify-content-center">
          <button
            id={course._id}
            onClick={handleDrop}
            className="btn btn-outline-danger rounded-0"
          >
            退選課程
          </button>
        </div>
      );
    }

    return null;
  };

  /* ── 課程數據獲取 ─────────────────────────── */
  useEffect(() => {
    if (!isLoggedIn) {
      setIsLoading(false);
      return;
    }

    // 使用 Hook 提供的課程獲取方法
    const fetchCourses = getCoursesFetcher();

    fetchCourses(uid)
      .then((data) => {
        setCourseData(data);
        setIsLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setIsLoading(false);
      });
  }, [uid, isLoggedIn, getCoursesFetcher]);

  /* ── Loading 狀態 ─────────────────────────── */
  if (isLoading) {
    return (
      <div>
        {isLoggedIn && (
          <div className="mb-3">
            <h1>歡迎來到{roleDisplayName}的課程頁面</h1>
          </div>
        )}
        <CourseSkeleton />
      </div>
    );
  }

  /* ── 未登入狀態 ───────────────────────────── */
  if (!isLoggedIn) {
    return (
      <div style={{ padding: '3rem' }}>
        <div className="banner-container">
          <div className="w-100">
            <picture>
              <source
                srcSet={CreateCourseMobile}
                width="650"
                height="416"
                media="(max-width: 768px)"
                loading="lazy"
              />
              <img
                className="w-100 img-fluid"
                alt="Banner"
                src={CreateCourseDesktop}
                loading="lazy"
              />
            </picture>
          </div>

          <div className="text-container bg-light p-4 mx-5 d-flex flex-column">
            <h3 className="mb-3">必須要先登入才能看到課程。</h3>
            <button
              className="btn btn-dark rounded-0 w-100"
              onClick={handleTakeToLogin}
            >
              回到登入頁面
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── 已登入狀態 ───────────────────────────── */
  return (
    <div style={{ padding: '3rem' }}>
      <div className="container mb-4">
        <h1 className="mb-2 text-start">歡迎來到{roleDisplayName}的課程頁面</h1>
        <h5 className="text-muted bg-gray-100 py-3">以下是您目前的課程清單:</h5>
      </div>

      {/* 空清單（講師） */}
      {isInstructor && courseData.length === 0 && (
        <div className="banner-container">
          <div className="w-100">
            <picture>
              <source
                srcSet={CreateCourseMobile}
                width="650"
                height="416"
                media="(max-width: 768px)"
                loading="lazy"
              />
              <img
                className="w-100 img-fluid"
                alt="Banner"
                src={CreateCourseDesktop}
                loading="lazy"
              />
            </picture>
          </div>

          <div className="text-container bg-light p-4 mx-5">
            <h2 className="mb-3">尚未上傳課程</h2>
            <p className="mb-4">點擊下方，建立課程</p>
            <button
              className="btn btn-dark rounded-0 w-100"
              onClick={handleTakeToCreateCourse}
            >
              立即開始
            </button>
          </div>
        </div>
      )}

      {/* 空清單（學生） */}
      {isStudent && courseData.length === 0 && (
        <div className="banner-container">
          <div className="w-100">
            <picture>
              <source
                srcSet={CreateCourseMobile}
                width="650"
                height="416"
                media="(max-width: 768px)"
                loading="lazy"
              />
              <img
                className="w-100 img-fluid"
                alt="Banner"
                src={CreateCourseDesktop}
                loading="lazy"
              />
            </picture>
          </div>

          <div className="text-container bg-light p-4 mx-5">
            <h2 className="mb-3">尚未註冊課程</h2>
            <p className="mb-4">點擊下方，開始學習</p>
            <button
              className="btn btn-dark rounded-0 w-100"
              onClick={handleTakeToEnroll}
            >
              立即開始
            </button>
          </div>
        </div>
      )}

      {/* 課程列表 */}
      {courseData.length > 0 && (
        <div className="container">
          <div className="row">
            {courseData.map((course) => (
              <div
                key={course._id}
                className="col-12 col-sm-6 col-md-4 col-lg-3 mb-4"
              >
                <div
                  className="card h-100 border-0 shadow-sm"
                  style={{
                    transition: 'all 0.3s ease-in-out',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      '0 8px 16px rgba(0,0,0,0.15)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow =
                      '0 2px 4px rgba(0,0,0,0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <CourseImage course={course} width="100%" height="180px" />
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title fw-bold mt-3">{course.title}</h5>
                    <p className="card-text small text-muted">
                      {course.description}
                    </p>
                    <ul className="list-unstyled text-muted small mt-auto mb-2">
                      <li>學生人數：{course.students.length}</li>
                      <li>
                        課程價格：${Number(course.price).toLocaleString()}
                      </li>
                      <li>講師：{course.instructor?.username || '未指定'}</li>
                    </ul>
                  </div>
                  <div className="card-footer border-white bg-white">
                    {renderCourseActions(course)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {editingCourse && (
        <EditCourseModal
          course={editingCourse}
          onClose={() => setEditingCourse(null)}
          onUpdate={handleUpdate}
          showAlert={showAlert}
        />
      )}
    </div>
  );
};

export default CoursePage;
