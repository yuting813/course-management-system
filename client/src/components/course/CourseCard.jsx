import React, { forwardRef } from 'react';
import CourseImage from './CourseImage';
import CourseDetails from './CourseDetails';

const CourseCard = forwardRef(
  ({ course, showAlert, currentUser, isNearRightEdge }, ref) => {
    return (
      <div
        ref={ref}
        className="card me-3 p-2 position-relative mb-4 course-card shadow-sm"
        style={{ borderRadius: '12px' }}
      >
        <div className="course-imager">
          <CourseImage course={course} />
        </div>
        <div className="card-body d-flex flex-column p-0 mt-2">
          <h6 className="card-title fw-bold text-truncate-2 mb-1">
            {course.title}
          </h6>
          <small className="text-muted mb-2 d-block text-truncate">
            講師：{course.instructor?.username || '未指定'}
          </small>

          <div className="d-flex align-items-center mb-3">
            <span className="badge-tag me-2">暢銷課程</span>
            <span className="badge text-dark fw-normal me-2 py-1 px-2" style={{ backgroundColor: 'transparent', border: '1px solid #dee2e6' }}>
              <span className="text-warning">★</span> 4.8
            </span>
            <span className="badge text-muted fw-normal py-1 px-2" style={{ backgroundColor: 'transparent', border: '1px solid #dee2e6' }}>
              {course.students.length.toLocaleString()}則課程評等
            </span>
          </div>

          <div className="mt-auto">
            <span className="fs-5 fw-bold text-dark">${Number(course.price).toLocaleString()}</span>
          </div>
        </div>

        <div
          className={`course-details-wrapper ${
            isNearRightEdge ? 'align-left' : 'align-right'
          }`}
        >
          <CourseDetails
            course={course}
            showAlert={showAlert}
            currentUser={currentUser}
          />
        </div>
      </div>
    );
  }
);

export default CourseCard;
