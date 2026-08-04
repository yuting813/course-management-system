import React, { useState, useEffect, useRef, useCallback } from 'react';
import CourseService from '../../services/course.service';
import CourseCard from './CourseCard';
import CourseHoverPopover from './CourseHoverPopover';
import ScrollButton from './ScrollButton';
import CourseSkeleton from './CourseSkeleton';

const CourseCardScroller = ({ showAlert, currentUser }) => {
  const [courses, setCourses] = useState([]);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [hoveredCourse, setHoveredCourse] = useState(null);
  const [anchorRect, setAnchorRect] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const containerRef = useRef(null);
  const cardsRef = useRef([]);
  const closeTimerRef = useRef(null);
  const anchorElementRef = useRef(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const closePopover = useCallback(() => {
    clearCloseTimer();
    anchorElementRef.current = null;
    setHoveredCourse(null);
    setAnchorRect(null);
  }, [clearCloseTimer]);

  const scheduleClosePopover = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      anchorElementRef.current = null;
      setHoveredCourse(null);
      setAnchorRect(null);
    }, 120);
  }, [clearCloseTimer]);

  const updatePopoverPosition = useCallback(() => {
    const anchorElement = anchorElementRef.current;
    if (!anchorElement) return;

    const nextRect = anchorElement.getBoundingClientRect();
    const isVisible =
      nextRect.bottom > 0 &&
      nextRect.top < window.innerHeight &&
      nextRect.right > 0 &&
      nextRect.left < window.innerWidth;

    if (!isVisible) {
      closePopover();
      return;
    }

    setAnchorRect(nextRect);
  }, [closePopover]);

  const handleCardMouseEnter = useCallback(
    (course, cardElement) => {
      clearCloseTimer();
      anchorElementRef.current = cardElement;
      setHoveredCourse(course);
      setAnchorRect(cardElement.getBoundingClientRect());
    },
    [clearCloseTimer]
  );

  const checkScrollState = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    const isAtStart = scrollLeft === 0;
    const isAtEnd = scrollLeft >= scrollWidth - clientWidth - 1;

    setShowLeftArrow(!isAtStart);
    setShowRightArrow(!isAtEnd);

    updatePopoverPosition();
  }, [updatePopoverPosition]);

  const scroll = useCallback(
    (direction) => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const scrollDistance = container.clientWidth;
      container.scrollBy({
        left: direction === 'right' ? scrollDistance : -scrollDistance,
        behavior: 'smooth',
      });
      setTimeout(checkScrollState, 500); // 滾動完成後檢查狀態
    },
    [checkScrollState]
  );

  useEffect(() => {
    const shuffleArray = (array) => {
      const newArray = [...array];
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
      }
      return newArray;
    };

    const fetchCourses = async () => {
      try {
        const response = await CourseService.getAllCourses();
        const shuffledCourses = shuffleArray(response.data);
        setCourses(shuffledCourses);
        setTimeout(checkScrollState, 0);
      } catch (error) {
        console.error('獲取課程資料失敗:', error);
        setError('獲取課程資料失敗');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollState);
      window.addEventListener('scroll', updatePopoverPosition, {
        passive: true,
      });
      window.addEventListener('resize', checkScrollState);
      return () => {
        container.removeEventListener('scroll', checkScrollState);
        window.removeEventListener('scroll', updatePopoverPosition);
        window.removeEventListener('resize', checkScrollState);
        clearCloseTimer();
      };
    }
  }, [checkScrollState, clearCloseTimer, updatePopoverPosition]);

  // 添加觸摸滑動支持
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startX,
      isDragging = false;

    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
      isDragging = true;
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;
      const currentX = e.touches[0].clientX;
      const diff = startX - currentX;
      if (Math.abs(diff) > 5) {
        container.scrollLeft += diff;
        startX = currentX;
      }
    };

    const handleTouchEnd = () => {
      isDragging = false;
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  if (isLoading) return <CourseSkeleton />;
  if (error)
    return (
      <div>
        錯誤: {error}
        <CourseSkeleton />
      </div>
    );
  if (courses.length === 0) return <div>目前沒有可用的課程</div>;

  return (
    <div className="course-card-scroller">
      <ScrollButton
        direction="left"
        onClick={() => scroll('left')}
        isVisible={showLeftArrow}
      />
      <div ref={containerRef} className="course-card-grid">
        {courses.map((course, index) => (
          <CourseCard
            key={course._id}
            ref={(el) => (cardsRef.current[index] = el)}
            course={course}
            showAlert={showAlert}
            currentUser={currentUser}
            onCardMouseEnter={handleCardMouseEnter}
            onCardMouseLeave={scheduleClosePopover}
          />
        ))}
      </div>
      <ScrollButton
        direction="right"
        onClick={() => scroll('right')}
        isVisible={showRightArrow}
      />
      <CourseHoverPopover
        course={hoveredCourse}
        anchorRect={anchorRect}
        showAlert={showAlert}
        currentUser={currentUser}
        onMouseEnter={clearCloseTimer}
        onMouseLeave={scheduleClosePopover}
      />
    </div>
  );
};

export default CourseCardScroller;
