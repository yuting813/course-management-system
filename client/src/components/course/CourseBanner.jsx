import React from 'react';
import CourseCardScroller from './CourseCardScroller';
import '../../styles/components/course-card.css';

const CourseBanner = ({ showAlert, currentUser }) => {
  return (
    <div>
      <div className="p-4 mt-3">
        <div>
          <h2>
            {' '}
            <strong>您所有需要的技能皆整合於一處 </strong>
          </h2>

          <p className="fs-6 mb-3">從關鍵技能到技術主題，支援您的專業發展。</p>
        </div>
        <div className="course-position-relative">
          <CourseCardScroller
            showAlert={showAlert}
            currentUser={currentUser}
          />
        </div>
      </div>
    </div>
  );
};

export default CourseBanner;
