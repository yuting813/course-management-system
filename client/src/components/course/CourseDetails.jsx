import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CourseService from '../../services/course.service';
import useAuthUser from '../../hooks/useAuthUser';

const CourseDetails = ({ course, showAlert, currentUser }) => {
  const navigate = useNavigate();
  const { uid, isStudent } = useAuthUser(currentUser);

  const [isEnrolling, setIsEnrolling] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  const isEnrolled = useMemo(() => {
    if (!uid || !course?.students) return false;
    return course.students.some(
      (s) => (typeof s === 'string' ? s : s?._id) === uid
    );
  }, [course?.students, uid]);

  const handleEnroll = async () => {
    if (!currentUser) {
      showAlert('請先登入', '註冊課程前，請先登入學生帳號。', 'elegant', 1000);
      return;
    }

    if (!isStudent) {
      showAlert('無法註冊', '註冊請轉換至學生身分', 'elegant', 2000);
      return;
    }

    if (isEnrolled || isEnrolling) return;

    try {
      setIsEnrolling(true);
      await CourseService.enroll(course._id);
      showAlert('課程註冊成功!', '將導向到課程頁面。', 'elegant', 500);
      navigate('/course');
    } catch {
      showAlert('註冊失敗', '請稍後再試', 'error', 3000);
    } finally {
      setIsEnrolling(false);
    }
  };

  /* =========================
     Mobile：點擊展開 / 收合
     ========================= */
  if (isMobile) {
    return (
      <div className="course-details-mobile">
        <button
          type="button"
          className="btn btn-link text-decoration-none text-dark w-100 d-flex justify-content-between align-items-center py-2 px-0 border-top"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          style={{ fontSize: '0.9rem', fontWeight: 'bold' }}
        >
          <span>查看細節與教學目標</span>
          <span style={{ fontSize: '0.7rem' }}>{expanded ? '▲' : '▼'}</span>
        </button>

        {expanded && (
          <div className="pt-2 pb-3">
            <p className="small mb-3 lh-sm text-muted">
              {course.description}
            </p>

            <ul className="list-unstyled small mb-3" style={{ color: '#1c1d1f' }}>
              <li className="d-flex align-items-start mb-2">
                <span className="me-2 text-success">✓</span>
                <span>核心基礎與實務架構解析</span>
              </li>
              <li className="d-flex align-items-start mb-2">
                <span className="me-2 text-success">✓</span>
                <span>掌握真實專案開發技巧</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={handleEnroll}
              className="btn btn-purple py-2 fw-bold w-100"
              style={{ borderRadius: '8px' }}
              disabled={isEnrolled || isEnrolling}
            >
              {isEnrolled ? '已經購買' : isEnrolling ? '處理中…' : '新增至購物車'}
            </button>
          </div>
        )}
      </div>
    );
  }

  /* =========================
     Desktop：原本 hover 卡片
     ========================= */
  return (
    // <div
    //   className="card position-absolute course-details-card"
    //   style={{
    //     width: "16.5rem",
    //     zIndex: 1500,
    //     ...(isNearRightEdge
    //       ? { right: 0, transform: "translateX(-3%)" }
    //       : { left: 0, transform: "translateX(93%)" }),
    //   }}
    // >

    <div className="course-details-card d-flex flex-column h-100">
      <h5 className="fw-bold mb-2 lh-base">{course.title}</h5>
      
      <div className="d-flex align-items-center mb-2">
        <span className="badge-tag me-2 px-2 py-1">暢銷課程</span>
        <span className="text-success small fw-bold">更新日期 2026年2月</span>
      </div>

      <div className="text-muted small mb-3">
        總計 {7} 小時 · 所有級別 · 字幕
      </div>

      <p className="small mb-3 lh-sm" style={{ color: '#1c1d1f' }}>
        {course.description}
      </p>

      {/* 模擬的課程特點清單 */}
      <ul className="list-unstyled small mb-4 flex-grow-1" style={{ color: '#1c1d1f' }}>
        <li className="d-flex align-items-start mb-2">
          <span className="me-2 mt-1">✓</span>
          <span>了解 {course.title} 的核心基礎與架構</span>
        </li>
        <li className="d-flex align-items-start mb-2">
          <span className="me-2 mt-1">✓</span>
          <span>掌握實務技巧，應用於真實專案開發</span>
        </li>
        <li className="d-flex align-items-start mb-2">
          <span className="me-2 mt-1">✓</span>
          <span>深入淺出解析困難概念，從小白到精通</span>
        </li>
      </ul>

      <button
        type="button"
        onClick={handleEnroll}
        className="btn btn-purple py-2 fw-bold w-100 mt-auto"
        style={{ borderRadius: '8px' }}
        disabled={isEnrolled || isEnrolling}
      >
        {isEnrolled ? '已經購買' : isEnrolling ? '處理中…' : '新增至購物車'}
      </button>
    </div>
  );
};

export default CourseDetails;
